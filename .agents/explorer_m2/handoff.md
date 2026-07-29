# Handoff Report — UI Architecture & Scoring Refinement (Milestone 2)

## 1. Observation
1. **Target Repository Location**: `/home/maady/teamwork_projects/prompt_royale`
2. **Root UI Component Stub (`src/App.tsx`)**:
   - `src/App.tsx` (lines 5-7):
     ```tsx
     export const App: React.FC = () => {
       return <div>PromptRoyale</div>;
     };
     ```
   - In `src/__tests__/empirical_challenger.test.tsx` (lines 137-139), `render(<App />)` textContent is `'PromptRoyale'`, and both `hasBossHp` and `hasPromptLab` are `false`.
3. **Turn Scoring Logic (`src/logic/gameEngine.ts`)**:
   - `src/logic/gameEngine.ts` (lines 27-49):
     ```typescript
     switch (correctCount) {
       case 4:
         bossDamage = 100;
         playerRecoilDamage = 0;
         break;
       case 3:
         bossDamage = 60;
         playerRecoilDamage = 25;
         break;
       case 2:
         bossDamage = 25;
         playerRecoilDamage = 25;
         break;
       case 1:
         bossDamage = 0;
         playerRecoilDamage = 25;
         break;
       case 0:
       default:
         bossDamage = 0;
         playerRecoilDamage = 30;
         break;
     }
     ```
   - Observed Anomaly: When 1 player is knocked out (3 active players left) and all 3 active players answer correctly (3/3 = 100%), `correctCount` is 3, causing `bossDamage` to equal 60 and `playerRecoilDamage` to equal 25 (with `incorrectPlayerIds = []`). When 3 players are knocked out (1 active player left) and answers correctly (1/1 = 100%), `correctCount` is 1, causing `bossDamage` to equal 0.
4. **Current Test Suite Run Result**:
   - Command: `npm test`
   - Output: `Test Files 3 passed (3), Tests 39 passed (39)` (noting that tests pass because existing test assertions reflected Iteration 1 stub state and anomaly checks).

---

## 2. Logic Chain
1. **Observation 2** shows that `src/App.tsx` is an unintegrated placeholder returning `<div>PromptRoyale</div>`. 
2. Therefore, to satisfy Milestone 2 requirements, `src/App.tsx` must be refactored into a full React application wrapping modular components (`PromptLab.tsx`, `BossArena.tsx`, `PlayerCard.tsx`, `BossCard.tsx`, `Timer.tsx`) inside a central `GameContext.tsx` provider.
3. **Observation 3** shows that `resolveTurnScoring` uses fixed switch cases based on total `correctCount` (0..4) rather than calculating the accuracy ratio of active players ($\text{ratio} = \frac{\text{correctCount}}{\text{activePlayers.length}}$).
4. Therefore, when active players are reduced due to knockouts, 100% active accuracy yields 60 or 0 damage to Boss and non-zero recoil damage to zero incorrect players.
5. Implementing active player accuracy ratio scaling ($\text{ratio} = \text{correctCount} / \text{activeCount}$) ensures:
   - 100% active correct (4/4, 3/3, 2/2, 1/1) $\implies$ 100 Boss damage, 0 recoil damage.
   - When 0 incorrect players exist, `playerRecoilDamage` is strictly 0.
   - Partial correctness ratios ($\ge 75\% \implies 60$ Boss dmg / 25 recoil, $\ge 50\% \implies 25$ Boss dmg / 25 recoil, $\ge 25\% \implies 0$ Boss dmg / 25 recoil, $0\% \implies 0$ Boss dmg / 30 recoil).
6. **Observation 4** shows that test assertions in `gameEngine.test.ts`, `e2e_requirements.test.tsx`, and `empirical_challenger.test.tsx` currently expect old switch-case values for 3/3 active correct (60 dmg) or stub UI outputs (`PromptRoyale`). Updating `gameEngine.ts` and `App.tsx` requires updating those test assertions to expect 100 Boss damage for 3/3 active correct and `prompt-lab` UI elements for `App.tsx`.

---

## 3. Caveats
- No code was modified in `/home/maady/teamwork_projects/prompt_royale` during this investigation (strictly read-only).
- Assumed standard initial state: 4 players with 100 HP, 1 Boss with 1000 HP, default correct answer `'A'`, and 60-second timer.
- Assumed test runner is Vitest using React Testing Library (`@testing-library/react`).

---

## 4. Conclusion
The root cause of Iteration 1 Gate Check failure has been fully diagnosed and resolved architecturally.
The complete blueprint for UI modular components (`src/context/GameContext.tsx`, `src/components/PromptLab.tsx`, `src/components/BossCard.tsx`, `src/components/Timer.tsx`, `src/components/PlayerCard.tsx`, `src/components/BossArena.tsx`, and `src/App.tsx`) and the exact refactored code for `resolveTurnScoring` in `src/logic/gameEngine.ts` have been formulated and documented in `/home/maady/learning/prompt-royale/.agents/explorer_m2/analysis.md`.

---

## 5. Verification Method
To independently verify the implementation once applied by the implementer:

1. **Files to Inspect**:
   - `src/App.tsx`
   - `src/context/GameContext.tsx`
   - `src/components/PromptLab.tsx`
   - `src/components/BossArena.tsx`
   - `src/components/BossCard.tsx`
   - `src/components/PlayerCard.tsx`
   - `src/components/Timer.tsx`
   - `src/logic/gameEngine.ts`
   - `src/__tests__/e2e_requirements.test.tsx`
   - `src/__tests__/gameEngine.test.ts`
   - `src/__tests__/empirical_challenger.test.tsx`

2. **Verification Commands**:
   - `cd /home/maady/teamwork_projects/prompt_royale && npm test`
   - Confirm all tests pass without errors.

3. **Invalidation Conditions**:
   - `App.tsx` failing to render `data-testid="prompt-lab"` or `data-testid="boss-arena"`.
   - 3/3 active correct players producing less than 100 Boss damage or non-zero player recoil damage.
   - `playerRecoilDamage` > 0 when `incorrectPlayerIds.length === 0`.
