# Code Review: Epic 3 - Discord Lobby & Prompt Lab
**Date:** 2026-07-29
**Reviewers:** Vik, Tara, Pierrot
**Context:** Reviewing the implementation of the Discord Lobby API/UI and Prompt Lab API/UI for Epic 3.

## Vik's Lens (Simplicity, Maintainability & Performance)
* **Important - Next.js Routing Anti-Pattern:** In `apps/web/src/app/lobby/page.tsx`, navigation to the Arena is handled via `window.location.href = '/arena'`. Since this is a Next.js App Router application, using `window.location.href` triggers a full page reload, losing the benefits of Next.js client-side routing. We should use the `useRouter` hook from `next/navigation` or the `<Link>` component.
* **Suggestion:** The UI components are very clean and effectively match the "Minimalist Focus Mode" concept. State management is simple and predictable.

## Tara's Lens (Test Quality & Coverage)
* **Clean Bill of Health:** The integration test suite (`epic3.test.ts`) elegantly covers the happy paths and necessary unhappy paths (empty/missing notes) for the API routes. The mocking strategy for the LLM service matches our documentation perfectly.

## Pierrot's Lens (Security Surface)
* **Important - Unbounded Text Input:** The `POST /api/prompt-lab/restyle` endpoint validates that `notes` is a string but does not enforce a maximum length. Passing a massive payload (e.g., millions of characters) could cause resource exhaustion during JSON parsing or when forwarding to the LLM provider. We should enforce a reasonable character limit (e.g., 10,000 characters) on the input.

## Lessons & Takeaways
1. **Client-Side Routing:** Always leverage your framework's native routing mechanisms (`useRouter` or `<Link>` in Next.js) to ensure snappy transitions and preserve application state.
2. **Defensive API Design:** Whenever accepting arbitrary user input (especially strings), always enforce a maximum length to prevent Denial of Service (DoS) or unexpected upstream API costs (e.g., LLM token limits).
