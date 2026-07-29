<!-- agent-notes: { ctx: "Project test strategy", deps: [], state: "active", last: "tara@2026-07-29" } -->
# Test Strategy

## Overview
Quality is our non-negotiable. The test suite must provide absolute confidence in the game engine's logic.

## Levels of Testing
1. **Unit Tests (Vitest):**
   - **Target:** Core Game Engine (`calculateDamage()`, `tallyVotes()`).
   - **Coverage:** 100% path coverage required for all math and state transitions.
2. **Integration Tests (Vitest / Supertest):**
   - **Target:** Asynchronous AI Pipeline.
   - **Goal:** Verify that a PDF upload successfully creates a pending job, and that the worker updates the status to complete.
3. **E2E Tests (Playwright - Future):**
   - **Target:** Critical user flows (Lobby -> Arena -> Defeat Boss).

## Test Data Approach
- Use mocked LLM responses for all automated tests to prevent brittle tests and API costs.
- Define a standard "Mock Question Bank" JSON fixture for testing the Boss Raid Arena.
