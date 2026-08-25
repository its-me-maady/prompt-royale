/**
 * agent-notes: { ctx: "Optimized Gemini vector embeddings service with active model memoization and high concurrency", deps: [], state: "canonical", last: "sato@2026-08-25" }
 */

function generateDeterministicVector(text: string, dim = 768): number[] {
  const vec = new Array(dim).fill(0);
  let hash = 5381;

  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash * 33) ^ char;
    const index = Math.abs(hash % dim);
    vec[index] += (char % 10) / 10 + 0.1;
  }

  const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vec.map((val) => val / norm);
}

let activeEmbeddingModel: string | null = null;
let hasLoggedEmbeddingWarning = false;

export const embeddingApi = {
  createEmbeddings: async (chunks: string[]): Promise<number[][]> => {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      if (!hasLoggedEmbeddingWarning) {
        console.warn('GEMINI_API_KEY missing, using deterministic vector generator.');
        hasLoggedEmbeddingWarning = true;
      }
      return chunks.map((c) => generateDeterministicVector(c));
    }

    if (chunks.length === 0) return [];

    const results: number[][] = [];
    const modelsToTry = activeEmbeddingModel
      ? [activeEmbeddingModel]
      : ['gemini-embedding-001', 'gemini-embedding-2', 'text-embedding-004', 'embedding-001'];
    const CONCURRENCY = 15;

    for (let i = 0; i < chunks.length; i += CONCURRENCY) {
      const chunkBatch = chunks.slice(i, i + CONCURRENCY);

      const batchResults = await Promise.all(
        chunkBatch.map(async (chunk) => {
          for (const model of modelsToTry) {
            try {
              const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`;
              const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  model: `models/${model}`,
                  content: { parts: [{ text: chunk }] },
                }),
              });

              if (response.ok) {
                const data = await response.json();
                if (data.embedding?.values) {
                  activeEmbeddingModel = model;
                  return data.embedding.values as number[];
                }
              }
            } catch (e) {}
          }

          if (!hasLoggedEmbeddingWarning) {
            console.warn('Gemini embedding endpoints unavailable on API key. Using deterministic 768-dim vector fallback.');
            hasLoggedEmbeddingWarning = true;
          }

          return generateDeterministicVector(chunk);
        })
      );

      results.push(...batchResults);
    }

    return results;
  },
};
