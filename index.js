
```javascript
const functions = require('@google-cloud/functions-framework');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- นี่คือ "กุญแจ API" ที่เราซ่อนไว้ครับ ---
// มันจะถูกดึงมาจาก Environment Variable ที่เราตั้งค่าไว้ใน Google Cloud
// We use process.env.GEMINI_API_KEY to access the secret key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- นี่คือ "ฟังก์ชัน" ของเรา (ที่เราตั้งชื่อว่า assessEssay) ---
// This is our main function, named 'assessEssay'
functions.http('assessEssay', async (req, res) => {
  
  // --- การตั้งค่า CORS (สำคัญมาก!) ---
  // This allows our GitHub Pages frontend to talk to this backend
  res.set('Access-Control-Allow-Origin', '*'); // Allow requests from any origin
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Respond to preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }
  // --- จบส่วน CORS ---

  try {
    // Get the data sent from the frontend
    const { essayText, action, feedbackForRewrite } = req.body;

    // --- นี่คือโค้ดที่ "แก้ไข" แล้ว ---
    // This is the corrected code
    
    // 1. Select the model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-09-2025" });
    
    let systemPrompt = "";
    let userPrompt = "";
    let combinedPrompt = ""; // We will combine system and user prompts here

    // 2. Create the correct prompt based on the "action"
    if (action === 'rewrite') {
        // --- Task: Rewrite ---
        systemPrompt = `You are an expert English editor. A student has written an essay and received feedback. 
Your task is to rewrite the student's original essay based *only* on the provided feedback.
You MUST respond ONLY with a valid JSON object. Do not include "\`\`\`json" or any other text before or after the JSON object.
The JSON object must have this exact structure:
{
  "rewrittenText": "<the complete rewritten essay text>"
}`;
        userPrompt = `Original Essay:
"""
${essayText}
"""

Feedback to apply:
"""
${feedbackForRewrite}
"""

Please rewrite the original essay based on this feedback.`;
        
        // Combine prompts
        combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;

    } else {
        // --- Task: Assess ---
        systemPrompt = `You are an expert English teacher assessing a student's essay on "Sharing Experiences" using the Present Perfect Tense.
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
        userPrompt = `Please assess this essay:
"""
${essayText}
"""`;
        
        // Combine prompts
        combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;
    }
    
    // 3. Send the request to Gemini (as a single combined prompt)
    const result = await model.generateContent(combinedPrompt);
    const textResponse = result.response.text();
    
    // 4. Parse the text response into a JSON object
    // We trust the AI to return valid JSON because we instructed it in the prompt
    
    // Handle the case where the AI might still return markdown
    let cleanTextResponse = textResponse.replace(/^```json\s*/, '').replace(/```$/, '');
    
    const jsonResponse = JSON.parse(cleanTextResponse);

    // 5. Send the valid JSON response back to the frontend
    res.status(200).json(jsonResponse);

  } catch (error) {
    // --- If anything crashes ---
    // (e.g., AI response isn't JSON, API key is wrong, Gemini API not enabled)
    console.error('Error processing request:', error);
    // Send a generic error back to the frontend to display the red error box
    res.status(500).json({ error: 'An internal error occurred.' });
  }
});
</html>
