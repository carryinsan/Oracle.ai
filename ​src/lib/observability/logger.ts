```typescript
import { trace, metrics } from '@opentelemetry/api';

// Initialize Tracer and Meter mapped to the oracle-core-engine service
const tracer = trace.getTracer('oracle-core-service');
const meter = metrics.getMeter('oracle-telemetry');

// System Metrics (As defined in Gap Analysis Page 18)
const activeStreamsCounter = meter.createUpDownCounter('oracle.streams.active', {
  description: 'Active server-sent event (SSE) connection count.',
});

const tokenOutputLatency = meter.createHistogram('oracle.tokens.latency_ms', {
  description: 'E2E latency from token generation to streaming transmission.',
  unit: 'ms',
});

/**
 * Wraps an active Server-Sent Event stream in an OpenTelemetry span
 * to track connection lifecycle, IP, and latency.
 */
export const instrumentSSEStream = (req: Request, userId: string, chatId: string) => {
  const lastEventId = req.headers.get('last-event-id') || 'null';
  
  const span = tracer.startSpan('sse.connection.session', {
    attributes: {
      'user.id': userId,
      'chat.id': chatId,
      'last.event.id': lastEventId,
      'transport': 'sse'
    }
  });

  activeStreamsCounter.add(1);

  // Return a cleanup function to be called when the stream terminates
  const endStreamTracing = () => {
    activeStreamsCounter.add(-1);
    span.end();
  };

  return { span, tokenOutputLatency, endStreamTracing };
};

/**
 * Standardized Perception-Engineered Error Messages
 */
export const PerceptionErrors = {
  RATE_LIMIT: 'ORACLE requires a brief cooldown cycle to align cognitive resources. Please pause for 5 seconds.',
  UPSTREAM_FAILURE: 'Neural pathways are currently experiencing turbulence. Rerouting logic streams...',
  FUNDS_EXHAUSTED: 'Context horizon reached. Elevate your capability to expand your intelligence allocation.'
};

```
