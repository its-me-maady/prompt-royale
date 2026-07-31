export async function parseDocument(file: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('https://api.cloud.llamaindex.ai/api/parsing/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.LLAMA_CLOUD_API_KEY}`
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error(`LlamaParse API error: ${response.statusText}`);
  }

  const data = await response.json();
  // Simplified for the mock implementation, real LlamaParse requires a job polling mechanism
  return data.markdown || data.text;
}
