/**
 * agent-notes: { ctx: "API route for RAG querying", deps: ["apps/web/src/engine/rag.ts"], state: "canonical", last: "sato@2026-08-05" }
 */
import { NextResponse } from 'next/server';
import { processRagQuery } from '../../../engine/rag';

// We need to implement the dummy deps for now since real services aren't fully integrated yet
const dummyDeps = {
  retrieveEmbeddings: async (query: string) => [
    { id: 'doc-123', content: 'This is a mock knowledge base response. In production, this would query pgvector.', score: 0.99 }
  ],
  generateLlmResponse: async (prompt: string) => {
    // Simulate LLM delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `This is a mock LLM response generated for the query.\n\n### Extracted Context\nBased on the uploaded syllabus, the midterm is on October 15th.`;
  }
};

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const result = await processRagQuery(query, dummyDeps, { maxContextLength: 2000 });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
