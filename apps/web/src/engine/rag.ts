/**
 * agent-notes: { ctx: "P0 principal SDE, TDD green phase", deps: [], state: "canonical", last: "sato@2026-08-05" }
 */

export interface Document {
  id: string;
  content: string;
  score: number;
}

export interface RagDependencies {
  retrieveEmbeddings: (query: string) => Promise<Document[]>;
  generateLlmResponse: (prompt: string) => Promise<string>;
}

export interface RagOptions {
  maxContextLength?: number;
}

export interface RagResponse {
  answer: string;
  sources: string[];
}

export async function processRagQuery(
  query: string,
  deps: RagDependencies,
  options?: RagOptions
): Promise<RagResponse> {
  if (!query.trim()) {
    throw new Error('Query cannot be empty');
  }

  const docs = await deps.retrieveEmbeddings(query);

  let context = docs.map((doc) => doc.content).join('\n');
  
  if (options?.maxContextLength !== undefined && context.length > options.maxContextLength) {
    context = context.substring(0, options.maxContextLength);
  }

  const prompt = `Context:\n${context}\n\nQuery: ${query}`;
  const answer = await deps.generateLlmResponse(prompt);

  return {
    answer,
    sources: docs.map((doc) => doc.id),
  };
}
