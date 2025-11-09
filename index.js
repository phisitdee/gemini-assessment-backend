const functions = require('@google-cloud/functions-framework');
const { VertexAI } = require('@google-cloud/vertexai');

// --- ‼️ ตั้งค่า Vertex AI (สำคัญมาก) ‼️ ---
// เราต้องระบุ Project ID และ Location (ภูมิภาค)
// มันจะดึงมาจาก Environment Variables ที่เราจะตั้งค่าใน Step 3
const vertex_ai = new VertexAI({
  project: process.env.PROJECT_ID,
  location: process.env.LOCATION,
});

// --- ‼️ นี่คือชื่อโมเดลที่ถูกต้องสำหรับ Vertex AI ‼️ ---
const modelName = "gemini-1.5-flash-latest"; // (เรากลับไปใช้ 1.0-pro ที่เสถียรครับ)

// --- เลือกโมเดล (แบบ Vertex AI) ---
const model = vertex_ai.getGenerativeModel({ model: modelName });

// --- คำสั่งระบบ (เหมือนเดิม) ---
const assessSystemPrompt = `You are an expert English teacher assessing a student's essay, which is a "Factual Recount".
Instructions: Evaluate the submission based on three traits: Content, Structure, and Language. Assign a score from 1 to 4 for each trait.
(ฯลฯ ... ใส่ Rubric ทั้งหมดของคุณที่นี่ ... ฯลฯ)
You MUST respond ONLY with a valid JSON object. Do not include "\`\`\`json" or any other text before or after the JSON object.
The JSON object must have this exact structure:
{
  "contentScore": <score_integer>,
  "structureScore": <score_integer>,
  "languageScore": <score_integer>,
  "feedback": "<feedback_string_with_asterisks>"
}`;

const rewriteSystemPrompt = `You are an expert English editor. A student has written an essay and received feedback.
(ฯลฯ ... ใส่ Prompt ของ Rewrite ที่นี่ ... ฯลฯ)
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

    // (Input Validation... เหมือนเดิม)
    if (!essayText || essayText.trim() === '') {
        return res.status(400).json({ error: 'Essay text is required.' });
    }
    
    let userPrompt = "";
    let systemPrompt = "";
    let combinedPrompt = ""; 

    // 2. สร้าง Prompt ที่ถูกต้องตาม 'action'
    if (action === 'rewrite') {
        systemPrompt = rewriteSystemPrompt;
        userPrompt = `Original Essay:\n"""\n${essayText}\n"""\n\nFeedback to apply:\n"""\n${feedbackForRewrite}\n"""\n\nPlease rewrite the original essay based on this feedback.`;
    } else {
        systemPrompt = assessSystemPrompt;
        userPrompt = `Please assess this essay:\n"""\n${essayText}\n"""`;
    }

    combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;
    
    // 3. ‼️ นี่คือวิธีส่งคำขอแบบ Vertex AI ‼️
    const request = {
        contents: [
            { role: 'user', parts: [{ text: combinedPrompt }] }
        ],
    };

    // 4. ส่งคำขอไปที่ Vertex AI
    const result = await model.generateContent(request); 
    
    // 5. ‼️ นี่คือวิธีอ่านผลลัพธ์แบบ Vertex AI ‼️
    const textResponse = result.response.candidates[0].content.parts[0].text;
    
    // 6. ทำความสะอาดและ Parse (เหมือนเดิม)
    let cleanTextResponse = textResponse.replace(/^```json\s*/, '').replace(/```$/, '');
    
    const jsonResponse = JSON.parse(cleanTextResponse);

    // 7. ส่ง JSON กลับไปที่ frontend (เหมือนเดิม)
    res.status(200).json(jsonResponse);

  } catch (error) {
    // --- กรณีเกิดข้อผิดพลาด ---
    console.error('Error processing request:', error);
    res.set('Access-Control-Allow-Origin', 'https://phisitdee.github.io');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    const errorMessage = error.message || 'An internal error occurred.';
    res.status(500).json({ error: errorMessage });
  }
});
