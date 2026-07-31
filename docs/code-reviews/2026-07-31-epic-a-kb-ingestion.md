---
agent-notes: { ctx: "Code review for Epic A Knowledge Base Ingestion", deps: [docs/tracking/2026-07-31-professor-kb-gamification-epic-a-implementation.md], state: active, last: "vik@2026-07-31" }
---

# Code Review: Epic A - Professor Knowledge Base Ingestion

## Lens 1: Vik (Simplicity, Maintainability & Performance)
- **Important**: In `apps/web/src/app/api/kb/upload/route.ts`, the database insertions are inside a `for...of` loop:
  ```typescript
  for (const chunk of embeddings) {
    await supabase.from('knowledge_base').insert({...});
  }
  ```
  This is a classic N+1 problem. We should bulk insert the array of embeddings instead of making multiple round-trips to Supabase.
- **Suggestion**: The chunking logic in `openai.ts` uses a naive regex. This is acceptable for a stub but should be upgraded to a robust tokenizer-based chunker (like LangChain's RecursiveCharacterTextSplitter) to avoid blowing up the OpenAI API limits.

## Lens 2: Tara (Test Quality & Coverage)
- **Important**: The backend API tests pass successfully and cover all edge cases defined in the Red Phase. However, the `UploadForm.tsx` UI component has no tests. We should add a basic Vitest + Testing Library rendering test to ensure the form behaves correctly.

## Lens 3: Pierrot (Security Surface)
- **Critical**: Missing Authorization. The `/api/kb/upload` route is currently unauthenticated. Any user could trigger a request, causing us to spend OpenAI and Groq credits processing arbitrary audio files. We must add a session/auth check before processing.
- **Important**: The `metadata` field parses arbitrary JSON from the client without schema validation. We should use `Zod` to validate that `courseId` and `title` are strings and meet length constraints.

## Lessons
1. **Bulk Operations over Loops**: Always use `.insert([])` with an array when pushing multiple rows to a database to avoid connection exhaustion and high latency.
2. **Never Trust the Client**: Endpoints that invoke paid external APIs must be authenticated to prevent abuse.
