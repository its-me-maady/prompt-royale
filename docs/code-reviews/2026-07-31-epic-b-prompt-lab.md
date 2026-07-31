---
agent-notes:
  ctx: "Multi-lens code review for Prompt Lab RAG endpoint"
  deps: ["apps/web/src/app/api/lab/chat/route.ts", "apps/web/src/app/prompt-lab/page.tsx", "apps/web/test/api/lab.test.ts", "apps/web/src/services/llm.ts"]
  state: active
  last: "coordinator@2026-07-31"
---
# Code Review: Epic B (Prompt Lab RAG endpoint and UI)
**Date:** 2026-07-31
**Reviewed by:** Vik (simplicity), Tara (testing), Pierrot (security), Archie (conformance)
**Files reviewed:** 
- `apps/web/src/app/api/lab/chat/route.ts`
- `apps/web/src/app/prompt-lab/page.tsx`
- `apps/web/test/api/lab.test.ts`
- `apps/web/src/services/llm.ts`
**Verdict:** Changes requested

## Context
Implementation of the Prompt Lab RAG endpoint allowing users to query the master knowledge base and the corresponding UI for the Boss Raid. It includes the API route for chat, the React frontend page, API tests, and stubs for the LLM service.

## Findings

### Critical
- **Missing Authentication & Rate Limiting (Pierrot):** The `/api/lab/chat` endpoint is completely public. Unauthenticated users can trigger potentially expensive LLM operations and database queries, which could lead to a Denial of Wallet (DoW) and service exhaustion. **Fix:** Add authentication middleware/checks and implement rate-limiting before proceeding with generation.
- **Missing Input Validation (Pierrot/Vik):** The API simply checks for truthiness (`!query`, `!courseId`) but not type or structure. Passing non-string objects could bypass checks or cause backend exceptions. **Fix:** Use a schema validation library (like Zod) to enforce strict types.

### Important
- **No UI Test Coverage (Tara):** While the API route has excellent TDD coverage in `lab.test.ts`, the frontend `prompt-lab/page.tsx` lacks any UI tests. **Fix:** Add component tests to verify loading states, disabled button behavior, and error/success rendering.
- **Untyped Shared Types (Archie):** In `llm.ts`, `generateSynthesis` accepts `chunks: any[]`. Since this is a shared service crossing the database and LLM domains, it should use a proper format-neutral representation (e.g., `interface KnowledgeChunk`) rather than relying on `any`.
- **Potential Fetch Error Trap (Vik):** In `page.tsx`, `await res.json()` is called before checking `res.ok`. If the server crashes and returns an HTML 500 error page, `.json()` will throw an exception, bypassing the actual API error handling and defaulting to "Network error". **Fix:** Check `res.ok` or `Content-Type` before safely parsing the body.

### Suggestions
- **Query Concatenation (Vik):** In the API route, `expandedQueries.join(' ')` is a simplistic way to pass multiple queries to pgvector/Supabase. Depending on how `match_knowledge_base` is implemented, this might dilute the vector embedding representation. Consider mapping each query to an embedding and searching individually or using a structured approach.

## Lessons
- **Protect Expensive Endpoints by Default:** Any endpoint triggering LLM generations must have auth and rate-limiting from day one to prevent abuse. This is a primary attack vector in AI applications.
- **Validate at the Boundary:** Truthiness checks (`if (!query)`) are insufficient in JavaScript APIs because objects or arrays evaluate to true. Always use schema validation (Zod) to ensure the structure matches expectations.
- **Order of Operations in Fetch:** Always check `res.ok` before calling `.json()` on a fetch response. It prevents JSON parsing errors from masking the actual server HTTP error.
- **Avoid `any` in Shared Services:** When data crosses from the database layer to an external service (like the LLM layer), explicitly define the contract using interfaces. It ensures both sides speak the same language and prevents runtime type errors.
