/**
 * <!-- agent-notes: { ctx: "Edge Rate Limiting & Auth Middleware", deps: ["apps/web/src/utils/supabase/middleware.ts"], state: "canonical", last: "sato@2026-08-31" } -->
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from './utils/supabase/middleware';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

import { rateLimiter } from './services/rateLimiter';

const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 10;     // 10 requests per minute limit for heavy AI endpoints

const PROTECTED_AI_ROUTES = ['/api/lab/chat', '/api/kb/upload'];

export function resetRateLimitStore() {
  rateLimiter.resetFallbackStore();
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Edge Authentication validation
  const isProtectedRoute =
    pathname.startsWith('/lobby') ||
    pathname.startsWith('/arena') ||
    pathname.startsWith('/professor') ||
    pathname.startsWith('/prompt-lab') ||
    pathname.startsWith('/api/kb/upload');

  let authResponse = NextResponse.next({ request });
  if (isProtectedRoute) {
    authResponse = await updateSession(request);
    // If the auth middleware returned a redirect or error response, halt and return it
    if (
      authResponse.status === 401 ||
      authResponse.status === 307 ||
      authResponse.status === 302 ||
      authResponse.headers.get('location')
    ) {
      return authResponse;
    }
  }

  // 2. AI endpoints rate limiting
  const isRateLimitedRoute = PROTECTED_AI_ROUTES.some((route) => pathname.startsWith(route));

  if (isRateLimitedRoute) {
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const key = `${clientIp}:${pathname}`;

    const limitResult = await rateLimiter.checkRateLimit(key, MAX_REQUESTS, WINDOW_MS);

    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(limitResult.retryAfter),
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return authResponse;
  }

  return authResponse;
}

export const config = {
  matcher: [
    '/api/lab/chat',
    '/api/kb/upload',
    '/lobby/:path*',
    '/arena/:path*',
    '/professor/:path*',
    '/prompt-lab/:path*'
  ],
};
