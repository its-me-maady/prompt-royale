# UI Architecture & Scoring Refinement Analysis — Milestone 2

## Executive Summary
This report presents the architectural blueprint and exact logic refactoring required to resolve the Iteration 1 Gate Check failures for PromptRoyale Milestone 2. 

The investigation identified two primary causes for the gate check failure:
1. **Empty Stub UI (`src/App.tsx`)**: `App.tsx` was a placeholder component (`<div>PromptRoyale</div>`) that failed to render the interactive prototype (`PromptLab`, `BossArena`, `PlayerCard`, `BossCard`, `Timer`, `GameContext`).
2. **Fixed-Count Scoring Anomalies (`src/logic/gameEngine.ts`)**: `resolveTurnScoring` relied on a hardcoded switch-case on `correctCount` (0..4) rather than calculating the accuracy ratio among **active (non-knocked-out)** players. This resulted in wrong boss damage calculation (e.g. 3/3 active players correct produced 60 damage instead of 100) and incorrect recoil damage when 0 incorrect players existed.

---

## Part 1: UI Architecture & Component Blueprints

### Architecture Overview
The UI state will be centralized in a dedicated React Context (`GameContext.tsx`) that manages game phase transitions (`PROMPT_LAB` -> `LOADING` -> `ARENA` -> `VICTORY` / `GAME_OVER`), party state, boss state, player votes, and turn resolution. 

The component hierarchy is structured modularly under `src/components/`:
```
src/
├── App.tsx
├── context/
│   └── GameContext.tsx
├── components/
│   ├── PromptLab.tsx
│   ├── BossArena.tsx
│   ├── BossCard.tsx
│   ├── PlayerCard.tsx
│   └── Timer.tsx
├── logic/
│   └── gameEngine.ts
└── types/
    └── game.ts
```

---

### Component Specifications & Blueprints

#### 1. `src/context/GameContext.tsx`
Provides central state and action methods for the PromptRoyale application.

```tsx
// agent-notes: { ctx: "Central React context and provider for game state management", deps: ["src/types/game.ts", "src/logic/gameEngine.ts"], state: active, last: "explorer_m2@2026-07-29" }

import React, { createContext, useContext, useState } from 'react';
import { PlayerState, BossState, GamePhase, TurnScoringResult } from '../types/game';
import { resolveTurnScoring } from '../logic/gameEngine';

export interface GameContextType {
  phase: GamePhase;
  setPhase: (phase: GamePhase) => void;
  promptText: string;
  setPromptText: (text: string) => void;
  hasUploadedPdf: boolean;
  setHasUploadedPdf: (uploaded: boolean) => void;
  boss: BossState;
  players: PlayerState[];
  votes: Record<number, string>;
  correctAnswer: string;
  timerSeconds: number;
  lastTurnResult: TurnScoringResult | null;
  enterBossArena: () => void;
  castVote: (playerId: number, option: string) => void;
  submitRoundVotes: () => void;
  resetGame: () => void;
}

const initialBoss: BossState = {
  id: 'boss_cyber_dragon',
  name: 'Cyber Dragon',
  hp: 1000,
  maxHp: 1000,
};

const initialPlayers: PlayerState[] = [
  { id: 1, name: 'Player 1', hp: 100, maxHp: 100, isKnockedOut: false, selectedOption: null },
  { id: 2, name: 'Player 2', hp: 100, maxHp: 100, isKnockedOut: false, selectedOption: null },
  { id: 3, name: 'Player 3', hp: 100, maxHp: 100, isKnockedOut: false, selectedOption: null },
  { id: 4, name: 'Player 4', hp: 100, maxHp: 100, isKnockedOut: false, selectedOption: null },
];

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [phase, setPhase] = useState<GamePhase>('PROMPT_LAB');
  const [promptText, setPromptText] = useState('');
  const [hasUploadedPdf, setHasUploadedPdf] = useState(false);
  const [boss, setBoss] = useState<BossState>(initialBoss);
  const [players, setPlayers] = useState<PlayerState[]>(initialPlayers);
  const [votes, setVotes] = useState<Record<number, string>>({});
  const [correctAnswer] = useState('A');
  const [timerSeconds] = useState(60);
  const [lastTurnResult, setLastTurnResult] = useState<TurnScoringResult | null>(null);

  const enterBossArena = () => {
    setPhase('ARENA');
  };

  const castVote = (playerId: number, option: string) => {
    const player = players.find((p) => p.id === playerId);
    if (!player || player.isKnockedOut || player.hp <= 0) return;
    setVotes((prev) => ({ ...prev, [playerId]: option }));
  };

  const submitRoundVotes = () => {
    const result = resolveTurnScoring(players, boss, votes, correctAnswer);
    setLastTurnResult(result);
    setBoss((prev) => ({ ...prev, hp: result.updatedBossHp }));
    setPlayers(result.updatedPlayers);
    setVotes({});

    if (result.updatedBossHp <= 0) {
      setPhase('VICTORY');
    } else if (result.updatedPlayers.every((p) => p.hp <= 0)) {
      setPhase('GAME_OVER');
    }
  };

  const resetGame = () => {
    setPhase('PROMPT_LAB');
    setPromptText('');
    setHasUploadedPdf(false);
    setBoss(initialBoss);
    setPlayers(initialPlayers);
    setVotes({});
    setLastTurnResult(null);
  };

  return (
    <GameContext.Provider
      value={{
        phase,
        setPhase,
        promptText,
        setPromptText,
        hasUploadedPdf,
        setHasUploadedPdf,
        boss,
        players,
        votes,
        correctAnswer,
        timerSeconds,
        lastTurnResult,
        enterBossArena,
        castVote,
        submitRoundVotes,
        resetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
```

---

#### 2. `src/components/PromptLab.tsx`
Renders student prompt engineering input form and PDF upload trigger.

```tsx
// agent-notes: { ctx: "Student prompt submission interface for Prompt Lab phase", deps: ["src/context/GameContext.tsx"], state: active, last: "explorer_m2@2026-07-29" }

import React from 'react';
import { useGame } from '../context/GameContext';

export const PromptLab: React.FC = () => {
  const { promptText, setPromptText, hasUploadedPdf, setHasUploadedPdf, enterBossArena } = useGame();

  return (
    <div data-testid="prompt-lab">
      <h2>Student Prompt Lab</h2>
      <textarea
        aria-label="Restyle Notes Prompt"
        placeholder="Enter prompt to restyle notes..."
        value={promptText}
        onChange={(e) => setPromptText(e.target.value)}
      />
      <button type="button" onClick={() => setHasUploadedPdf(!hasUploadedPdf)}>
        {hasUploadedPdf ? 'PDF Uploaded' : 'Upload PDF'}
      </button>
      <button type="button" onClick={enterBossArena}>
        Enter Boss Arena
      </button>
    </div>
  );
};
```

---

#### 3. `src/components/BossCard.tsx`
Displays current Boss status and HP bar in Boss Arena.

```tsx
// agent-notes: { ctx: "Boss status component rendering name and HP", deps: ["src/types/game.ts"], state: active, last: "explorer_m2@2026-07-29" }

import React from 'react';
import { BossState } from '../types/game';

interface BossCardProps {
  boss: BossState;
}

export const BossCard: React.FC<BossCardProps> = ({ boss }) => {
  return (
    <div data-testid="boss-card">
      <h3>{boss.name}</h3>
      <div data-testid="boss-hp">
        Boss HP: {boss.hp} / {boss.maxHp}
      </div>
    </div>
  );
};
```

---

#### 4. `src/components/Timer.tsx`
Renders round countdown timer.

```tsx
// agent-notes: { ctx: "Round timer component", deps: [], state: active, last: "explorer_m2@2026-07-29" }

import React from 'react';

interface TimerProps {
  seconds?: number;
}

export const Timer: React.FC<TimerProps> = ({ seconds = 60 }) => {
  return <div data-testid="timer">Time Remaining: {seconds}s</div>;
};
```

---

#### 5. `src/components/PlayerCard.tsx`
Renders individual party player stats, knockout badges, and voting controls.

```tsx
// agent-notes: { ctx: "Player card component for party grid", deps: ["src/types/game.ts"], state: active, last: "explorer_m2@2026-07-29" }

import React from 'react';
import { PlayerState } from '../types/game';

interface PlayerCardProps {
  player: PlayerState;
  onVote: (playerId: number, option: string) => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, onVote }) => {
  const isKnockedOut = player.isKnockedOut || player.hp <= 0;

  return (
    <div data-testid={`player-card-${player.id}`}>
      <h4>{player.name}</h4>
      <div data-testid={`player-hp-${player.id}`}>
        HP: {player.hp} / {player.maxHp}
      </div>
      {isKnockedOut && <span data-testid={`knockout-badge-${player.id}`}>KNOCKED OUT</span>}
      <div data-testid={`voting-buttons-${player.id}`}>
        {['A', 'B', 'C', 'D'].map((option) => (
          <button
            key={option}
            type="button"
            disabled={isKnockedOut}
            onClick={() => onVote(player.id, option)}
          >
            Option {option}
          </button>
        ))}
      </div>
    </div>
  );
};
```

---

#### 6. `src/components/BossArena.tsx`
Aggregates BossCard, Timer, Players Grid, and Turn Submission control.

```tsx
// agent-notes: { ctx: "Boss Raid Arena main container", deps: ["src/context/GameContext.tsx", "src/components/BossCard.tsx", "src/components/Timer.tsx", "src/components/PlayerCard.tsx"], state: active, last: "explorer_m2@2026-07-29" }

import React from 'react';
import { useGame } from '../context/GameContext';
import { BossCard } from './BossCard';
import { Timer } from './Timer';
import { PlayerCard } from './PlayerCard';

export const BossArena: React.FC = () => {
  const { boss, players, timerSeconds, castVote, submitRoundVotes } = useGame();

  return (
    <div data-testid="boss-arena">
      <BossCard boss={boss} />
      <Timer seconds={timerSeconds} />
      <div data-testid="players-grid">
        {players.map((player) => (
          <PlayerCard key={player.id} player={player} onVote={castVote} />
        ))}
      </div>
      <button type="button" onClick={submitRoundVotes}>
        Submit Round Votes
      </button>
    </div>
  );
};
```

---

#### 7. `src/App.tsx`
Root Application component wrapping the view switcher inside `<GameProvider>`.

```tsx
// agent-notes: { ctx: "Root App component providing GameContext and phase rendering", deps: ["src/context/GameContext.tsx", "src/components/PromptLab.tsx", "src/components/BossArena.tsx"], state: active, last: "explorer_m2@2026-07-29" }

import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { PromptLab } from './components/PromptLab';
import { BossArena } from './components/BossArena';

const GameContent: React.FC = () => {
  const { phase } = useGame();

  if (phase === 'PROMPT_LAB') {
    return <PromptLab />;
  }

  if (phase === 'LOADING') {
    return <div data-testid="loading-screen">Simulating AI Processing...</div>;
  }

  if (phase === 'VICTORY') {
    return <div data-testid="victory-screen">Victory! Boss Defeated!</div>;
  }

  if (phase === 'GAME_OVER') {
    return <div data-testid="game-over-screen">Game Over! Party Wiped Out!</div>;
  }

  return <BossArena />;
};

export const App: React.FC = () => {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
};

export default App;
```

---

## Part 2: Refactoring `src/logic/gameEngine.ts` for Active Player Ratio Scoring

### Problem Formulation
In Iteration 1, `resolveTurnScoring` calculated damage using `switch (correctCount)` based on absolute numbers (0 to 4 correct players). This created critical flaws when players were knocked out:
- If 1 player was KO'd (3 active players remaining) and all 3 answered correctly (3/3 = 100%), `correctCount` was 3. Switch case 3 yielded `bossDamage = 60` (instead of 100) and `playerRecoilDamage = 25` even though 0 incorrect players existed!
- If 3 players were KO'd (1 active player remaining) and that player answered correctly (1/1 = 100%), `correctCount` was 1. Switch case 1 yielded `bossDamage = 0`!

### Refactored Scoring Rules & Formula
Let `activePlayers` be the array of non-knocked-out players with `hp > 0`.
Let `activeCount = activePlayers.length`.
Let `correctCount` be the number of active players who voted correctly.
Let `incorrectPlayers` be active players who voted incorrectly.

The accuracy ratio among active voters is:
$$\text{ratio} = \frac{\text{correctCount}}{\text{activeCount}} \quad (\text{for } \text{activeCount} > 0)$$

#### Scoring Rules Mapping:
1. **0 Incorrect Players (`incorrectPlayers.length === 0`)**:
   - `playerRecoilDamage = 0` (strictly 0 whenever zero active players voted incorrectly).
   - If `activeCount > 0`, `ratio = 1.0` (100% active correct) $\implies$ `bossDamage = 100`.
2. **Partial / Zero Correctness Ratio Brackets**:
   - **$100\%$ Active Correct ($\text{ratio} = 1.0$)**: Boss damage = $100$, player recoil = $0$.
   - **$75\% \le \text{ratio} < 100\%$ ($\text{ratio} \ge 0.75$, e.g. 3/4)**: Boss damage = $60$, player recoil = $25$ to incorrect players.
   - **$50\% \le \text{ratio} < 75\%$ ($\text{ratio} \ge 0.50$, e.g. 2/4, 2/3, 1/2)**: Boss damage = $25$, player recoil = $25$ to incorrect players.
   - **$25\% \le \text{ratio} < 50\%$ ($\text{ratio} \ge 0.25$, e.g. 1/4, 1/3)**: Boss damage = $0$, player recoil = $25$ to incorrect players.
   - **$0\% \le \text{ratio} < 25\%$ ($\text{ratio} < 0.25$, e.g. 0/4, 0/3, 0/2, 0/1)**: Boss damage = $0$, player recoil = $30$ to all active players.

---

### Exact Refactored Code for `src/logic/gameEngine.ts`

```typescript
// agent-notes: { ctx: "Core game engine turn scoring and HP knockout logic with ratio-based active player scaling", deps: ["src/types/game.ts"], state: active, last: "explorer_m2@2026-07-29" }

import { PlayerState, BossState, TurnScoringResult } from '../types/game';

/**
 * Resolves a turn in the PromptRoyale Boss Raid Arena.
 * Calculates damage dealt to the Boss and recoil damage to incorrect players based on active voting accuracy ratio.
 */
export function resolveTurnScoring(
  players: PlayerState[],
  boss: BossState,
  votes: Record<number, string>,
  correctAnswer: string
): TurnScoringResult {
  // Only non-knocked-out players contribute to voting scoring
  const activePlayers = players.filter((p) => !p.isKnockedOut && p.hp > 0);

  const correctPlayers = activePlayers.filter((p) => votes[p.id] === correctAnswer);
  const incorrectPlayers = activePlayers.filter((p) => votes[p.id] !== correctAnswer);

  const activeCount = activePlayers.length;
  const correctCount = correctPlayers.length;
  const incorrectPlayerIds = incorrectPlayers.map((p) => p.id);

  let bossDamage = 0;
  let playerRecoilDamage = 0;

  if (activeCount > 0) {
    if (incorrectPlayers.length === 0) {
      // 100% active players correct (4/4, 3/3, 2/2, 1/1)
      bossDamage = 100;
      playerRecoilDamage = 0;
    } else {
      const ratio = correctCount / activeCount;
      if (ratio >= 0.75) {
        // 75% active correct (e.g. 3/4)
        bossDamage = 60;
        playerRecoilDamage = 25;
      } else if (ratio >= 0.50) {
        // 50% active correct (e.g. 2/4, 2/3, 1/2)
        bossDamage = 25;
        playerRecoilDamage = 25;
      } else if (ratio >= 0.25) {
        // 25% active correct (e.g. 1/4, 1/3)
        bossDamage = 0;
        playerRecoilDamage = 25;
      } else {
        // 0% active correct (0/4, 0/3, 0/2, 0/1)
        bossDamage = 0;
        playerRecoilDamage = 30;
      }
    }
  }

  const updatedBossHp = Math.max(0, boss.hp - bossDamage);

  const updatedPlayers: PlayerState[] = players.map((p) => {
    const isIncorrect = incorrectPlayerIds.includes(p.id);
    const damageTaken = isIncorrect ? playerRecoilDamage : 0;
    const newHp = Math.max(0, p.hp - damageTaken);

    return {
      ...p,
      hp: newHp,
      isKnockedOut: newHp <= 0,
      selectedOption: votes[p.id] !== undefined ? votes[p.id] : p.selectedOption,
    };
  });

  return {
    bossDamage,
    playerRecoilDamage,
    incorrectPlayerIds,
    updatedBossHp,
    updatedPlayers,
  };
}

/**
 * Checks if the boss has been defeated (HP <= 0).
 */
export function isBossDefeated(boss: BossState): boolean {
  return boss.hp <= 0;
}

/**
 * Checks if all players in the party have been knocked out (all HP <= 0).
 */
export function isPartyWiped(players: PlayerState[]): boolean {
  return players.every((p) => p.hp <= 0);
}
```

---

### Verification Matrix for All Active Party Configurations

| Active Players ($N$) | Correct Votes | Incorrect Votes | Ratio ($\%$) | Boss Damage | Recoil Damage | Affected Players | Notes |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---|
| 4 | 4 | 0 | 100% | 100 | 0 | None | AC 28 |
| 4 | 3 | 1 | 75% | 60 | 25 | 1 Wrong Player | AC 29 |
| 4 | 2 | 2 | 50% | 25 | 25 | 2 Wrong Players | AC 30 |
| 4 | 1 | 3 | 25% | 0 | 25 | 3 Wrong Players | R1 Auxiliary |
| 4 | 0 | 4 | 0% | 0 | 30 | All 4 Active | AC 31 |
| 3 | 3 | 0 | 100% | 100 | 0 | None | **Fixed Iteration 1 Anomaly** |
| 3 | 2 | 1 | 66.7% | 25 | 25 | 1 Wrong Player | Partial scaling ($\ge 50\%$) |
| 3 | 1 | 2 | 33.3% | 0 | 25 | 2 Wrong Players | Partial scaling ($\ge 25\%$) |
| 3 | 0 | 3 | 0% | 0 | 30 | All 3 Active | Team recoil |
| 2 | 2 | 0 | 100% | 100 | 0 | None | 2 active 100% correct |
| 2 | 1 | 1 | 50% | 25 | 25 | 1 Wrong Player | Partial scaling ($\ge 50\%$) |
| 2 | 0 | 2 | 0% | 0 | 30 | Both Active | Team recoil |
| 1 | 1 | 0 | 100% | 100 | 0 | None | **Fixed Iteration 1 Anomaly** |
| 1 | 0 | 1 | 0% | 0 | 30 | Last Active Player | Team recoil |
| 0 | 0 | 0 | 0% | 0 | 0 | None | Party wiped out |

---

## Part 3: Test Suite Updates & Alignment

When implementing these changes, existing test assertions in the test files must be updated to align with the new ratio-based active player scoring and prototype UI rendering:

1. **`src/__tests__/empirical_challenger.test.tsx`**:
   - Update `2. Knockout Status & Reduced Party Scaling Anomalies` test:
     - `3/3 active players correct` should expect `bossDamage: 100` and `playerRecoilDamage: 0` (was previously expecting 60 and 25 to document the Iteration 1 anomaly).
     - `1/1 active player correct` should expect `bossDamage: 100` and `playerRecoilDamage: 0` (was previously expecting 0 and 25).
   - Update `3. Root Application Component UI Verification` test:
     - Expect `App` to render `prompt-lab` component (`screen.getByTestId('prompt-lab')`).
2. **`src/__tests__/gameEngine.test.ts`**:
   - Update line 139: `ignores votes from already knocked out players when calculating correct vote counts`: 3/3 active players correct should expect `bossDamage: 100` and `incorrectPlayerIds: []`.
3. **`src/__tests__/e2e_requirements.test.tsx`**:
   - Update line 325: `excludes knocked-out players from active voter calculations`: 3/3 active players correct should expect `bossDamage: 100` and `incorrectPlayerIds: []`.

---

## Summary of Actionable Implementation Steps for Implementer
1. Create `src/context/GameContext.tsx` with the specified context provider and `useGame` hook.
2. Create modular React UI components in `src/components/`:
   - `PromptLab.tsx`
   - `BossCard.tsx`
   - `Timer.tsx`
   - `PlayerCard.tsx`
   - `BossArena.tsx`
3. Refactor `src/App.tsx` to wrap `GameContent` in `<GameProvider>`.
4. Refactor `resolveTurnScoring` in `src/logic/gameEngine.ts` to use `ratio = correctCount / activeCount` with zero recoil when 0 incorrect players exist.
5. Update test assertions in `gameEngine.test.ts`, `e2e_requirements.test.tsx`, and `empirical_challenger.test.tsx` for 3/3 active player ratio scoring and UI rendering.
6. Run `npm test` to verify 100% test pass rate.
