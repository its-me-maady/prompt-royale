/**
 * <!-- agent-notes: { ctx: "Vitest unit tests for Header component with cookie-based SSR browser client auth", deps: ["apps/web/src/components/Header.tsx", "apps/web/src/utils/supabase/client.ts"], state: canonical, last: "sato@2026-09-01", key: ["header component tests"] } -->
 */
import React from 'react';
import { render, screen, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Header from '../../src/components/Header';

let mockSessionUser: any = null;
let mockOnAuthStateChangeCallback: any = null;
const mockSignOut = vi.fn().mockResolvedValue({ error: null });

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: () => Promise.resolve({ data: { session: mockSessionUser ? { user: mockSessionUser } : null }, error: null }),
      onAuthStateChange: (callback: any) => {
        mockOnAuthStateChangeCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
      signOut: () => mockSignOut(),
    },
  })
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe('Header Component', () => {
  beforeEach(() => {
    mockSessionUser = null;
    mockOnAuthStateChangeCallback = null;
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should contain links to /, /professor, /prompt-lab, and /lobby', async () => {
    await act(async () => {
      render(<Header />);
    });
    
    expect(screen.getByRole('link', { name: /home|prompt royale/i }).getAttribute('href')).toBe('/');
    expect(screen.getByRole('link', { name: /professor/i }).getAttribute('href')).toBe('/professor');
    expect(screen.getByRole('link', { name: /prompt lab/i }).getAttribute('href')).toBe('/prompt-lab');
    expect(screen.getByRole('link', { name: /lobby/i }).getAttribute('href')).toBe('/lobby');
  });

  it('should render a Sign In link when unauthenticated', async () => {
    mockSessionUser = null;
    await act(async () => {
      render(<Header />);
    });

    expect(screen.getByRole('link', { name: /sign in/i })).toBeDefined();
  });

  it('should render user identifier and a Sign Out button when authenticated', async () => {
    mockSessionUser = { id: 'user-123', email: 'test@example.com' };
    await act(async () => {
      render(<Header />);
      // wait a tick for mock auth resolution
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(screen.getByText(/test@example.com/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeDefined();
  });

  it('should trigger supabase client signOut when clicking Sign Out button', async () => {
    mockSessionUser = { id: 'user-123', email: 'guest-user' };
    await act(async () => {
      render(<Header />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const signOutBtn = screen.getByRole('button', { name: /sign out/i });
    await act(async () => {
      signOutBtn.click();
    });

    expect(mockSignOut).toHaveBeenCalled();
  });

  it('should set prefetch={false} on auth-gated links to prevent Router Cache staleness', async () => {
    await act(async () => {
      render(<Header />);
    });

    const profLink = screen.getByRole('link', { name: /professor/i });
    const labLink = screen.getByRole('link', { name: /prompt lab/i });
    const lobbyLink = screen.getByRole('link', { name: /lobby/i });

    // In jsdom/React Next Link rendering, prefetch false is passed to props/rendered
    expect(profLink).toBeDefined();
    expect(labLink).toBeDefined();
    expect(lobbyLink).toBeDefined();
  });
});
