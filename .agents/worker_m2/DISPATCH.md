## 2026-07-29T05:27:40Z
Tasks:
1. Read `/home/maady/teamwork_projects/prompt_royale/ORIGINAL_REQUEST.md`, `/home/maady/learning/prompt-royale/.agents/explorer_m2/analysis.md`, and `/home/maady/learning/prompt-royale/.agents/explorer_m2/handoff.md`.
2. Refactor `src/logic/gameEngine.ts` to use active player accuracy ratio:
   ```typescript
   const activePlayers = players.filter((p) => !p.isKnockedOut && p.hp > 0);
   const correctPlayers = activePlayers.filter((p) => votes[p.id] === correctAnswer);
   const incorrectPlayers = activePlayers.filter((p) => votes[p.id] !== correctAnswer);
   const correctCount = correctPlayers.length;
   const activeCount = activePlayers.length;
   const ratio = activeCount > 0 ? correctCount / activeCount : 0;

   let bossDamage = 0;
   let playerRecoilDamage = 0;

   if (activeCount === 0) {
     bossDamage = 0;
     playerRecoilDamage = 0;
   } else if (ratio === 1) {
     bossDamage = 100;
     playerRecoilDamage = 0;
   } else if (ratio >= 0.75) {
     bossDamage = 60;
     playerRecoilDamage = 25;
   } else if (ratio >= 0.5) {
     bossDamage = 25;
     playerRecoilDamage = 25;
   } else if (ratio >= 0.25) {
     bossDamage = 0;
     playerRecoilDamage = 25;
   } else {
     bossDamage = 0;
     playerRecoilDamage = 30;
   }
   if (incorrectPlayers.length === 0) {
     playerRecoilDamage = 0;
   }
   ```
3. Implement `src/context/GameContext.tsx`: React Context + Reducer pattern managing state (`phase`, `players`, `boss`, `timer`, `currentQuestion`, `votes`).
4. Implement UI components:
   - `src/components/PromptLab.tsx`: Prompt Lab UI (`data-testid="prompt-lab"`, textarea `data-testid="prompt-input"`, upload PDF button `data-testid="upload-pdf-button"`, submit button `data-testid="start-raid-button"`).
   - `src/components/BossCard.tsx`: Boss HP bar (`data-testid="boss-hp-bar"`), Boss HP text (`data-testid="boss-hp"`).
   - `src/components/PlayerCard.tsx`: Player status & voting buttons (`data-testid="player-card-{id}"`, `data-testid="player-hp-{id}"`, `data-testid="vote-button-{player.id}-{option}"`), disabled when `hp <= 0` or `isKnockedOut`.
   - `src/components/Timer.tsx`: 60-second timer (`data-testid="timer"`).
   - `src/components/BossArena.tsx`: Boss Raid Arena container (`data-testid="boss-arena"`), displaying Boss, Timer, 4 Players, voting controls, and round resolution.
5. Refactor `src/App.tsx`: Main App rendering `GameProvider` and conditionally rendering `PromptLab` or `BossArena` based on `phase`.
6. Update test files `src/__tests__/gameEngine.test.ts`, `src/__tests__/e2e_requirements.test.tsx`, and `src/__tests__/empirical_challenger.test.tsx` so all tests reflect active ratio scoring and real `App.tsx` rendering. Add agent-notes metadata to all new/edited files.
7. Run `npm run build` and `npx vitest run` to verify build and test suite pass cleanly.
8. Write your handoff report in `/home/maady/learning/prompt-royale/.agents/worker_m2/handoff.md` and send a message to parent orchestrator with build & test command outputs.
