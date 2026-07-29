<!-- agent-notes: { ctx: "Sprint 1 Plan - Boss Raid MVP", deps: [], state: "active", last: "grace@2026-07-29" } -->
# Sprint 1 Plan: Boss Raid MVP

## Goals
Deliver the core Boss Raid Arena game engine and the asynchronous AI Question Bank pipeline with high visual polish and zero tolerance for logic bugs.

## Scope
- **Backend:** Setup MongoDB models, Asynchronous job queue for PDF parsing, SSE endpoints for game state.
- **Frontend:** Implement the Minimalist Focus Mode UI for the Arena, integrating the 60s timer, voting buttons, and health bars.
- **Integration:** Connect Discord API for lobby voice chat.

## V-Team Personas Engaged
- **Dani:** Must review all UI PRs to ensure Minimalist Focus Mode visual polish.
- **Tara:** Writes the TDD specs for the complex voting/damage logic before Sato implements.
- **Sato:** Primary implementer for the React UI and Node backend.
- **Pierrot:** Final review on backend validation to ensure clients cannot tamper with game state.

## Risks & Open Questions
- Discord API rate limits for generating invites on the fly.
- Ensuring SSE connections re-establish cleanly if a student's internet drops briefly.
