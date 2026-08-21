import { vi } from 'vitest';

// Mock custom fetch for global setting if needed by components
global.fetch = vi.fn();

// Mock Supabase JS Client for Auth testing
const mockCallbacks: Record<string, Function> = {};
const mockSend = vi.fn();

const mockChannel = {
  on: vi.fn(function(this: any, type: string, filter: any, callback: Function) {
    const key = `${type}:${filter.event}`;
    mockCallbacks[key] = callback;
    return this;
  }),
  subscribe: vi.fn(function(this: any, cb) {
    if (cb) cb('SUBSCRIBED');
    return this;
  }),
  send: mockSend,
  presenceState: vi.fn().mockReturnValue({ 'test-user-id-1234': {} }),
  track: vi.fn().mockResolvedValue({}),
  unsubscribe: vi.fn(),
};

const mockSession = { data: { session: { access_token: 'test-token', user: { id: 'test-user-id-1234' } } }, error: null };
const mockUser = { data: { user: { id: 'test-user-id-1234' } }, error: null };

const mockAuth = {
  getSession: vi.fn().mockResolvedValue(mockSession),
  signInAnonymously: vi.fn().mockResolvedValue(mockUser),
};

const mockClient = {
  auth: mockAuth,
  channel: vi.fn().mockReturnValue(mockChannel),
};

// Mock directly in the global space before files load
vi.mock('@/lib/db/supabase-client', () => {
  return {
    supabaseClient: mockClient
  };
});