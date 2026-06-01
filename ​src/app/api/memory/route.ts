import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { generateEmbedding, retrieveRelevantMemories } from '@/services/memory/retrievalEngine';
import { checkRateLimit } from '@/lib/redis/upstash';
import { SubscriptionTier } from '@/types';

// POST /api/memory - Explicitly save a new memory node
export async function POST(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    const userTier = req.headers.get('x-user-tier') as SubscriptionTier;

    if (!userId || !userTier) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Tier Constraint: Free users cannot explicitly construct permanent memory graphs.
    if (userTier === 'free') {
      return NextResponse.json({ 
        error: 'Explicit semantic memory construction requires an elevated tier.' 
      }, { status: 403 });
    }

    const { success, limit, remaining, resetAt } = await checkRateLimit(userId, userTier);
    if (!success) {
      return NextResponse.json({ 
        error: 'ORACLE requires a brief cooldown cycle to align cognitive resources.',
        limit, remaining, resetAt 
      }, { status: 429 });
    }

    const { type, content, tags } = await req.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required.' }, { status: 400 });
    }

    // Generate the 1536-dim vector embedding
    const embedding = await generateEmbedding(content);

    // Save to PostgreSQL pgvector
    const { data, error } = await supabaseAdmin
      .from('memories')
      .insert({
        user_id: userId,
        type: type || 'semantic',
        content,
        embedding,
        importance_score: 0.8, // Manual saves default to high importance
        emotional_weight: 1.0,
      })
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      status: 'success',
      data: {
        memory_id: data.id,
        vectorized: true
      }
    }, { status: 201 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// GET /api/memory - Search active semantic nodes (For Sidebar UI)
export async function GET(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    const userTier = req.headers.get('x-user-tier') as SubscriptionTier;
    
    if (!userId || !userTier) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (userTier === 'free') {
        return NextResponse.json({ error: 'Memory visualization restricted.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    
    if (!query) {
        return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const memories = await retrieveRelevantMemories(userId, query, 10);

    return NextResponse.json({
        status: 'success',
        data: memories
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}


