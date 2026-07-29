# Original User Request

## 2026-07-29T05:13:43Z

PromptRoyale: A gamified, multiplayer study and quiz arena where students team up to defeat AI bosses by answering questions generated from their class notes.

Working directory: ~/teamwork_projects/prompt_royale
Integrity mode: development

## Requirements

### R1. Core Game Loop (Boss Raid Arena Prototype)
Build a functional React prototype simulating a 4-player team battle in a single browser window. The UI must display Boss HP (starting at 1000), individual health bars for 4 simulated players (starting at 100 each), a 60-second timer, and multiple-choice voting buttons for each player. Implement the specific damage scoring logic:
- 4/4 correct: 100 damage to Boss, 0 damage to players.
- 3/4 correct: 60 damage to Boss, 25 recoil damage to the 1 wrong player.
- 2/4 correct: 25 damage to Boss, 25 recoil damage to the 2 wrong players.
- 0/4 correct: 30 damage to all 4 players.

### R2. AI Game Master & Student Prompt Lab (Simulated)
Implement a mock interface for the Prompt Lab where a user can input a text prompt to "restyle notes" and simulate uploading a PDF. Upon submission, the system should simulate AI processing and transition to the Boss Raid Arena with mock multiple-choice questions.

### R3. Knockout Mechanics
If a player reaches 0 HP, their voting buttons should be disabled for subsequent questions.

## Acceptance Criteria

### Core Mechanics Verification
- [ ] Automated tests (e.g., using React Testing Library or Playwright) exist and programmatically verify that 4/4 correct votes reduce Boss HP by 100 and Player HP by 0.
- [ ] Automated tests programmatically verify that 3/4 correct votes reduce Boss HP by 60 and the incorrect player's HP by 25.
- [ ] Automated tests programmatically verify that 2/4 correct votes reduce Boss HP by 25 and the incorrect players' HP by 25.
- [ ] Automated tests programmatically verify that 0/4 correct votes reduce all players' HP by 30.

### UI Validation
- [ ] The application successfully runs locally and renders the Boss Raid Arena with 4 simulated player interfaces.
- [ ] A test verifies that a player reaching 0 HP can no longer submit votes.
- [ ] A test verifies the presence of the Prompt Lab interface (text input and simulate upload button) and its transition to the Arena state.
