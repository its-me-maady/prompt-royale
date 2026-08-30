/**
 * agent-notes: { ctx: "Vitest unit tests for database-backed Boss Raid Arena page with presence mocks", deps: ["apps/web/src/app/arena/page.tsx", "apps/web/src/lib/db/supabase-client.ts"], state: "canonical", last: "sato@2026-08-27" }
 */
import React from 'react';
import { render, screen, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ArenaPage from '../../src/app/arena/page';

vi.mock('next/navigation', () => {
  const routerMock = {
    push: vi.fn(),
    replace: vi.fn(),
  };
  const searchParamsMock = {
    get: vi.fn().mockReturnValue('test-squad-1')
  };
  return {
    useRouter: () => routerMock,
    useSearchParams: () => searchParamsMock
  };
});

vi.mock('@/lib/db/supabase-client', () => {
  let presenceCallback: Function | null = null;
  
  const channelMock: any = {
    on: (event: string, opts: any, callback: any) => {
      const cb = typeof opts === 'function' ? opts : callback;
      if (event === 'presence') {
        presenceCallback = cb;
      }
      return channelMock;
    },
    subscribe: (callback: any) => {
      if (typeof callback === 'function') callback('SUBSCRIBED');
      if (presenceCallback) {
        presenceCallback();
      }
      return channelMock;
    },
    track: () => Promise.resolve({}),
    unsubscribe: () => {},
    send: () => {},
    presenceState: () => ({
      'p1': [{ name: 'Player p1' }]
    })
  };

  const dbMock: any = {
    select: () => dbMock,
    eq: () => dbMock,
    single: () => Promise.resolve({
      data: { id: 'test-squad-1', boss_hp: 1000, boss_max_hp: 1000, status: 'active' },
      error: null
    }),
    insert: () => Promise.resolve({ data: null, error: null })
  };

  return {
    supabaseClient: {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signInAnonymously: () => Promise.resolve({ data: { user: { id: 'p1' } }, error: null })
      },
      channel: () => channelMock,
      from: () => dbMock
    }
  };
});

describe('Arena Page', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.0001);

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/arena/revive') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            question: 'Test question?',
            options: ['A', 'B', 'C', 'D'],
            correctIndex: 0
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true })
      });
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('should render a Boss Raid Arena placeholder when connecting', () => {
    render(<ArenaPage />);
    expect(screen.getByText(/Boss Raid Arena/i)).toBeDefined();
    expect(screen.getByText(/Connecting to Arena/i)).toBeDefined();
  });

  it('should become host and render state when presence sync fires', async () => {
    render(<ArenaPage />);

    // Wait for auth to complete and presence sync to fire
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    // We should see the UI
    expect(await screen.findByText(/Test question\?/i)).toBeDefined();
    expect(screen.queryByText(/Connecting to Arena/i)).toBeNull();
  });

  it('should show error banner when vote API fails', async () => {
    render(<ArenaPage />);

    // Wait for host election and UI state
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    // Verify question is loaded
    expect(await screen.findByText(/Test question\?/i)).toBeDefined();

    // Mock fetch to return error status
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/arena/vote') {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Database transaction failed' })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true })
      });
    });

    // Click Option A (the correct option in our mock question metadata)
    const optionA = screen.getAllByText('A')[0];
    await act(async () => {
      optionA.click();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    // Check if error message is displayed
    expect(screen.getByText(/Failed to record vote/i)).toBeDefined();
  });
});
