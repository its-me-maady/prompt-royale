import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/rag/route';
import { embeddingApi } from '@/services/embedding';
import { vectorDb } from '@/services/vectorDb';

vi.mock('@/services/embedding');
vi.mock('@/services/vectorDb');
vi.mock('@/engine/rag', () => ({
  processRagQuery: vi.fn().mockResolvedValue({
    answer: 'This is a mocked RAG answer.',
    sources: ['Mock source 1']
  })
}));

describe('Epic B: Prompt Lab API (RAG)', () => {
  it('should process a valid query and return a RAG result', async () => {
    const request = new Request('http://localhost/api/rag', {
      method: 'POST',
      body: JSON.stringify({ query: 'When is the midterm?' })
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.answer).toBe('This is a mocked RAG answer.');
    expect(data.sources).toEqual(['Mock source 1']);
  });

  it('should return a 400 error for invalid JSON', async () => {
    const request = new Request('http://localhost/api/rag', {
      method: 'POST',
      body: 'invalid json'
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
