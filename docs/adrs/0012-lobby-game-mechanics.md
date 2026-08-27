---
agent-notes: { ctx: "ADR for database-authoritative lobby presence and raid game mechanics", deps: ["docs/adrs/0008-boss-raid-game-state-sync.md"], state: accepted, last: "archie@2026-08-25" }
---

# ADR-0012: Authoritative Database-Backed Lobby & Game Mechanics

## Status

Accepted

## Context

Epic C introduces the real-time multiplayer Squad Lobby and Boss Raid Arena. The initial prototype performed round damage calculations client-side in the "Host" browser and broadcasted results. This introduces a major security/cheating risk and lacks persistence. If the Host player disconnects or manipulates their client, the game breaks. We need to implement database-authoritative lobby membership and raid state calculation.

## Decision

We will implement a database-authoritative architecture using Supabase PostgreSQL tables and Postgres RPC triggers, and utilize Supabase Realtime *only* for streaming state changes from the database down to all squad members.

### 1. Database Schema Design

#### `squads` Table:
Stores the live combat session for each squad.
- `id` (UUID, PK)
- `status` (VARCHAR: `'lobby' | 'active' | 'victory' | 'defeat'`)
- `boss_hp` (INTEGER)
- `boss_max_hp` (INTEGER)
- `created_at` (TIMESTAMP)

#### `squad_members` Table:
Tracks joined players and their health metrics.
- `squad_id` (UUID, FK -> squads.id, PK)
- `player_id` (VARCHAR, PK)
- `name` (VARCHAR)
- `hp` (INTEGER, Default: 100)
- `status` (VARCHAR: `'alive' | 'dead'`)

#### `squad_votes` Table:
Ephemerally tracks submitted answers during a debate round.
- `squad_id` (UUID, FK -> squads.id, PK)
- `player_id` (VARCHAR, PK)
- `round_number` (INTEGER, PK)
- `is_correct` (BOOLEAN)
- `created_at` (TIMESTAMP)

### 2. State Resolution RPC (`resolve_raid_round`)
When the 60-second timer expires or all alive players have voted, the designated Host triggers a secure Supabase RPC:
```sql
SELECT resolve_raid_round(squad_id, round_number);
```
The Postgres function executes the following on the database server:
1. Fetches all votes for the given `round_number`.
2. Computes the consensus rating (e.g. 4 correct = 100 Boss damage, <2 correct = player feedback damage).
3. Decrements `squads.boss_hp` and updates `squad_members.hp` correspondingly.
4. Updates `squads.status` to `'victory'` if Boss HP reaches 0, or `'revive'` if all players' status is `'dead'`.
5. Clears or archives votes for the next round.

### 3. Real-Time Synchronization
All clients join a Supabase Realtime channel listening to table updates:
```ts
supabase
  .channel('squad-room')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'squads' }, handleSquadUpdate)
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'squad_members' }, handleMembersUpdate)
  .subscribe();
```

---

## Consequences

### Positive

- **Full Security & Anti-Cheat:** Clients cannot modify damage numbers or vote statistics, as calculations are strictly processed in Postgres.
- **Persistence & Reconnection:** If a student's network drops, they can reconnect to the lobby/arena and immediately retrieve the current canonical state from the database.
- **Reduced Network Traffic:** Replaces rapid client broadcast loops with simple event listeners on DB change updates.

### Negative

- **Increased Postgres Write Load:** Processing rounds via database RPCs writes to disk, but since writes only occur once every 60 seconds per squad, this load is extremely light compared to continuous polling.
- **Supabase Realtime Schema Setup Required:** Requires enabling Replication on the `squads` and `squad_members` tables.

### Neutral

- **Lobby Redirection:** Redirection from lobby to arena is handled by updating `squads.status` to `'active'`, which triggers all clients' listener to navigate them to `/arena`.
