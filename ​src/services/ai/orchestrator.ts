```typescript
import { streamText, generateText } from 'ai';
import { CognitiveMode, SubscriptionTier } from '@/types';
import { SSEWriter } from '../transport/sseManager';
import { retrieveRelevantMemories } from '../memory/retrievalEngine';
import { executeTavilySearch } from '../search/tavily';
import { getModelTarget } from './clients';
import * as Prompts from './prompts';

interface OrchestrationParams {
  chatId: string;
  userId: string;
  userTier: SubscriptionTier;
  message: string;
  mode: CognitiveMode;
}

export async function executeOrchestration(params: OrchestrationParams, streamWriter: SSEWriter) {
  try {
    // 1. Emit Initialization Start Event
    await streamWriter.emit('start', { chat_id: params.chatId, timestamp: Date.now() });

    // 2. Parallel Context Retrieval (Memory & Live Web Search)
    const requiresSearch = params.mode === 'sage' || params.mode === 'oracle';
    
    const [memories, sources] = await Promise.all([
      retrieveRelevantMemories(params.userId, params.message, 5),
      requiresSearch ? executeTavilySearch(params.message, params.userTier === 'free' ? 3 : 10) : Promise.resolve([])
    ]);

    const { memStr, srcStr } = Prompts.buildContextString(memories, sources);

    // 3. Emit Context Metadata to Frontend (for Sidebar Nodes & Source Drawers)
    await streamWriter.emit('memory_used', { nodes: memories.map(m => m.id) });
    if (requiresSearch) {
      await streamWriter.emit('source_attached', { sources });
    }

    // 4. Model Selection and Routing
    const activeModel = getModelTarget(params.mode);
    let finalSystemPrompt = '';

    // ==========================================
    // 5. EXECUTE MULTI-PASS ARCHITECTURES
    // ==========================================
    
    // --- SINGLE PASS MODES (Spark, Smarter, Thinker) ---
    if (params.mode === 'spark' || params.mode === 'smarter' || params.mode === 'thinker') {
      let basePrompt = '';
      if (params.mode === 'spark') basePrompt = Prompts.SPARK_PROMPT;
      if (params.mode === 'smarter') basePrompt = Prompts.SMARTER_PROMPT;
      if (params.mode === 'thinker') basePrompt = Prompts.THINKER_PROMPT;

      finalSystemPrompt = basePrompt.replace('{memory_injection}', memStr) + `\n\n${Prompts.MEMORY_RULES}`;
    } 
    
    // --- TWO-PASS MODES (Flux, Sage) ---
    else if (params.mode === 'flux' || params.mode === 'sage') {
      const pass1Prompt = params.mode === 'flux' ? Prompts.FLUX_PASS_1 : Prompts.SAGE_PASS_1;
      
      const { text: pass1Output } = await generateText({
        model: activeModel,
        system: pass1Prompt,
        prompt: params.message
      });

      const pass2Prompt = params.mode === 'flux' ? Prompts.FLUX_PASS_2 : Prompts.SAGE_PASS_2;
      finalSystemPrompt = pass2Prompt
        .replace('{pass_1_output}', pass1Output)
        .replace('{search_injection}', srcStr)
        .replace('{memory_injection}', memStr) + `\n\n${Prompts.MEMORY_RULES}`;
    }
    
    // --- THREE-PASS MODE (Oracle Flagship) ---
    else if (params.mode === 'oracle') {
      // Pass 1: Decompose
      const { text: pass1Output } = await generateText({
        model: activeModel,
        system: Prompts.ORACLE_PASS_1,
        prompt: params.message
      });

      // Pass 2: Refine
      const { text: pass2Output } = await generateText({
        model: activeModel,
        system: Prompts.ORACLE_PASS_2.replace('{pass_1_output}', pass1Output),
        prompt: params.message
      });

      // Pass 3: Setup Final Synthesis
      finalSystemPrompt = Prompts.ORACLE_PASS_3
        .replace('{pass_2_output}', pass2Output)
        .replace('{search_injection}', srcStr)
        .replace('{memory_injection}', memStr) + `\n\n${Prompts.MEMORY_RULES}`;
    }

    // ==========================================
    // 6. EXECUTE FINAL GENERATION & STREAM TO CLIENT
    // ==========================================
    const result = await streamText({
      model: activeModel,
      system: finalSystemPrompt,
      prompt: params.message,
    });

    let cumulative = '';
    
    // Token Streaming Loop with Translation Interceptor
    for await (const textPart of result.textStream) {
      let filteredPart = textPart;
      
      // Dynamic Regex Replacer: Translates DeepSeek's native <think> tags 
      // into ORACLE's <oracle_steps> XML component required by our AST parser.
      if (params.mode === 'thinker') {
        filteredPart = filteredPart.replace(/<think>/g, '<oracle_steps>\n');
        filteredPart = filteredPart.replace(/<\/think>/g, '\n</oracle_steps>\n');
      }

      cumulative += filteredPart;
      await streamWriter.emit('token', { delta: filteredPart, content: cumulative });
    }

    // 7. Emit Done Event with Telemetry
    const usage = await result.usage;
    await streamWriter.emit('done', {
      finish_reason: 'stop',
      prompt_tokens: usage?.promptTokens || 0,
      completion_tokens: usage?.completionTokens || 0,
      total_tokens: usage?.totalTokens || 0
    });

  } catch (error: any) {
    console.error('Orchestration Error:', error);
    // Cascade Downgrade and Error Emit (To be fully fleshed out in Phase 9, 
    // but ensures the UI catches the error immediately without hanging).
    await streamWriter.emit('system_error', {
      code: 'neural_pathway_turbulent',
      message: 'Neural pathways are currently experiencing turbulence. The system is attempting to route through alternative logic streams...',
      fallback_active: true
    });
  } finally {
    streamWriter.close();
  }
}


```
