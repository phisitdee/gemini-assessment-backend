const functions = require('@google-cloud/functions-framework');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ดึง API Key มาจาก Environment Variable ที่เราจะตั้งค่าใน Google Cloud
// วิธีนี้ทำให้ API Key ไม่ได้อยู่ในโค้ดของเราโดยตรง ปลอดภัย 100%
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ตรวจสอบว่ามี API Key หรือไม่
if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-09-2025" });

// กำหนดให้ฟังก์ชันนี้ทำงานเมื่อมีการเรียกผ่าน HTTP
functions.http('assessEssay', async (req, res) => {
    // ตั้งค่า CORS Headers เพื่อให้เว็บไซต์ของเรา (Frontend) สามารถเรียกฟังก์ชันนี้ได้
    res.set('Access-Control-Allow-Origin', '*'); // ในใช้งานจริง ควรระบุโดเมนของคุณแทน '*'
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    // จัดการ preflight request สำหรับ CORS
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    // --- ส่วนตรรกะหลักของ Backend ---
    try {
        const { essayText, action, feedbackForRewrite } = req.body;

        if (!essayText) {
            return res.status(400).json({ error: "Essay text is required." });
        }
        
        let result;
        if (action === 'assess') {
             // สร้าง Prompt สำหรับการประเมิน
            const systemPrompt = `You are an expert English teacher assessing a student's writing.
            The topic is "sharing experiences" and the student must use the Present Perfect Tense.
            Evaluate the essay based on the following rubric, providing scores as whole numbers (integers) only, from 1 to 5 for each category:
            1. **Structure** 2. **Accuracy** 3. **Relevance**
            Provide assessment in a strict JSON format with keys: "structureScore", "accuracyScore", "relevanceScore", "totalScore", and "feedback".
            All scores MUST be whole numbers.`;

            const prompt = `${systemPrompt}\n\nStudent Essay:\n${essayText}`;
            
            const generationConfig = {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        "structureScore": { "type": "NUMBER" },
                        "accuracyScore": { "type": "NUMBER" },
                        "relevanceScore": { "type": "NUMBER" },
                        "totalScore": { "type": "NUMBER" },
                        "feedback": { "type": "STRING" }
                    },
                    required: ["structureScore", "accuracyScore", "relevanceScore", "totalScore", "feedback"]
                }
            };

            const chat = model.startChat({ generationConfig });
            const apiResult = await chat.sendMessage(prompt);
            const responseText = await apiResult.response.text();
            
            // แปลงข้อความ JSON ที่ได้จาก API เป็น Object
            const parsedData = JSON.parse(responseText);
             // คำนวณคะแนนรวมใหม่เพื่อความแน่นอน
            parsedData.totalScore = (parsedData.structureScore || 0) + (parsedData.accuracyScore || 0) + (parsedData.relevanceScore || 0);
            result = parsedData;

        } else if (action === 'rewrite') {
            // สร้าง Prompt สำหรับการเขียนใหม่
            const systemPrompt = `You are an expert English teacher. Rewrite the following essay based on the provided feedback to improve it.
            Maintain the student's original voice. Focus on corrections mentioned in the feedback.
            Do not add any commentary. Just provide the rewritten essay text.`;

            const prompt = `${systemPrompt}\n\nOriginal Essay:\n${essayText}\n\nFeedback:\n${feedbackForRewrite}`;
            const apiResult = await model.generateContent(prompt);
            const rewrittenText = await apiResult.response.text();
            result = { rewrittenText: rewrittenText };

        } else {
             return res.status(400).json({ error: "Invalid action specified." });
        }

        // ส่งผลลัพธ์กลับไปให้ Frontend
        res.status(200).json(result);

    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ error: "An internal error occurred." });
    }
});
