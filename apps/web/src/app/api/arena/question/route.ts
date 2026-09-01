// agent-notes: { ctx: "API route for generating grounded course quiz questions from vector database chunks", deps: ["apps/web/src/services/vectorDb.ts", "apps/web/src/services/embedding.ts", "apps/web/src/services/llm.ts"], state: active, last: "sato@2026-09-01" }
import { NextRequest, NextResponse } from 'next/server';
import { embeddingApi } from '../../../../services/embedding';
import { vectorDb } from '../../../../services/vectorDb';
import { llmService } from '../../../../services/llm';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { courseId, roundNumber } = body;

    const filter: Record<string, any> = {};
    if (courseId && typeof courseId === 'string' && courseId.toLowerCase() !== 'all') {
      filter.courseId = courseId;
    }

    const searchQuery = `round ${roundNumber || 1} course study concepts quiz`;
    const embeddings = await embeddingApi.createEmbeddings([searchQuery]);
    let chunks: any[] = [];
    if (embeddings && embeddings.length > 0) {
      chunks = await vectorDb.search(embeddings[0], 0.0, 5, filter);
    }

    if (!chunks || chunks.length === 0) {
      return NextResponse.json({ error: 'no_course_content' }, { status: 400 });
    }

    const question = await llmService.generateQuizQuestion(chunks, courseId);
    if (!question) {
      return NextResponse.json({ error: 'no_course_content' }, { status: 400 });
    }

    return NextResponse.json(question);
  } catch (error: any) {
    console.error('Arena question generation failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
