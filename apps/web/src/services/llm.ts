// agent-notes: { ctx: "LLM service for prompt restyling, query expansion, synthesis, revive and grounded quiz generation", deps: [], state: active, last: "sato@2026-09-01" }
export interface KnowledgeChunk {
  content: string;
  metadata?: Record<string, any>;
}

export const GEMINI_MODELS = [
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
  'gemini-1.5-flash'
];

async function callGemini(systemPrompt: string, userPrompt: string, isJson = false): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload: any = {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userPrompt }] }]
      };
      if (isJson) {
        payload.generationConfig = { response_mime_type: 'application/json' };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      }
    } catch (e) {
      // try next model
    }
  }

  return null;
}

export const llmService = {
  generateQuestions: async (fileContent: Buffer) => {
    return [];
  },

  restylePrompt: async (notes: string): Promise<string> => {
    const systemPrompt =
      "You are an expert prompt engineer and study coach. Rewrite and enhance the student's study prompt into a clear, detailed, well-structured prompt designed to elicit deep explanations and key concepts. Output ONLY the enhanced prompt string without commentary.";

    const geminiResult = await callGemini(systemPrompt, notes);
    if (geminiResult) return geminiResult;

    // Fallback if API keys unconfigured
    return `Enhanced Study Guide Prompt: "Provide a comprehensive, step-by-step breakdown of ${notes.substring(0, 80)}. Include key definitions, core mechanisms, visual diagrams, time complexity, and practical examples."`;
  },

  expandQuery: async (query: string): Promise<string[]> => {
    const systemPrompt =
      "Expand the student study query into 3 distinct alternative search queries for retrieving relevant study materials. Output strictly a JSON array of strings, e.g. [\"query 1\", \"query 2\", \"query 3\"].";

    const geminiResult = await callGemini(systemPrompt, query, true);
    if (geminiResult) {
      try {
        const clean = geminiResult.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(clean);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch (e) {}
    }

    return [query, `${query} key concepts`, `${query} examples and definitions`].slice(0, 3);
  },

  generateSynthesis: async (chunks: KnowledgeChunk[], query: string): Promise<string> => {
    const context = chunks.map((c) => c.content).join('\n\n');
    const systemPrompt =
      "You are a friendly, expert computer science teaching assistant. Synthesize a clear, accurate, well-formatted response for the student based on the provided context material and query.";

    const userPrompt = `Context:\n${context || 'No specific course context provided.'}\n\nStudent Query: ${query}`;
    const geminiResult = await callGemini(systemPrompt, userPrompt);
    if (geminiResult) return geminiResult;

    return `Here is a synthesized response for your query "${query}". Based on your course knowledge base:\n\n${context || 'Review your core lecture slides for formulas and key definitions.'}`;
  },

  generateReviveQuestion: async () => {
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

    const geminiResult = await callGemini(systemPrompt, 'Generate the revive question now.', true);
    if (geminiResult) {
      try {
        const cleanText = geminiResult.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
      } catch (e) {}
    }

    // Fallback if API key unconfigured or Groq
    if (process.env.GROQ_API_KEY) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama3-8b-8192',
            messages: [{ role: 'system', content: systemPrompt }],
            response_format: { type: 'json_object' },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.choices[0].message.content;
          const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
          return JSON.parse(cleanText);
        }
      } catch (e) {}
    }

    return {
      question: 'Which pattern best prevents race conditions in a distributed 60-second game loop?',
      options: ['Pessimistic Locking', 'Host-Client Inversion Model', 'Eventual Consistency', 'Client-side Prediction'],
      correctIndex: 1,
    };
  },

  generateQuizQuestion: async (chunks: KnowledgeChunk[], courseId?: string) => {
    if (!chunks || chunks.length === 0) {
      return null;
    }

    const context = chunks.map((c) => c.content).join('\n\n---\n\n');
    const systemPrompt = `You are a study quiz generator for a course raid arena. You MUST generate a multiple-choice question based strictly and exclusively on the provided course material context.
Do NOT invent facts or use outside knowledge not present in the context.
Output strictly in JSON format matching this schema:
{
  "question": "Question text...",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0
}`;

    const userPrompt = `Course ID: ${courseId || 'General'}\n\nProvided Course Context:\n${context}\n\nGenerate 1 grounded multiple-choice question based on this context.`;

    const geminiResult = await callGemini(systemPrompt, userPrompt, true);
    if (geminiResult) {
      try {
        const cleanText = geminiResult.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
      } catch (e) {}
    }

    if (process.env.GROQ_API_KEY) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama3-8b-8192',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.choices[0].message.content;
          const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
          return JSON.parse(cleanText);
        }
      } catch (e) {}
    }

    // Static fallback grounded in the provided chunk text
    const firstChunkText = chunks[0]?.content || '';
    const snippet = firstChunkText.slice(0, 80).replace(/\n/g, ' ').trim();
    return {
      question: `According to the ${courseId || 'course'} study material: What concept is directly mentioned in the notes regarding "${snippet}..."?`,
      options: [
        `${snippet.slice(0, 40)}`,
        'Quantum Entanglement in Microservices',
        'Non-relational Stack Overflowing',
        'Asynchronous Memory Eviction'
      ],
      correctIndex: 0,
    };
  },
};
