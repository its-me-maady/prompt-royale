---
agent-notes: { ctx: "Technical debt tracking register", deps: [AGENTS.md], state: active, last: "sato@2026-09-01" }
---

# Technical Debt Register

| ID | Topic | Description | Priority / Status | Sprint Added |
|---|---|---|---|---|
| TD-001 | LLM Mocks | The LLM API calls are completely mocked. We need to implement the real OpenAI/Gemini bindings. | High / Pending | Sprint 1 |
| TD-002 | DB Persistence | In-memory `db.ts` and dead job pipeline retired and deleted; live upload path operates via Supabase `knowledge_base` table. | Resolved | Sprint 1 |
| TD-003 | Auth & Session Persistence | Standardized on `@supabase/ssr` cookies across client (`@/utils/supabase/client`), server (`@/utils/supabase/server`), and middleware (`updateSession`). `@/lib/db/supabase-client` marked deprecated for auth as it persists session to `localStorage` only. PKCE email callback handler created at `/auth/callback`. | Resolved | Sprint 1 |
| TD-004 | Router Cache Staleness | Middleware redirects use `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate` and `Header.tsx` protected nav links set `prefetch={false}` to prevent Next.js Router Cache from serving pre-login 307 redirects post-login. | Resolved | Sprint 1 |
| TD-005 | DB Migration Pipeline | Implemented ADR-0010 automated Supabase migration pipeline under `supabase/migrations/20260901000000_initial_schema.sql` and `supabase/config.toml`, with CI syntax linting (`ci.yml`) and deploy pushing (`deploy-production.yml`). `setup.sql` annotated as manual reference fallback. | Resolved (Requires manual secret setup in GitHub Actions settings: `SUPABASE_ACCESS_TOKEN` & `SUPABASE_PROJECT_ID`) | Sprint 1 |
| TD-006 | Lobby Host Selection | Presence channel sync tracks `isCreator: true` payload to elect the actual lobby creator as host (regardless of alphabetical `playerId` order). Falls back to alphabetical sort if original creator disconnects. | Resolved (Client-asserted `isCreator` in presence payload; non-adversarial trusted group scope) | Sprint 1 |
| TD-007 | Realtime Event Filter Mismatch | Supabase `postgres_changes` subscriptions targeting newly created database rows must use `event: '*'` (or include `INSERT`), because `event: 'UPDATE'` listeners ignore row creations. Handlers must include a navigation boolean ref guard to prevent redundant redirects on multiple events. | Resolved (Lobby listener updated to `event: '*'` with `hasNavigatedRef` guard) | Sprint 1 |
| TD-008 | Boss Raid Arena Race Conditions | Resolved three raid flow race conditions: added atomic server-side `start_raid` RPC (validating ≥2 members and inserting `squads` + `squad_members` in a single transaction), added advisory locking (`pg_advisory_xact_lock`) and `last_resolved_round` idempotency guards to `resolve_raid_round`, and ref-mirrored `host_player_id` state in `apps/web/src/app/arena/page.tsx` so database host status overrides alphabetical presence ordering. Dropped public INSERT policies on `squads` and `squad_members`. | Resolved (Migration `20260916000000_fix_raid_race_conditions.sql`) | Sprint 1 |

