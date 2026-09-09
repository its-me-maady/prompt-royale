---
name: handwritten-notes-ingestion
description: >-
  Parse and process handwritten notes, notebook scans, and math formulas using a 2-step pipeline: Gemini Vision OCR transcription followed by Gemini text embeddings for RAG vector search in Supabase. Use when handling handwritten study notes, lecture scribbles, or image-based document ingestion.
---

# Handwritten Notes Ingestion & RAG Pipeline

## Overview

This skill defines the standard 2-step pipeline for parsing handwritten study notes, notebook scans, or math equations, and ingesting them into the PromptRoyale Knowledge Base (RAG) system.

---

## 2-Step Pipeline Workflow

```
[ Handwritten Note (Image / PDF) ]
               │
               ▼
[ Step 1: Gemini Vision OCR Transcribe ] (gemini-1.5-flash / gemini-2.0-flash)
               │ Converts image pixels ➔ Clean Markdown + LaTeX math ($...$)
               ▼
[ Step 2: Vector Embedding & RAG Storage ] (text-embedding-004 ➔ Supabase pgvector)
               │ Generates 768-dim embedding array ➔ Inserts into `knowledge_base`
```

---

## Step 1: Multimodal Vision OCR Transcription

Use Gemini's native multimodal capabilities to transcribe handwritten text, tables, and mathematical formulas into Markdown.

### Code Pattern (Node.js / Next.js API Route)

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function transcribeHandwrittenNote(imageBuffer: Buffer, mimeType: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are an expert handwritten note OCR and transcription assistant.
Transcribe the provided handwritten note into clean, structured GitHub-flavored Markdown:
1. Preserve all headers, bullet points, numbered lists, and tables.
2. Convert all mathematical formulas, symbols, and equations into LaTeX ($...$ for inline, $$...$$ for block).
3. If text is illegible, mark it as [illegible].
4. Output ONLY the transcribed Markdown without conversational intro or outro.`;

  const result = await model.generateContent([
    {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType
      }
    },
    prompt
  ]);

  return result.response.text();
}
```

---

## Step 2: Vector Embedding & RAG Indexing

Pass the transcribed Markdown text through the Gemini embedding service to generate a 768-dimensional vector and store it in Supabase `knowledge_base`.

### Code Pattern

```typescript
import { embeddingApi } from '@/services/embedding';
import { createClient } from '@/utils/supabase/server';

export async function indexTranscribedNote(content: string, metadata: Record<string, any>) {
  // 1. Generate 768-dim vector using text-embedding-004
  const embedding = await embeddingApi.generateEmbedding(content);

  // 2. Insert into Supabase pgvector table
  const supabase = createClient();
  const { data, error } = await supabase
    .from('knowledge_base')
    .insert([
      {
        content,
        metadata,
        embedding
      }
    ]);

  if (error) throw error;
  return data;
}
```

---

## Key Best Practices

1. **Model Selection:** Use `gemini-1.5-flash` or `gemini-2.0-flash` for high-speed, cost-effective vision OCR. Use `gemini-1.5-pro` for dense, highly complex handwriting or low-contrast historic documents.
2. **LaTeX Preservation:** Ensure math equations are formatted in LaTeX (`$...$`) so the Professor Chat & Arena Quiz components can render KaTeX formulas cleanly.
3. **Chunking for RAG:** For multi-page handwritten PDF notebooks, split pages before transcription and chunk long text (>500 words) before embedding.
