```typescript
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';

if (!process.env.GEMINI_API_KEY_1 || !process.env.GROQ_API_KEY || !process.env.OPENROUTER_API_KEY) {
    throw new Error('Missing AI Provider API Keys in Environment Variables.');
}

// Gemini Client (Smarter, Flux, Sage, Oracle)
export const gemini = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY_1,
});

// Groq Client (Spark - Llama 3)
export const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

// OpenRouter Client (Thinker - DeepSeek R1)
export const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Routing Map
export const getModelTarget = (mode: string) => {
    switch (mode) {
        case 'spark': return groq('llama-3.1-70b-versatile');
        case 'smarter': return gemini('gemini-2.5-flash');
        case 'thinker': return openrouter('deepseek/deepseek-r1');
        case 'flux': return gemini('gemini-2.5-pro');
        case 'sage': return gemini('gemini-2.5-pro');
        case 'oracle': return gemini('gemini-2.5-pro');
        default: return gemini('gemini-2.5-flash');
    }
};

```
