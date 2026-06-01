```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/security/jwt';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isAdminRoute = path.startsWith('/admin') || path.startsWith('/api/admin');
  const isProtectedApi = path.startsWith('/api/chat') || path.startsWith('/api/memory');

  // ==========================================
  // 1. ADMIN ROUTE ISOLATION (Dual-Layered)
  // ==========================================
  if (isAdminRoute) {
    const adminSecretHeader = request.headers.get('x-admin-secret');
    const adminSecretCookie = request.cookies.get('admin_secret')?.value;
    
    // Check 1: Must possess the ADMIN_SECRET (Header for API, Cookie for UI)
    const providedSecret = adminSecretHeader || adminSecretCookie;
    if (providedSecret !== process.env.ADMIN_SECRET) {
      // Return 404 to obscure the existence of the admin route from scanners
      return new NextResponse(null, { status: 404, statusText: 'Not Found' });
    }

    // Check 2: Must have a valid JWT
    const token = request.cookies.get('oracle_token')?.value || request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized Admin Access' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or Expired Session' }, { status: 401 });
    }
    
    // Pass user ID to the headers for downstream API usage
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.id);
    requestHeaders.set('x-user-tier', payload.tier);
    
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // ==========================================
  // 2. STANDARD API PROTECTION (Chat, Memory)
  // ==========================================
  if (isProtectedApi) {
    const token = request.headers.get('authorization')?.split(' ')[1] || request.cookies.get('oracle_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired credentials' }, { status: 401 });
    }

    // Pass validated claims to the downstream API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.id);
    requestHeaders.set('x-user-tier', payload.tier);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/chat/:path*',
    '/api/memory/:path*'
  ]
};

```
