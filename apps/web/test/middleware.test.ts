/**
 * <!-- agent-notes: { ctx: "TDD test suite for Edge Rate Limiting Middleware", deps: ["apps/web/src/middleware.ts"], state: "active", last: "tara@2026-08-25" } -->
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { middleware, resetRateLimitStore } from '../src/middleware';
import { NextRequest } from 'next/server';

function createMockNextRequest(url: string, ip: string = '127.0.0.1'): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    headers: {
      'x-forwarded-for': ip,
    },
  });
}

describe('Edge Rate Limiting Middleware', () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it('should allow requests below the rate limit threshold for public AI endpoints', async () => {
    const req = createMockNextRequest('/api/jobs/upload', '1.2.3.4');
    const res = await middleware(req);

    expect(res.status).not.toBe(429);
  });

  it('should return 429 Too Many Requests when rate limit is exceeded on /api/jobs/upload', async () => {
    const clientIp = '5.6.7.8';
    
    // Send 10 allowed requests (limit is 10 per min)
    for (let i = 0; i < 10; i++) {
      const req = createMockNextRequest('/api/jobs/upload', clientIp);
      const res = await middleware(req);
      expect(res.status).not.toBe(429);
    }

    // 11th request should be blocked
    const excessReq = createMockNextRequest('/api/jobs/upload', clientIp);
    const excessRes = await middleware(excessReq);

    expect(excessRes.status).toBe(429);
    const json = await excessRes.json();
    expect(json.error).toBe('Too many requests. Please try again later.');
  });

  it('should return 429 Too Many Requests when rate limit is exceeded on /api/lab/chat', async () => {
    const clientIp = '9.10.11.12';
    
    for (let i = 0; i < 10; i++) {
      const req = createMockNextRequest('/api/lab/chat', clientIp);
      const res = await middleware(req);
      expect(res.status).not.toBe(429);
    }

    const excessReq = createMockNextRequest('/api/lab/chat', clientIp);
    const excessRes = await middleware(excessReq);

    expect(excessRes.status).toBe(429);
  });

  it('should not rate limit non-AI endpoints like /api/health', async () => {
    const clientIp = '13.14.15.16';
    
    for (let i = 0; i < 15; i++) {
      const req = createMockNextRequest('/api/health', clientIp);
      const res = await middleware(req);
      expect(res.status).not.toBe(429);
    }
  });
});
