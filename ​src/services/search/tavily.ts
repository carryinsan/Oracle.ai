```typescript
import { Citation } from '@/types';

interface TavilyResponse {
  results: Array<{
    title: string;
    url: string;
    content: string;
    score: number;
  }>;
}

export async function executeTavilySearch(query: string, limit: number = 5): Promise<Citation[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.error('TAVILY_API_KEY is missing. Search bypassed.');
    return [];
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'advanced',
        include_answer: false,
        max_results: limit,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API responded with ${response.status}`);
    }

    const data = (await response.json()) as TavilyResponse;

    return data.results.map((result) => ({
      title: result.title,
      url: result.url,
      domain: new URL(result.url).hostname,
      confidence: parseFloat(result.score.toFixed(2)),
    }));
  } catch (error) {
    console.error('Tavily Search Error:', error);
    return []; // Return empty array to allow graceful degradation without breaking the chat stream
  }
}

```
