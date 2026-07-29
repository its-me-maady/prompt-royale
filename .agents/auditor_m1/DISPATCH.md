## 2026-07-29T05:24:30Z
You are Forensic Integrity Auditor for Milestone 1 of PromptRoyale.
Your assigned working directory is `/home/maady/learning/prompt-royale/.agents/auditor_m1`.
The target project directory containing source code and tests is `/home/maady/teamwork_projects/prompt_royale`.

Tasks:
1. Perform forensic integrity verification on `src/types/game.ts`, `src/logic/gameEngine.ts`, `src/__tests__/gameEngine.test.ts`.
2. Verify that `resolveTurnScoring`, `isBossDefeated`, and `isPartyWiped` implement genuine calculation logic and contain NO hardcoded test results, fake assertions, or dummy facades.
3. Run `npx vitest run` and `npm run build` in `/home/maady/teamwork_projects/prompt_royale`.
4. Write your handoff report in `/home/maady/learning/prompt-royale/.agents/auditor_m1/handoff.md` with an explicit verdict: CLEAN or INTEGRITY_VIOLATION, and send a message to parent orchestrator.
