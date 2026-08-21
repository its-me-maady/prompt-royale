import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as ChatRoute } from '../../src/app/api/lab/chat/route';
import { NextRequest } from 'next/server';
import { llmService } from '../../src/services/llm';
import { supabase } from '../../src/lib/db/supabase';

vi.mock('../../src/services/llm', () => ({
  llmService: {
    expandQuery: vi.fn(),
    generateSynthesis: vi.fn(),
  }
}));

vi.mock('../../src/lib/db/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  }
}));

function createJsonRequest(body: any) {
  return {
    json: async () => body,
    headers: {
      get: () => null,
    },
  } as unknown as NextRequest;
}

describe('Prompt Lab RAG Endpoint Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should successfully expand query, retrieve chunks, and generate synthesis', async () => {
      const mockExpandedQueries = ['query 1', 'query 2'];
      const mockChunks = [{ content: 'chunk 1', metadata: { lecture_id: 'l1' } }];
      const mockSynthesis = 'Final synthesized response.';

      // 1. Mock Query Expansion
      vi.mocked(llmService.expandQuery).mockResolvedValue(mockExpandedQueries);
      
      // 2. Mock Supabase pgvector retrieval
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockChunks,
        error: null,
      } as any);

      // 3. Mock Synthesis generation
      vi.mocked(llmService.generateSynthesis).mockResolvedValue(mockSynthesis);

      const req = createJsonRequest({ query: 'Explain concepts', courseId: 'course-123' });
      const response = await ChatRoute(req);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('response', mockSynthesis);

      expect(llmService.expandQuery).toHaveBeenCalledWith('Explain concepts');
      expect(supabase.rpc).toHaveBeenCalledWith('match_knowledge_base', expect.objectContaining({
        query_text: expect.any(String),
        filter: expect.objectContaining({ courseId: 'course-123' }),
      }));
      expect(llmService.generateSynthesis).toHaveBeenCalledWith(mockChunks, 'Explain concepts');
    });
  });

  describe('Unhappy Paths', () => {
    it('should return 400 if JSON is malformed', async () => {
      const req = {
        json: async () => { throw new SyntaxError('Unexpected token'); },
        headers: {
          get: () => null,
        },
      } as unknown as NextRequest;
      const response = await ChatRoute(req);
      
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('Invalid JSON');
    });

    it('should return 400 Bad Request if query is missing', async () => {
      const req = createJsonRequest({ courseId: 'course-123' });
      const response = await ChatRoute(req);
      
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('Invalid input');
    });

    it('should return 400 Bad Request if courseId is missing', async () => {
      const req = createJsonRequest({ query: 'Explain concepts' });
      const response = await ChatRoute(req);
      
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('Invalid input');
    });

    it('should return 500 if Query Expansion fails', async () => {
      vi.mocked(llmService.expandQuery).mockRejectedValue(new Error('LLM error'));
      
      const req = createJsonRequest({ query: 'Explain concepts', courseId: 'course-123' });
      const response = await ChatRoute(req);
      
      expect(response.status).toBe(500);
    });

    it('should return 500 if Supabase retrieval fails', async () => {
      vi.mocked(llmService.expandQuery).mockResolvedValue(['query 1']);
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
      } as any);
      
      const req = createJsonRequest({ query: 'Explain concepts', courseId: 'course-123' });
      const response = await ChatRoute(req);
      
      expect(response.status).toBe(500);
    });
    
    it('should return 500 if Synthesis generation fails', async () => {
      vi.mocked(llmService.expandQuery).mockResolvedValue(['query 1']);
      vi.mocked(supabase.rpc).mockResolvedValue({ data: [], error: null } as any);
      vi.mocked(llmService.generateSynthesis).mockRejectedValue(new Error('LLM synthesis error'));
      
      const req = createJsonRequest({ query: 'Explain concepts', courseId: 'course-123' });
      const response = await ChatRoute(req);
      
      expect(response.status).toBe(500);
    });
  });
});
