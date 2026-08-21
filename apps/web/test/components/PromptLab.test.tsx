import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PromptLab from '@/app/prompt-lab/page';

// Mock Supabase client for PromptLab
vi.mock('@/lib/db/supabase-client', () => ({
  supabaseClient: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ 
        data: { session: { access_token: 'test-token', user: { id: 'test-user' } } }, 
        error: null 
      }),
      signInAnonymously: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user' }, session: { access_token: 'mock-token' } },
        error: null,
      }),
    },
  }
}));

describe('PromptLab UI Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('renders the form correctly', () => {
    render(<PromptLab />);
    expect(screen.getByText('Prompt Lab')).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter your prompt here...')).toBeTruthy();
    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('disables the submit button if inputs are empty', () => {
    render(<PromptLab />);
    const submitBtn = screen.getByRole('button') as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
  });

  it('submits the form and displays the AI synthesis successfully', async () => {
    const mockAnswer = 'This is the AI synthesized response.';
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        answer: mockAnswer,
        sources: ['source 1', 'source 2']
      }),
    });

    render(<PromptLab />);
    
    const queryInput = screen.getByPlaceholderText('Enter your prompt here...');
    const submitBtn = screen.getByRole('button');

    fireEvent.change(queryInput, { target: { value: 'What is a graph?' } });
    
    // After filling inputs, button should be enabled
    expect((submitBtn as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(mockAnswer)).toBeTruthy();
    });
    
    expect(global.fetch).toHaveBeenCalledWith('/api/rag', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ 
        'Content-Type': 'application/json',
      }),
      body: expect.any(String),
    }));
  });

  it('displays an error message when the API fails', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Course ID not found' }),
    });

    render(<PromptLab />);
    
    fireEvent.change(screen.getByPlaceholderText('Enter your prompt here...'), { target: { value: 'What is a graph?' } });
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText(/Course ID not found/)).toBeTruthy();
    });
  });

  it('displays a fallback error message when the API returns non-JSON errors (e.g. 500 HTML)', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => { throw new Error('Not JSON'); },
    });

    render(<PromptLab />);
    
    fireEvent.change(screen.getByPlaceholderText('Enter your prompt here...'), { target: { value: 'What is a graph?' } });
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText(/Error: /)).toBeTruthy();
    });
  });
});