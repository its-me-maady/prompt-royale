/**
 * agent-notes: { ctx: "API route for RAG querying", deps: ["apps/web/src/engine/rag.ts", "apps/web/src/services/embedding.ts", "apps/web/src/services/vectorDb.ts"], state: "canonical", last: "sato@2026-08-05" }
 */
import { NextResponse } from 'next/server';
import { processRagQuery } from '../../../engine/rag';
import { embeddingApi } from '../../../services/embedding';
import { vectorDb } from '../../../services/vectorDb';

const realDeps = {
  retrieveEmbeddings: async (query: string) => {
    // 1. Get embedding for the query
    const embeddings = await embeddingApi.createEmbeddings([query]);
    if (!embeddings || embeddings.length === 0) {
      return [];
    }
    const queryEmbedding = embeddings[0];
    
    // 2. Search vector DB for similar content
    const results = await vectorDb.search(queryEmbedding, 0.7, 5);
    
    // 3. Map to expected Document format
    return results.map(row => ({
      id: row.id,
      content: row.content,
      score: row.similarity
    }));
  },
  generateLlmResponse: async (prompt: string) => {
    // Simulate LLM delay for now, since we don't have a real one here.
    // In production, this would call llmService.generateSynthesis
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `This is a mock LLM response generated for the query.\n\n### Extracted Context\nBased on the uploaded syllabus, the midterm is on October 15th.`;
  }
};

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const result = await processRagQuery(query, realDeps, { maxContextLength: 2000 });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
