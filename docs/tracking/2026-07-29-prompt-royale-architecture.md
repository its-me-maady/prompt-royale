# Architecture Phase Tracking
**Date:** 2026-07-29
**Topic:** PromptRoyale Core Platform
**Prior Phase:** docs/tracking/2026-07-29-prompt-royale-discovery.md

## Architecture
- **Frontend:** Next.js (React) / Tailwind CSS (Turborepo)
- **Backend:** Node.js / Express
- **Database:** MongoDB
- **AI Engine:** Gemini / OpenAI API

## Key Decisions & ADRs
- **ADR 0002:** Asynchronous AI Pipeline for parsing PDFs.
- **ADR 0003:** Server-Sent Events (SSE) for sub-300ms game state sync.

## Threat Surface
- Game state tampering (mitigated by enforcing all damage logic on the backend).
- AI endpoint DoS (mitigated by rate limiting and background queues).
- Prompt injection in Prompt Lab.

## Debate Outcomes
- Added mandatory Job Status polling for the async pipeline to prevent silent failures.
- Switched from WebSockets to SSE for simpler real-time state synchronization.
