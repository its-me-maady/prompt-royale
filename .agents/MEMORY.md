# Session Memory

<!-- agent-notes: { ctx: "Session memory tracking", deps: [], state: "active", last: "coordinator@2026-07-31" } -->

## Current Sprint Status
- **Epic A:** Professor Knowledge Base Ingestion API routes -> DONE
- **Epic B:** Prompt Lab RAG integration and UI -> DONE
- **Connect Web Pages:** UI Overhaul for `/`, `/professor`, `/lobby`, `/arena` -> DONE
- **Epic C:** Boss Raid Arena Gamification -> PLANNING / NEXT

## Discovered Patterns & Gotchas
- **Vitest & JSDOM:** JSDOM does not natively provide `EventSource`. When testing components that use SSE, wrap it in a client check `if (typeof window !== 'undefined' && window.EventSource)` or stub it globally (`vi.stubGlobal('EventSource', mock)`).
- **Vitest UI Test Pollution:** Always add `cleanup()` inside an `afterEach` hook when running multiple DOM tests in the same file to prevent "Found multiple elements" testing errors.
- **Next.js `useRouter` in Tests:** Testing components that use `useRouter` from `next/navigation` requires an explicit mock (`vi.mock('next/navigation', ...)`) or it will throw an "app router not mounted" invariant error.
- **Aesthetics over Simplicity:** The project mandates "wow-factor" UI (glassmorphism, `mix-blend-screen` gradients, pulsing backgrounds). Ensure these are applied to all new UI elements instead of plain generic colors.
