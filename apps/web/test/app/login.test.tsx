/**
 * <!-- agent-notes: { ctx: "Vitest unit tests for Login Page with email and guest auth support", deps: ["apps/web/src/app/login/page.tsx"], state: "canonical", last: "tara@2026-08-31" } -->
 */
import React from 'react';
import { render, screen, act, cleanup, fireEvent } from '@testing-library/react';
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
const mockSignInWithPassword = vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id', email: 'test@example.com' } }, error: null });
const mockSignUp = vi.fn().mockResolvedValue({ data: { user: { id: 'new-user-id', email: 'new@example.com' } }, error: null });

vi.mock('@/lib/db/supabase-client', () => ({
  supabaseClient: {
    auth: {
      signInAnonymously: () => mockSignInAnonymously(),
      signInWithPassword: (credentials: any) => mockSignInWithPassword(credentials),
      signUp: (credentials: any) => mockSignUp(credentials),
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

  it('should render the form fields (email, password) and guest login option', () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText(/email@example.com/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Sign Up/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Enter as Guest/i })).toBeDefined();
  });

  it('should trigger anonymous login on guest button click and redirect user', async () => {
    render(<LoginPage />);
    const guestButton = screen.getByRole('button', { name: /Enter as Guest/i });
    
    await act(async () => {
      guestButton.click();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(mockSignInAnonymously).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/lobby?id=squad-1');
  });

  it('should trigger sign in with email and password on form submission', async () => {
    render(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText(/email@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const signInButton = screen.getByRole('button', { name: /Sign In/i });

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    await act(async () => {
      signInButton.click();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(mockPush).toHaveBeenCalledWith('/lobby?id=squad-1');
  });

  it('should trigger sign up with email and password on sign up click', async () => {
    render(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText(/email@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const signUpButton = screen.getByRole('button', { name: /Sign Up/i });

    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'securepwd456' } });

    await act(async () => {
      signUpButton.click();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'securepwd456',
    });
  });
});
