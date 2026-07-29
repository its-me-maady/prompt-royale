# Technical Architecture & Test Strategy Analysis

**Agent:** Architecture & Test Explorer 2  
**Date:** 2026-07-29  
**Target Project:** `/home/maady/teamwork_projects/prompt_royale`  

---

## Executive Summary

This report provides the technical analysis, environment setup recommendations, state management architecture, and testing framework integration strategy for **PromptRoyale** (Boss Raid Arena & AI Prompt Lab).

The target directory `/home/maady/teamwork_projects/prompt_royale` is currently an uninitialized repository containing only `ORIGINAL_REQUEST.md`. This analysis establishes a complete blueprint for bootstrapping the build system, state machine, component architecture, and automated test suite required to meet acceptance criteria R1, R2, and R3.

---

## 1. Codebase Survey & Current Environment State

* **Path Inspected:** `/home/maady/teamwork_projects/prompt_royale`
* **File Inventory:**
  * `ORIGINAL_REQUEST.md` (2,318 bytes)
* **Current Status:** Uninitialized repository (No `package.json`, Vite/Webpack config, TypeScript config, or source/test files).
* **Target Requirements Summary (`ORIGINAL_REQUEST.md`):**
  * **R1 (Core Game Loop / Boss Raid Arena Prototype):** 4-player team battle simulation in single browser window. Boss HP = 1000, 4 Players HP = 100 each, 60-second arena timer, multiple-choice voting buttons.
    * *Scoring Matrix:*
      * 4/4 correct: Boss -100 HP, Players -0 HP
      * 3/4 correct: Boss -60 HP, 1 wrong player -25 HP
      * 2/4 correct: Boss -25 HP, 2 wrong players -25 HP each
      * 0/4 correct: Boss -0 HP, all 4 players -30 HP each
  * **R2 (AI Game Master & Student Prompt Lab):** Simulated Prompt Lab with text input ("restyle notes") + PDF upload simulation button. Submitting triggers simulated AI processing state, then transitions to Boss Raid Arena with mock MCQs.
  * **R3 (Knockout Mechanics):** Player reaching 0 HP has voting buttons disabled for subsequent questions.

---

## 2. Build System & NPM Scripts Configuration

### Recommended Tech Stack
* **Framework:** React 18 / 19 with TypeScript (`tsx`)
* **Bundler / Dev Server:** Vite 5+ (fast cold start, instant HMR, native TypeScript support)
* **Testing Framework:** Vitest + React Testing Library (`@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`) + `jsdom`

### Required `package.json` Structure
```json
{
  "name": "prompt-royale",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.400.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.8",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "jsdom": "^24.1.1",
    "typescript": "^5.5.4",
    "vite": "^5.4.0",
    "vitest": "^2.0.5"
  }
}
```

### Vite & Vitest Configuration (`vite.config.ts`)
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

---

## 3. State Management & Core Domain Architecture

To ensure 100% testability and compliance with TDD rules, the core game state and damage logic should be separated into a pure, deterministic state machine (`gameReducer.ts`).

### Pure Domain State Interface (`src/types/game.ts`)
```typescript
export type GamePhase = 'PROMPT_LAB' | 'PROCESSING' | 'ARENA' | 'VICTORY' | 'DEFEAT';

export interface Player {
  id: string;
  name: string;
  maxHp: number;
  currentHp: number;
  isKnockedOut: boolean;
  selectedOption: string | null;
}

export interface Question {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
}

export interface Boss {
  name: string;
  maxHp: number;
  currentHp: number;
}

export interface GameState {
  phase: GamePhase;
  boss: Boss;
  players: Player[];
  timerSeconds: number;
  currentQuestionIndex: number;
  questions: Question[];
  notesText: string;
  uploadedFileName: string | null;
  lastTurnSummary: string | null;
}
```

### Pure Scoring & Damage Resolution Logic (`src/logic/scoring.ts`)
```typescript
export interface ScoringResult {
  bossDamage: number;
  playerDamages: Record<string, number>; // playerId -> damage
  correctCount: number;
  totalActive: number;
}

export function resolveTurnScoring(
  players: Player[],
  correctAnswer: string
): ScoringResult {
  const activePlayers = players.filter(p => !p.isKnockedOut);
  const totalActive = activePlayers.length;

  let correctCount = 0;
  const incorrectPlayerIds: string[] = [];

  activePlayers.forEach(player => {
    if (player.selectedOption === correctAnswer) {
      correctCount++;
    } else {
      incorrectPlayerIds.push(player.id);
    }
  });

  let bossDamage = 0;
  const playerDamages: Record<string, number> = {};
  players.forEach(p => (playerDamages[p.id] = 0));

  if (correctCount === 4) {
    bossDamage = 100;
  } else if (correctCount === 3) {
    bossDamage = 60;
    incorrectPlayerIds.forEach(id => (playerDamages[id] = 25));
  } else if (correctCount === 2) {
    bossDamage = 25;
    incorrectPlayerIds.forEach(id => (playerDamages[id] = 25));
  } else if (correctCount === 0) {
    bossDamage = 0;
    players.forEach(p => {
      if (!p.isKnockedOut) playerDamages[p.id] = 30;
    });
  } else if (correctCount === 1) {
    // Edge case 1/4 correct: 0 boss damage, 25 recoil to incorrect players
    bossDamage = 0;
    incorrectPlayerIds.forEach(id => (playerDamages[id] = 25));
  }

  return { bossDamage, playerDamages, correctCount, totalActive };
}
```

---

## 4. Test Framework Integration & Verification Plan

### Test Hierarchy
1. **Unit Tests (`src/logic/scoring.test.ts` & `src/store/gameReducer.test.ts`):**
   * Programmatically test all damage calculations without DOM rendering.
   * Verify 4/4 correct => Boss HP -100, Players -0.
   * Verify 3/4 correct => Boss HP -60, 1 incorrect Player -25.
   * Verify 2/4 correct => Boss HP -25, 2 incorrect Players -25.
   * Verify 0/4 correct => Boss HP -0, all 4 Players -30.
   * Verify HP clamping at 0 and transition of `isKnockedOut` flag.

2. **Component & UI Integration Tests (`src/components/PromptLab.test.tsx` & `src/components/BossRaidArena.test.tsx`):**
   * **Prompt Lab Integration:** Render `PromptLab`, input text, simulate file upload, click submission, assert phase transitions to `PROCESSING` then `ARENA`.
   * **Arena UI Validation:** Render `BossRaidArena` with 4 player controls. Assert Boss HP bar displays 1000/1000, 4 player HP bars display 100/100.
   * **Knockout UI Verification:** Simulate damage reducing Player 1 HP to 0. Assert Player 1 voting buttons are rendered with `disabled` attribute (`expect(button).toBeDisabled()`).

---

## 5. Proposed File Tree for Target Project

```
/home/maady/teamwork_projects/prompt_royale/
├── ORIGINAL_REQUEST.md
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── types/
│   │   └── game.ts
│   ├── logic/
│   │   ├── scoring.ts
│   │   └── scoring.test.ts
│   ├── store/
│   │   ├── gameReducer.ts
│   │   ├── gameReducer.test.ts
│   │   └── GameContext.tsx
│   ├── components/
│   │   ├── PromptLab.tsx
│   │   ├── PromptLab.test.tsx
│   │   ├── BossRaidArena.tsx
│   │   ├── BossRaidArena.test.tsx
│   │   ├── BossHealthBar.tsx
│   │   └── PlayerCard.tsx
│   ├── mock/
│   │   └── questions.ts
│   └── test/
│       └── setup.ts
```

---

## 6. Summary of Architectural Recommendations for Implementers

1. **Strict Pure State Logic:** Keep damage calculations in pure TypeScript functions (`resolveTurnScoring`) to guarantee fast, zero-flakiness automated tests.
2. **Accessible UI Elements:** Use standard semantic button tags with explicit `aria-label` or text content so React Testing Library tests (`getByRole('button', { name: ... })`) can easily select player voting buttons.
3. **Timer Management:** Mock timers using `vi.useFakeTimers()` in Vitest tests for the 60-second arena timer.
