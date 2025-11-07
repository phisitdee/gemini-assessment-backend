const { GoogleGenerativeAI } = require('@google/generative-ai');

// ✅ Export function for Google Cloud Functions
exports.assessEssay = async (req, res) => {
  // --- CORS ---
  res.set('Access-Control-Allow-Origin', 'https://your-frontend.github.io'); // แก้ domain ให้ตรงของคุณ
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', 'https://your-frontend.github.io');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).send('');
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Missing GEMINI_API_KEY environment variable');
    }

    const { essayText, action, feedbackForRewrite } = req.body;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let systemPrompt = "";
    let userPrompt = "";
    let combinedPrompt = "";

    if (action === 'rewrite') {
      systemPrompt = `You are an expert English editor. A student has written an essay and received feedback. 
Your task is to rewrite the student's original essay based *only* on the provided feedback.
You MUST respond ONLY with a valid JSON object. Do not include code fences or markdown.
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
      combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;
    } else {
      systemPrompt = `You are an expert English teacher assessing a student's essay on "Sharing Experiences" using the Present Perfect Tense.
The rubric criteria are:
1. Structure (1-5): Organization, flow, and coherence.
2. Accuracy (1-5): Correct use of Present Perfect Tense and general grammar.
3. Relevance (1-5): Stays on topic and meets the word count (min. 100 words).
You MUST provide scores as WHOLE NUMBERS only, from 1 to 5 for each category.
You MUST provide constructive feedback as a single string, with key points separated by asterisks (*).
Respond ONLY with a valid JSON object in this format:
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
      combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;
    }

    const result = await model.generateContent(combinedPrompt);
    const textResponse = result.response.text();

    let cleanTextResponse = textResponse
      .replace(/```json\s*/g, '')
      .replace(/```/g, '')
      .trim();

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(cleanTextResponse);
    } catch (err) {
      console.error('Invalid JSON from model:', cleanTextResponse);
      return res.status(500).json({ error: 'Invalid response format from AI model.' });
    }

    res.status(200).json(jsonResponse);

  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'An internal error occurred.' });
  }
};
