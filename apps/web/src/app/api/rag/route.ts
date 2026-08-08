import { NextResponse } from 'next/server';
import { processRagQuery, RagDependencies } from '../../../engine/rag';
import { generateEmbeddings } from '@/lib/ai/openai';
import { supabase } from '@/lib/db/supabase';

const liveDeps: RagDependencies = {
  retrieveEmbeddings: async (query: string) => {
    try {
      // 1. Generate embedding for query
      const embedResult = await generateEmbeddings(query);
      if (!embedResult || embedResult.length === 0) return [];
      const queryEmbedding = embedResult[0].embedding;

      // 2. Perform similarity search using match_knowledge_base RPC
      const { data, error } = await supabase.rpc('match_knowledge_base', {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: 5,
        filter: {}
      });

      if (error) {
        console.error("Supabase match error:", error);
        return [];
      }

      if (!data) return [];

      return data.map((doc: any) => ({
        id: doc.id || Math.random().toString(),
        content: doc.content,
        score: doc.similarity || 1.0
      }));
    } catch (e) {
      console.error("retrieveEmbeddings error", e);
      return [];
    }
  },
  generateLlmResponse: async (prompt: string) => {
    if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
      return `[Mock Response] Here is a synthesized response for your query.\n\n${prompt}`;
    }

    const isGemini = !!process.env.GEMINI_API_KEY;
    const url = isGemini 
      ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`
      : 'https://api.groq.com/openai/v1/chat/completions';

    const systemPrompt = "You are a helpful teaching assistant answering a student's question based on the provided context. If the context does not contain the answer, say you don't know.";

    try {
      let response;
      if (isGemini) {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: { text: systemPrompt } },
            contents: [{ parts: [{ text: prompt }] }]
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
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ]
          })
        });
      }

      if (!response.ok) throw new Error('Failed to generate response');
      const data = await response.json();
      
      if (isGemini) {
        return data.candidates[0].content.parts[0].text;
      }
      return data.choices[0].message.content;
    } catch (e) {
      console.error("LLM Generation error", e);
      return "[Fallback] An error occurred while generating the response.";
    }
  }
};

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const result = await processRagQuery(query, liveDeps, { maxContextLength: 4000 });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
