/**
 * agent-notes: { ctx: "TDD red phase tests for KB ingestion API", deps: ["docs/adrs/0004-kb-ingestion-storage.md"], state: "active", last: "tara@2026-07-31" }
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
const mockTranscribeAudio = vi.fn();
const mockParseDocument = vi.fn();
const mockGenerateEmbeddings = vi.fn();
const mockSupabaseInsert = vi.fn();

// Mock modules - using abstract placeholder paths to be adapted during implementation
vi.mock('@/lib/ai/groq', () => ({
  transcribeAudio: (...args: any[]) => mockTranscribeAudio(...args)
}));

vi.mock('@/lib/ai/llamaparse', () => ({
  parseDocument: (...args: any[]) => mockParseDocument(...args)
}));

vi.mock('@/lib/ai/openai', () => ({
  generateEmbeddings: (...args: any[]) => mockGenerateEmbeddings(...args)
}));

vi.mock('@/lib/db/supabase', () => ({
  supabase: {
    from: () => ({
      insert: (...args: any[]) => mockSupabaseInsert(...args)
    })
  }
}));

import { POST } from '@/app/api/kb/upload/route';

describe('POST /api/kb/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Happy Paths', () => {
    it('should process an audio file, chunk it, and save metadata via Gemini and OpenAI', async () => {
      // Arrange
      mockTranscribeAudio.mockResolvedValue('Transcribed lecture content.');
      mockGenerateEmbeddings.mockResolvedValue([{ embedding: [0.1, 0.2, 0.3], content: 'Transcribed lecture chunk' }]);
      mockSupabaseInsert.mockResolvedValue({ data: { id: 1 }, error: null });

      const formData = new FormData();
      formData.append('file', new Blob(['audio blob content'], { type: 'audio/mpeg' }), 'lecture.mp3');
      formData.append('metadata', JSON.stringify({ courseId: 'CS101', title: 'Intro to Algorithms' }));

      const request = new Request('http://localhost/api/kb/upload', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer dev-token' }
      });
      request.formData = async () => formData;

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(200);
      expect(mockTranscribeAudio).toHaveBeenCalledTimes(1);
      expect(mockGenerateEmbeddings).toHaveBeenCalledTimes(1);
      expect(mockSupabaseInsert).toHaveBeenCalledTimes(1);
      
      const responseBody = await response.json();
      expect(responseBody.success).toBe(true);
    });

    it('should process a PPT file, parse markdown, chunk it, and save via LlamaParse and OpenAI', async () => {
      // Arrange
      mockParseDocument.mockResolvedValue('# Slide 1\nContent');
      mockGenerateEmbeddings.mockResolvedValue([{ embedding: [0.1, 0.2, 0.3], content: '# Slide 1 content chunk' }]);
      mockSupabaseInsert.mockResolvedValue({ data: { id: 2 }, error: null });

      const formData = new FormData();
      formData.append('file', new Blob(['ppt blob content'], { type: 'application/vnd.ms-powerpoint' }), 'slides.ppt');
      formData.append('metadata', JSON.stringify({ courseId: 'CS101', title: 'Data Structures' }));

      const request = new Request('http://localhost/api/kb/upload', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer dev-token' }
      });
      request.formData = async () => formData;

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(200);
      expect(mockParseDocument).toHaveBeenCalledTimes(1);
      expect(mockGenerateEmbeddings).toHaveBeenCalledTimes(1);
      expect(mockSupabaseInsert).toHaveBeenCalledTimes(1);
    });
  });

  describe('Unhappy Paths', () => {
    it('should return 400 if no file is provided in the request', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('metadata', JSON.stringify({ courseId: 'CS101', title: 'Test' }));
      const request = new Request('http://localhost/api/kb/upload', { 
        method: 'POST', 
        headers: { 'Authorization': 'Bearer dev-token' }
      });
      request.formData = async () => formData;

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(400);
    });

    it('should return 400 for an unsupported file type', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('file', new Blob(['exe content'], { type: 'application/x-msdownload' }), 'virus.exe');
      formData.append('metadata', JSON.stringify({ courseId: 'CS101', title: 'Test' }));
      const request = new Request('http://localhost/api/kb/upload', { 
        method: 'POST', 
        headers: { 'Authorization': 'Bearer dev-token' }
      });
      request.formData = async () => formData;

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(400);
    });

    it('should return 500 if the external transcription API fails', async () => {
      // Arrange
      mockTranscribeAudio.mockRejectedValue(new Error('External API processing failed'));
      
      const formData = new FormData();
      formData.append('file', new Blob(['audio blob'], { type: 'audio/mpeg' }), 'lecture.mp3');
      formData.append('metadata', JSON.stringify({ courseId: 'CS101', title: 'Test' }));
      const request = new Request('http://localhost/api/kb/upload', { 
        method: 'POST', 
        headers: { 'Authorization': 'Bearer dev-token' }
      });
      request.formData = async () => formData;

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(500);
      // Ensure we don't proceed to insert if transcription fails
      expect(mockSupabaseInsert).not.toHaveBeenCalled();
    });
  });
});