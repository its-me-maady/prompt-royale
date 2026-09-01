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

const rateLimitStore = new Map<string, RateLimitRecord>();

const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 10;     // 10 requests per minute limit for heavy AI endpoints

const PROTECTED_AI_ROUTES = ['/api/jobs/upload', '/api/lab/chat', '/api/kb/upload'];

export function resetRateLimitStore() {
  rateLimitStore.clear();
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
    const now = Date.now();

    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + WINDOW_MS,
      });
      return authResponse;
    }

    if (record.count >= MAX_REQUESTS) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
            'Content-Type': 'application/json',
          },
        }
      );
    }

    record.count += 1;
    rateLimitStore.set(key, record);
    return authResponse;
  }

  return authResponse;
}

export const config = {
  matcher: [
    '/api/jobs/upload',
    '/api/lab/chat',
    '/api/kb/upload',
    '/lobby/:path*',
    '/arena/:path*',
    '/professor/:path*',
    '/prompt-lab/:path*'
  ],
};
