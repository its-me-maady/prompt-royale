<!-- agent-notes: { ctx: "Debate tracking for async AI and Game State", deps: [], state: "active", last: "archie@2026-07-29" } -->
# Architectural Debates
**Date:** 2026-07-29
**Topic:** PromptRoyale Core Platform

## Debate 1: AI Question Bank Asynchronous Pipeline (ADR 0002)
- **Archie's Proposal:** Offload PDF parsing and MCQ generation to an asynchronous worker queue (e.g., BullMQ) storing results in MongoDB to ensure the UI isn't blocked.
- **Wei's Challenge (Cost of Being Wrong):** "Running full PDF parsing async requires us to manage a separate worker process or rely on expensive serverless compute for long-running tasks. If the background job fails silently, the students are stuck waiting forever with no feedback."
- **Archie's Response:** We will implement explicit job status tracking (Pending, Processing, Failed, Complete) in MongoDB. The client will poll the job status and display an error immediately if it fails. We'll use a simple background job library rather than a complex distributed queue for the MVP.
- **Outcome:** Archie's approach accepted with the mandatory addition of robust job status polling and failure surfacing in the UI.

## Debate 2: Game State Synchronization (ADR 0003)
- **Archie's Proposal:** Use WebSockets (Socket.io) for real-time multiplayer synchronization of votes and Boss HP since it provides the < 300ms latency we need.
- **Wei's Challenge (Alternative Technology / Simplicity):** "You just said we cut native chat to avoid WebRTC/WebSocket complexity. Why introduce WebSockets just to tally 4 votes every 60 seconds? We can use HTTP long-polling or Server-Sent Events (SSE) which are vastly simpler to scale and require less stateful infrastructure."
- **Archie's Response:** Long-polling could struggle with the < 300ms strict requirement if requests drift. However, Server-Sent Events (SSE) is unidirectional (Server to Client) and perfect for broadcasting Boss HP updates, while votes can just be standard HTTP POST requests. SSE is much simpler than WebSockets and doesn't require a stateful load balancer.
- **Outcome:** Proposal amended. We will use HTTP POST for votes and Server-Sent Events (SSE) for broadcasting game state updates to hit the latency targets without WebSocket overhead.
