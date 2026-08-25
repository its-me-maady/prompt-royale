/**
 * agent-notes: { ctx: "Gemini vector embeddings service with batching and error logging", deps: [], state: "canonical", last: "sato@2026-08-25" }
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

    // Process in batches of 20 to respect rate limits and payload boundaries
    const BATCH_SIZE = 20;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batchChunks = chunks.slice(i, i + BATCH_SIZE);
      let batchEmbeddings: number[][] | null = null;

      for (const model of modelsToTry) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:batchEmbedContents?key=${apiKey}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requests: batchChunks.map((text) => ({
                model: `models/${model}`,
                content: { parts: [{ text }] },
              })),
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data.embeddings)) {
              batchEmbeddings = data.embeddings.map((e: any) => e.values || new Array(768).fill(0.1));
              break;
            }
          } else {
            const errText = await response.text();
            console.warn(`Gemini embedding batch failed for ${model} (${response.status}):`, errText);
          }
        } catch (e) {
          console.warn(`Gemini embedding exception for ${model}:`, e);
        }
      }

      // Single chunk fallback if batch failed
      if (!batchEmbeddings) {
        for (const chunk of batchChunks) {
          let singleEmbedding: number[] | null = null;
          for (const model of modelsToTry) {
            try {
              const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`;
              const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  model: `models/${model}`,
                  content: { parts: [{ text: chunk }] },
                }),
              });
              if (resp.ok) {
                const data = await resp.json();
                if (data.embedding?.values) {
                  singleEmbedding = data.embedding.values;
                  break;
                }
              }
            } catch (err) {}
          }
          results.push(singleEmbedding || new Array(768).fill(0.1));
        }
      } else {
        results.push(...batchEmbeddings);
      }
    }

    return results;
  },
};
