```typescript
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { SubscriptionTier } from '@/types';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL!;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN!;

if (!redisUrl || !redisToken) {
  throw new Error("Missing Upstash Redis environment variables.");
}

export const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

// Atomic Token-Bucket Rate Limiting to prevent API abuse and burst traffic
// Note: This operates independently of the Postgres "Energy Balance" to protect infrastructure.
const tierLimiters = {
  free: new Ratelimit({
    redis,
    limiter: Ratelimit.tokenBucket(40, '24 h', 40),
    prefix: 'ratelimit:free',
    ephemeralCache: new Map(),
  }),
  plus: new Ratelimit({
    redis,
    limiter: Ratelimit.tokenBucket(300, '24 h', 300),
    prefix: 'ratelimit:plus',
    ephemeralCache: new Map(),
  }),
  pro: new Ratelimit({
    redis,
    limiter: Ratelimit.tokenBucket(1000, '24 h', 1000),
    prefix: 'ratelimit:pro',
    ephemeralCache: new Map(),
  }),
  elite: new Ratelimit({
    redis,
    limiter: Ratelimit.tokenBucket(5000, '24 h', 5000),
    prefix: 'ratelimit:elite',
    ephemeralCache: new Map(),
  }),
};

export async function checkRateLimit(userId: string, tier: SubscriptionTier) {
  const limiter = tierLimiters[tier] || tierLimiters.free;
  const identifier = `rate_limit:${userId}`;
  
  const { success, limit, remaining, reset } = await limiter.limit(identifier);
  
  return {
    success,
    limit,
    remaining,
    resetAt: new Date(reset).toISOString(),
  };
}

// Short-Term Memory (STM) Cache Management
export async function getShortTermMemory(chatId: string) {
  const data = await redis.lrange(`stm:${chatId}`, 0, 39); // Retrieve last 40 messages
  return data.map((msg) => JSON.parse(msg as string));
}

export async function appendShortTermMemory(chatId: string, message: any) {
  const key = `stm:${chatId}`;
  await redis.rpush(key, JSON.stringify(message));
  // Keep only the rolling window of the last 40 messages to prevent context bloat
  await redis.ltrim(key, -40, -1);
  // Set a 72-hour TTL as specified in the architectural gap analysis
  await redis.expire(key, 259200); 
}

```
