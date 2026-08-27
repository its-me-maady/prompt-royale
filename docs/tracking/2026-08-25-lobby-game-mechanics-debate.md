---
agent-notes: { ctx: "Architecture debate on vote write scalability and client trust for Boss Raid", deps: ["docs/adrs/0012-lobby-game-mechanics.md"], state: active, last: "wei@2026-08-25" }
---

# Architecture Debate: Vote Write Scalability vs. Client Trust

**Date:** August 25, 2026  
**Participants:** Wei (Devil's Advocate), Archie (Architect), Ines (DevOps)

---

### The Challenge (Wei)
If 1,000 concurrent squads are raiding simultaneously, up to 4,000 players are submitting answers/votes in 60-second intervals.
- If every player inserts their vote directly to the database via `squad_votes` table, we have **4,000 database writes** per minute.
- At the end of the timer, 1,000 Hosts execute the `resolve_raid_round` RPC, triggering another **1,000 write transactions** (updating HP, deleting votes).
- This creates structured spike patterns (writes clustered at round boundaries), which can exhaust the transaction pool (pgBouncer) or trigger disk I/O bottlenecks in standard Supabase tiers.

---

### Alternative Options Considered

#### Option A: Ephemeral Broadcast + Host Submission (Low Write Load, Low Trust)
- Players broadcast their votes over Supabase Broadcast (in-memory, 0 writes).
- At the end of the round, the Host collects the votes and sends a single API request containing the final round results.
- **Write load:** Exactly 1 write per round per squad (1,000 writes/min).
- **Cons (Wei):** High vulnerability to cheating. A malicious client running as Host can easily send fake damage data.

#### Option B: Direct Vote Inserts + RPC Garbage Collection (High Write Load, High Trust)
- Each player inserts their vote securely to `squad_votes` using RLS policies (`auth.uid() = player_id`).
- The Host runs `resolve_raid_round` RPC which queries the table, calculates damage, updates state, and purges the round's votes.
- **Write load:** 5 writes per round per squad (5,000 writes/min).
- **Mitigation (Ines):** Since 5,000 writes/min is only ~83 writes/sec, PostgreSQL handles this effortlessly. We index `squad_votes` on `(squad_id, player_id, round_number)` for fast O(1) inserts, and use pgBouncer transaction pooling.

---

### Consensus Decision
We will standardize on **Option B (Direct Database Inserts + RPC Purge)**. Security and trust are paramount for a gamified leaderboard experience. The write load of 83 operations/sec is well within the capabilities of Postgres, and transaction pooling fully mitigates connection exhaustion.
