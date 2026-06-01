```typescript
// ==========================================
// ORACLE System Shared TypeScript Interfaces
// ==========================================

export type SubscriptionTier = 'free' | 'plus' | 'pro' | 'elite';
export type MessageRole = 'user' | 'assistant' | 'system';
export type MemoryType = 'semantic' | 'episodic' | 'emotional' | 'project';
export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type CognitiveMode = 'spark' | 'smarter' | 'thinker' | 'flux' | 'sage' | 'oracle';

export interface User {
  id: string; // UUID matching Supabase auth.users
  email: string;
  tier: SubscriptionTier;
  tier_expires_at: string | null;
  email_verified: boolean;
  created_at: string;
}

export interface Chat {
  id: string;
  user_id: string;
  title: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  role: MessageRole;
  content: string;
  model_used?: string;
  tokens: number;
  sources_attached: Citation[];
  created_at: string;
}

export interface Citation {
  title: string;
  url: string;
  domain: string;
  confidence: number;
}

export interface MemoryNode {
  id: string;
  user_id: string;
  type: MemoryType;
  content: string;
  embedding: number[]; // 1536 dimensions
  importance_score: number;
  emotional_weight: number;
  stability_factor: number;
  last_accessed_at: string;
  created_at: string;
}

export interface UpgradeRequest {
  id: string;
  user_id: string;
  requested_tier: SubscriptionTier;
  status: RequestStatus;
  created_at: string;
}

export interface ReferralCode {
  id: string;
  code: string;
  tier: SubscriptionTier;
  duration_days: number;
  assigned_user_id: string | null;
  expires_at: string;
  used: boolean;
}

export interface AiUsage {
  id: string;
  user_id: string;
  energy_balance: number;
  total_tokens_used: number;
  oracle_uses_today: number;
  tavily_searches_today: number;
  reset_at: string;
}

export interface AdminTelemetry {
  totalUsers: number;
  dailyActiveUsers: number;
  messagesToday: number;
  geminiUsage: number;
  groqUsage: number;
  deepSeekUsage: number;
  tavilyUsage: number;
}

```
