/**
 * agent-notes: { ctx: "Supabase auth and client mock for tests", deps: [], state: "canonical", last: "agent@2026-08-18" }
 */
import { vi } from 'vitest';

export const mockSupabaseAuth = {
  getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
  getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
  signInAnonymously: vi.fn().mockResolvedValue({
    data: { user: { id: 'anon-user-123' }, session: { access_token: 'mock-token' } },
    error: null,
  }),
};

export const mockSupabaseChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockResolvedValue('SUBSCRIBED'),
  send: vi.fn(),
  presenceState: vi.fn().mockReturnValue({ 'p1': {} }),
  track: vi.fn(),
  unsubscribe: vi.fn(),
};

export const supabase = {
  rpc: vi.fn(),
  auth: mockSupabaseAuth,
  channel: vi.fn(() => mockSupabaseChannel),
};

export const supabaseClient = supabase;