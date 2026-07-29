# Technical Context & Requirements — PromptRoyale

## Overview
PromptRoyale is a gamified, multiplayer study and quiz arena where students team up to defeat AI bosses by answering questions generated from their class notes.

## Workspace Directories
- Project Source & Tests Directory: `/home/maady/teamwork_projects/prompt_royale`
- Orchestrator Agent Directory: `/home/maady/learning/prompt-royale/.agents/orchestrator`
- Original Request Document: `/home/maady/teamwork_projects/prompt_royale/ORIGINAL_REQUEST.md`

## Functional Requirements Summary

### R1. Core Game Loop (Boss Raid Arena Prototype)
- Functional React prototype simulating a 4-player team battle in a single browser window.
- UI elements:
  - Boss HP (starts at 1000)
  - 4 simulated players (HP starts at 100 each)
  - 60-second timer
  - Multiple-choice voting buttons for each player
- Damage Scoring Logic:
  - 4/4 correct: 100 damage to Boss, 0 damage to players.
  - 3/4 correct: 60 damage to Boss, 25 recoil damage to the 1 wrong player.
  - 2/4 correct: 25 damage to Boss, 25 recoil damage to the 2 wrong players.
  - 0/4 correct: 30 damage to all 4 players (0 damage to Boss).

### R2. AI Game Master & Student Prompt Lab (Simulated)
- Mock interface for Prompt Lab:
  - Text input to "restyle notes"
  - Button to simulate uploading a PDF
- Processing flow:
  - Upon submission, simulate AI processing
  - Transition to Boss Raid Arena with mock multiple-choice questions

### R3. Knockout Mechanics
- When a player reaches 0 HP, their voting buttons are disabled for subsequent questions.

## Acceptance Criteria & Automated Testing
1. 4/4 correct votes reduce Boss HP by 100 and Player HP by 0.
2. 3/4 correct votes reduce Boss HP by 60 and incorrect player HP by 25.
3. 2/4 correct votes reduce Boss HP by 25 and incorrect players' HP by 25.
4. 0/4 correct votes reduce all players' HP by 30.
5. Application successfully runs locally and renders Boss Raid Arena with 4 simulated player interfaces.
6. Player reaching 0 HP can no longer submit votes (disabled UI / logic).
7. Prompt Lab interface presence (text input + simulate upload button) and transition to Arena state.

## Operational Discipline & Integrity
- Integrity Mode: development
- Zero tolerance for test result hardcoding, dummy facades, or fake assertions.
- Verification requires full build pass, test pass, reviewer approval, challenger confirmation, and clean forensic audit.
