import Groq from 'groq-sdk';
import { ruleBasedClassify } from './similarity.js';

let groq = null;
let isConfigured = false;
const geminiApiKey = process.env.GEMINI_API_KEY;
const isGeminiConfigured = Boolean(geminiApiKey);

if (process.env.GROQ_API_KEY) {
  try {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: 15000 });
    isConfigured = true;
    console.log('[Groq] Client initialized');
  } catch (err) {
    console.warn('[Groq] Failed to initialize:', err.message);
  }
} else if (isGeminiConfigured) {
  console.log('[Groq] Not configured — Gemini will be used as the primary AI provider');
} else {
  console.warn('[Groq] Not configured — using rule-based fallback');
}

if (isGeminiConfigured) {
  console.log('[Gemini] Backup provider configured');
}

export { groq, isConfigured, isGeminiConfigured };
export const aiConfigured = isConfigured || isGeminiConfigured;

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

function createPrompt(description, location) {
  return `Campus maintenance complaint:
Location: ${location || 'Not specified'}
Description: ${description}

Extract structured information as JSON.`;
}

function normalizeResponse(raw, description, location) {
  if (!raw) throw new Error('Empty AI response');

  const parsed = JSON.parse(raw);
  const validCategories = ['Water', 'Electricity', 'Wi-Fi', 'Sanitation', 'Safety', 'Classroom', 'Other'];
  const validUrgencies = ['Low', 'Medium', 'High', 'Critical'];

  return {
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
  };
}

async function analyzeWithGroq(prompt, description, location) {
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

  return normalizeResponse(completion.choices[0]?.message?.content, description, location);
}

async function analyzeWithGemini(prompt, description, location) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      }),
      signal: AbortSignal.timeout(15000),
    }
  );
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message || `Gemini request failed (${response.status})`);
  }

  const raw = result.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('');
  return normalizeResponse(raw, description, location);
}

export async function analyzeComplaint(description, location) {
  const prompt = createPrompt(description, location);
  const providers = [
    { name: 'Groq', configured: isConfigured, analyze: analyzeWithGroq },
    { name: 'Gemini', configured: isGeminiConfigured, analyze: analyzeWithGemini },
  ].filter((provider) => provider.configured);

  if (providers.length === 0) {
    return {
      success: true,
      data: ruleBasedClassify(description, location),
      provider: 'Rule-based demo',
      usedFallback: true,
    };
  }

  const errors = [];
  for (const provider of providers) {
    try {
      return {
        success: true,
        data: await provider.analyze(prompt, description, location),
        provider: provider.name,
        usedFallback: false,
      };
    } catch (err) {
      console.warn(`[${provider.name}] analyzeComplaint error:`, err.message);
      errors.push(`${provider.name}: ${err.message}`);
    }
  }

  console.warn('[AI] All providers failed; using rule-based demo:', errors.join('; '));
  return {
    success: true,
    data: ruleBasedClassify(description, location),
    provider: 'Rule-based demo',
    usedFallback: true,
  };
}
