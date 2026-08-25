import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PromptLab from '@/app/prompt-lab/page';

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
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/kb/courses') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ courses: ['CS101', 'CS102'] })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ answer: 'Mock Answer', sources: ['source 1'] })
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('renders the form and subject selector correctly', async () => {
    render(<PromptLab />);
    expect(screen.getByText('Prompt Lab')).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter your prompt here...')).toBeTruthy();
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Subject \/ Course/i)).toBeTruthy();
      expect(screen.getByText('CS101')).toBeTruthy();
    });
  });

  it('disables the submit button if prompt input is empty', () => {
    render(<PromptLab />);
    const submitBtn = screen.getByRole('button', { name: /Run Prompt/i }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
  });

  it('submits the form with selected courseId and displays the AI synthesis successfully', async () => {
    const mockAnswer = 'This is the AI synthesized response.';
    
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === '/api/kb/courses') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ courses: ['CS101', 'CS102'] })
        });
      }
      if (url === '/api/rag') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ answer: mockAnswer, sources: ['source 1'] })
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(<PromptLab />);

    await waitFor(() => {
      expect(screen.getByText('CS101')).toBeTruthy();
    });

    const select = screen.getByLabelText(/Subject \/ Course/i);
    fireEvent.change(select, { target: { value: 'CS101' } });

    const queryInput = screen.getByPlaceholderText('Enter your prompt here...');
    const submitBtn = screen.getByRole('button', { name: /Run Prompt/i });

    fireEvent.change(queryInput, { target: { value: 'What is a graph?' } });
    expect((submitBtn as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(mockAnswer)).toBeTruthy();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/rag', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ query: 'What is a graph?', courseId: 'CS101' })
    }));
  });

  it('restyles prompt when clicking Enhance Prompt button', async () => {
    const restyled = 'Enhanced: What is a data structure graph and its properties?';
    
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === '/api/kb/courses') {
        return Promise.resolve({ ok: true, json: async () => ({ courses: ['CS101'] }) });
      }
      if (url === '/api/prompt-lab/restyle') {
        return Promise.resolve({ ok: true, json: async () => ({ restyledSummary: restyled }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ answer: 'Ans', sources: [] }) });
    });

    render(<PromptLab />);

    const queryInput = screen.getByPlaceholderText('Enter your prompt here...');
    fireEvent.change(queryInput, { target: { value: 'tell me about graphs' } });

    const enhanceBtn = screen.getByRole('button', { name: /Enhance Prompt/i });
    fireEvent.click(enhanceBtn);

    await waitFor(() => {
      expect((queryInput as HTMLTextAreaElement).value).toBe(restyled);
    });
  });

  it('displays an error message when the API fails', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === '/api/kb/courses') {
        return Promise.resolve({ ok: true, json: async () => ({ courses: [] }) });
      }
      return Promise.resolve({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Course ID not found' })
      });
    });

    render(<PromptLab />);
    
    fireEvent.change(screen.getByPlaceholderText('Enter your prompt here...'), { target: { value: 'What is a graph?' } });
    fireEvent.click(screen.getByRole('button', { name: /Run Prompt/i }));

    await waitFor(() => {
      expect(screen.getByText(/Course ID not found/)).toBeTruthy();
    });
  });

  it('displays a fallback error message when the API returns non-JSON errors (e.g. 500 HTML)', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === '/api/kb/courses') {
        return Promise.resolve({ ok: true, json: async () => ({ courses: [] }) });
      }
      return Promise.resolve({
        ok: false,
        status: 500,
        json: async () => { throw new Error('Not JSON'); }
      });
    });

    render(<PromptLab />);
    
    fireEvent.change(screen.getByPlaceholderText('Enter your prompt here...'), { target: { value: 'What is a graph?' } });
    fireEvent.click(screen.getByRole('button', { name: /Run Prompt/i }));

    await waitFor(() => {
      expect(screen.getByText(/Error: /)).toBeTruthy();
    });
  });
});