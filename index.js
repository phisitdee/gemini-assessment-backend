const functions = require('@google-cloud/functions-framework');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- กุญแจ API ---
// ดึงมาจาก Environment Variable ที่ตั้งค่าไว้ใน Google Cloud
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- การตั้งค่าโมเดล ---
// เราจะตั้งค่า systemInstruction แยกต่างหากสำหรับแต่ละ action
const assessModelConfig = {
  model: "gemini-2.5-flash-preview-09-2025",
  systemInstruction: `You are an expert English teacher assessing a student's essay on "Sharing Experiences" using the Present Perfect Tense.
The rubric criteria are:
1.  **Structure** (1-5): Organization, flow, and coherence.
2.  **Accuracy** (1-5): Correct use of Present Perfect Tense and general grammar.
3.  **Relevance** (1-5): Stays on topic and meets the word count (min. 100 words).
You MUST provide scores as WHOLE NUMBERS (integers) only, from 1 to 5 for each category.
You MUST provide constructive feedback as a single string, with key points separated by asterisks (*).

You MUST respond ONLY with a valid JSON object. Do not include "\`\`\`json" or any other text before or after the JSON object.
The JSON object must have this exact structure:
{
  "structureScore": <score_integer>,
  "accuracyScore": <score_integer>,
  "relevanceScore": <score_integer>,
  "feedback": "<feedback_string_with_asterisks>"
}`,
};

const rewriteModelConfig = {
  model: "gemini-2.5-flash-preview-09-2025",
  systemInstruction: `You are an expert English editor. A student has written an essay and received feedback.
Your task is to rewrite the student's original essay based *only* on the provided feedback.
You MUST respond ONLY with a valid JSON object. Do not include "\`\`\`json" or any other text before or after the JSON object.
The JSON object must have this exact structure:
{
  "rewrittenText": "<the complete rewritten essay text>"
}`,
};


// --- ฟังก์ชันหลัก 'assessEssay' ---
functions.http('assessEssay', async (req, res) => {
  
  // --- 🔒 การตั้งค่า CORS (สำคัญมาก!) ---
  // ‼️ เปลี่ยน 'YOUR-GITHUB-USERNAME' เป็นชื่อ GitHub ของคุณ
  // นี่คือการจำกัดให้เฉพาะหน้าเว็บ GitHub Pages ของคุณเท่านั้นที่เรียกใช้ฟังก์ชันนี้ได้
  res.set('Access-Control-Allow-Origin', 'https://YOUR-GITHUB-USERNAME.github.io');
  // หากทดสอบบน Localhost ให้ใช้บรรทัดนี้แทน (และปิดบรรทัดบน)
  // res.set('Access-Control-Allow-Origin', 'http://127.0.0.1:5500'); 

  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // ตอบกลับ preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }
  // --- จบส่วน CORS ---

  try {
    // 1. ดึงข้อมูลจาก frontend
    const { essayText, action, feedbackForRewrite } = req.body;

    // --- 🛡️ การตรวจสอบข้อมูล (Input Validation) ---
    if (!essayText || essayText.trim() === '') {
        // ถ้าไม่มี essayText หรือเป็นค่าว่าง
        return res.status(400).json({ error: 'Essay text is required.' });
    }
    if (essayText.length > 10000) { // ป้องกันการส่งข้อความที่ยาวเกินไป
        return res.status(400).json({ error: 'Essay text is too long (max 10,000 chars).' });
    }
    if (action === 'rewrite' && (!feedbackForRewrite || feedbackForRewrite.trim() === '')) {
        // ถ้า action คือ 'rewrite' แต่ไม่มี feedback
        return res.status(400).json({ error: 'Feedback is required for rewrite action.' });
    }
    // --- จบส่วนการตรวจสอบ ---

    let model;
    let userPrompt = "";

    // 2. เลือกโมเดลและสร้าง Prompt ตาม 'action'
    if (action === 'rewrite') {
        model = genAI.getGenerativeModel(rewriteModelConfig);
        userPrompt = `Original Essay:
"""
${essayText}
"""

Feedback to apply:
"""
${feedbackForRewrite}
"""

Please rewrite the original essay based on this feedback.`;

    } else {
        // ค่าเริ่มต้นคือ 'assess'
        model = genAI.getGenerativeModel(assessModelConfig);
        userPrompt = `Please assess this essay:
"""
${essayText}
"""`;
    }
    
    // 3. ส่งคำขอไปที่ Gemini (ส่งเฉพาะ userPrompt)
    // (systemInstruction ถูกตั้งค่าไว้ใน getGenerativeModel แล้ว)
    const result = await model.generateContent(userPrompt);
    const textResponse = result.response.text();
    
    // 4. ทำความสะอาดและ Parse การตอบกลับ
    // เผื่อในกรณีที่ AI ยังคงส่ง markdown ```json กลับมา
    let cleanTextResponse = textResponse.replace(/^```json\s*/, '').replace(/```$/, '');
    
    const jsonResponse = JSON.parse(cleanTextResponse);

    // 5. ส่ง JSON กลับไปที่ frontend
    res.status(200).json(jsonResponse);

  } catch (error) {
    // --- กรณีเกิดข้อผิดพลาด ---
    console.error('Error processing request:', error);
    
    // --- ‼️ เพิ่ม 3 บรรทัดนี้เข้ามา ---
    // ‼️ เปลี่ยน 'YOUR-GITHUB-USERNAME' เป็นชื่อ GitHub ของคุณ
    res.set('Access-Control-Allow-Origin', 'https://YOUR-GITHUB-USERNAME.github.io');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    // --- จบส่วนที่เพิ่ม ---

    // ส่ง error ที่แท้จริง (ถ้ามี) กลับไปให้ frontend แสดงผล
    const errorMessage = error.message || 'An internal error occurred. Please try again.';
    res.status(500).json({ error: errorMessage });
  }
});
