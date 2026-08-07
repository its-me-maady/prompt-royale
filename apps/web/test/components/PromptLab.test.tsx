import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PromptLab from '@/app/prompt-lab/page';



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
    expect(screen.getByPlaceholderText('Ask a question...')).toBeTruthy();
    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('disables the submit button if inputs are empty', () => {
    render(<PromptLab />);
    const submitBtn = screen.getByRole('button') as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
  });

  it('submits the form and displays the AI synthesis successfully', async () => {
    const mockSynthesis = 'This is the AI synthesized response.';
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: mockSynthesis }),
    });

    render(<PromptLab />);
    
    const queryInput = screen.getByPlaceholderText('Ask a question...');
    const submitBtn = screen.getByRole('button');

    fireEvent.change(queryInput, { target: { value: 'What is a graph?' } });
    
    // After filling inputs, button should be enabled
    expect((submitBtn as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(mockSynthesis)).toBeTruthy();
    });
    
    expect(global.fetch).toHaveBeenCalledWith('/api/lab/chat', expect.objectContaining({
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
    
    fireEvent.change(screen.getByPlaceholderText('Ask a question...'), { target: { value: 'What is a graph?' } });
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Course ID not found')).toBeTruthy();
    });
  });

  it('displays a fallback error message when the API returns non-JSON errors (e.g. 500 HTML)', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => { throw new Error('Not JSON'); },
    });

    render(<PromptLab />);
    
    fireEvent.change(screen.getByPlaceholderText('Ask a question...'), { target: { value: 'What is a graph?' } });
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Server error: 500')).toBeTruthy();
    });
  });
});
