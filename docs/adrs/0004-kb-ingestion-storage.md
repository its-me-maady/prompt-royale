---
agent-notes: { ctx: "ADR for KB ingestion and storage using Supabase pgvector", deps: [], state: active, last: "archie@2026-07-31" }
---
# ADR 0004: Knowledge Base Ingestion & Storage

## Context
We need a cost-effective way to process Professor uploads (audio, PPTs, notes) and store them in a master knowledge base that can be easily queried by students in the Prompt Lab and by the AI during the Boss Raid (to generate hard-mode questions).

## Decision
- **Storage:** We will use **Supabase with pgvector** to store both the relational metadata (course, lecture name, uploader) and the vector embeddings of the chunked documents.
- **Transcription/OCR:** We will use the **Groq API (Whisper-large-v3)** for audio transcription due to its extremely low latency and low cost. For PPTs/PDFs, we will use **LlamaParse** or a similar API to extract markdown text.
- **Embeddings:** We will use `text-embedding-3-small` (OpenAI) or `bge-m3` for embedding generation to keep costs low while maintaining high retrieval quality.

## Rationale
- **Wei's Challenge:** Are we sure Groq's Whisper is accurate enough for dense academic lectures? And how do we handle images in PPTs?
- **Archie's Response:** Groq runs the exact same Whisper-large-v3 model as others, just faster and cheaper. For PPTs, LlamaParse handles complex layouts and tables far better than standard text extraction.
- Keeping both relational data and vector data in Postgres (Supabase) prevents "split-brain" architecture (e.g., Postgres for users, Pinecone for vectors) and simplifies the stack.

## Consequences
- Requires setting up a background worker or asynchronous queue (e.g., Inngest or simple Next.js background jobs) to handle long-running transcription tasks without blocking the UI.
- Requires managing Supabase database migrations for the pgvector schema.
