# Handoff Report — Explorer Survey 2

**Agent:** Architecture & Test Explorer 2  
**Working Directory:** `/home/maady/learning/prompt-royale/.agents/explorer_survey_2`  
**Target Project:** `/home/maady/teamwork_projects/prompt_royale`  
**Date:** 2026-07-29  

---

## 1. Observation

* **Target Directory Inspection:**
  * Exact Path: `/home/maady/teamwork_projects/prompt_royale`
  * Contents: Only 1 file exists: `ORIGINAL_REQUEST.md` (2,318 bytes).
  * Build/Test Runner Configuration: No existing `package.json`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`, or React components exist in the target directory.
* **Original Request Specifications (`ORIGINAL_REQUEST.md`):**
  * **R1 (Core Game Loop):** 4-player team battle simulation in single browser window. Boss HP = 1000, 4 Players HP = 100 each, 60-second timer, multiple-choice voting.
  * **R1 Damage Rules:**
    * 4/4 correct: 100 damage to Boss, 0 to players.
    * 3/4 correct: 60 damage to Boss, 25 recoil damage to 1 wrong player.
    * 2/4 correct: 25 damage to Boss, 25 recoil damage to 2 wrong players.
    * 0/4 correct: 30 damage to all 4 players.
  * **R2 (Prompt Lab & AI Game Master):** Simulated Prompt Lab with text input ("restyle notes"), simulated PDF upload button, processing state transition to Boss Raid Arena.
  * **R3 (Knockout Mechanics):** Player reaching 0 HP has voting buttons disabled for subsequent questions.
  * **Acceptance Criteria:** Automated test suite verifying 4/4, 3/4, 2/4, 0/4 damage rules, UI rendering, Prompt Lab transition, and knockout button disabling.

---

## 2. Logic Chain

1. **Observation:** The target directory `/home/maady/teamwork_projects/prompt_royale` is currently uninitialized (contains only `ORIGINAL_REQUEST.md`).
2. **Step 1:** To fulfill R1, R2, and R3 with automated test coverage, a modern, lightweight React + TypeScript build system is required. Vite + Vitest + React Testing Library provides native ESM speed, zero-config TypeScript support, and fast headless DOM testing with `jsdom`.
3. **Step 2:** The scoring rules in R1 require deterministic mathematical transformations (Boss HP reductions, recoil damage allocations). Placing this logic inside React components directly makes automated testing slower and more complex.
4. **Step 3:** Therefore, separating the core state logic into a pure function (`resolveTurnScoring`) and state reducer (`gameReducer`) enables instantaneous, 100% reliable unit test coverage for all acceptance criteria (4/4, 3/4, 2/4, 0/4 correct votes).
5. **Step 4:** UI components (`PromptLab` and `BossRaidArena`) wrap the pure reducer state via React Context, and can be verified using React Testing Library (`@testing-library/react`) for user actions (entering text, clicking PDF upload, clicking option buttons) and button disabled states (`toBeDisabled()`).

---

## 3. Caveats

* **Uninitialized Target Codebase:** The target repository `/home/maady/teamwork_projects/prompt_royale` does not yet have NPM packages installed or source code present. The recommended architecture must be scaffolded before running tests.
* **1/4 Correct Edge Case:** `ORIGINAL_REQUEST.md` explicitly specifies rules for 4/4, 3/4, 2/4, and 0/4 correct votes. For 1/4 correct, our scoring logic defaults to 0 damage to Boss and 25 recoil damage to incorrect players (or 30 to all).
* **Single Window Simulation:** The 4-player multiplayer is a single-window simulation (4 local player button groups on one screen), avoiding external WebSocket/backend requirements.

---

## 4. Conclusion

* **Build & Runner Architecture:** Recommend scaffolding Vite + React + TypeScript + Vitest + React Testing Library.
* **State Management Architecture:** Recommend a React Context + `useReducer` pattern with a pure scoring function (`resolveTurnScoring`) to decouple damage calculation logic from component rendering.
* **Testing Integration:** Vitest + React Testing Library is ideal for programmatically testing all acceptance criteria:
  * Pure unit tests for R1 scoring rules (4/4, 3/4, 2/4, 0/4).
  * Component tests for R2 Prompt Lab transition to Boss Raid Arena.
  * Component/State tests for R3 knockout button disabling (`toBeDisabled()`).
* **Detailed Blueprint:** Delivered in `/home/maady/learning/prompt-royale/.agents/explorer_survey_2/analysis.md`.

---

## 5. Verification Method

1. **Inspect Analysis File:**
   ```bash
   cat /home/maady/learning/prompt-royale/.agents/explorer_survey_2/analysis.md
   ```
2. **Verify Target Directory:**
   ```bash
   ls -la /home/maady/teamwork_projects/prompt_royale
   ```
3. **Future Implementation Verification:**
   Once the project is scaffolded according to `analysis.md`, automated tests can be verified using:
   ```bash
   cd /home/maady/teamwork_projects/prompt_royale
   npm test
   ```
