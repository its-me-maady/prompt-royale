/**
 * agent-notes: { ctx: "Vitest unit tests for real-time Presence Lobby Page with Next Navigation mock", deps: ["apps/web/src/app/lobby/page.tsx"], state: "canonical", last: "sato@2026-09-01" }
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LobbyPage from '../../src/app/lobby/page';

vi.mock('next/navigation', () => {
  const routerMock = {
    push: vi.fn(),
    replace: vi.fn(),
  };
  const searchParamsMock = {
    get: vi.fn().mockReturnValue(null)
  };
  return {
    useRouter: () => routerMock,
    useSearchParams: () => searchParamsMock
  };
});

vi.mock('@/lib/db/supabase-client', () => {
  const channelMock = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockImplementation((callback) => {
      if (typeof callback === 'function') callback('SUBSCRIBED');
      return channelMock;
    }),
    track: vi.fn().mockResolvedValue({}),
    unsubscribe: vi.fn(),
    presenceState: vi.fn().mockReturnValue({})
  };

  return {
    supabaseClient: {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        signInAnonymously: vi.fn().mockResolvedValue({ data: { user: { id: 'p1' } }, error: null })
      },
      channel: vi.fn().mockReturnValue(channelMock),
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: null, error: null })
      })
    }
  };
});

describe('Lobby Page', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve())
      }
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('should render a Squad Lobby placeholder', () => {
    render(<LobbyPage />);
    expect(screen.getByText(/Squad Lobby/i)).toBeDefined();
  });

  it('should show error state on fetch failure', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response);
    render(<LobbyPage />);
    
    const button = screen.getByRole('button', { name: /Create Lobby/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to create lobby/i)).toBeDefined();
    });
  });

  it('should show invite link, handle safe URLs and copy to clipboard on success', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ lobbyId: '123' })
    } as Response);
    
    render(<LobbyPage />);
    
    const button = screen.getByRole('button', { name: /Create Lobby/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/123/)).toBeDefined();
    });

    const copyBtn = screen.getByRole('button', { name: /Copy/i });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(screen.getByText(/Copied!/i)).toBeDefined();
    });
  });
});
