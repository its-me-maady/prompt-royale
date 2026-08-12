/**
 * <!-- agent-notes: { ctx: "P0 TDD red phase, coverage veto, test strategy owner", deps: ["apps/web/src/app/arena/page.tsx"], state: canonical, last: "sato@2026-08-05", key: ["arena page tests"] } -->
 */
import React from 'react';
import { render, screen, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ArenaPage from '../../src/app/arena/page';

let mockCallbacks: Record<string, Function> = {};
let mockSend = vi.fn();

vi.mock('../../src/lib/db/supabase-client', () => {
  return {
    supabaseClient: {
      channel: vi.fn(() => ({
        on: vi.fn(function(this: any, type: string, filter: any, callback: Function) {
          const key = `${type}:${filter.event}`;
          mockCallbacks[key] = callback;
          return this;
        }),
        subscribe: vi.fn().mockResolvedValue('SUBSCRIBED'),
        send: mockSend,
        presenceState: vi.fn().mockReturnValue({ 'p1': {} }),
        track: vi.fn(),
        unsubscribe: vi.fn()
      })),
      auth: {
        getSession: async () => ({ data: { session: { access_token: 'test-token' } } })
      }
    }
  };
});

describe('Arena Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCallbacks = {};
    // Mock Math.random so playerId is always 'p1'
    vi.spyOn(Math, 'random').mockReturnValue(0.0001);
    
    // Mock fetch for revive questions
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        question: "Test question?",
        options: ["A", "B", "C", "D"],
        correctIndex: 0
      })
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
    
    // Flush microtasks for initAuth
    await act(async () => {
      await new Promise(r => setTimeout(r, 10));
    });
    
    // Simulate presence sync
    await act(async () => {
      const presenceSync = mockCallbacks['presence:sync'];
      if (presenceSync) {
        presenceSync();
      }
    });

    // We should see the UI
    expect(await screen.findByText(/Test question\?/i)).toBeDefined();
    expect(screen.queryByText(/Connecting to Arena/i)).toBeNull();
    // It should have sent a state update to broadcast since it became host
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
      event: 'state_update'
    }));
  });

  it('should render received state update when not host', async () => {
    render(<ArenaPage />);
    
    // Flush microtasks for initAuth
    await act(async () => {
      await new Promise(r => setTimeout(r, 10));
    });
    
    // Simulate receiving a broadcast from host
    await act(async () => {
      const stateUpdate = mockCallbacks['broadcast:state_update'];
      if (stateUpdate) {
        stateUpdate({
          payload: {
            boss: { hp: 500, maxHp: 1000 },
            players: [{ id: 'p2', hp: 50, status: 'alive' }],
            status: 'active'
          }
        });
      }
      
      const questionUpdate = mockCallbacks['broadcast:question_update'];
      if (questionUpdate) {
        questionUpdate({
          payload: {
            question: "Broadcasted question",
            options: ["A", "B"],
            correctIndex: 0
          }
        });
      }
    });

    expect(screen.getByText(/Broadcasted question/i)).toBeDefined();
  });
});
