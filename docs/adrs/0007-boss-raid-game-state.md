---
agent-notes: { ctx: "ADR for Boss Raid game state machine schema and real-time sync method", deps: [docs/adrs/0006-supabase-realtime-sync.md, docs/plans/2026-07-31-epic-c-boss-raid-plan.md], state: proposed, last: "archie@2026-08-04" }
---

# ADR-0007: Boss Raid Game State Machine and Synchronization

## Status

Proposed (Supersedes ADR-0003; Builds upon ADR-0006)

## Context

Epic C introduces the Boss Raid Arena, requiring an asymmetric 4v1 battle with a strict 60-second debate loop. We need to define the state transitions for this loop and solve the synchronization challenge. Our constraints require using Supabase, maintaining visual polish (no UI lag), and handling edge cases like network drops or 10,000 concurrent active raids without causing a Postgres "thundering herd" bottleneck.

## Decision

We will implement a **Host-Client Inversion Model** using Supabase Realtime for ephemeral state and Supabase Postgres RPCs strictly for canonical outcome validation.

### Synchronization Architecture
To avoid overwhelming Postgres with thousands of concurrent, synchronized write spikes, we separate the state into two layers:
1. **Ephemeral State (Supabase Broadcast & Presence):** All mid-round activity (typing, voting, current 60s timer) is broadcast in-memory. Zero DB writes occur during the 60-second loop.
2. **Canonical State (Postgres):** A single Postgres RPC call is made at the end of the 60 seconds to resolve the damage and update HP.

### The Host-Client Model
To solve the "missing player" trap and edge function race conditions:
- **Host Designation:** Player 1 in the lobby is designated the "Host" via Supabase Presence. 
- **The Timer:** When the round starts, Postgres sets a `deadline_at` timestamp. The Host's client tracks this 60s countdown locally.
- **Resolution:** When 4 votes are broadcasted OR the `deadline_at` is reached, the Host submits a single RPC call `resolve_round(squad_id, gathered_votes)`. The Postgres function validates that the caller is the Host and applies the damage.
- **Failover:** If the Host disconnects, Supabase Presence alerts the squad, Player 2 is instantly promoted to Host, and Player 2 assumes responsibility for submitting the `resolve_round` call.

### State Machine Schema
1. `LOBBY`: Waiting for 4 players (Tracking via Supabase Presence).
2. `BATTLE`: `deadline_at` set. 60-second debate active. Votes shared via Supabase Broadcast.
3. `CALCULATION`: Triggered exclusively by the Host's RPC call. Server validates votes and calculates damage consensus (4/4 = max damage, <2/4 = team recoil). Returns updated HP.
4. `KNOCKOUT / REVIVE`: If squad HP reaches 0, squad enters `REVIVE` (AI question). 
5. `RESOLVED`: Boss HP reaches 0 -> Victory.

## Consequences

### Positive
- **Scale:** By eliminating mid-round database writes, Postgres write load is reduced by >90%. It easily scales to 10,000+ concurrent squads.
- **Resilience:** The Host-Failover mechanism gracefully handles disconnected clients without hanging the 60-second loop.
- **Latency:** Supabase Broadcast handles the UI updates instantly (<50ms), ensuring the visual polish and responsiveness mandates are met.

### Negative
- **Client Trust:** We rely on the Host client to submit the accurate votes. While Postgres validates the timestamp, a maliciously modified Host client could theoretically alter peers' broadcasted votes before submission. (Acceptable risk for this MVP phase, can be mitigated later with cryptographic vote signing).
- **Client-Side Timer Manipulation:** A malicious host could freeze the local timer to give their team more time. Since this is a PvE game, this cheating risk is accepted for the initial implementation.
- **Failover Jitter:** Peer-to-peer host migration via Supabase Presence takes a few seconds to detect a drop (heartbeat timeout). This may result in a temporary UI hang for the remaining squad members during migration.
- **Complexity:** The Host promotion and failover logic introduces complex client-side state management compared to a purely server-driven loop.
