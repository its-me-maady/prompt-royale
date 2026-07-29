<!-- agent-notes: { ctx: "ADR for game state synchronization", deps: [], state: "active", last: "archie@2026-07-29" } -->
# ADR 0003: Game State Synchronization

## Context
During a Boss Raid, 4 players need to see each other's votes and the Boss's HP update in real-time. We have a strict < 300ms latency budget for state updates.

## Decision
We will use standard HTTP POST requests for players to submit votes, and Server-Sent Events (SSE) to broadcast the updated game state (Boss HP, Player HP, Vote Tallies) from the Node.js server back to the clients.

## Rationale
- **Simplicity over WebSockets:** WebSockets require managing stateful connections and complex load balancing. Since communication is mostly unidirectional (Server broadcasting state changes to 4 clients), SSE is vastly simpler to implement and scales over standard HTTP infrastructure.
- **Speed:** SSE provides the low-latency, real-time push capability required to hit our < 300ms budget.

## Consequences
- The client must maintain an open SSE connection during the match.
- If a client disconnects, they must fetch the current state via a standard GET request upon reconnecting before re-establishing the SSE stream.
