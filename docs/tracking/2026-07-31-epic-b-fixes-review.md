---
date: 2026-07-31
topic: epic-b-fixes
status: in-progress
---

# Code Review Tracking: Epic B Fixes

## Prior Phase
`docs/code-reviews/2026-07-31-epic-b-prompt-lab.md`

## Findings Summary
- **Critical:** 2
- **Important:** 2
- **Suggestion:** 1

## Key Issues Found
1. **[CRITICAL]** Insecure token validation in `/api/lab/chat`. Currently only checks for string prefix, failing to validate identity or authorization (IDOR risk).
2. **[CRITICAL]** Broken Client-Server Contract. Frontend `PromptLab` does not attach `Authorization` header in its `fetch` request, meaning it will always fail with a 401 in integration.
3. **[IMPORTANT]** Missing test coverage for defensive error handling (non-JSON server errors in UI, malformed JSON body in API).
4. **[IMPORTANT]** Unhandled empty query expansion `expandedQueries.join(' ')` returning an empty string to Supabase vector search.
5. **[SUGGESTION]** Test hygiene: Mutating `global.fetch` at the module scope rather than using `vi.spyOn` in lifecycle hooks.

## Resolution Status
- **Pending:** All issues are currently pending resolution.

## Detailed Review Document
For full details, explanations, and learning takeaways, see: `docs/code-reviews/2026-07-31-epic-b-fixes.md`
