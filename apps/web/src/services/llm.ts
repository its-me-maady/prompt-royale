export interface KnowledgeChunk {
  content: string;
  metadata?: Record<string, any>;
}

export const llmService = {
  generateQuestions: async (fileContent: Buffer) => {
    // Real LLM integration to be added
    return [];
  },
  restylePrompt: async (notes: string) => {
    // In production, this would call OpenAI/Gemini to restyle the text.
    // For TDD/MVP, we mock the response.
    return `Here is your simplified study guide based on: "${notes.substring(0, 50)}..."`;
  },
  expandQuery: async (query: string): Promise<string[]> => {
    return [query, "mock expanded query"];
  },
  generateSynthesis: async (chunks: KnowledgeChunk[], query: string): Promise<string> => {
    const context = chunks.map(c => c.content).join('\n\n');
    return `Here is a synthesized response for your query "${query}". Based on the uploaded knowledge base: \n\n${context}`;
  },
  generateReviveQuestion: async () => {
    if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
      // Mocked fallback for local dev without keys
      return {
        question: "Which pattern best prevents race conditions in a distributed 60-second game loop?",
        options: ["Pessimistic Locking", "Host-Client Inversion Model", "Eventual Consistency", "Client-side Prediction"],
        correctIndex: 1
      };
    }
    // Use Gemini or fallback to Groq based on available keys
    const isGemini = !!process.env.GEMINI_API_KEY;
    const url = isGemini 
      ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`
      : 'https://api.groq.com/openai/v1/chat/completions';

    const systemPrompt = `You are an AI Boss in a cyber-raid game. The players have been wiped out.
To revive, they must answer a difficult software engineering question.
Topic: Distributed Systems, Advanced React, or Cybersecurity.
Tone: Taunting, arrogant AI boss.
Output strictly in JSON format exactly like this:
{
  "question": "Puny humans... [question text]",
  "options": ["A", "B", "C", "D"],
  "correctIndex": 2
}`;

    let response;
    if (isGemini) {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: { text: systemPrompt } },
          contents: [{ parts: [{ text: 'Generate the revive question now.' }] }],
          generationConfig: { response_mime_type: 'application/json' }
        })
      });
    } else {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [{ role: 'system', content: systemPrompt }],
          response_format: { type: 'json_object' }
        })
      });
    }
    if (!response.ok) throw new Error('Failed to generate revive question');
    const data = await response.json();
    if (isGemini) {
      const text = data.candidates[0].content.parts[0].text;
      return JSON.parse(text);
    }
    return JSON.parse(data.choices[0].message.content);
  }
};
