const functions = require('@google-cloud/functions-framework');
const { VertexAI } = require('@google-cloud/vertexai');

// --- ‼️ ตั้งค่า Vertex AI (สำคัญมาก) ‼️ ---
const vertex_ai = new VertexAI({
  project: process.env.PROJECT_ID,
  location: process.env.LOCATION,
});

// --- ‼️ นี่คือชื่อโมเดลที่ถูกต้องสำหรับ Vertex AI ‼️ ---
const modelName = "gemini-2.5-flash";

// --- เลือกโมเดล (แบบ Vertex AI) ---
const model = vertex_ai.getGenerativeModel({ model: modelName });

// --- คำสั่งระบบ (Rubric ใหม่ของคุณ) ---
const assessSystemPrompt = `You are an expert English teacher assessing a student's essay, which is a "Factual Recount".
Instructions: Evaluate the submission based on three traits: Content, Structure, and Language. Assign a score from 1 to 4 for each trait.

Trait 1: Content
- Score 4: Event explicitly stated. Clearly documents events. Evaluate their significance. Personal comment on events.
- Score 3: Event fairly clearly stated. Includes most events. Some evaluation of events. Some personal comment.
- Score 2: Event only sketchy. Clearly documents events. Little or weak evaluation. Inadequate personal comment.
- Score 1: Event not stated. No recognizable events. No or confused evaluation. No or weak personal comment.

Trait 2: Structure
- Score 4: Orientation gives all essential info. All necessary background provided. Account in chronological/other order. Reorientation "rounds off" sequence.
- Score 3: Fairly well-developed orientation. Most factors and events mentioned. Largely chronological and coherent. Reorientation "rounds off" sequence.
- Score 2: Orientation gives some information. Some necessary background omitted. Account partly coherent. Some attempt to provide reorientation.
- Score 1: Missing or weak orientation. No background provided. Haphazard and incoherent sequencing. No reorientation or includes new matter.

Trait 3: Language
- Score 4: Excellent control of language. Excellent use of vocabulary. Excellent choice of grammar. Appropriate tone and style.
- Score 3: Good control of language. Adequate vocab choices. Varied choice of grammar. Mainly appropriate tone.
- Score 2: Inconsistent language control. Lack of variety in choice of grammar and vocabulary. Inconsistent tone and style.
- Score 1: Little language control. Reader seriously distracted by grammar errors. Poor vocabulary and tone.

You MUST provide scores as WHOLE NUMBERS (integers) only, from 1 to 4 for each category.
You MUST provide constructive feedback as a single string, with key points separated by asterisks (*).

You MUST respond ONLY with a valid JSON object. Do not include "\`\`\`json" or any other text before or after the JSON object.
The JSON object must have this exact structure:
{
  "contentScore": <score_integer>,
  "structureScore": <score_integer>,
  "languageScore": <score_integer>,
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
  
  // --- 🔒 ‼️ แก้ไข CORS (สำคัญมาก!) ‼️ ---
  res.set('Access-Control-Allow-Origin', 'https://easyessay.site');
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
    // --- 🔒 ‼️ แก้ไข CORS (สำคัญมาก!) ‼️ ---
    res.set('Access-Control-Allow-Origin', 'https://easyessay.site');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    const errorMessage = error.message || 'An internal error occurred.';
    res.status(500).json({ error: errorMessage });
  }
});
