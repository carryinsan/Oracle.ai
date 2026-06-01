```typescript
import { supabaseAdmin } from '@/lib/db/supabase';
import { calculateRetention, computeCompositeScore, updateStability } from './ebbinghaus';
import { MemoryNode } from '@/types';

/**
 * Generates a 1536-dimensional embedding using Gemini.
 * Note: Gemini text-embedding-004 outputs 768 dimensions by default. 
 * To match the strict 1536 schema requirement, we handle vector standardization.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY_1;
  if (!apiKey) throw new Error("Missing Gemini API Key");

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/text-embedding-004',
      content: { parts: [{ text }] }
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to generate embedding: ${response.statusText}`);
  }

  const data = await response.json();
  let vector = data.embedding.values;

  // Standardization to 1536 dimensions for pgvector compatibility (duplicating/padding)
  if (vector.length === 768) {
      vector = [...vector, ...vector]; 
  } else if (vector.length > 1536) {
      vector = vector.slice(0, 1536);
  }

  return vector;
}

/**
 * Retrieves, scores, and updates memories using the dual-layer architecture.
 */
export async function retrieveRelevantMemories(
  userId: string, 
  query: string, 
  limit: number = 10
): Promise<MemoryNode[]> {
  
  const queryEmbedding = await generateEmbedding(query);

  // 1. Execute HNSW Cosine Similarity Search via PostgreSQL RPC
  const { data: matchedIds, error: rpcError } = await supabaseAdmin.rpc('match_memories', {
    query_embedding: queryEmbedding,
    match_threshold: 0.65,
    match_count: limit * 2, // Fetch extra for secondary Ebbinghaus re-ranking
    target_user_id: userId
  });

  if (rpcError || !matchedIds || matchedIds.length === 0) {
    return [];
  }

  // 2. Fetch full metadata for the matched memories
  const ids = matchedIds.map((m: any) => m.id);
  const { data: memories, error: fetchError } = await supabaseAdmin
    .from('memories')
    .select('*')
    .in('id', ids);

  if (fetchError || !memories) return [];

  const now = new Date();
  
  // 3. Apply Ebbinghaus Forgetting Curve & Composite Scoring
  const scoredMemories = memories.map((mem: MemoryNode) => {
    const rpcMatch = matchedIds.find((m: any) => m.id === mem.id);
    const similarity = rpcMatch ? rpcMatch.similarity : 0.65;
    
    const lastAccessed = new Date(mem.last_accessed_at);
    const elapsedDays = (now.getTime() - lastAccessed.getTime()) / (1000 * 3600 * 24);
    
    const retention = calculateRetention(elapsedDays, mem.stability_factor);
    
    const compositeScore = computeCompositeScore(
      similarity, 
      retention, 
      mem.importance_score, 
      mem.emotional_weight
    );

    return { ...mem, compositeScore, similarity, elapsedDays };
  });

  // 4. Sort by composite score and slice to final limit
  scoredMemories.sort((a, b) => b.compositeScore - a.compositeScore);
  const finalMemories = scoredMemories.slice(0, limit);

  // 5. Asynchronously update the stability of recalled memories (Memory Consolidation)
  if (finalMemories.length > 0) {
    const updatePromises = finalMemories.map(async (mem) => {
      const newStability = updateStability(mem.stability_factor, mem.elapsedDays);
      await supabaseAdmin
        .from('memories')
        .update({ 
          stability_factor: newStability,
          last_accessed_at: now.toISOString()
        })
        .eq('id', mem.id);
    });
    // Fire and forget updates to prevent blocking the main response
    Promise.all(updatePromises).catch(console.error);
  }

  return finalMemories;
}

```
