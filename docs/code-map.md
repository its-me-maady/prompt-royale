---
agent-notes:
  ctx: "codebase structural overview for humans and agents"
  deps: []
  state: canonical
  last: "sato@2026-09-01"
  key: ["UPDATE when adding packages, modules, or changing public APIs"]
---
# Code Map

Structural overview of the PromptRoyale codebase.

## Architecture at a Glance

```
[ Frontend (Next.js App Router) ]
    │
    ├── /login (Auth Page) ──────────────────► @/utils/supabase/client (Cookie-synced SSR Auth)
    ├── /arena (Raid Quiz Engine) ──────────► Supabase Realtime Broadcast / DB
    ├── /lobby (Squad Assembly) ─────────────► Supabase Realtime Presence
    ├── /professor (Professor Chat & RAG) ───► POST /api/rag / Gemini / Supabase vector
    └── /prompt-lab (Prompt Engineer) ──────► POST /api/prompt-lab/restyle / Gemini
    
[ Auth & API Endpoints ]
    ├── GET  /auth/callback ────────────────► Exchange PKCE auth code for cookie session
    ├── POST /api/kb/upload ────────────────► Gemini (Audio) / LlamaParse (Docs) ➔ Supabase KB
    ├── POST /api/arena/question ───────────► RAG Knowledge Search ➔ Gemini Grounded Quiz
    ├── POST /api/arena/resolve ────────────► Supabase RPC (resolve_raid_round)
    ├── GET  /api/arena/revive ─────────────► Boss Revive Taunt Generator
    └── middleware.ts ───────────────────────► Edge Session Auth & Supabase RateLimiter
```

## Package / Module Summaries

### `apps/web` — Next.js Application
**Purpose:** Core web application hosting the quiz arena, squad lobby, AI professor chat, auth callback, and KB ingestion.

| Module | Key Exports / Purpose | Notes |
|--------|----------------------|-------|
| `src/middleware.ts` | Next Middleware | Edge session auth validation & distributed rate limiting |
| `src/services/rateLimiter.ts` | `rateLimiter` | Supabase-backed rate limiting with fallback store |
| `src/services/llm.ts` | `llmService` | Gemini / Groq integrations for quiz, prompt restyling, & revive |
| `src/services/embedding.ts` | `embeddingApi` | Vector embedding generation for RAG |
| `src/utils/supabase/client.ts` | `createClient()` | SSR browser client with cookie session context (canonical for auth) |
| `src/utils/supabase/server.ts` | `createClient()` | Server-side Supabase client with cookie session context |
| `src/utils/supabase/middleware.ts` | `updateSession()` | SSR session refresh helper for protected routes |
| `src/lib/db/supabase-client.ts` | `supabaseClient` | Deprecated for auth (persists to localStorage only) |
| `src/app/lobby/page.tsx` | `LobbyPage` | Real-time presence squad assembly with `MIN_SQUAD_SIZE = 2` start gate & manual Join by ID input |
| `src/app/auth/callback/route.ts` | `GET` | PKCE auth code exchange route handler |
| `src/app/api/kb/upload/route.ts` | `POST` | Course material ingestion route |
| `src/app/api/arena/question/route.ts` | `POST` | Grounded quiz question generator from KB embeddings |
| `src/app/api/arena/resolve/route.ts` | `POST` | Raid round resolution triggering RPC |
| `supabase/migrations/` | `*.sql` | Authoritative versioned SQL database migrations (ADR-0010) |
| `supabase/config.toml` | Config | Supabase CLI project configuration |

## Test Inventory

| Category | Test Files | Tests | Focus Area |
|----------|-----------|-------|------------|
| API Routes | 8 | 29 | `/auth/callback`, `/api/arena/question`, `/api/kb/upload`, `/api/rag`, `/api/health`, `/api/lab`, `/api/kb-courses`, `/api/epic3` |
| App Pages | 5 | 15 | `/arena`, `/lobby` (presence, `MIN_SQUAD_SIZE` gate, & join-by-ID), `/login`, `/`, `/professor` |
| Components | 3 | 12 | `Header`, `PromptLab`, `UploadForm` |
| Services & Engine | 6 | 30 | `rateLimiter`, `llm`, `game-logic`, `kb`, `rag`, `supabase` |
| Infrastructure | 1 | 9 | Edge Auth & Rate Limiting Middleware |
