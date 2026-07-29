## 2026-07-29T05:19:40Z
You are the Implementation Worker for Milestone 1 of PromptRoyale (Project Setup & Pure Core Game Logic).
Your assigned working directory is `/home/maady/learning/prompt-royale/.agents/worker_m1`.
The target project directory containing source code and tests is `/home/maady/teamwork_projects/prompt_royale`.

MANDATORY INTEGRITY WARNING: DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Tasks:
1. Read `/home/maady/teamwork_projects/prompt_royale/ORIGINAL_REQUEST.md` and `/home/maady/learning/prompt-royale/.agents/orchestrator/plan.md`.
2. Initialize project scaffolding in `/home/maady/teamwork_projects/prompt_royale`:
   - Create `package.json` with React, React DOM, TypeScript, Vite, Vitest, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`.
   - Install dependencies (`npm install`).
   - Create `vite.config.ts`, `vitest.config.ts` (with `environment: 'jsdom'`), `tsconfig.json`, `index.html`.
3. Implement `src/types/game.ts`:
   - `PlayerState`: `{ id: number; name: string; hp: number; maxHp: number; isKnockedOut: boolean; selectedOption: string | null }`
   - `BossState`: `{ id: string; name: string; hp: number; maxHp: number }`
   - `GamePhase`: `'PROMPT_LAB' | 'LOADING' | 'ARENA' | 'VICTORY' | 'GAME_OVER'`
   - `TurnScoringResult`: `{ bossDamage: number; playerRecoilDamage: number; incorrectPlayerIds: number[]; updatedBossHp: number; updatedPlayers: PlayerState[] }`
4. Implement `src/logic/gameEngine.ts`:
   - `resolveTurnScoring(players: PlayerState[], boss: BossState, votes: Record<number, string>, correctAnswer: string)`:
     - Calculates count of correct votes among non-knocked-out players.
     - Damage rules:
       - 4/4 correct: 100 damage to Boss, 0 to players.
       - 3/4 correct: 60 damage to Boss, 25 recoil damage to the 1 wrong player.
       - 2/4 correct: 25 damage to Boss, 25 recoil damage to the 2 wrong players.
       - 0/4 correct: 30 damage to all 4 players (0 damage to Boss).
       - 1/4 correct: 0 damage to Boss, 25 damage to the 3 wrong players.
     - Decrements Boss HP (min 0).
     - Decrements incorrect players' HP (min 0).
     - Marks any player with HP <= 0 as `isKnockedOut: true`.
   - `isBossDefeated(boss: BossState)`: returns `boss.hp <= 0`.
   - `isPartyWiped(players: PlayerState[])`: returns `players.every(p => p.hp <= 0)`.
5. Create initial unit tests in `src/__tests__/gameEngine.test.ts` verifying all 4 damage formulas (4/4, 3/4, 2/4, 0/4) and knockout state.
6. Run `npm run build` and `npx vitest run` to verify build & tests pass cleanly.
7. Write your handoff report in `/home/maady/learning/prompt-royale/.agents/worker_m1/handoff.md` and send a message to parent orchestrator with build & test command outputs.
