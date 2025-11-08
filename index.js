const functions = require('@google-cloud/functions-framework');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- กุญแจ API ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- ‼️ นี่คือชื่อโมเดลที่ถูกต้อง และเราจะไม่ใช้ systemInstruction ‼️ ---
const modelName = "gemini-1.0-pro"; 

// --- คำสั่งระบบ (เราจะเก็บไว้ในตัวแปรธรรมดา) ---
const assessSystemPrompt = `You are an expert English teacher assessing a student's essay on "Sharing Experiences" using the Present Perfect Tense.
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
}`;

const rewriteSystemPrompt = `You are an expert English editor. A student has written an essay and received feedback.
Your task is to rewrite the student's original essay based *only* on the provided feedback.
You MUST respond ONLY with a valid JSON object. Do not include "\`\`\`json" or any other text before or after the JSON object.
The JSON object must have this exact structure:
{
  "rewrittenText": "<the complete rewritten essay text>"
}`;


// --- ฟังก์ชันหลัก 'assessEssay' ---
functions.http('assessEssay', async (req, res) => {
  
  // --- 🔒 การตั้งค่า CORS ---
  res.set('Access-Control-Allow-Origin', 'https://phisitdee.github.io');
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
        return res.status(400).json({ error: 'Essay text is required.' });
    }
    if (essayText.length > 10000) { 
        return res.status(400).json({ error: 'Essay text is too long (max 10,000 chars).' });
    }
    if (action === 'rewrite' && (!feedbackForRewrite || feedbackForRewrite.trim() === '')) {
        return res.status(400).json({ error: 'Feedback is required for rewrite action.' });
    }
    // --- จบส่วนการตรวจสอบ ---

    // 2. เลือกโมเดล (โดยไม่มี systemInstruction)
    const model = genAI.getGenerativeModel({ model: modelName });

    let userPrompt = "";
    let systemPrompt = "";
    let combinedPrompt = ""; // เราจะรวมกันที่นี่

    // 3. สร้าง Prompt ที่ถูกต้องตาม 'action'
    if (action === 'rewrite') {
        systemPrompt = rewriteSystemPrompt;
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
        systemPrompt = assessSystemPrompt;
        userPrompt = `Please assess this essay:
"""
${essayText}
"""`;
    }

    // 4. ‼️ นี่คือส่วนที่แก้ไข ‼️
    // รวม system prompt และ user prompt เข้าด้วยกันเป็นสตริงเดียว
    combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;
    
    // 5. ส่งคำขอไปที่ Gemini (ด้วย prompt ที่รวมแล้ว)
    const result = await model.generateContent(combinedPrompt); 
    const textResponse = result.response.text();
    
    // 6. ทำความสะอาดและ Parse การตอบกลับ
    let cleanTextResponse = textResponse.replace(/^```json\s*/, '').replace(/```$/, '');
    
    const jsonResponse = JSON.parse(cleanTextResponse);

    // 7. ส่ง JSON กลับไปที่ frontend
    res.status(200).json(jsonResponse);

  } catch (error) {
    // --- กรณีเกิดข้อผิดพลาด ---
    console.error('Error processing request:', error);
    
    // ตั้งค่า CORS สำหรับ Error ด้วย
    res.set('Access-Control-Allow-Origin', 'https://phisitdee.github.io');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    const errorMessage = error.message || 'An internal error occurred. Please try again.';
    res.status(500).json({ error: errorMessage });
  }
});
