import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/rag/route';
import { vectorDb } from '@/services/vectorDb';

vi.mock('@/services/embedding', () => ({
  embeddingApi: {
    createEmbeddings: vi.fn().mockResolvedValue([[0.1, 0.2]])
  }
}));

vi.mock('@/services/vectorDb', () => ({
  vectorDb: {
    search: vi.fn().mockResolvedValue([{ id: '1', content: 'CS101 content', similarity: 0.9 }])
  }
}));

describe('POST /api/rag with courseId filter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes courseId filter to vectorDb.search when provided', async () => {
    const req = new Request('http://localhost/api/rag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'What is a binary tree?', courseId: 'CS101' })
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(vectorDb.search).toHaveBeenCalledWith(
      [0.1, 0.2],
      0.5,
      5,
      { courseId: 'CS101' }
    );
  });
});
