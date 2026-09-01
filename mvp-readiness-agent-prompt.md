# PromptRoyale — MVP Readiness: Agent Prompt

Paste everything below the line into your coding agent (the one with full GH access to `its-me-maady/prompt-royale`).

---

## Prompt for the agent

You have full GitHub access to `its-me-maady/prompt-royale`. This is a Next.js 14 / Supabase gamified study app ("boss battle" quiz arena).

### Goal (run until this is true — do not stop for intermediate input)

All 5 issues below are filed on GitHub, each closed via a merged PR against `main` that references it ("Closes #N"), AND all of the following hold on `main` at the end:
- `pnpm build` succeeds
- `pnpm test` passes with no regressions, and every changed/deleted module has matching test coverage updated or removed
- `docs/tech-debt.md` and `docs/code-map.md` reflect the current state (TD-002 and TD-003 resolved or explicitly re-scoped, no references to deleted modules)
- The manual acceptance test at the bottom of this doc passes: sign in → upload a course PDF → start a raid in that course → the quiz question is traceably derived from the uploaded content → revive question still fires on a wipe

If a verifier/reviewer subagent is available, use it to check each PR against that issue's acceptance criteria before merging, and loop back to fix and re-verify rather than merging on a failed check.

### Autonomous decision rules (no human is available mid-run — apply these instead of asking)

- **Deleting a file** (Issues 2 and 4): delete only if `grep -rn` across `apps/web/src` and `apps/web/test` (excluding the file's own module/tests) turns up zero references. If any reference is found, or the grep is ambiguous, leave the file in place, add a `// NOT DEAD: referenced by <path>` comment or a note in `docs/tech-debt.md` explaining why it survived, and move on — do not block the goal on it.
- **Deployment target for Issue 4** (serverless multi-instance vs. single instance): default to assuming serverless multi-instance, since `vercel.json` is present in the repo — implement the Supabase-backed rate limiter migration rather than skipping it. Only fall back to "document as single-instance" if the Supabase migration proves infeasible within the issue's scope (e.g., needs a schema change that conflicts with existing tables) — if so, note the reasoning in `docs/runbooks/` and proceed.
- **Issue 5 scope** (mock vs. real Discord integration): default to option (a) — fix the UI copy, do not implement real Discord OAuth (it requires credentials this agent doesn't have). Note this default in the PR description.
- **Issue 3 auth approach**: default to option (a), the Supabase session check — it reuses existing infrastructure and requires no new credentials.
- Whenever a choice must be made that isn't covered above, choose the option that requires no new external credentials/services and needs no product/design input, note the choice and reasoning in the relevant PR description, and continue.

Do not batch multiple issues into one PR. Work order: P0 issues first (they block the core product loop), then P1, then P2.

---

### Issue 1 — [P0] Arena questions are disconnected from uploaded course content

**Labels:** `P0`, `bug`, `core-loop`

**Problem:**
`apps/web/src/app/arena/page.tsx` calls `fetchQuestion()` → `GET /api/arena/revive` for **every round**, not just revive rounds. That endpoint (`apps/web/src/app/api/arena/revive/route.ts`) calls `llmService.generateReviveQuestion()`, which is a hardcoded "taunting AI boss" prompt about generic CS topics (distributed systems, React, cybersecurity) — it never touches the `knowledge_base` table or the course material a student uploaded via `/api/kb/upload`. So the product's core promise — "study your own notes via boss battle quiz" — is not implemented. The RAG pipeline (`engine/rag.ts`, `/api/rag`, `/api/lab/chat`) exists and works, but is entirely separate from Arena gameplay.

**Fix:**
1. Add a new endpoint `POST /api/arena/question` that takes `{ courseId, roundNumber }`, retrieves relevant chunks from `knowledge_base` via `vectorDb.search` (reuse the pattern in `apps/web/src/app/api/rag/route.ts`), and prompts Gemini to generate a multiple-choice question **grounded in those chunks**, in the same JSON shape currently returned by `generateReviveQuestion()` (`{ question, options, correctIndex }`).
2. Add `generateQuizQuestion(chunks, courseId)` to `apps/web/src/services/llm.ts` alongside the existing `generateReviveQuestion` — same fallback pattern (Gemini → Groq → static fallback question), but with a system prompt that requires grounding in provided context and forbids inventing facts not in it.
3. Update `apps/web/src/app/arena/page.tsx`'s `fetchQuestion()` to call `/api/arena/question` for normal rounds (`gameState.status === 'active'`) and keep `/api/arena/revive` only for `gameState.status === 'revive'`.
4. Handle the empty-knowledge-base case explicitly: if no chunks are found for the `courseId`, return a clear `{ error: 'no_course_content' }` and have the frontend show "Upload course material for this course before starting a raid" instead of silently falling back to generic trivia.

**Acceptance criteria:**
- Uploading a document for `courseId: CS101` and then playing an Arena round in `CS101` produces a question whose content is traceably derived from the uploaded document (test with a fixture doc containing a fact not in Gemini's general knowledge).
- Revive rounds still use the existing taunting-boss generator (that one is fine as generic, since it's a "gotcha" mechanic, not a study mechanic).
- New Vitest tests in `apps/web/test/api/arena/` and `apps/web/test/services/llm.test.ts` covering: successful grounded generation, empty-KB case, and LLM fallback.

---

### Issue 2 — [P0] Retire the dead upload/OCR/job pipeline

**Labels:** `P0`, `tech-debt`, `cleanup`

**Problem:**
There are two parallel, non-communicating upload pipelines:
- **Live path:** `UploadForm.tsx` → `POST /api/kb/upload` → `lib/ai/llamaparse.ts` (real Gemini doc parsing) / `lib/ai/groq.ts` (real Whisper transcription) → `embeddingApi` → Supabase `knowledge_base`. This one works.
- **Dead path:** `POST /api/jobs/upload` → `db.ts` (in-memory `Map`, wiped on every restart) → `services/worker.ts` → `engine/kb.ts` → `services/{ocr,transcription,storage}.ts`, all three of which are **hardcoded stubs** returning `[]` / `''` / a fake S3 URL. `worker.ts` even calls `llmService.generateQuestions(Buffer.from(''))` — an empty buffer, structurally incapable of producing output. Nothing in the frontend calls this path (confirmed: only `UploadForm.tsx` posts to `/api/kb/upload`; grep found no caller of `/api/jobs/upload`).

This is dead code that will confuse anyone reading the repo (including future agents) into thinking there's a background-job upload flow, and it's a liability if `GET /api/jobs/[id]` or `POST /api/jobs/upload` are ever accidentally wired into the UI, since they will silently no-op.

**Fix:**
1. Confirm dead-ness: `grep -rn "jobs/upload\|/api/jobs\|engine/kb\|services/worker\|services/ocr\|services/transcription\b\|services/storage\b" apps/web/src apps/web/test` and verify no live route or component references them except each other and their own tests.
2. If confirmed dead, delete: `apps/web/src/app/api/jobs/` (both routes), `apps/web/src/engine/kb.ts`, `apps/web/src/services/worker.ts`, `apps/web/src/services/ocr.ts`, `apps/web/src/services/transcription.ts`, `apps/web/src/services/storage.ts`, `apps/web/src/db.ts`, and their corresponding test files.
3. Remove the now-unused `generateQuestions` stub from `apps/web/src/services/llm.ts` (returns `[]`, unused after deletion) — or repurpose it for Issue 1's `generateQuizQuestion` if that's a cleaner path than adding a new function.
4. Update `docs/tech-debt.md`: close **TD-002** ("in-memory `db.ts` needs migrating") by noting it was deleted as dead code rather than migrated — since the live path never used it.
5. Update `docs/code-map.md` to remove references to the deleted modules if any exist.

**Acceptance criteria:**
- `pnpm build` and `pnpm test` pass with the files removed.
- No remaining imports of any deleted module.
- `docs/tech-debt.md` TD-002 marked resolved with a note explaining the resolution was deletion, not migration.

---

### Issue 3 — [P0] `NEXT_PUBLIC_API_SECRET_TOKEN` provides no real protection on `/api/kb/upload`

**Labels:** `P0`, `security`

**Problem:**
`apps/web/src/app/api/kb/upload/route.ts` checks `Authorization: Bearer <token>` against `process.env.NEXT_PUBLIC_API_SECRET_TOKEN`. Any env var prefixed `NEXT_PUBLIC_` is inlined into the client JavaScript bundle by Next.js at build time — `UploadForm.tsx` reads the exact same var to set the header. This means the "secret" is shipped to every browser and is trivially visible via devtools. The endpoint currently has **no actual access control**; anyone can upload arbitrary content into the shared `knowledge_base` table for any `courseId`.

**Fix:**
1. Since this route is called from the client with `fetch`, it needs either (a) a server-side session check using the existing Supabase auth already wired in `middleware.ts` / `utils/supabase/middleware.ts` — check `request.cookies` for a valid Supabase session and reject unauthenticated requests — or (b) if anonymous uploads are intentionally allowed for the demo, remove the fake-auth theater entirely and replace it with real abuse controls (the existing per-IP rate limiter pattern from `middleware.ts`, scoped to this route, plus a file-size/type check that already exists).
2. Recommend (a): require a logged-in Supabase session for `/api/kb/upload`, matching how `/lobby`, `/arena`, `/professor`, `/prompt-lab` are already protected in `middleware.ts`. Add `/api/kb/upload` to `PROTECTED_AI_ROUTES` or a new protected-routes list, and inside the route handler, verify `request` has a valid session via the Supabase server client rather than the placeholder Bearer check.
3. Remove `NEXT_PUBLIC_API_SECRET_TOKEN` from `.env.example` and `UploadForm.tsx` once replaced.

**Acceptance criteria:**
- An unauthenticated request to `/api/kb/upload` is rejected (401/redirect) the same way an unauthenticated request to `/arena` is.
- `docs/tech-debt.md` TD-003 ("API routes currently lack authentication") updated to reflect this route is now covered, and note which routes (if any) remain intentionally open (`/api/rag`, `/api/prompt-lab/restyle` — confirm these are meant to be public before leaving them unauthenticated).

---

### Issue 4 — [P1] In-memory rate limiters and event bus won't survive serverless/multi-instance deploy

**Labels:** `P1`, `infra`, `production-readiness`

**Problem:**
`vercel.json` and `Dockerfile` both exist, implying serverless/multi-instance deployment is intended. Three places use process-local in-memory state that breaks under that model:
- `apps/web/src/middleware.ts` — `rateLimitStore` (`Map`) for AI-endpoint rate limiting.
- `apps/web/src/app/api/arena/revive/route.ts` — its own separate in-memory `rateLimit` `Map`.
- `apps/web/src/engine/events.ts` — a Node `EventEmitter` explicitly commented as needing to become Redis Pub/Sub for multi-instance; used by `/api/arena/sse/route.ts`.

On Vercel serverless, each invocation can hit a cold instance, silently resetting all three — rate limits become ineffective and SSE clients on one instance never see events emitted on another.

**Fix (scope to what's needed for the demo, not a full rewrite):**
1. Confirm deployment target: if the MVP demo runs on a single long-lived instance (e.g., one Docker container, not Vercel serverless), this is lower urgency — document that constraint in `docs/runbooks/` instead of doing a full Redis migration.
2. If serverless multi-instance is required for the demo, migrate the two rate limiters to a Supabase table (simple `INSERT ... ON CONFLICT` counter, since Supabase is already the DB dependency — avoid adding a new infra dependency like Redis for the MVP).
3. Check whether `/api/arena/sse/route.ts` is even still used — `apps/web/src/app/arena/page.tsx` appears to drive real-time state via a Supabase Realtime channel (`.on('broadcast', ...)`), not this SSE route. If SSE is dead code superseded by Supabase Realtime, delete it and `engine/events.ts` together (fold into this issue's PR, verified via grep first, same caution as Issue 2).

**Acceptance criteria:**
- Either: rate limiting now backed by Supabase and verified to work across two concurrent server processes locally, OR a documented decision that single-instance deployment is the MVP target with a note in `docs/runbooks/`.
- Dead SSE path removed if confirmed unused, with `docs/code-map.md` updated.

---

### Issue 5 — [P2] Lobby invite links are fully mocked

**Labels:** `P2`, `polish`

**Problem:**
`apps/web/src/app/api/lobby/create/route.ts` generates a fake `https://discord.gg/<random>` link with a comment `// Mock Discord invite generation`. It creates no real Discord resource. For a live demo this is fine to leave mocked, but it should not be presented as a working integration.

**Fix:**
1. Decide scope for the demo: either (a) leave mocked but change the UI copy so it's clearly a "party code" for the app's own lobby system rather than implying real Discord integration, or (b) if Discord integration is actually a claimed feature, implement it via the Discord API (requires a bot token / OAuth app — flag as needing product decision + credentials before implementing).
2. Whichever is chosen, update `docs/product-context.md` and any user-facing copy to match reality so the demo doesn't overclaim.

**Acceptance criteria:**
- No UI text implies a real Discord invite exists unless real Discord API integration is implemented.

---

## Suggested execution order

1. Issue 1 (core loop — the single biggest thing that makes this feel like a working product)
2. Issue 3 (security — quick, should not ship a demo with fake auth if real users will hit it)
3. Issue 2 (cleanup — safe once Issue 1 confirms which pipeline is canonical)
4. Issue 4 (only as deep as the actual demo deployment target requires)
5. Issue 5 (cosmetic, do last or skip for MVP)

After all P0s are merged, re-run the full flow manually: sign in → upload a course PDF → start a raid in that course → confirm the quiz question reflects the uploaded content → confirm revive question still fires on wipe. That's the actual MVP acceptance test.
