/**
 * <!-- agent-notes: { ctx: "Vitest unit tests for Login Page", deps: ["apps/web/src/app/login/page.tsx"], state: "canonical", last: "tara@2026-08-31" } -->
 */
import React from 'react';
import { render, screen, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LoginPage from '../../src/app/login/page';

const mockPush = vi.fn();
const mockGet = vi.fn().mockReturnValue('/lobby?id=squad-1');

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

const mockSignInAnonymously = vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null });

vi.mock('@/lib/db/supabase-client', () => ({
  supabaseClient: {
    auth: {
      signInAnonymously: () => mockSignInAnonymously(),
    },
  },
}));

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render the static guest login interface and instructions', () => {
    render(<LoginPage />);
    expect(screen.getByText(/Enter Arena/i)).toBeDefined();
    expect(screen.getByText(/Anonymous Guest Entry/i)).toBeDefined();
  });

  it('should trigger anonymous login on button click and redirect user', async () => {
    render(<LoginPage />);
    const button = screen.getByRole('button', { name: /Enter Arena/i });
    
    await act(async () => {
      button.click();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(mockSignInAnonymously).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/lobby?id=squad-1');
  });
});
