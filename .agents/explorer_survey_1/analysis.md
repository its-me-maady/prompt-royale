# Codebase Survey & Requirement Analysis Report

**Project**: PromptRoyale (Boss Raid Arena Prototype)  
**Surveyor**: Codebase Survey Explorer 1  
**Target Path**: `/home/maady/teamwork_projects/prompt_royale`  
**Date**: 2026-07-29  

---

## 1. Executive Summary

An inspection of the target project directory `/home/maady/teamwork_projects/prompt_royale` confirms that this is a **greenfield / uninitialized project repository**. The only existing file is `ORIGINAL_REQUEST.md`. There are no pre-existing source files, test suites, framework dependencies, or package configuration files (`package.json`).

This report provides a detailed breakdown of the requirements specified in `ORIGINAL_REQUEST.md` and recommends a modern, clean architecture (React + TypeScript + Vite + Vitest + React Testing Library) to implement the Boss Raid Arena prototype and satisfy all acceptance criteria.

---

## 2. Directory & Setup Inspection

### 2.1 File System Inspection Results
- **Directory**: `/home/maady/teamwork_projects/prompt_royale`
- **Files Present**:
  - `ORIGINAL_REQUEST.md` (37 lines, 2318 bytes)
- **Files Absent**:
  - `package.json`
  - Build configuration (e.g., `vite.config.ts`, `webpack.config.js`, `tsconfig.json`)
  - Framework files (React / Next.js / Create React App)
  - Test framework setups (Vitest, Jest, Playwright, RTL)
  - Source code (`src/` directory)

---

## 3. Detailed Requirements Breakdown

### 3.1 R1. Core Game Loop (Boss Raid Arena Prototype)
- **Players**: 4 simulated players, each starting with **100 HP**.
- **Boss**: Single AI Boss starting with **1000 HP**.
- **Timer**: 60-second countdown timer.
- **Voting Mechanism**: Multiple-choice voting buttons for each player to submit an answer per question.
- **Damage Scoring Rules**:
  | Player Voting Result | Boss Damage Taken | Player Damage Taken |
  | :--- | :--- | :--- |
  | **4/4 Correct** | 100 damage | 0 damage to all players |
  | **3/4 Correct** | 60 damage | 25 recoil damage to the 1 wrong player |
  | **2/4 Correct** | 25 damage | 25 recoil damage to the 2 wrong players |
  | **0/4 Correct** | 0 damage to Boss | 30 recoil damage to **all 4 players** |

> **Note on 1/4 Correct (Edge Case)**: The specification explicitly details 4/4, 3/4, 2/4, and 0/4. For 1/4 correct, logical extrapolations based on recoil pattern (or treating <2/4 as team failure) should be cleanly handled in the reducer (e.g. 0 Boss damage, 25 damage to the 3 wrong players or 30 team damage).

### 3.2 R2. AI Game Master & Student Prompt Lab (Simulated)
- **Prompt Lab Screen**:
  - Text input for user to enter prompts (e.g., "restyle notes").
  - "Simulate PDF Upload" button / input.
  - Submit action: Simulates AI processing phase (loading indicator / delay).
  - State transition: Automatically transitions from Prompt Lab screen to Boss Raid Arena populated with mock multiple-choice questions.

### 3.3 R3. Knockout Mechanics
- When a player's HP reaches **0**:
  - The player status becomes "Knocked Out".
  - Their voting buttons must be **disabled** for subsequent questions.
  - Remaining active players continue voting.

### 3.4 Automated Testing & Verification Requirements
- **Automated Unit & Component Tests**:
  1. Test 4/4 correct votes: Boss HP reduces by 100, Player HP unchanged.
  2. Test 3/4 correct votes: Boss HP reduces by 60, incorrect player HP reduces by 25.
  3. Test 2/4 correct votes: Boss HP reduces by 25, 2 incorrect players HP reduce by 25 each.
  4. Test 0/4 correct votes: All 4 players HP reduce by 30 each.
  5. Test knockout mechanics: Player with 0 HP has disabled voting buttons.
  6. Test Prompt Lab UI & Transition: Prompt input + PDF upload button exists; submitting transitions to Arena screen.

---

## 4. Recommended Technical Architecture

### 4.1 Technology Stack
- **Build Tool**: Vite (`vite`)
- **UI Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS (or clean CSS Modules) for responsive, gamified UI
- **Testing Framework**: Vitest + React Testing Library (`@testing-library/react`, `@testing-library/jest-dom`, `jsdom`)

### 4.2 Module & Component Layout Recommendation
```
/home/maady/teamwork_projects/prompt_royale/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── src/
│   ├── types/
│   │   └── game.ts             # Game state, Player, Boss, Question types
│   ├── game/
│   │   ├── damageLogic.ts      # Pure functions for damage & HP updates
│   │   └── mockData.ts         # Mock questions generated from notes
│   ├── hooks/
│   │   └── useBossRaidGame.ts  # Game reducer & state management hook
│   ├── components/
│   │   ├── PromptLab.tsx       # R2: Simulated note upload & prompt entry
│   │   ├── BossArena.tsx       # R1: Raid screen with Boss & Player cards
│   │   ├── BossCard.tsx        # Boss HP bar & status
│   │   ├── PlayerCard.tsx      # Player HP bar, voting buttons & knockout state
│   │   └── Timer.tsx           # 60s countdown timer
│   ├── App.tsx                 # Main container controlling screen flow
│   └── main.tsx
└── src/__tests__/
    ├── damageLogic.test.ts     # Pure function tests for damage scoring rules
    ├── PromptLab.test.tsx      # Prompt Lab UI & transition testing
    └── BossArena.test.tsx      # Boss Arena & knockout voting UI tests
```

---

## 5. Next Steps for Implementation Team
1. Initialize Vite + React + TypeScript project in `/home/maady/teamwork_projects/prompt_royale`.
2. Configure Vitest + React Testing Library test runner.
3. Write pure function tests for damage calculations and state reducer first (TDD).
4. Implement `damageLogic.ts` and `useBossRaidGame` hook.
5. Build `PromptLab` and `BossArena` UI components.
6. Verify all test criteria pass via `npm test` / `npx vitest run`.
