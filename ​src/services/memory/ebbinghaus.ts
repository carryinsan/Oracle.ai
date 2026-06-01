```typescript
/**
 * Calculates the memory retention probability based on elapsed time and stability.
 * Formula: R(t) = exp(-t / S)
 */
export const calculateRetention = (elapsedDays: number, stability: number): number => {
  return Math.exp(-elapsedDays / Math.max(stability, 0.1)); // Prevent division by zero
};

/**
 * Dynamically adjusts the stability of a memory node after it has been retrieved/reviewed.
 * Formula: S_new = S_old + c * exp(-lambda * t)
 */
export const updateStability = (
  prevStability: number, 
  elapsedDays: number, 
  c = 0.5, 
  lambda = 0.08
): number => {
  return prevStability + c * Math.exp(-lambda * elapsedDays);
};

/**
 * Computes the final composite utility score to rank memories before injecting into the LLM context.
 */
export const computeCompositeScore = (
  similarity: number, 
  retention: number, 
  importance: number, 
  emotionalWeight: number
): number => {
  // Weights defined by the ORACLE Architecture Specification
  const w1 = 0.50; // Semantic Similarity
  const w2 = 0.20; // Temporal Retention
  const w3 = 0.15; // Factual Importance
  const w4 = 0.15; // Emotional Valence

  return (w1 * similarity) + (w2 * retention) + (w3 * importance) + (w4 * emotionalWeight);
};

```
