<!-- agent-notes: { ctx: "multi-lens code review on epic-b fixes", deps: [], state: active, last: "code-reviewer@2026-07-31" } -->
# Code Review: Epic B Fixes

**Date:** 2026-07-31
**Topic:** epic-b-fixes

## Context
A follow-up review on the fixes applied to Epic B (Prompt Lab RAG endpoint and UI). The fixes addressed initial findings regarding missing Auth, Zod validation, and UI test coverage.

## Findings

### Critical

**1. Pierrot (Security & Compliance): Missing Token Validation in RAG Endpoint**
- **What's wrong:** In `apps/web/src/app/api/lab/chat/route.ts`, the authorization check merely verifies that the `Authorization` header exists and starts with `Bearer `. It does not actually validate the token (e.g., checking JWT signature or resolving it to a user session).
- **Why it matters:** An attacker can completely bypass the endpoint's security by passing `Authorization: Bearer literally-anything`. Furthermore, because the user identity isn't extracted, there is no way to verify if the user has authorization to query the provided `courseId`, leaving the system vulnerable to Insecure Direct Object Reference (IDOR) and cross-tenant data leakage.
- **Fix:** Properly validate the token using the project's chosen authentication library (e.g., Supabase Auth or a JWT verifier) and extract the user's ID. Ensure the user is authorized to access the requested `courseId`.
- **Principle:** Authentication must verify identity, not just the presence of a credential format. Authorization must ensure the authenticated identity has permission to access the requested resources.

**2. Vik & Tara (Simplicity / Testing): Frontend Missing Authorization Header**
- **What's wrong:** In `apps/web/src/app/prompt-lab/page.tsx`, the `fetch` call to `/api/lab/chat` does not include the `Authorization` header. However, the backend explicitly requires this header and will return a `401 Unauthorized`.
- **Why it matters:** The feature is completely broken in integration. The UI will never successfully get a response from the API. The UI tests in `PromptLab.test.tsx` failed to catch this because they only verify the `Content-Type` header and don't enforce an integration contract.
- **Fix:** Update the `fetch` call in `page.tsx` to include the user's `Authorization: Bearer <token>` header. Update the UI tests to assert that this header is being sent.
- **Principle:** Client-server contracts must be respected in integration. Mocks in tests can create false confidence if they don't reflect the actual requirements of the integrated system.

### Important

**3. Tara (Test Quality & Coverage): Missing Error Handling Edge Case Tests**
- **What's wrong:** 
  1. `apps/web/src/app/prompt-lab/page.tsx` introduced a fallback for non-JSON error responses, but there is no corresponding test in `PromptLab.test.tsx`.
  2. `route.ts` will throw an unhandled exception yielding a 500 status if `req.json()` fails, but this is not tested in `lab.test.ts`.
- **Why it matters:** The UI error fallback protects the user experience against unexpected server crashes. Without tests, this defensive code could easily regress.
- **Fix:** Add a test in `PromptLab.test.tsx` mocking a fetch response with `ok: false` and plain text/HTML body. Add a test in `lab.test.ts` that sends an invalid JSON payload.
- **Principle:** All defensive error-handling branches should be covered by tests.

**4. Vik (Simplicity & Maintainability): Unhandled Empty Query Expansion**
- **What's wrong:** In `route.ts`, the code uses `expandedQueries.join(' ')` as the `query_text` for the Supabase RPC call. If `llmService.expandQuery(query)` returns an empty array, `query_text` will be an empty string.
- **Why it matters:** Passing an empty string to a vector search can result in returning all documents or no documents unpredictably, corrupting the RAG synthesis step.
- **Fix:** Provide a fallback. For example: `query_text: expandedQueries.length > 0 ? expandedQueries.join(' ') : query`.
- **Principle:** Always account for empty or null collections when transforming data between boundaries.

### Suggestions

**5. Tara (Test Quality & Coverage): Avoid Mutating Globals at Module Scope**
- **What's wrong:** In both `UploadForm.test.tsx` and `PromptLab.test.tsx`, `global.fetch = vi.fn();` is executed at the top level of the module.
- **Why it matters:** Mutating globals outright at the module scope is an anti-pattern that can lead to subtle leaks or unintended behaviors if configuration changes.
- **Fix:** Use `const fetchMock = vi.spyOn(global, 'fetch');` inside a `beforeEach` block.

## Lessons Learned
1. **Integration tests are essential:** Mocks are useful for unit testing, but they can't guarantee that the frontend and backend agree on the contract (e.g., the Authorization header requirement).
2. **True Validation:** Just because a header exists doesn't mean it's valid. Always parse and verify tokens using a cryptographic or authoritative source.
3. **Empty Data Collections:** Array `.join()` on an empty array produces an empty string. Consider the impact of passing empty strings to downstream services.
