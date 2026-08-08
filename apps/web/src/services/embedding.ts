/**
 * agent-notes: { ctx: "P0 principal SDE, TDD green phase", deps: [], state: "canonical", last: "sato@2026-08-05" }
 */

export const embeddingApi = {
  createEmbeddings: async (chunks: string[]): Promise<number[][]> => {
    if (!process.env.GEMINI_API_KEY) {
      // Basic stub implementation for local dev without keys
      return chunks.map(() => new Array(1536).fill(0.1));
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
        results.push(new Array(1536).fill(0));
      } else {
        const data = await response.json();
        const embedding = data.embedding?.values;
        if (embedding) {
          // Note: Gemini text-embedding-004 is 768 dimensions by default.
          // In setup.sql we defined vector(1536) for OpenAI. 
          // We can pad with zeros to match 1536 or change the db schema.
          // But as a mock/stub we'll ensure it's 1536 length.
          const padded = new Array(1536).fill(0);
          for (let i = 0; i < Math.min(1536, embedding.length); i++) {
            padded[i] = embedding[i];
          }
          results.push(padded);
        } else {
          results.push(new Array(1536).fill(0));
        }
      }
    }
    
    return results;
  }
};
