/**
 * agent-notes: { ctx: "API route for RAG querying", deps: [], state: "canonical", last: "sato@2026-08-08" }
 */

export const embeddingApi = {
  createEmbeddings: async (chunks: string[]): Promise<number[][]> => {
    if (!process.env.GEMINI_API_KEY) {
      // Basic stub implementation for local dev without keys
      return chunks.map(() => new Array(768).fill(0.1));
    }
    
    // Use Gemini for embeddings
    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`;
    
    const results: number[][] = [];
    
    for (const chunk of chunks) {
      let embedding: number[] | null = null;
      
      // Try text-embedding-004 first, then gemini-embedding-001
      const modelsToTry = ['text-embedding-004', 'gemini-embedding-001'];
      
      for (const model of modelsToTry) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${process.env.GEMINI_API_KEY}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: { parts: [{ text: chunk }] }
            })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.embedding?.values) {
              embedding = data.embedding.values;
              break;
            }
          }
        } catch (e) {
          // ignore and try next model
        }
      }

      if (embedding) {
        results.push(embedding);
      } else {
        console.warn('Embedding API unavailable, returning 768-dim fallback stub vector.');
        results.push(new Array(768).fill(0.1));
      }
    }
    
    return results;
  }
};
