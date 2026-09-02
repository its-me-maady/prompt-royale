/**
 * agent-notes: { ctx: "Vitest unit tests for real-time Presence Lobby Page with start gate and join-by-ID tests", deps: ["apps/web/src/app/lobby/page.tsx", "apps/web/src/utils/supabase/client.ts"], state: "canonical", last: "sato@2026-09-01" }
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LobbyPage from '../../src/app/lobby/page';

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => {
  const searchParamsMock = {
    get: vi.fn().mockReturnValue(null)
  };
  return {
    useRouter: () => ({
      push: mockPush,
      replace: mockReplace,
    }),
    useSearchParams: () => searchParamsMock
  };
});

let mockPresenceState: any = {};
let mockSquadStatus: string | null = null;
let presenceCallback: Function | null = null;
const mockChannel = vi.fn();

vi.mock('@/utils/supabase/client', () => {
  const channelMock = {
    on: vi.fn().mockImplementation((event: string, opts: any, callback: any) => {
      const cb = typeof opts === 'function' ? opts : callback;
      if (event === 'presence') {
        presenceCallback = cb;
      }
      return channelMock;
    }),
    subscribe: vi.fn().mockImplementation((callback) => {
      if (typeof callback === 'function') callback('SUBSCRIBED');
      const cb = presenceCallback;
      if (cb) {
        presenceCallback = null;
        setTimeout(() => cb(), 0);
      }
      return channelMock;
    }),
    track: vi.fn().mockResolvedValue({}),
    unsubscribe: vi.fn(),
    presenceState: () => mockPresenceState
  };

  return {
    createClient: () => ({
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'p1-user-id' } } }, error: null }),
        signInAnonymously: vi.fn().mockResolvedValue({ data: { user: { id: 'p1-user-id' } }, error: null })
      },
      channel: (name: string, config?: any) => {
        mockChannel(name, config);
        return channelMock;
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockImplementation(() =>
          Promise.resolve({
            data: mockSquadStatus ? { id: 'squad-123', status: mockSquadStatus } : null,
            error: null
          })
        ),
        insert: vi.fn().mockResolvedValue({ data: null, error: null })
      })
    })
  };
});

describe('Lobby Page', () => {
  beforeEach(() => {
    mockPresenceState = {};
    mockSquadStatus = null;
    presenceCallback = null;
    vi.clearAllMocks();
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

  it('should render Squad Lobby title, Create Lobby button, and Join Existing Squad input', () => {
    render(<LobbyPage />);
    expect(screen.getByText(/Squad Lobby/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Create Lobby/i })).toBeDefined();
    expect(screen.getByPlaceholderText(/Enter Lobby Code \/ ID/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Join Lobby/i })).toBeDefined();
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

  it('should allow joining an existing lobby by typing ID', async () => {
    render(<LobbyPage />);
    
    const input = screen.getByPlaceholderText(/Enter Lobby Code \/ ID/i);
    const joinBtn = screen.getByRole('button', { name: /Join Lobby/i });

    fireEvent.change(input, { target: { value: 'squad-789' } });
    
    await act(async () => {
      fireEvent.click(joinBtn);
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(mockReplace).toHaveBeenCalledWith('/lobby?id=squad-789');
  });

  it('should show inline error when attempting to join a lobby that has already ended', async () => {
    mockSquadStatus = 'victory';
    render(<LobbyPage />);
    
    const input = screen.getByPlaceholderText(/Enter Lobby Code \/ ID/i);
    const joinBtn = screen.getByRole('button', { name: /Join Lobby/i });

    fireEvent.change(input, { target: { value: 'ended-squad' } });
    
    await act(async () => {
      fireEvent.click(joinBtn);
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(screen.getByText(/This raid has already ended/i)).toBeDefined();
  });

  it('should disable Start Raid button with 1 member and require at least 2 members', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ lobbyId: 'squad-123' })
    } as Response);

    mockPresenceState = {
      'p1-user-': [{ name: 'Player 1' }]
    };

    render(<LobbyPage />);

    const createBtn = screen.getByRole('button', { name: /Create Lobby/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(screen.getByText(/squad-123/)).toBeDefined();
    });

    const startBtn = screen.getByRole('button', { name: /Need at least 2 members to start \(1\/2\)/i }) as HTMLButtonElement;
    expect(startBtn.disabled).toBe(true);
  });

  it('should enable Start Raid button when 2 or more members are present', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ lobbyId: 'squad-123' })
    } as Response);

    mockPresenceState = {
      'p1-user-': [{ name: 'Player 1' }],
      'p2-user-': [{ name: 'Player 2' }]
    };

    render(<LobbyPage />);

    const createBtn = screen.getByRole('button', { name: /Create Lobby/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(screen.getByText(/squad-123/)).toBeDefined();
    });

    const startBtn = screen.getByRole('button', { name: /Start Raid/i }) as HTMLButtonElement;
    expect(startBtn.disabled).toBe(false);
  });

  it('should initialize presence channel with explicit presence key tied to playerId', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ lobbyId: 'squad-123' })
    } as Response);

    render(<LobbyPage />);

    const createBtn = screen.getByRole('button', { name: /Create Lobby/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(mockChannel).toHaveBeenCalledWith(
        'lobby-squad-123',
        { config: { presence: { key: 'p1-user-' } } }
      );
    });
  });

  it('should render waiting message for non-host members when another player is host', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ lobbyId: 'squad-123' })
    } as Response);

    // p0-alpha comes before p1-user- alphabetically, making p0-alpha host
    mockPresenceState = {
      'p0-alpha': [{ name: 'Alpha Host' }],
      'p1-user-': [{ name: 'Player 1' }]
    };

    render(<LobbyPage />);

    const createBtn = screen.getByRole('button', { name: /Create Lobby/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(screen.getByText(/Waiting for Squad Leader to start/i)).toBeDefined();
      expect(screen.queryByRole('button', { name: /Start Raid/i })).toBeNull();
    });
  });
});
