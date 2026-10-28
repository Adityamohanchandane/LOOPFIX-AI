import Groq from 'groq-sdk';

let groq = null;
let isConfigured = false;

if (process.env.GROQ_API_KEY) {
  try {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    isConfigured = true;
    console.log('[Groq] Client initialized');
  } catch (err) {
    console.warn('[Groq] Failed to initialize:', err.message);
  }
} else {
  console.warn('[Groq] Not configured — using rule-based fallback');
}

export { groq, isConfigured };

const SYSTEM_PROMPT = `You are LoopFix AI, a campus maintenance intelligence assistant.
Analyze the provided campus maintenance complaint and extract structured information.

Respond ONLY with a valid JSON object. No markdown, no explanations.

JSON schema:
{
  "title": "Short issue title (max 80 chars)",
  "normalized_description": "Cleaned, normalized description (max 300 chars)",
  "category": "One of: Water, Electricity, Wi-Fi, Sanitation, Safety, Classroom, Other",
  "location": "Normalized location string (building + area, max 100 chars)",
  "urgency": "One of: Low, Medium, High, Critical",
  "department": "Responsible department name",
  "next_action": "Recommended next maintenance action (max 150 chars)",
  "confidence": "high or medium or low"
}

Rules:
- Do NOT invent facts not in the complaint.
- Use "Unknown" for missing information rather than guessing.
- Category must be exactly one of the listed values.
- Urgency "Critical" only for safety/health emergencies.`;

export async function analyzeComplaint(description, location) {
  if (!groq) {
    return { success: false, error: 'AI not configured', usedFallback: true };
  }

  const prompt = `Campus maintenance complaint:
Location: ${location || 'Not specified'}
Description: ${description}

Extract structured information as JSON.`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 2048,
      reasoning_effort: 'low',
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error('Empty AI response');

    const parsed = JSON.parse(raw);

    // Validate required fields
    const validCategories = ['Water', 'Electricity', 'Wi-Fi', 'Sanitation', 'Safety', 'Classroom', 'Other'];
    const validUrgencies = ['Low', 'Medium', 'High', 'Critical'];

    return {
      success: true,
      data: {
        title: typeof parsed.title === 'string' ? parsed.title.slice(0, 200) : 'Campus Issue',
        normalized_description: typeof parsed.normalized_description === 'string'
          ? parsed.normalized_description.slice(0, 500)
          : description.slice(0, 500),
        category: validCategories.includes(parsed.category) ? parsed.category : 'Other',
        location: typeof parsed.location === 'string' ? parsed.location : location || 'Unknown',
        urgency: validUrgencies.includes(parsed.urgency) ? parsed.urgency : 'Medium',
        department: typeof parsed.department === 'string' ? parsed.department : 'Facilities Management',
        next_action: typeof parsed.next_action === 'string' ? parsed.next_action : 'Assign to maintenance team',
        confidence: ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'medium',
      },
      usedFallback: false,
    };
  } catch (err) {
    console.warn('[Groq] analyzeComplaint error:', err.message);
    return { success: false, error: err.message, usedFallback: true };
  }
}
