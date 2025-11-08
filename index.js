const functions = require('@google-cloud/functions-framework');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- กุญแจ API ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- ฟังก์ชันหลัก 'assessEssay' (เวอร์ชันดีบัก) ---
functions.http('assessEssay', async (req, res) => {
  
  // --- 🔒 การตั้งค่า CORS (สำคัญมาก!) ---
  // (ผมใส่ username 'phisitdee' ให้คุณแล้ว)
  res.set('Access-Control-Allow-Origin', 'https://phisitdee.github.io');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // ตอบกลับ preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }
  // --- จบส่วน CORS ---

  try {
    // --- ‼️ นี่คือโค้ดใหม่สำหรับตรวจสอบโมเดล ‼️ ---
    console.log('Attempting to list models...');
    
    // 1. เรียก API เพื่อขอดูโมเดลทั้งหมด
    const modelList = await genAI.listModels();
    
    // 2. ดึงเฉพาะ "ชื่อ" ของโมเดลที่รองรับ "generateContent"
    const availableModels = [];
    for await (const model of modelList) {
      if (model.methods.includes('generateContent')) {
        availableModels.push(model.name);
      }
    }

    // 3. แสดงผลใน Log (สำคัญที่สุด)
    console.log('--- AVAILABLE MODELS (that support generateContent) ---');
    console.log(availableModels);
    console.log('-----------------------------------------------------');

    // 4. ส่งรายชื่อกลับไปที่ Frontend (เผื่อไว้)
    res.status(200).json({ 
        message: "Successfully listed models. Check Cloud Run LOGS.",
        availableModels: availableModels 
    });

  } catch (error) {
    // --- กรณีเกิดข้อผิดพลาด ---
    console.error('Error listing models:', error);
    
    // ตั้งค่า CORS สำหรับ Error ด้วย
    res.set('Access-Control-Allow-Origin', 'https://phisitdee.github.io');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    const errorMessage = error.message || 'An internal error occurred.';
    res.status(500).json({ error: `Error listing models: ${errorMessage}` });
  }
});
