// agent-notes: { ctx: "Unit tests for POST /api/arena/question route handler", deps: ["apps/web/src/app/api/arena/question/route.ts", "apps/web/src/services/vectorDb.ts"], state: active, last: "sato@2026-09-01" }
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../src/app/api/arena/question/route';
import { vectorDb } from '../../src/services/vectorDb';
import { embeddingApi } from '../../src/services/embedding';

vi.mock('../../src/services/embedding', () => ({
  embeddingApi: {
    createEmbeddings: vi.fn()
  }
}));

vi.mock('../../src/services/vectorDb', () => ({
  vectorDb: {
    search: vi.fn()
  }
}));

describe('POST /api/arena/question', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return error no_course_content when vector search returns empty array', async () => {
    vi.mocked(embeddingApi.createEmbeddings).mockResolvedValue([[0.1, 0.2]]);
    vi.mocked(vectorDb.search).mockResolvedValue([]);

    const req = new Request('http://localhost:3000/api/arena/question', {
      method: 'POST',
      body: JSON.stringify({ courseId: 'EMPTY_COURSE', roundNumber: 1 })
    });

    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('no_course_content');
  });

  it('should return a grounded quiz question when chunks exist in KB', async () => {
    vi.mocked(embeddingApi.createEmbeddings).mockResolvedValue([[0.1, 0.2]]);
    vi.mocked(vectorDb.search).mockResolvedValue([
      { id: '1', content: 'Distributed Raft Consensus uses leader election and log replication.' }
    ]);

    const req = new Request('http://localhost:3000/api/arena/question', {
      method: 'POST',
      body: JSON.stringify({ courseId: 'CS101', roundNumber: 1 })
    });

    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.question).toContain('Distributed Raft Consensus');
    expect(json.options).toHaveLength(4);
  });
});
