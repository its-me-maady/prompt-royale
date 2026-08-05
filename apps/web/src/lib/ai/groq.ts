export async function transcribeAudio(file: Blob): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    console.warn('GROQ_API_KEY missing, returning mock transcription.');
    return "This is a mock transcription of the audio file since no API key is provided. The professor talks about various things in the lecture.";
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('model', 'whisper-large-v3');

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.text;
}
