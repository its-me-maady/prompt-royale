import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '@/app/api/kb/courses/route';

vi.mock('@/lib/db/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [
          { metadata: { courseId: 'CS101' } },
          { metadata: { courseId: 'CS102' } },
          { metadata: { courseId: 'CS101' } }
        ],
        error: null
      })
    })
  }
}));

describe('GET /api/kb/courses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns distinct course IDs from knowledge base metadata', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.courses).toBeDefined();
    expect(Array.isArray(data.courses)).toBe(true);
    expect(data.courses).toContain('CS101');
    expect(data.courses).toContain('CS102');
  });
});
