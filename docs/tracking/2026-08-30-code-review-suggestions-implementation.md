---
agent-notes: { ctx: "implementation tracking for code review suggestions", deps: [setup.sql, apps/web/src/app/arena/page.tsx], state: active, last: "sato@2026-08-30" }
---

# Implementation: Code Review Suggestions

**Date:** 2026-08-30
**Lead:** sato
**Status:** Complete
**Prior Phase:** None

## Key Decisions
- Chose to enable public RLS policies on squads, squad_members, and squad_votes rather than disabling RLS, because anonymous presence logic requires CRUD operations from clients, while backend calculations are safe inside SECURITY DEFINER RPCs.
- Added explicit Cache-Control: no-store headers on vote/resolve endpoints to prevent network or service-worker caching of game transactional state.
- Rendered the fetchError banner dynamically inside the main arena container, ensuring database vote errors are visible during active question answering.

## Artifacts Produced
- Modified `setup.sql` with RLS policies.
- Modified `/api/arena/vote` and `/api/arena/resolve` with Cache-Control headers.
- Added vote submission error tests to `apps/web/test/app/arena.test.tsx`.

## Open Questions
- None

## Next Phase
- None
