# Debate: Boss Raid Game State Machine

**ADR:** docs/adrs/0007-boss-raid-game-state.md
**Date:** 2026-08-04
**Participants:** Archie (author) vs Wei (challenger)

## Round 1 — Wei's Challenges

1. **The "Magic Edge Function" & The Missing Player Trap:** A serverless edge function is a poor orchestrator for a 60-second synchronized timer. It risks race conditions on invocation and hangs if a player drops connection without voting.
2. **The Thundering Herd on Postgres:** Relying on Postgres for the entire 60-second loop with frequent writes will bottleneck at scale (e.g., 10,000 concurrent raids). Write lock latency will destroy the <300ms budget.

## Round 2 — Archie's Responses

1. **Host-Client Model:** Adopted a Host-Client inversion strategy. Player 1 (the Host) tracks the timer locally and submits a single RPC call to Postgres at the end of the round. Failover to Player 2 occurs via Supabase Presence if Player 1 disconnects.
2. **Ephemeral State:** Replaced mid-round Postgres writes with Supabase Realtime Broadcast. All typing/voting is broadcast in-memory, eliminating the thundering herd. Only a single Postgres RPC call is made at the end of the 60s window.

## Round 3 — Final Word

Wei accepted the resolution but surfaced two final risks:
- **Client-Side Cheating:** A malicious Player 1 could freeze the timer locally to gain more time.
- **Failover Jitter:** Supabase Presence heartbeat timeouts mean a disconnected Host might take 2-5 seconds to be detected, causing temporary UI hangs during migration.

## Resolution

- **Resolved:** Removed the serverless edge function orchestrator, adopted a Host-Client Inversion Model. Removed mid-round database writes, utilizing Supabase Broadcast for ephemeral state.
- **Accepted risks:** Client-side timer manipulation (PvE environment makes this tolerable) and minor UI jitter during host failovers. Client-side vote spoofing (noted in Round 2).
- **ADR changes:** Completely rewrote the Synchronization Architecture section of ADR-0007 to document the Host-Client model and ephemeral state split. Added accepted risks to the Consequences section.
