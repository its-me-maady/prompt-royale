import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import UploadForm from '@/components/UploadForm';



describe('UploadForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('renders the form correctly', () => {
    render(<UploadForm />);
    expect(screen.getByText('Upload Course Material')).toBeTruthy();
    expect(screen.getByLabelText('Course ID')).toBeTruthy();
    expect(screen.getByLabelText('Lecture Title')).toBeTruthy();
    expect(screen.getByLabelText('File (Audio or PPT)')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Upload and Process/i })).toBeTruthy();
  });

  it('submits the form successfully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    render(<UploadForm />);

    const courseIdInput = screen.getByLabelText('Course ID');
    const titleInput = screen.getByLabelText('Lecture Title');
    const fileInput = screen.getByLabelText('File (Audio or PPT)');
    const submitBtn = screen.getByRole('button', { name: /Upload and Process/i });

    fireEvent.change(courseIdInput, { target: { value: 'CS101' } });
    fireEvent.change(titleInput, { target: { value: 'Intro' } });

    const file = new File(['dummy'], 'lecture.mp3', { type: 'audio/mpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const form = submitBtn.closest('form');
    if (form) fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Upload and processing successful!')).toBeTruthy();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
