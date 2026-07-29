# Project Plan & Architecture — PromptRoyale

## Architecture & System Overview
PromptRoyale is structured as a single-page React web application simulating a 4-player cooperative Boss Raid Arena fed by a simulated AI Prompt Lab.

- **Frontend Tech Stack**: React 18, TypeScript 5.5, Vite 5.4, Vitest 2.0, React Testing Library (`@testing-library/react`), `jsdom`.
- **State Architecture**:
  - `gameEngine.ts`: Pure functional core (`resolveTurnScoring`) handling active player accuracy ratio damage matrix and player knockout state calculation.
  - `GameContext.tsx`: React Context + Reducer pattern managing global game state (`PROMPT_LAB` -> `LOADING` -> `ARENA` -> `VICTORY`/`GAME_OVER`).
- **UI Architecture**:
  - `PromptLab.tsx`: Interactive form with prompt textarea ("restyle notes"), mock PDF upload button, submit action to trigger simulated AI processing and arena entry.
  - `BossArena.tsx`: Multiplayer raid view featuring Boss HP gauge (1000 max), 4 Player panels (100 HP max each) with voting controls, and 60s round timer.
  - `PlayerCard.tsx`: Individual player status & voting buttons (programmatically disabled when HP <= 0).

## Feature Inventory
| # | Feature | Description | Requirement | Milestone | Status |
|---|---------|-------------|-------------|-----------|--------|
| 1 | Project Scaffolding & Config | Setup Vite + React + TypeScript + Vitest + RTL in `/home/maady/teamwork_projects/prompt_royale` | R1-R3 Setup | M1 | DONE |
| 2 | Pure Game Logic & Damage Engine | Pure scoring function (`resolveTurnScoring`) for 4/4 (100/0), 3/4 (60/25), 2/4 (25/25), 0/4 (0/30) damage & active player ratio scaling | R1, AC 28-31 | M1 | DONE |
| 3 | Prompt Lab UI & Transition | Prompt input, PDF upload mock button, simulated AI loading, transition to Arena | R2, AC 36 | M2 | DONE |
| 4 | Boss Raid Arena UI & Knockout | Boss HP bar (1000), 4 player HP bars (100), 60s timer, voting controls, knockout button disabling | R1, R3, AC 34, 35 | M2 | DONE |
| 5 | Automated Unit & Component Tests | Vitest + RTL test suite for damage rules, Prompt Lab transition, knockout button disabling | AC 28-36 | M3 | DONE |
| 6 | E2E Testing Track & Forensic Audit | Dual track requirement test suite, adversarial coverage hardening, clean forensic audit | AC 28-36 | M4 | DONE |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Project Setup & Core Logic Engine | Vite + React + TS setup, `gameEngine.ts` pure scoring & knockout rules | Survey | DONE |
| M2 | UI Components & Prompt Lab Flow | `PromptLab`, `BossArena`, `PlayerCard`, `BossCard`, `GameContext` integration | M1 | DONE |
| M3 | Automated Unit & Component Test Suite | `gameEngine.test.ts`, `PromptLab.test.tsx`, `Arena.test.tsx`, `empirical_challenger.test.tsx` | M2 | DONE |
| M4 | Dual-Track E2E & Forensic Audit Gate | Requirements-driven test suite, Tier 1-5 testing, forensic integrity audit | M3 | DONE |

## Interface Contracts & Data Structures
```typescript
export interface PlayerState {
  id: number; // 1..4
  name: string;
  hp: number; // 0..100
  isKnockedOut: boolean;
  selectedOption: string | null;
}

export interface BossState {
  id: string; // 'boss_1'
  name: string; // 'AI Knowledge Overlord'
  hp: number; // 0..1000
  maxHp: number; // 1000
}

export interface TurnScoringResult {
  bossDamage: number;
  playerRecoilDamage: number;
  incorrectPlayerIds: number[];
  updatedBossHp: number;
  updatedPlayers: PlayerState[];
}

export type GamePhase = 'PROMPT_LAB' | 'LOADING' | 'ARENA' | 'VICTORY' | 'GAME_OVER';
```

## Code Layout (Verified)
- Target Root: `/home/maady/teamwork_projects/prompt_royale`
- Configs: `package.json`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`, `index.html`
- Source Code:
  - `src/types/game.ts`
  - `src/logic/gameEngine.ts`
  - `src/context/GameContext.tsx`
  - `src/components/PromptLab.tsx`
  - `src/components/BossArena.tsx`
  - `src/components/PlayerCard.tsx`
  - `src/components/BossCard.tsx`
  - `src/components/Timer.tsx`
  - `src/App.tsx`
  - `src/main.tsx`
  - `src/setupTests.ts`
- Test Files:
  - `src/__tests__/gameEngine.test.ts`
  - `src/__tests__/e2e_requirements.test.tsx`
  - `src/__tests__/empirical_challenger.test.tsx`
- Published Test Strategy & Report: `TEST_READY.md`
