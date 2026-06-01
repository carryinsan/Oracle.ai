```typescript
import { SignJWT, jwtVerify } from 'jose';
import { SubscriptionTier } from '@/types';

// We use 'jose' instead of 'jsonwebtoken' to ensure compatibility with Next.js Edge Middleware
const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(secret);
};

export interface OracleJwtPayload {
  id: string;
  email: string;
  tier: SubscriptionTier;
  [key: string]: any;
}

export async function signToken(payload: OracleJwtPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h') // 24 hour session lifetime
    .sign(getJwtSecretKey());
}

export async function verifyToken(token: string): Promise<OracleJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return payload as OracleJwtPayload;
  } catch (error) {
    return null;
  }
}

```
