## 2026-07-29T05:26:11Z
<USER_REQUEST>
You are UI Architecture & Scoring Refinement Explorer 3 for Milestone 2 of PromptRoyale.
Your assigned working directory is `/home/maady/learning/prompt-royale/.agents/explorer_m2`.
The target project directory containing source code and tests is `/home/maady/teamwork_projects/prompt_royale`.

Iteration 1 Gate Check failed due to:
1. `src/App.tsx` is an empty stub returning `<div>PromptRoyale</div>`. The application UI needs to be built with real modular React components (`PromptLab.tsx`, `BossArena.tsx`, `PlayerCard.tsx`, `BossCard.tsx`, `Timer.tsx`) wrapped in `GameContext.tsx` so that `App.tsx` renders the full functional prototype.
2. `resolveTurnScoring` in `src/logic/gameEngine.ts` needs ratio-based scoring for active players:
   - When active players answer 100% correctly (e.g. 4/4 or 3/3 active), Boss HP reduces by 100, recoil is 0.
   - When 0 incorrect players exist, `playerRecoilDamage` MUST be 0.
   - Formula for partial correctness based on active players ratio:
     - 100% active correct (1.0 ratio): 100 Boss damage, 0 player recoil.
     - 75% active correct (0.75 ratio): 60 Boss damage, 25 recoil damage to incorrect players.
     - 50% active correct (0.50 ratio): 25 Boss damage, 25 recoil damage to incorrect players.
     - 25% active correct (0.25 ratio): 0 Boss damage, 25 recoil damage to incorrect players.
     - 0% active correct (0.0 ratio): 0 Boss damage, 30 recoil damage to all active players.

Tasks:
1. Inspect `/home/maady/teamwork_projects/prompt_royale/src/` files and `/home/maady/teamwork_projects/prompt_royale/src/__tests__/e2e_requirements.test.tsx`.
2. Formulate the exact component blueprint for `App.tsx`, `GameContext.tsx`, `PromptLab.tsx`, `BossArena.tsx`, `PlayerCard.tsx`, `BossCard.tsx`, and `Timer.tsx`.
3. Formulate the exact code refactoring for `src/logic/gameEngine.ts` to satisfy both raw 4-player rules and active player accuracy ratio scaling.
4. Write your analysis in `/home/maady/learning/prompt-royale/.agents/explorer_m2/analysis.md` and handoff report in `/home/maady/learning/prompt-royale/.agents/explorer_m2/handoff.md`.
5. Send a message to parent orchestrator when complete.
</USER_REQUEST>
