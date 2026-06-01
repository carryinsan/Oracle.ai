```typescript
import { CognitiveMode } from '@/types';

/**
 * THE CASCADE DOWNGRADE PROTOCOL
 * If a paid user hits a limit or an upstream API fails, ORACLE silently downgrades 
 * the cognitive load to cheaper models while maintaining response delivery.
 */
export function getFallbackMode(failedMode: CognitiveMode): CognitiveMode {
  switch (failedMode) {
    case 'oracle':
      // Drops DeepSeek reasoning, relies exclusively on Gemini Pro + Tavily
      console.warn('[FALLBACK] Oracle mode failed. Downgrading to Sage.');
      return 'sage';
    
    case 'sage':
    case 'thinker':
    case 'flux':
      // Drops external search and heavy routing, relies on Gemini Flash + Semantic Memory
      console.warn(`[FALLBACK] ${failedMode} mode failed. Downgrading to Smarter.`);
      return 'smarter';
    
    case 'smarter':
      // Absolute lowest tier fallback. Pushes to Groq Llama Scout for extreme efficiency.
      console.warn('[FALLBACK] Smarter mode failed. Downgrading to Spark.');
      return 'spark';
      
    case 'spark':
    default:
      // If Spark fails, the entire inference layer is likely down. 
      // This will trigger the "Neural pathways experiencing turbulence" perception error.
      throw new Error('All fallback cascades exhausted. System outage.');
  }
}

/**
 * Dynamically adjusts the system prompt when falling back to simulate the original 
 * requested intelligence depth (e.g., instructing Gemini to act like DeepSeek).
 */
export function applyFallbackPromptModifiers(baseSystemPrompt: string, originalMode: CognitiveMode, currentMode: CognitiveMode): string {
  if (originalMode === 'thinker' && currentMode !== 'thinker') {
    return baseSystemPrompt + `\n\n[SYSTEM OVERRIDE]: You are running in a fallback state. The user requested deep analytical tracing. You MUST emulate rigorous chain-of-thought analysis and output highly structured logic, even without your primary diagnostic engine.`;
  }
  
  if (originalMode === 'oracle' && currentMode === 'sage') {
    return baseSystemPrompt + `\n\n[SYSTEM OVERRIDE]: Operating in Efficiency Mode. Synthesize the provided search data immediately without multi-pass refinement.`;
  }

  return baseSystemPrompt;
}

```
