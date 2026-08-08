export async function generateEmbeddings(text: string): Promise<Array<{ embedding: number[], content: string }>> {
  // Simplified naive chunking for the implementation
  const chunks = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY missing, returning 768-dim mock embeddings.');
    return chunks.map(chunk => ({
      embedding: Array(768).fill(0.01),
      content: chunk
    }));
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      input: chunks,
      model: 'text-embedding-3-small'
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  return data.data.map((item: any, index: number) => ({
    embedding: item.embedding,
    content: chunks[index]
  }));
}
