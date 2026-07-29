## 2026-07-29T05:19:39Z
You are the E2E Test Suite Writer for the PromptRoyale project.
Your assigned working directory is `/home/maady/learning/prompt-royale/.agents/test_writer_e2e`.
The target project directory containing source code and tests is `/home/maady/teamwork_projects/prompt_royale`.

Tasks:
1. Read `/home/maady/teamwork_projects/prompt_royale/ORIGINAL_REQUEST.md`.
2. Design and write a comprehensive opaque-box test suite for PromptRoyale based on requirements R1, R2, R3, and Acceptance Criteria 28–36.
3. Test Tiers to cover:
   - Tier 1: Feature Coverage (4/4, 3/4, 2/4, 0/4 damage rules, Prompt Lab rendering, Arena rendering, knockout state).
   - Tier 2: Boundary & Corner Cases (Boss HP <= 0 victory threshold, Player HP <= 0 knockout threshold, 0 HP button disabling).
   - Tier 3: Cross-Feature combinations (Prompt Lab submit -> Arena state -> Multiple question turns -> Knockout persistence across rounds).
   - Tier 4: Real-world application scenario (complete battle flow from prompt input to boss defeat or team wipeout).
4. Create test files in `/home/maady/teamwork_projects/prompt_royale/src/__tests__/e2e_requirements.test.tsx` (or Vitest/RTL compatible tests).
5. Publish `TEST_READY.md` at `/home/maady/teamwork_projects/prompt_royale/TEST_READY.md` summarizing coverage, test runner command (`npx vitest run`), and feature checklist.
6. Write your handoff report in `/home/maady/learning/prompt-royale/.agents/test_writer_e2e/handoff.md` and send a message to parent orchestrator when complete.
