---
agent-notes: { ctx: "debate tracking for edge authentication architecture gate", deps: ["docs/adrs/0013-edge-authentication.md"], state: complete, last: "coordinator@2026-08-31" }
---

# Debate: Edge Authentication

**ADR:** [0013-edge-authentication.md](file:///home/maady/learning/prompt-royale/docs/adrs/0013-edge-authentication.md)  
**Date:** 2026-08-31  
**Participants:** Archie (author) vs Wei (challenger)

---

## Round 1 — Wei's Challenges

1. **The Crawler/Bot Session Flood (Scale Attack):** Auto-generating anonymous sessions on redirect will lead to bot traffic bloating the database with orphaned records.
2. **Edge Middleware Network Blocker (Assumption Surfacing):** Hitting Supabase Auth APIs on every routing request inside middleware blocks execution and creates a performance bottleneck (150ms-400ms lag).
3. **HTTP 431 Header Bloat (Historical Precedent):** Large Supabase cookie chunks forwarded in request headers risk exceeding Vercel/Next.js limits, triggering HTTP 431 errors.
4. **The Vitest Mocking Nightmare (Testing Complexity):** Testing middleware that uses Next.js `cookies()` and `@supabase/ssr` `createServerClient` is complex and prone to fragile mock failure in Vitest.

---

## Round 2 — Archie's Responses

1. **Bot Session Flood:** Redirection is decoupled from session creation. The `/login` page will render statically, requiring a manual user click (e.g. "Join as Guest") to initiate `signInAnonymously()`. Programmatic crawlers/bots will not trigger session database writes. Additionally, `/login` is added to `robots.txt`.
2. **Edge Middleware Network Blocker:** The middleware config is strictly scoped via Matchers to bypass static/public routes. Furthermore, instead of calling Supabase endpoints on every request, we will verify the session JWT locally using the cryptographic library `jose` and the `SUPABASE_JWT_SECRET`. Database token refresh will only run lazily if the session is near expiration (within 5 minutes).
3. **HTTP 431 Header Bloat:** Implement automated chunking via `@supabase/ssr` defaults, combined with an active header pruning helper in the middleware to strip obsolete state cookies, and enforce strict payload limits on JWT custom metadata.
4. **Testing Mocking:** Mock `next/headers` with a custom stateful cookie mock store inside our Vitest setup. Standardize mock client helpers for `@supabase/ssr` to isolate tests from runtime Next.js headers dependencies.

---

## Resolution

*   **Resolved:** All four challenges have been successfully resolved by introducing decoupling of authentication pages, local JWT signature verification, header chunking/pruning, and structured mock factories.
*   **Accepted risks:** Slightly higher code complexity in `middleware.ts` for managing local JWT signatures, and additional setup required in the local test suite.
*   **ADR changes:** Appended **Risk Mitigation** section containing precise technical implementations to resolve bot traffic, latency, header size limits, and Vitest mocking. Changed status to **Accepted**.
