# Code Review: Boss Raid MVP (Epic 1 & 2)
**Date:** 2026-07-29
**Reviewers:** Vik, Tara, Pierrot
**Context:** Reviewing the Asynchronous Content Pipeline and Boss Raid Arena implementations.

## Vik's Lens (Simplicity, Maintainability & Performance)
* **Critical - Broken SSE Broadcasting:** `apps/web/src/app/api/arena/sse/route.ts` establishes the SSE connection and sends the initial state, but it lacks a mechanism (like an EventEmitter or Redis Pub/Sub) to push *new* state updates to the open stream. The UI will never see damage applied without this.
* **Important - Express vs Next.js Mismatch:** `apps/web/src/app.ts` implements the async pipeline endpoints as an Express app. However, this is a Next.js App Router project. Unless we configure a custom `server.js` for Next.js, these endpoints will not be reachable in production. We should refactor them to Next.js API Routes (`app/api/jobs/.../route.ts`).
* **Important - Worker Race Conditions:** In `worker.ts`, jobs are fetched via `findPending()` and then updated to `Processing`. In a scaled environment with MongoDB, two workers could fetch the same pending job simultaneously. We need an atomic `findOneAndUpdate` lock.

## Tara's Lens (Test Quality & Coverage)
* **Important - Unhappy Paths Missing:** The `async-pipeline.test.ts` only tests happy paths. We need tests for missing files, invalid file types, and LLM API timeouts.
* **Suggestion - Excellent Game Logic Coverage:** The `game-logic.test.ts` has 100% path coverage and handles the ambiguous 1/4 correct edge case perfectly. Great job separating the math from the network layer!

## Pierrot's Lens (Security Surface)
* **Critical - Unbounded Memory Uploads:** The `multer` configuration in `app.ts` uses `memoryStorage()` without a `limits.fileSize` restriction. An attacker can upload a 10GB file and immediately crash the Node.js process with an Out-of-Memory (OOM) error.
* **Critical - Missing File Validation:** There is no check ensuring the uploaded file is actually a PDF before it's passed to the LLM queue.
* **Important - Missing Authorization:** The game state SSE endpoint and job endpoints are completely unauthenticated. For the MVP, this might be acceptable, but it violates the Threat Model if anyone can view or tamper with jobs.

## Lessons & Takeaways
1. **Always Validate Input at the Boundary:** Never accept a file upload into memory without strict size limits and mime-type validation.
2. **Framework Alignment:** When using Next.js, prefer App Router API routes over bolting on Express unless you explicitly plan to run a custom Node server.
3. **SSE requires a Pub/Sub layer:** SSE is just an open HTTP connection. To push updates to it from *other* requests (like a player voting), you need a centralized bus (EventEmitter for single-instance, Redis for multi-instance) that the SSE route subscribes to.
