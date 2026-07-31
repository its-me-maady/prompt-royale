---
agent-notes: { ctx: "ADR for Prompt Lab RAG Strategy", deps: [docs/adrs/0004-kb-ingestion-storage.md], state: active, last: "archie@2026-07-31" }
---
# ADR 0005: Prompt Lab RAG Strategy

## Context
The Prompt Lab allows students to consume the master knowledge base. We need a reliable Retrieval-Augmented Generation (RAG) strategy that goes beyond simple keyword matching, as students often ask synthesis questions.

## Decision
We will implement an **Advanced RAG Pipeline with Query Expansion and Metadata Filtering**.
1. **Query Expansion:** Before hitting the vector DB, a fast LLM (e.g., GPT-4o-mini) will rewrite the student's prompt into a set of optimized search queries.
2. **Metadata Filtering:** Vectors in Supabase will be tagged with `lecture_id`, `topic`, and `document_type`.
3. **Synthesis:** The retrieved chunks will be passed to the LLM to generate the final study response.

## Rationale
- **Wei's Challenge:** Naive RAG fails on synthesis. If a student asks "Compare Lecture 1 and 4", naive chunk matching might only pull chunks from one lecture.
- **Archie's Response:** That's exactly why we need Query Expansion. The LLM will split that into two queries: one for Lecture 1 and one for Lecture 4, and we can use metadata filters to force pgvector to search within those specific lectures.

## Consequences
- Increases the number of LLM calls per Prompt Lab query (one for expansion, one for generation).
- Requires careful chunking strategy during the ingestion phase (ADR 0004) to ensure metadata is preserved and attached to every chunk.
