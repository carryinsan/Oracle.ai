```typescript
import { redis } from '@/lib/redis/upstash';
import { supabaseAdmin } from '@/lib/db/supabase';
import { SubscriptionTier } from '@/types';

/**
 * Tracks rapid variations in usage patterns to detect bot farms or 
 * account credential sharing (e.g., > 50 Oracle calls in 5 minutes).
 */
export async function scanForAnomalies(userId: string, tier: SubscriptionTier, mode: string): Promise<boolean> {
  // Elite tier has heuristic limits raised significantly
  if (tier === 'elite') return true; 
  
  const key = `anomaly:${userId}:${mode}`;
  
  // Increment the usage counter for this specific user/mode combo
  const currentVelocity = await redis.incr(key);
  
  if (currentVelocity === 1) {
    // Set a 5-minute rolling window for anomaly detection
    await redis.expire(key, 300);
  }

  // Threshold: If a non-elite user fires more than 40 heavy requests in 5 minutes, flag as abuse
  const MAX_CALLS_PER_5_MIN = mode === 'oracle' ? 20 : 40;

  if (currentVelocity > MAX_CALLS_PER_5_MIN) {
    console.warn(`[SECURITY] Abuse detected for user ${userId}. Velocity: ${currentVelocity} calls/5m`);
    
    // 1. Temporarily lock the account at the database level
    await supabaseAdmin
      .from('users')
      .update({ is_banned: true })
      .eq('id', userId);

    // 2. Log to the Immutable Audit Table
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        action: 'AUTOMATED_SECURITY_LOCK',
        target_user: userId,
        metadata: { reason: 'Velocity anomaly detected', velocity: currentVelocity, window: '5m' }
      });

    return false; // Request denied
  }

  return true; // Request approved
}

```
