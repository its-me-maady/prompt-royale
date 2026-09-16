---
agent-notes: { ctx: "implementation tracking for boss raid race condition fixes and atomic start_raid RPC", deps: ["apps/web/src/app/api/lobby/start/route.ts", "apps/web/src/app/lobby/page.tsx", "apps/web/src/app/arena/page.tsx", "supabase/migrations/20260916000000_fix_raid_race_conditions.sql"], state: complete, last: "sato@2026-09-16" }
---

# Implementation: Boss Raid Arena Race Condition Fixes

**Date:** 2026-09-16  
**Lead:** sato  
**Status:** Complete  
**Prior Phase:** [TD-006 & TD-007 Resolution](file:///home/maady/learning/prompt-royale/docs/tech-debt.md)

## Key Decisions

1. **Atomic Server-Side `start_raid` RPC:** Replaced client-side multi-table inserts with a single Postgres transaction running as `SECURITY DEFINER`. This guarantees that `squads` and `squad_members` are inserted atomically or rolled back completely, with strict server-side validation on minimum squad size (≥ 2 members) and host existence.
2. **Transaction-Scoped Advisory Locking in `resolve_raid_round`:** Implemented `PERFORM pg_advisory_xact_lock(hashtextextended(target_squad_id::text, 0))` as the first statement in `resolve_raid_round` to serialize concurrent resolution RPC calls for the same squad.
3. **Idempotency Guard via `last_resolved_round`:** Added `last_resolved_round` column to `squads`. `resolve_raid_round` checks `squads.last_resolved_round >= current_round` and returns the existing game state immediately without reapplying boss or player damage if the round has already been resolved.
4. **Ref-Mirrored `host_player_id` Presence Override:** Added `host_player_id` column to `squads` and synchronized it to a React state and ref in `apps/web/src/app/arena/page.tsx`. Arena presence sync elects the database-recorded `host_player_id` as host over raw alphabetical socket ID order, preventing host desync between lobby and arena without causing channel resubscription loops.
5. **RLS Hardening:** Dropped public INSERT policies on `squads` and `squad_members` tables, routing all creations through server-side authenticated RPCs.

## Artifacts Produced

- **Database Migration:** `supabase/migrations/20260916000000_fix_raid_race_conditions.sql`
- **API Route:** `apps/web/src/app/api/lobby/start/route.ts`
- **Frontend Pages Updated:** `apps/web/src/app/lobby/page.tsx`, `apps/web/src/app/arena/page.tsx`
- **Unit & Integration Tests:** `apps/web/test/api/lobby-start.test.ts`, `apps/web/test/app/lobby.test.tsx`, `apps/web/test/app/arena.test.tsx`
- **Documentation:** `docs/tech-debt.md`, `docs/code-map.md`

## Open Questions

- None

## Next Phase

- Production deployment and real-time multiplayer stress testing under high network jitter.
