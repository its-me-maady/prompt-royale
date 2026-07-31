---
agent-notes: { ctx: "ADR deprecating Next.js SSE for Supabase Realtime", deps: [docs/adrs/0003-game-state-sync.md], state: active, last: "archie@2026-07-31" }
---
# ADR 0006: Migrate Boss Raid Sync to Supabase Realtime

## Context
ADR 0003 previously established Next.js Server-Sent Events (SSE) for the 60-second Boss Raid game state loop. However, since ADR 0004 adopts Supabase for the Knowledge Base and vector storage, we have access to Supabase's real-time capabilities.

## Decision
**Deprecate Next.js SSE (ADR 0003) and migrate to Supabase Realtime (Broadcast and Presence).**
- **Broadcast:** Used to emit ephemeral state changes (votes cast, damage dealt, knockout triggers) to all 4 squad members with <100ms latency.
- **Presence:** Used to track which squad members are currently online and in the lobby/battle.

## Rationale
- **Wei's Challenge:** Supabase Realtime has concurrent connection limits. What happens if multiple 500-student lecture halls play at once?
- **Archie's Response:** Supabase Pro tier allows for massive concurrent connections. More importantly, building a robust, distributed SSE system in serverless Next.js is notoriously difficult (due to Vercel connection timeouts). Supabase Realtime handles the WebSocket infrastructure for us natively.

## Consequences
- Replaces the need for custom Node.js/Next.js API routes for state broadcasting.
- Ties our real-time architecture tightly to the Supabase ecosystem.
- Client applications will subscribe to Supabase channels based on their `squad_id`.
