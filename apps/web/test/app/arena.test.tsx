/**
 * <!-- agent-notes: { ctx: "P0 TDD red phase, coverage veto, test strategy owner", deps: ["apps/web/src/app/arena/page.tsx"], state: canonical, last: "sato@2026-07-31", key: ["arena page tests"] } -->
 */
import React from 'react';
import { render, screen, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ArenaPage from '../../src/app/arena/page';

describe('Arena Page', () => {
  let mockEventSource: any;

  beforeEach(() => {
    mockEventSource = {
      onmessage: null,
      close: vi.fn(),
    };
    vi.stubGlobal('EventSource', vi.fn(() => mockEventSource));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('should render a Boss Raid Arena placeholder when connecting', () => {
    render(<ArenaPage />);
    expect(screen.getByText(/Boss Raid Arena/i)).toBeDefined();
    expect(screen.getByText(/Connecting to Arena/i)).toBeDefined();
  });

  it('should render active game state when SSE sends data', () => {
    render(<ArenaPage />);
    
    act(() => {
      if (mockEventSource.onmessage) {
        mockEventSource.onmessage({
          data: JSON.stringify({
            players: [{ id: 'p1', hp: 100 }],
            boss: { hp: 1000, maxHp: 1000 }
          })
        });
      }
    });

    expect(screen.getByText(/P1/i)).toBeDefined();
    // The placeholder should be gone
    expect(screen.queryByText(/Connecting to Arena/i)).toBeNull();
  });
  
  it('should ignore malformed SSE data', () => {
    render(<ArenaPage />);
    
    act(() => {
      if (mockEventSource.onmessage) {
        mockEventSource.onmessage({
          data: JSON.stringify({
            players: "not an array",
            // missing boss
          })
        });
      }
    });

    // Should still be in the connecting state
    expect(screen.getByText(/Connecting to Arena/i)).toBeDefined();
  });
});
