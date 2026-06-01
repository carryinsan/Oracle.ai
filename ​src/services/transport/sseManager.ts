```typescript
import { redis } from '@/lib/redis/upstash';
import { v4 as uuidv4 } from 'uuid';

export interface SSEEvent {
  id: string;
  event: 'start' | 'memory_used' | 'source_attached' | 'token' | 'system_error' | 'done';
  data: any;
}

export class SSEWriter {
  private controller: ReadableStreamDefaultController<any>;
  private encoder: TextEncoder;
  private chatId: string;

  constructor(controller: ReadableStreamDefaultController<any>, chatId: string) {
    this.controller = controller;
    this.encoder = new TextEncoder();
    this.chatId = chatId;
  }

  /**
   * Encodes and writes an SSE compliant chunk to the stream, 
   * and simultaneously caches it in Redis for the sliding-window replay buffer.
   */
  async emit(eventType: SSEEvent['event'], data: any) {
    const id = `msg_${uuidv4()}`;
    const payload = JSON.stringify(data);
    
    // Format according to standard text/event-stream specifications
    const chunk = `event: ${eventType}\nid: ${id}\ndata: ${payload}\n\n`;
    this.controller.enqueue(this.encoder.encode(chunk));

    // Save to Redis for the Replay Buffer (Background fire-and-forget to avoid latency)
    this.cacheEvent({ id, event: eventType, data }).catch(console.error);
  }

  private async cacheEvent(eventPayload: SSEEvent) {
    const key = `sse_buffer:${this.chatId}`;
    await redis.rpush(key, JSON.stringify(eventPayload));
    // Keep only the last 1000 events per chat stream (Sliding Window)
    await redis.ltrim(key, -1000, -1);
    // Expire the buffer after 1 hour to free memory
    await redis.expire(key, 3600);
  }

  close() {
    this.controller.close();
  }
}

/**
 * Retrieves missed events from the Redis replay buffer if a connection drops.
 */
export async function getMissedEvents(chatId: string, lastEventId: string): Promise<SSEEvent[]> {
  const key = `sse_buffer:${this.chatId}`;
  const history = await redis.lrange(key, 0, -1);
  
  const parsedHistory: SSEEvent[] = history.map((item) => JSON.parse(item as string));
  const startIndex = parsedHistory.findIndex((e) => e.id === lastEventId);
  
  if (startIndex === -1) {
    return parsedHistory; // If ID not found, return all available in buffer
  }
  
  return parsedHistory.slice(startIndex + 1);
}

```
