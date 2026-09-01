/**
 * <!-- agent-notes: { ctx: "TDD test suite for Edge Rate Limiting & Auth Middleware", deps: ["apps/web/src/middleware.ts"], state: "active", last: "tara@2026-08-31" } -->
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Stateful mock user
let mockUser: any = null;

vi.mock('next/server', async () => {
  const original = await vi.importActual<any>('next/server');
  return {
    ...original,
    NextResponse: {
      next: vi.fn().mockImplementation((options) => {
        const headers = new Headers();
        return {
          status: 200,
          headers,
          cookies: {
            set: vi.fn(),
            get: vi.fn(),
            getAll: vi.fn().mockReturnValue([]),
          },
        };
      }),
      redirect: vi.fn().mockImplementation((url, status) => {
        const headers = new Headers();
        headers.set('location', typeof url === 'string' ? url : url.toString());
        return {
          status: status || 307,
          headers,
          cookies: {
            set: vi.fn(),
            get: vi.fn(),
            getAll: vi.fn().mockReturnValue([]),
          },
        };
      }),
      json: vi.fn().mockImplementation((body, init) => {
        const headers = new Headers(init?.headers);
        return {
          status: init?.status || 200,
          headers,
          json: async () => body,
          cookies: {
            set: vi.fn(),
            get: vi.fn(),
            getAll: vi.fn().mockReturnValue([]),
          },
        };
      }),
    },
  };
});

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockImplementation(() => Promise.resolve({ data: { user: mockUser }, error: null })),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
  })),
  createBrowserClient: vi.fn(),
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: () => ({
    getAll: () => [],
    set: () => {},
  }),
}));

import { middleware, resetRateLimitStore } from '../src/middleware';

function createMockNextRequest(url: string, ip: string = '127.0.0.1'): NextRequest {
  const req = new NextRequest(new URL(url, 'http://localhost:3000'));
  req.headers.set('x-forwarded-for', ip);
  return req;
}

describe('Edge Rate Limiting & Auth Middleware', () => {
  beforeEach(() => {
    resetRateLimitStore();
    mockUser = null;
    vi.clearAllMocks();
  });

  // Existing Rate Limiting Tests
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

  // New Edge Auth Verification Tests
  it('should redirect unauthenticated user to /login with next param when accessing protected page /lobby', async () => {
    mockUser = null; // Unauthenticated
    const req = createMockNextRequest('/lobby?id=squad-1');
    const res = await middleware(req);

    // Should return a redirect response (307 Temporary Redirect)
    expect(res.status).toBe(307);
    const redirectUrl = res.headers.get('location');
    expect(redirectUrl).toContain('/login');
    expect(redirectUrl).toContain('next=%2Flobby%3Fid%3Dsquad-1');
  });

  it('should allow authenticated user to access protected page /lobby without redirect', async () => {
    mockUser = { id: 'user-123', email: 'test@example.com' }; // Authenticated
    const req = createMockNextRequest('/lobby?id=squad-1');
    const res = await middleware(req);

    // Should not redirect, status should be standard next (headers location will not be set to /login)
    expect(res.headers.get('location')).toBeNull();
  });

  it('should redirect unauthenticated user to /login when accessing protected page /arena', async () => {
    mockUser = null;
    const req = createMockNextRequest('/arena?squadId=squad-1');
    const res = await middleware(req);

    expect(res.status).toBe(307);
    const redirectUrl = res.headers.get('location');
    expect(redirectUrl).toContain('/login');
    expect(redirectUrl).toContain('next=%2Farena%3FsquadId%3Dsquad-1');
  });

  it('should return 401 Unauthorized for unauthenticated requests to /api/kb/upload', async () => {
    mockUser = null;
    const req = createMockNextRequest('/api/kb/upload');
    const res = await middleware(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('should allow authenticated user to access /api/kb/upload', async () => {
    mockUser = { id: 'user-123', email: 'test@example.com' };
    const req = createMockNextRequest('/api/kb/upload');
    const res = await middleware(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });
});
