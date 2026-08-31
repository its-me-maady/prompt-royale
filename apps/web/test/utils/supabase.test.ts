import { describe, it, expect, vi, beforeEach } from 'vitest';

// We mock next/headers cookies
export const mockCookieStore = {
  getAll: vi.fn().mockReturnValue([]),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: () => mockCookieStore,
}));

describe('Supabase SSR Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';
  });

  it('should successfully create a browser client', async () => {
    const { createClient } = await import('../../src/utils/supabase/client');
    const client = createClient();
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
  });

  it('should successfully create a server client and access cookies', async () => {
    const { createClient } = await import('../../src/utils/supabase/server');
    const client = createClient();
    expect(client).toBeDefined();
    
    // Trigger cookies read
    await client.auth.getUser();
    expect(mockCookieStore.getAll).toHaveBeenCalled();
  });
});
