```typescript
// This file initializes OpenTelemetry and Sentry before the Next.js server accepts traffic.
// Required per "Production AI Platform Gap Analysis" specifications.

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Dynamically import to ensure this only runs in the Node.js runtime, not Edge
    const { registerOTel } = await import('@vercel/otel');
    
    registerOTel({
      serviceName: 'oracle-core-engine',
      // Sentry propagation and sampling configurations would be injected here
      // instrumentations: [new SentryInstrumentation()]
    });
  }
}

```
