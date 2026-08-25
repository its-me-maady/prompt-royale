/**
 * agent-notes: { ctx: "Gemini vector embeddings service using embedContent with concurrent batching", deps: [], state: "canonical", last: "sato@2026-08-25" }
 */

export const embeddingApi = {
  createEmbeddings: async (chunks: string[]): Promise<number[][]> => {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('GEMINI_API_KEY missing, returning 768-dim stub vectors.');
      return chunks.map(() => new Array(768).fill(0.1));
    }

    if (chunks.length === 0) return [];

    const results: number[][] = [];
    const modelsToTry = ['text-embedding-004', 'embedding-001'];
    const CONCURRENCY = 5;

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
                  content: { parts: [{ text: chunk }] },
                }),
              });

              if (response.ok) {
                const data = await response.json();
                if (data.embedding?.values) {
                  return data.embedding.values as number[];
                }
              } else {
                const errText = await response.text();
                console.warn(`Gemini embedContent failed for ${model} (${response.status}):`, errText);
              }
            } catch (e) {
              console.warn(`Gemini embedContent exception for ${model}:`, e);
            }
          }
          return new Array(768).fill(0.1);
        })
      );

      results.push(...batchResults);
    }

    return results;
  },
};
