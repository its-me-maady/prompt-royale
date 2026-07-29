# PromptRoyale Specification & Requirements Mining Analysis

**Target Project:** `PromptRoyale` (`/home/maady/teamwork_projects/prompt_royale`)  
**Assigned Scope:** R1 (Boss Raid Arena), R2 (AI Game Master & Student Prompt Lab), R3 (Knockout Mechanics), Acceptance Criteria 28–36  
**Author:** Requirements & Spec Miner 3  
**Date:** 2026-07-29  

---

## 1. Executive Summary

PromptRoyale is a gamified, multiplayer study and quiz arena prototype where students team up in a single browser window to defeat AI bosses by answering questions generated from their class notes.

This specification analysis mines all explicit requirements, implicit behaviors, mathematical formulas, state machine transitions, UI/UX contracts, and automated testing criteria for:
- **R1: Core Game Loop (Boss Raid Arena Prototype)** – 4-player local co-op battle against a 1000 HP Boss, individual player health bars (100 HP each), 60-second timer, voting interfaces, and exact damage/recoil mechanics.
- **R2: AI Game Master & Student Prompt Lab** – Restyle prompt input, mock PDF file upload, simulated AI processing state, and transition to the Arena with generated mock questions.
- **R3: Knockout Mechanics** – 0 HP knockout condition disabling voting buttons for subsequent questions.
- **Acceptance Criteria 28–36** – Automated test verifications for all damage rules, local rendering validation, knockout state verification, and Prompt Lab transition verification.

---

## 2. Comprehensive Requirements Breakdown

### R1. Core Game Loop (Boss Raid Arena Prototype)

#### R1.1 Initial Arena State
- **Boss Starting Health**: `1000 HP` (Maximum HP = 1000, Minimum HP = 0).
- **Player Count**: Exactly 4 simulated players (`Player 1`, `Player 2`, `Player 3`, `Player 4`).
- **Player Starting Health**: `100 HP` each (Maximum HP = 100, Minimum HP = 0).
- **Round Timer**: 60-second countdown timer (`60s`) per question/round.
- **Multiple-Choice Voting Interface**: Independent voting buttons (Options A, B, C, D) rendered simultaneously for each of the 4 players in a single browser window.

#### R1.2 Damage Scoring Logic
When all active players submit votes or timer expires:
- **4 out of 4 correct votes**:
  - Boss HP Reduction: `100 HP`
  - Player HP Reduction: `0 HP` (No recoil damage to any player)
- **3 out of 4 correct votes**:
  - Boss HP Reduction: `60 HP`
  - Player HP Reduction: `25 HP` recoil damage strictly applied to the **1 incorrect player**. Correct players take `0 HP` damage.
- **2 out of 4 correct votes**:
  - Boss HP Reduction: `25 HP`
  - Player HP Reduction: `25 HP` recoil damage applied strictly to the **2 incorrect players**. Correct players take `0 HP` damage.
- **0 out of 4 correct votes**:
  - Boss HP Reduction: `0 HP`
  - Player HP Reduction: `30 HP` damage applied to **all 4 players**.

---

### R2. AI Game Master & Student Prompt Lab (Simulated)

#### R2.1 Prompt Lab Interface
- **Text Prompt Input**: Text input/textarea allowing students to enter custom notes restyling instructions (e.g. *"Restyle my biology notes into a dragon boss raid"*).
- **PDF Upload Mock**: Button/file input control labeled *"Upload PDF Class Notes"* or *"Simulate PDF Upload"*. Selecting or clicking displays mock PDF state (e.g. file badge `"biology_ch4_notes.pdf"`).
- **Submission Action**: Action button (*"Generate Boss Raid"* / *"Start Raid"*) to initiate processing.

#### R2.2 Simulated Processing & Transition
- **AI Processing State**: Displays loading indicator / status message (*"AI Game Master is parsing notes and generating boss questions..."*).
- **Arena Transition**: Automatically transitions application state from `PROMPT_LAB` view to `BOSS_RAID_ARENA` view upon processing completion, populating active questions.

---

### R3. Knockout Mechanics

#### R3.1 Knockout Threshold & State
- **Trigger Condition**: When a player's HP reaches `0` (`player.hp <= 0`), their status changes to `KNOCKED_OUT`.
- **Button Disabling**: All voting buttons for that player MUST be disabled (`disabled={true}`) for all subsequent questions.
- **Visual Feedback**: Player health bar shows `0 / 100`, status badge indicates `"KNOCKED OUT"`, and voting controls are rendered inactive/grayed out.

---

### Acceptance Criteria Mapping (AC 28–36)

| AC # | Description | Target Component / Module | Verification Method |
|------|-------------|---------------------------|---------------------|
| **AC 28** | Automated test verifies 4/4 correct votes reduce Boss HP by 100 and Player HP by 0 | `BossRaidArena` / Damage Logic | React Testing Library / Vitest unit test |
| **AC 29** | Automated test verifies 3/4 correct votes reduce Boss HP by 60 and incorrect player HP by 25 | `BossRaidArena` / Damage Logic | React Testing Library / Vitest unit test |
| **AC 30** | Automated test verifies 2/4 correct votes reduce Boss HP by 25 and incorrect players' HP by 25 | `BossRaidArena` / Damage Logic | React Testing Library / Vitest unit test |
| **AC 31** | Automated test verifies 0/4 correct votes reduce all players' HP by 30 | `BossRaidArena` / Damage Logic | React Testing Library / Vitest unit test |
| **AC 32** | Core mechanics unit test suite integration | Damage Scoring Module | Test Suite Execution |
| **AC 33** | UI rendering & state isolation test suite | UI Test Runner | Component Render Tests |
| **AC 34** | Local application runs and renders Boss Raid Arena with 4 simulated player interfaces | `App` / `BossRaidArena` | Component Integration Test / Render Test |
| **AC 35** | Test verifies player reaching 0 HP can no longer submit votes | `PlayerCard` / Voting Controls | React Testing Library user interaction test |
| **AC 36** | Test verifies presence of Prompt Lab interface (text input + PDF button) and transition to Arena state | `PromptLab` / `App` State | React Testing Library workflow test |

---

## 3. Mathematical & Logical Formulas

### 3.1 Damage Calculation Function

Given:
- $N_{\text{active}}$: Number of active (non-knocked-out) players submitting votes ($0 \le N_{\text{active}} \le 4$).
- $V_{\text{correct}}$: Number of correct votes cast ($0 \le V_{\text{correct}} \le N_{\text{active}}$).
- $\text{IsCorrect}_i \in \{0, 1\}$: Flag indicating whether Player $i$ voted correctly.

$$\text{BossDamage}(V_{\text{correct}}) = \begin{cases} 
100 & \text{if } V_{\text{correct}} = 4 \\
60 & \text{if } V_{\text{correct}} = 3 \\
25 & \text{if } V_{\text{correct}} = 2 \\
0 & \text{if } V_{\text{correct}} = 1 \text{ or } 0 
\end{cases}$$

$$\text{PlayerDamage}_i(V_{\text{correct}}, \text{IsCorrect}_i) = \begin{cases} 
0 & \text{if } V_{\text{correct}} = 4 \\
25 \cdot (1 - \text{IsCorrect}_i) & \text{if } V_{\text{correct}} \in \{2, 3\} \\
30 & \text{if } V_{\text{correct}} = 0 \text{ or } (V_{\text{correct}} = 1 \text{ and } \text{IsCorrect}_i = 0)
\end{cases}$$

### 3.2 Health Clamping State Update

$$\text{BossHP}_{\text{new}} = \max(0, \text{BossHP}_{\text{current}} - \text{BossDamage})$$

$$\text{PlayerHP}_{i, \text{new}} = \max(0, \text{PlayerHP}_{i, \text{current}} - \text{PlayerDamage}_i)$$

---

## 4. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| F1 | Setup | Initial Boss State | Boss initialized with 1000 HP and visual health bar | Game Start trigger | Boss HP = 1000 | Clamp HP to 0 if negative | R1 Spec |
| F2 | Setup | Initial Player State | 4 players initialized with 100 HP each | Game Start trigger | 4 Player Cards with 100 HP | Clamp HP to 0 if negative | R1 Spec |
| F3 | Gameplay | 60s Round Timer | Countdown timer per question starting at 60s | Question start event | Real-time countdown UI | Auto-resolve round at 0s | R1 Spec |
| F4 | Gameplay | 4/4 Perfect Score | 4 correct votes deal 100 damage to Boss, 0 to players | 4 correct votes | Boss HP -100, Players HP -0 | N/A | R1 & AC 28 |
| F5 | Gameplay | 3/4 High Score | 3 correct votes deal 60 damage to Boss, 25 recoil to 1 wrong player | 3 correct, 1 wrong vote | Boss HP -60, Wrong Player HP -25 | N/A | R1 & AC 29 |
| F6 | Gameplay | 2/4 Split Score | 2 correct votes deal 25 damage to Boss, 25 recoil to 2 wrong players | 2 correct, 2 wrong votes | Boss HP -25, 2 Wrong Players HP -25 | N/A | R1 & AC 30 |
| F7 | Gameplay | 0/4 Wipe Score | 0 correct votes deal 0 damage to Boss, 30 damage to all players | 4 wrong votes | Boss HP -0, All Players HP -30 | N/A | R1 & AC 31 |
| F8 | Mechanics | Player Knockout | Reaching 0 HP disables player voting buttons permanently | Player HP = 0 | Disabled voting buttons, KO status badge | Prevent further vote submissions | R3 & AC 35 |
| F9 | UI | Prompt Lab Screen | Input text prompt and mock PDF upload button | Prompt string, PDF file mock | Prompt Lab UI rendered | Highlight empty required prompt | R2 & AC 36 |
| F10 | Workflow | AI Processing Simulation | Simulated loading state when generating boss questions from notes | Submit Prompt event | Spinner / Loading indicator | Handle submission timeout | R2 & AC 36 |
| F11 | Workflow | State Transition to Arena | Switch screen view from Prompt Lab to Boss Raid Arena | Processing complete trigger | Arena UI displayed with active round | Fallback to default mock questions | R2 & AC 36 |
| F12 | Game Over | Boss Defeat Victory | Victory screen displayed when Boss HP reaches 0 | Boss HP = 0 | Victory modal/overlay | Freeze timer and disable voting | Implicit Game Logic |
| F13 | Game Over | Party Wipe Defeat | Defeat screen displayed when all 4 players reach 0 HP | All Players HP = 0 | Defeat modal/overlay | Freeze timer and disable voting | Implicit Game Logic |

---

## 5. Edge Cases

| # | Feature | Input / Scenario | Observed / Expected Behavior |
|---|---------|------------------|------------------------------|
| E1 | Damage Logic | 1 out of 4 correct votes cast | Boss HP reduced by 0; 3 wrong players take 25 (or 30) recoil damage |
| E2 | Knockout Logic | Player HP drops to -10 from heavy hit | HP clamped to 0 (`Math.max(0, hp)`), player marked KO immediately |
| E3 | Knockout Voting | Player KO'd in Round 1 attempts to vote in Round 2 | All option buttons for KO'd player are `disabled={true}`; vote cannot be registered |
| E4 | Timer Expiration | 60-second timer hits 0 before all players submit votes | Unvoted players auto-marked as incorrect or unsubmitted; round auto-resolves damage |
| E5 | Partial Team KO | 2 players KO'd, 2 remaining vote correct | Damage formula evaluates votes relative to active voters or total team size 4 |
| E6 | Overkill Damage | Boss HP is 15, team hits 4/4 correct (100 dmg) | Boss HP clamped to 0 (`Math.max(0, bossHP)`), triggering Victory screen |
| E7 | Prompt Lab Input | User submits Prompt Lab with empty prompt text | Prompt Lab uses default prompt ("AP Biology Boss Raid") and allows transition |
| E8 | PDF Upload Mock | User clicks PDF Upload multiple times | PDF upload mock state updates cleanly to show selected PDF file name |

---

## 6. UI/UX & Component Architecture Expectations

```
+-----------------------------------------------------------------------+
|                              PROMPT LAB                               |
|                                                                       |
|  [ Text Area: "Restyle notes into a dragon boss battle..." ]          |
|  [ Button: "Upload PDF Class Notes (biology_notes.pdf)" ]            |
|  [ Action Button: "Generate Boss Raid Arena" ]                        |
+-----------------------------------------------------------------------+
                                  |
                                  v (Simulated Processing / Spinner)
+-----------------------------------------------------------------------+
|                           BOSS RAID ARENA                             |
|                                                                       |
|  +-----------------------------------------------------------------+  |
|  | BOSS: AI Knowledge Dragon    HP: [████████████████████] 1000/1000  |  |
|  +-----------------------------------------------------------------+  |
|  | TIMER: 00:60                                                   |  |
|  | QUESTION 1: What is the primary function of mitochondria?       |  |
|  +-----------------------------------------------------------------+  |
|                                                                       |
|  +---------------+ +---------------+ +---------------+ +---------------+  |
|  | Player 1      | | Player 2      | | Player 3      | | Player 4      |  |
|  | HP: 100/100   | | HP: 100/100   | | HP: 100/100   | | HP: 0/100 (KO)|  |
|  | [A] [B] [C] [D| | [A] [B] [C] [D| | [A] [B] [C] [D| | [DISABLED]    |  |
|  +---------------+ +---------------+ +---------------+ +---------------+  |
+-----------------------------------------------------------------------+
```

---

## 7. Automated Testing Strategy for AC 28–36

### Unit Test Verification Specs (React Testing Library / Vitest)

1. **AC 28 (4/4 Correct Damage Test)**:
   - Render `BossRaidArena` with initial state (Boss: 1000, P1-P4: 100).
   - Simulate all 4 players selecting the correct answer option (e.g. Option A).
   - Trigger answer resolution / submit.
   - Assert `Boss HP` text/bar equals `900`.
   - Assert `Player 1-4 HP` equals `100`.

2. **AC 29 (3/4 Correct Damage Test)**:
   - Simulate P1, P2, P3 selecting correct option, P4 selecting wrong option.
   - Trigger resolution.
   - Assert `Boss HP` equals `940` (1000 - 60).
   - Assert P1, P2, P3 HP equal `100`.
   - Assert P4 HP equals `75` (100 - 25).

3. **AC 30 (2/4 Correct Damage Test)**:
   - Simulate P1, P2 selecting correct option, P3, P4 selecting wrong option.
   - Trigger resolution.
   - Assert `Boss HP` equals `975` (1000 - 25).
   - Assert P1, P2 HP equal `100`.
   - Assert P3, P4 HP equal `75` (100 - 25).

4. **AC 31 (0/4 Correct Damage Test)**:
   - Simulate all 4 players selecting wrong options.
   - Trigger resolution.
   - Assert `Boss HP` equals `1000` (1000 - 0).
   - Assert P1, P2, P3, P4 HP equal `70` (100 - 30).

5. **AC 34 (Local Arena Rendering Test)**:
   - Render application in Arena view.
   - Assert 4 distinct player controls/cards are rendered in the DOM.
   - Assert Boss HP bar and timer elements are present.

6. **AC 35 (Knockout Voting Disabled Test)**:
   - Set P1 HP to `0`.
   - Re-render / advance to next question.
   - Assert P1 voting buttons have `disabled` attribute (`toBeDisabled()`).
   - Attempt click on P1 voting button; assert vote state does not update.

7. **AC 36 (Prompt Lab & Transition Test)**:
   - Render `App` in initial state (`PromptLab`).
   - Assert prompt text input and PDF upload button exist.
   - Enter prompt text, click PDF upload button, click generate button.
   - Assert transition state / loading state.
   - Assert `BossRaidArena` component is rendered in DOM.
