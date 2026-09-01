// agent-notes: { ctx: "Unit tests for PKCE auth callback route handler and error redirection", deps: ["apps/web/src/app/auth/callback/route.ts", "apps/web/src/utils/supabase/server.ts"], state: "canonical", last: "sato@2026-09-01" }
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockExchangeCodeForSession = vi.fn();

vi.mock('@/utils/supabase/server', () => ({
  createClient: () => ({
    auth: {
      exchangeCodeForSession: (code: string) => mockExchangeCodeForSession(code)
    }
  })
}));

import { GET } from '@/app/auth/callback/route';

describe('GET /auth/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should exchange code for session and redirect to /lobby on success', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ data: { session: {} }, error: null });

    const req = new NextRequest('http://localhost:3000/auth/callback?code=valid-code');
    const res = await GET(req);

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('valid-code');
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/lobby');
  });

  it('should redirect to custom next URL when provided in query params', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ data: { session: {} }, error: null });

    const req = new NextRequest('http://localhost:3000/auth/callback?code=valid-code&next=/professor');
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/professor');
  });

  it('should redirect to /login with error query param when exchange fails', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ data: { session: null }, error: new Error('Invalid code') });

    const req = new NextRequest('http://localhost:3000/auth/callback?code=invalid-code');
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/login?error=verification_failed');
  });

  it('should redirect to /login with error query param when code is missing', async () => {
    const req = new NextRequest('http://localhost:3000/auth/callback');
    const res = await GET(req);

    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/login?error=verification_failed');
  });
});
