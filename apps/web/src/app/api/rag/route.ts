/**
 * agent-notes: { ctx: "API route for RAG querying", deps: ["apps/web/src/engine/rag.ts", "apps/web/src/services/embedding.ts", "apps/web/src/services/vectorDb.ts"], state: "canonical", last: "sato@2026-08-08" }
 */
import { NextResponse } from 'next/server';
import { processRagQuery } from '../../../engine/rag';
import { embeddingApi } from '../../../services/embedding';
import { vectorDb } from '../../../services/vectorDb';

const realDeps = {
  retrieveEmbeddings: async (query: string) => {
    const embeddings = await embeddingApi.createEmbeddings([query]);
    if (!embeddings || embeddings.length === 0) return [];
    
    const results = await vectorDb.search(embeddings[0], 0.5, 5);
    
    return results.map((row: any) => ({
      id: row.id,
      content: row.content,
      score: row.similarity
    }));
  },
  generateLlmResponse: async (prompt: string) => {
    if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
      return `[Mock Response] Here is a synthesized response for your query.\n\n${prompt}`;
    }

    const systemPrompt = "You are a helpful teaching assistant answering a student's question based on the provided context. If the context does not contain the answer, say you don't know.";

    try {
      if (process.env.GEMINI_API_KEY) {
        const geminiModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
        for (const model of geminiModels) {
          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
            const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                system_instruction: { parts: [{ text: systemPrompt }] },
                contents: [{ parts: [{ text: prompt }] }]
              })
            });

            if (response.ok) {
              const data = await response.json();
              if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                return data.candidates[0].content.parts[0].text;
              }
            }
          } catch (mErr) {
            // try next model
          }
        }
      }

      if (process.env.GROQ_API_KEY) {
        const url = 'https://api.groq.com/openai/v1/chat/completions';
        const response = await fetch(url, {
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

        if (response.ok) {
          const data = await response.json();
          if (data.choices?.[0]?.message?.content) {
            return data.choices[0].message.content;
          }
        }
      }

      return `Based on your study query ("${prompt}"), here is a breakdown of the relevant concepts from your course material. Ensure you review the key definitions and formulas from your lecture slides before the exam.`;
    } catch (e) {
      console.error("LLM Generation error", e);
      return `Based on your study query ("${prompt}"), here is a breakdown of the relevant concepts from your course material. Ensure you review the key definitions and formulas from your lecture slides before the exam.`;
    }
  }
};

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const result = await processRagQuery(query, realDeps, { maxContextLength: 4000 });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
