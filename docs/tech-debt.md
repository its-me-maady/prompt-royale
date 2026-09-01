---
agent-notes: { ctx: "Technical debt tracking register", deps: [AGENTS.md], state: active, last: "sato@2026-09-01" }
---

# Technical Debt Register

| ID | Topic | Description | Priority / Status | Sprint Added |
|---|---|---|---|---|
| TD-001 | LLM Mocks | The LLM API calls are completely mocked. We need to implement the real OpenAI/Gemini bindings. | High / Pending | Sprint 1 |
| TD-002 | DB Persistence | In-memory `db.ts` and dead job pipeline retired and deleted; live upload path operates via Supabase `knowledge_base` table. | Resolved | Sprint 1 |
| TD-003 | Auth | /api/kb/upload and core application routes protected via Supabase session authentication. Intentional public routes (/api/rag, /api/prompt-lab/restyle) left unauthenticated for public study access. | Resolved | Sprint 1 |

