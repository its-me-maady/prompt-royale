/**
 * <!-- agent-notes: { ctx: "Edge Rate Limiting & Security Middleware", deps: ["AGENTS.md", "docs/adrs/0011-edge-api-defense-rate-limiting.md"], state: "active", last: "sato@2026-08-25" } -->
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 10;     // 10 requests per minute limit for heavy AI endpoints

const PROTECTED_AI_ROUTES = ['/api/jobs/upload', '/api/lab/chat'];

export function resetRateLimitStore() {
  rateLimitStore.clear();
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply sliding window rate limiting to protected AI endpoints
  const isProtectedRoute = PROTECTED_AI_ROUTES.some((route) => pathname.startsWith(route));

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  const key = `${clientIp}:${pathname}`;
  const now = Date.now();

  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
    return NextResponse.next();
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

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/jobs/upload', '/api/lab/chat'],
};
