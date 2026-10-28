import dotenv from 'dotenv';
dotenv.config();
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Try models from the available list
const modelsToTry = [
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'allam-2-7b',
];

for (const model of modelsToTry) {
  try {
    const completion = await groq.chat.completions.create({
      model,
      messages: [{ role: 'user', content: 'Say hello in one word only.' }],
      max_tokens: 10,
    });
    const reply = completion.choices[0]?.message?.content?.trim();
    console.log(`✅ ${model}: "${reply}"`);
  } catch (err) {
    const msg = err.message?.slice(0, 120) || 'unknown error';
    console.log(`❌ ${model}: ${msg}`);
  }
}
