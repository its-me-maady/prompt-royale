# PromptRoyale

> **Gamified AI Study & Quiz Arena** — Students form squads, debate answers together, and defeat AI bosses using their actual course knowledge.

[![CI](https://github.com/its-me-maady/prompt-royale/actions/workflows/ci.yml/badge.svg)](https://github.com/its-me-maady/prompt-royale/actions/workflows/ci.yml)

---

## What Is It?

PromptRoyale turns exam revision into a multiplayer RPG battle. A professor uploads course slides or notes; students jump into squads of 2–4, answer AI-generated quiz questions grounded in those exact materials, and work together to whittle down a taunting AI Boss's 1 000 HP before it wipes the squad.

Between raids, every student has access to:

- **AI Professor** — a RAG-powered chatbot that answers questions directly from the uploaded course material.
- **Prompt Lab** — rewrites rough study notes into polished, structured study prompts using Gemini.

---

## Features

| Feature | Description |
|---|---|
| 🔐 **Anonymous Auth** | Guest sessions via Supabase Auth — no sign-up required |
| 📚 **Course Ingestion** | Upload PDFs / notes → parsed by LlamaParse → embedded with Gemini → stored in pgvector |
| 🤖 **AI Professor** | RAG-powered course Q&A grounded in uploaded materials |
| ✍️ **Prompt Lab** | LLM prompt restyling for better study sessions |
| 🏟️ **Squad Lobby** | Real-time presence via Supabase — see teammates join live |
| ⚔️ **Boss Raid Arena** | Timed 60-second debate rounds, atomic damage resolution, revive challenges |
| 📊 **Damage System** | 4/4 correct = 100 HP boss damage; 0/4 = 30 HP team penalty |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org) (App Router) |
| UI | React 18, [Tailwind CSS](https://tailwindcss.com) |
| Database | [Supabase](https://supabase.com) (Postgres + pgvector) |
| Auth | Supabase Auth (anonymous sessions, PKCE) |
| Real-time | Supabase Realtime (WebSocket Presence & Broadcast) |
| LLM — Primary | Google Gemini API (`gemini-3.5-flash` and variants) |
| LLM — Fallback | [Groq](https://groq.com) (`llama3-8b-8192`) |
| Document Parsing | [LlamaParse](https://www.llamaindex.ai/llamaparse) |
| Deployment | [Vercel](https://vercel.com) |
| Monorepo | [Turborepo](https://turbo.build) + pnpm |

---

## Architecture Overview

```
Browser (Next.js Client)
    │
    ├── HTTPS ──► Vercel Edge Middleware  (auth + rate limiting)
    │                 │
    │           Next.js API Routes & Pages
    │                 │
    │        ┌────────┴──────────────────────┐
    │        │                               │
    │   Supabase (Postgres, Auth,        LLM APIs
    │   Realtime, pgvector)              (Gemini → Groq → static)
    │
    └── WSS ───► Supabase Realtime  (Presence & Broadcast)
```

**Boss Raid game loop:**
1. Lobby — host presses **Start Raid** → `POST /api/lobby/start` → `start_raid` Postgres RPC (atomic, validated).
2. Arena — Gemini generates a grounded MCQ from uploaded course chunks.
3. Voting — all members vote within 60 s (broadcast via Supabase Realtime).
4. Resolution — Host submits `POST /api/arena/resolve` → advisory-locked, idempotent `resolve_raid_round` RPC.
5. Repeat until Boss HP = 0 (Victory) or squad HP = 0 (Revive challenge or Defeat).

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- pnpm 9.9.0 (`npm install -g pnpm@9.9.0`)
- A [Supabase](https://supabase.com) project
- A [Google AI Studio](https://aistudio.google.com) Gemini API key

### 1. Clone & Install

```bash
git clone https://github.com/its-me-maady/prompt-royale.git
cd prompt-royale
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example apps/web/.env.local
```

Edit `apps/web/.env.local` and fill in the values:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-key

# Optional — enables professor upload endpoint auth
NEXT_PUBLIC_API_SECRET_TOKEN=your-secret-token

# Optional — LLM fallback
GROQ_API_KEY=your-groq-key

# Optional — document parsing
LLAMA_CLOUD_API_KEY=your-llamaparse-key
```

See [`docs/config-manifest.md`](docs/config-manifest.md) for the full variable reference including which are required vs. have runtime fallbacks.

### 3. Apply Database Migrations

```bash
# Using Supabase CLI (requires SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_ID)
supabase db push

# Or link and push interactively
supabase link --project-ref <your-project-ref>
supabase db push
```

### 4. Run

```bash
pnpm dev        # development server at http://localhost:3000
pnpm build      # production build
pnpm test       # run test suite (Vitest)
pnpm run lint   # lint all packages
```

### Devcontainer (Recommended)

This repo ships a `.devcontainer` pre-configured with Node.js 22, pnpm, Docker, and the Supabase CLI.

1. Open in VS Code.
2. When prompted, click **"Reopen in Container"** (or `F1` → `Dev Containers: Reopen in Container`).
3. `pnpm install` runs automatically. All extensions (ESLint, Prettier, Tailwind) are pre-installed.

---

## Project Structure

```
prompt-royale/
├── apps/web/                  # Next.js 14 application
│   ├── src/app/               # App Router pages & API routes
│   │   ├── arena/             # Boss Raid Arena
│   │   ├── lobby/             # Squad Lobby
│   │   ├── professor/         # AI Professor chat
│   │   ├── prompt-lab/        # Prompt restyling tool
│   │   ├── login/             # Anonymous sign-in
│   │   └── api/               # Server API routes
│   ├── src/engine/            # Pure game logic (damage calc, RAG)
│   ├── src/services/          # LLM orchestration, embeddings, rate limiter
│   ├── src/components/        # Shared React components
│   └── test/                  # Vitest test suites (100 tests, 23 files)
├── supabase/
│   └── migrations/            # Versioned SQL migrations (ADR-0010)
├── docs/                      # ADRs, plans, threat model, tech debt
└── .github/workflows/         # CI (lint + test + migration check)
```

---

## API Routes

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Liveness probe |
| `POST` | `/api/kb/upload` | Upload & embed course material |
| `GET` | `/api/kb/courses` | List available course IDs |
| `POST` | `/api/lab/chat` | AI Professor RAG chat |
| `POST` | `/api/prompt-lab/restyle` | Prompt restyling |
| `POST` | `/api/lobby/start` | Atomically start a raid |
| `POST` | `/api/arena/question` | Generate a grounded quiz question |
| `POST` | `/api/arena/resolve` | Resolve a raid round |
| `GET` | `/api/arena/revive` | Generate a revive challenge |

---

## Documentation

| Doc | Description |
|---|---|
| [`docs/code-map.md`](docs/code-map.md) | Package structure & public API overview |
| [`docs/threat-model.md`](docs/threat-model.md) | STRIDE threat model & trust boundaries |
| [`docs/config-manifest.md`](docs/config-manifest.md) | Environment variable reference |
| [`docs/tech-debt.md`](docs/tech-debt.md) | Known tech debt register |
| [`docs/adrs/`](docs/adrs/) | Architecture Decision Records |
| [`docs/tracking/`](docs/tracking/) | Implementation tracking documents |
| [`docs/runbooks/`](docs/runbooks/) | Production deployment runbook |

---

## Contributing

1. Fork the repo and create a feature branch: `git checkout -b feat/your-feature`.
2. Write tests first (Vitest) — TDD is the team default.
3. Ensure `pnpm test` and `pnpm run lint` both pass with 0 errors.
4. Open a pull request targeting `main`.

---

## License

This project is for educational purposes.
