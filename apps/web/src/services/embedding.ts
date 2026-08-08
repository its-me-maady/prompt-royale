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
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: { parts: [{ text: chunk }] }
        })
      });
      
      if (!response.ok) {
        console.error('Failed to generate embedding', await response.text());
        results.push(new Array(768).fill(0));
      } else {
        const data = await response.json();
        const embedding = data.embedding?.values;
        if (embedding) {
          results.push(embedding);
        } else {
          results.push(new Array(768).fill(0));
        }
      }
    }
    
    return results;
  }
};
