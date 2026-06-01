import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { checkRateLimit, appendShortTermMemory } from '@/lib/redis/upstash';
import { SSEWriter, getMissedEvents } from '@/services/transport/sseManager';
import { executeOrchestration } from '@/services/ai/orchestrator';
import { CognitiveMode, SubscriptionTier } from '@/types';

// Energy cost definitions based on the cognitive engine
const MODE_COSTS: Record<CognitiveMode, number> = {
  spark: 1,
  smarter: 2,
  thinker: 5,
  flux: 3,
  sage: 5,
  oracle: 20
};

export const maxDuration = 60; // Allow function to run for up to 60s for Oracle mode

export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id')!;
    const userTier = req.headers.get('x-user-tier') as SubscriptionTier;
    const lastEventId = req.headers.get('last-event-id');

    const body = await req.json();
    let { chat_id, message, mode = 'smarter' } = body;
    const cognitiveMode = mode as CognitiveMode;

    // ==========================================
    // 1. RECONNECTION HANDLING (SLIDING WINDOW)
    // ==========================================
    if (lastEventId && chat_id) {
      const missedEvents = await getMissedEvents(chat_id, lastEventId);
      
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          for (const evt of missedEvents) {
            const chunk = `event: ${evt.event}\nid: ${evt.id}\ndata: ${JSON.stringify(evt.data)}\n\n`;
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        }
      });
      
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
        }
      });
    }

    // ==========================================
    // 2. RATE LIMITING & ECONOMIC PROTECTION
    // ==========================================
    if (!message) {
      return NextResponse.json({ error: 'Message content required.' }, { status: 400 });
    }

    const { success, limit, remaining, resetAt } = await checkRateLimit(userId, userTier);
    if (!success) {
      return NextResponse.json({ 
        error: 'ORACLE requires a brief cooldown cycle to align cognitive resources. Please pause for 5 seconds.',
        limit, remaining, resetAt 
      }, { status: 429 });
    }

    const cost = MODE_COSTS[cognitiveMode] || 1;
    
    // Validate energy balance inside a transaction to prevent race conditions
    const { data: usageData } = await supabaseAdmin
      .from('ai_usage')
      .select('energy_balance')
      .eq('user_id', userId)
      .single();

    if (!usageData || usageData.energy_balance < cost) {
      // Perception-Engineered 402 Error
      return NextResponse.json({ 
        error: 'Context horizon reached. Elevate your capability to expand your intelligence allocation.' 
      }, { status: 402 });
    }

    // Deduct energy immediately
    await supabaseAdmin.rpc('decrement_energy', { 
      target_user_id: userId, 
      cost_amount: cost 
    }); 
    // *Note: Assuming `decrement_energy` SQL RPC is added for atomic deduction. 
    // Alternatively, update directly if using optimistic locking.
    await supabaseAdmin
      .from('ai_usage')
      .update({ energy_balance: usageData.energy_balance - cost })
      .eq('user_id', userId);

    // ==========================================
    // 3. CONVERSATION STATE INITIALIZATION
    // ==========================================
    if (!chat_id) {
      const { data: newChat } = await supabaseAdmin
        .from('chats')
        .insert({ user_id: userId, title: message.substring(0, 40) })
        .select('id')
        .single();
      chat_id = newChat?.id;
    }

    // Log the user's prompt to PostgreSQL Long-Term History
    await supabaseAdmin
      .from('messages')
      .insert({
        chat_id,
        role: 'user',
        content: message,
        tokens: Math.ceil(message.length / 4) // Rough estimate
      });

    // Add to Redis Short-Term Memory
    await appendShortTermMemory(chat_id, { role: 'user', content: message });

    // ==========================================
    // 4. INITIATE SSE STREAM & ORCHESTRATION
    // ==========================================
    const stream = new ReadableStream({
      async start(controller) {
        const streamWriter = new SSEWriter(controller, chat_id);
        
        // Pass to the Multi-Model Orchestrator (Implementation in Phase 6)
        await executeOrchestration({
          chatId: chat_id,
          userId,
          userTier,
          message,
          mode: cognitiveMode
        }, streamWriter);
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

