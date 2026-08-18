/**
 * Shared Supabase mock utilities for tests.
 * Provides consistent mock implementations for Supabase auth and database operations.
 */

import { vi } from 'vitest';

/**
 * Creates a mock Supabase auth client with configurable behavior.
 */
export function createMockSupabaseAuth(overrides: {
  getSession?: ReturnType<typeof vi.fn>;
  getUser?: ReturnType<typeof vi.fn>;
  signInAnonymously?: ReturnType<typeof vi.fn>;
  signOut?: ReturnType<typeof vi.fn>;
} = {}) {
  const defaultSession = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: 'mock-user-id',
      email: 'test@example.com',
      created_at: new Date().toISOString(),
    },
  };

  return {
    getSession: overrides.getSession ?? vi.fn().mockResolvedValue({
      data: { session: defaultSession },
      error: null,
    }),
    getUser: overrides.getUser ?? vi.fn().mockResolvedValue({
      data: { user: defaultSession.user },
      error: null,
    }),
    signInAnonymously: overrides.signInAnonymously ?? vi.fn().mockResolvedValue({
      data: { user: defaultSession.user, session: defaultSession },
      error: null,
    }),
    signOut: overrides.signOut ?? vi.fn().mockResolvedValue({ error: null }),
  };
}

/**
 * Creates a mock Supabase client with auth and rpc methods.
 */
export function createMockSupabaseClient(overrides: {
  auth?: ReturnType<typeof createMockSupabaseAuth>;
  rpc?: ReturnType<typeof vi.fn>;
  from?: ReturnType<typeof vi.fn>;
} = {}) {
  return {
    auth: overrides.auth ?? createMockSupabaseAuth(),
    rpc: overrides.rpc ?? vi.fn().mockResolvedValue({ data: null, error: null }),
    from: overrides.from ?? vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  };
}

/**
 * Mock for the server-side supabase client (uses service role key).
 */
export function createMockServerSupabase(overrides: {
  rpc?: ReturnType<typeof vi.fn>;
  auth?: ReturnType<typeof createMockSupabaseAuth>;
} = {}) {
  return {
    rpc: overrides.rpc ?? vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: overrides.auth ?? createMockSupabaseAuth(),
  };
}

/**
 * Mock for the client-side supabase client (uses anon key).
 */
export function createMockClientSupabase(overrides: {
  auth?: ReturnType<typeof createMockSupabaseAuth>;
  channel?: ReturnType<typeof vi.fn>;
} = {}) {
  return {
    auth: overrides.auth ?? createMockSupabaseAuth(),
    channel: overrides.channel ?? vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockResolvedValue('SUBSCRIBED'),
      send: vi.fn(),
      presenceState: vi.fn().mockReturnValue({}),
      track: vi.fn(),
      unsubscribe: vi.fn(),
    })),
  };
}

/**
 * Helper to create a mock NextRequest with optional auth header.
 */
export function createMockRequest(body: any, authHeader: string | null = 'Bearer mock-access-token') {
  const headers = new Map<string, string>();
  if (authHeader) headers.set('authorization', authHeader);

  return {
    json: async () => body,
    headers: {
      get: (key: string) => headers.get(key.toLowerCase()) || null,
    },
  } as unknown as Request;
}