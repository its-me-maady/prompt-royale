---
agent-notes: { ctx: "Technical debt tracking register", deps: [AGENTS.md], state: active, last: "sato@2026-09-01" }
---

# Technical Debt Register

| ID | Topic | Description | Priority / Status | Sprint Added |
|---|---|---|---|---|
| TD-001 | LLM Mocks | The LLM API calls are completely mocked. We need to implement the real OpenAI/Gemini bindings. | High / Pending | Sprint 1 |
| TD-002 | DB Persistence | In-memory `db.ts` and dead job pipeline retired and deleted; live upload path operates via Supabase `knowledge_base` table. | Resolved | Sprint 1 |
| TD-003 | Auth & Session Persistence | Standardized on `@supabase/ssr` cookies across client (`@/utils/supabase/client`), server (`@/utils/supabase/server`), and middleware (`updateSession`). `@/lib/db/supabase-client` marked deprecated for auth as it persists session to `localStorage` only. PKCE email callback handler created at `/auth/callback`. | Resolved | Sprint 1 |

