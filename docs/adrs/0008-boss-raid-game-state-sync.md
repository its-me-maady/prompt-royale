---
agent-notes: { ctx: "Boss Raid Game State Sync Decision", deps: [], state: active, last: "archie@2026-08-07" }
---

# ADR-0008: Boss Raid Game State Machine & Real-Time Sync

## Status

Accepted (with Mitigations)

## Context

We are building a Next.js/Supabase application that features a "Boss Raid" mode. This mode requires a 60-second game loop state to be synchronized in real-time across all connected squad members to handle voting and damage calculation. We need to decide on the architecture for broadcasting this rapid state evolution from the server to the clients.

## Options

1. **Supabase Realtime (WebSockets)**: Utilizing the built-in Supabase Realtime functionality to broadcast game state updates and manage squad presence over WebSockets.
2. **Next.js Server-Sent Events (SSE)**: Implementing custom SSE API routes in Next.js to stream unidirectional state updates to clients.
3. **Custom WebSocket Server**: Deploying a standalone Node.js/Socket.io server specifically for managing the game loop and client connections.

## Evaluation Criteria

- **Performance**: Ability to deliver low-latency state updates within a 60-second intensive loop.
- **Maintainability**: Effort required to manage the infrastructure and integrate with existing systems.
- **Operational Complexity**: How hard it is to run this in production, especially given Next.js serverless constraints.
- **Cost**: Hosting and scaling expenses.

## Decision

We will proceed with **Supabase Realtime (WebSockets) via Database Changes**. 

To mitigate the split-brain and source-of-truth issues raised during the architecture debate, we will NOT use Supabase Broadcast for authoritative game state. Instead:
- Clients will send standard API requests (or Supabase RPC calls) to deal damage authoritatively, relying on the database as the single source of truth.
- We will use Supabase Realtime *only* to listen to `UPDATE` events on the Boss Health record, streaming these authorized changes down to all connected clients.
- We accept the 500 concurrent connection limit (Supabase Pro tier) as an acceptable scaling ceiling for the MVP.

## Consequences

### Positive

- **Authoritative State**: Damage calculations are safely arbitrated by the database/RPC functions, preventing client hacking.
- **Low Operational Complexity**: No need to manage a separate Redis instance or standalone WebSocket server.
- **Native Features**: We gain access to Supabase Realtime for pushing updates natively.

### Negative

- **Vendor Lock-in**: Deepens our architectural dependency on Supabase's specific Realtime API and limits our ability to easily migrate the backend to another provider.
- **Connection Limits**: Persistent WebSocket connections could count against Supabase tier connection limits during high concurrent usage, capping our MVP scale at 500 simultaneous players.

### Neutral

- **Database Write Load**: Relies on Postgres to handle the write load of rapid damage events, which may require database tuning or batched writes if the concurrency approaches the upper limits.
