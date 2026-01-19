const functions = require('@google-cloud/functions-framework');
const { VertexAI } = require('@google-cloud/vertexai');

// --- ตั้งค่า Vertex AI ---
const vertex_ai = new VertexAI({
  project: process.env.PROJECT_ID,
  location: process.env.LOCATION,
});

// ใช้โมเดล 2.5 Flash เพื่อความเร็วและความแม่นยำ
const modelName = "gemini-3.0-pro";
const model = vertex_ai.getGenerativeModel({ model: modelName });

// --- ‼️ เกณฑ์การให้คะแนนใหม่ (Cause & Effect Paragraph) ‼️ ---
const assessSystemPrompt = `You are an expert English writing evaluator.
Your task is to assess a student's "Cause and Effect Paragraph" based on the provided topic.

RUBRIC (Score 0-5 for each trait):

1) Format & Content (5 Marks)
- 5 (Excellent): Fulfills task fully, relevant info, substantial concept use. Clear causes/effects. Ideas properly developed. Good sense of audience.
- 4 (Good): Fulfills task quite well. Details slightly underdeveloped. Clear causes/effects. Ideas satisfactory with some development.
- 3 (Average): Adequate but may have irrelevant data. Causes/effects present but lack depth. Limited development.
- 2 (Fair): Inadequate fulfillment. Key info missing. Ideas limited/undeveloped. Significant irrelevant info.
- 1 (Poor): Fails to fulfill task. No cause/effect relationship. No concept use/development.
- 0 (No Attempt): No response or off-topic.

2) Organization & Coherence (5 Marks)
- 5 (Excellent): Well-organized paragraph structure (clear topic sentence, supporting details, concluding sentence). Logical progression. Effective transitions.
- 4 (Good): Satisfactorily organized. Mostly logical progression. Transitions correctly used (maybe slight over/under use).
- 3 (Average): Some pattern of organization. Inconsistent progression. Moderate use of transitions.
- 2 (Fair): Little evidence of organization. Lacks clear topic/concluding sentence. Transitions missing/incorrect.
- 1 (Poor): No apparent organization or paragraph structure. No transitions.
- 0 (No Attempt): No response.

3) Sentence Construction & Grammar (5 Marks)
- 5 (Excellent): Wide variety of correct sentences/lengths. No significant errors. Full control of grammar.
- 4 (Good): Variety of correct sentences. Slight errors that don't cause confusion. Almost no fragments/run-ons.
- 3 (Average): Limited variety. Recurring errors but meaning clear. Occasional fragments/run-ons.
- 2 (Fair): Limited variety, requires effort to understand. Frequent errors cause comprehension problems. Frequent incomplete/run-ons.
- 1 (Poor): Severe errors dominate. Unable to construct simple sentences. Meaning obscured.
- 0 (No Attempt): No response.

4) Vocabulary (5 Marks)
- 5 (Excellent): Wide variety of lexical items. Mastery of word forms. Precise choice. Correct register.
- 4 (Good): Variety of lexical items used effectively. Good control of word forms. Mostly effective choice.
- 3 (Average): Limited variety. Occasional inappropriate choices. Moderate control of word forms.
- 2 (Fair): Very limited variety. Frequent misuse/poor control causing difficulties.
- 1 (Poor): Too limited to communicate. Incorrect usage makes text unintelligible.
- 0 (No Attempt): No response.

IMPORTANT:
- You MUST provide scores as INTEGERS (0-5).
- You MUST provide constructive feedback as a single string with key points separated by asterisks (*).
- Respond ONLY with a valid JSON object:
{
  "formatScore": <integer>,
  "organizationScore": <integer>,
  "grammarScore": <integer>,
  "vocabularyScore": <integer>,
  "feedback": "<string>"
}`;

const rewriteSystemPrompt = `You are an expert English editor.
Rewrite the following paragraph to be a 5/5 score "Cause and Effect Paragraph" based on the feedback provided.
Keep the original meaning but improve structure, grammar, and vocabulary.
Respond ONLY with JSON: { "rewrittenText": "<text>" }`;

functions.http('assessEssay', async (req, res) => {
  // CORS Setup
  res.set('Access-Control-Allow-Origin', 'https://phisitdee.github.io');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).send('');

  try {
    // 1. รับค่า topic มาด้วย
    const { essayText, topic, action, feedbackForRewrite } = req.body;

    if (!essayText || essayText.trim() === '') {
        return res.status(400).json({ error: 'Text is required.' });
    }
    
    // ตั้งค่า Default topic ถ้า user ไม่กรอก
    const currentTopic = topic || "General Cause and Effect";

    let combinedPrompt = "";
    if (action === 'rewrite') {
        combinedPrompt = `${rewriteSystemPrompt}\n\nOriginal Text:\n"${essayText}"\n\nFeedback:\n"${feedbackForRewrite}"`;
    } else {
        // ส่ง Topic ไปให้ AI ด้วย
        combinedPrompt = `${assessSystemPrompt}\n\nTopic: "${currentTopic}"\n\nStudent Paragraph:\n"${essayText}"`;
    }

    const request = {
        contents: [{ role: 'user', parts: [{ text: combinedPrompt }] }],
    };

    const result = await model.generateContent(request); 
    const textResponse = result.response.candidates[0].content.parts[0].text;
    const cleanTextResponse = textResponse.replace(/^```json\s*/, '').replace(/```$/, '');
    const jsonResponse = JSON.parse(cleanTextResponse);

    res.status(200).json(jsonResponse);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});
