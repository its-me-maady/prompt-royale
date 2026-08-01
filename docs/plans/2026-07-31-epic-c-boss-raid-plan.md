---
agent-notes:
  ctx: "implementation plan for Epic C: Boss Raid Arena Gamification"
  deps: ["docs/methodology/personas.md", "docs/methodology/phases.md"]
  state: "active"
  last: "coordinator@2026-07-31"
---

# Plan: Epic C - Boss Raid Arena Gamification

## 1. Goal
Implement Epic C: Boss Raid Arena Gamification. This involves an asymmetric team-based game mode where a squad of 4 students (100 HP each) battles an AI Boss (1,000 HP). Students have 60 seconds to debate via Discord and lock in their answers. Damage dealt to the boss scales with team consensus (0-4 votes). It also features a revive mechanic utilizing AI-generated hard-mode synthesis questions.

## 2. Constraints
- Must use Supabase.
- Visual polish is non-negotiable (Dark mode, glassmorphism, dynamic gradients, micro-animations).
- Real-time game state synchronization is required for the 60-second Boss Raid loops.
- Avoid clunky UI or confusing interactions; the user base has zero patience.

## 3. Architecture Gate Items
**Requires Architecture Gate: ADR + Wei debate before implementation.**

- **Boss Raid Game State Machine:**
  - *Why it's architectural:* We need to decide how to handle real-time synchronization of the 60-second loop (Supabase Realtime vs. Next.js SSE vs. WebSockets). We also need to define the exact state transitions (lobby -> battle -> vote lock -> damage calculation -> knockout -> revive) and how concurrent voting mutations are handled safely without race conditions.

## 4. Approach

### Phase 2: Architecture (Archie + Wei)
1. **Archie:** Draft ADR for Boss Raid Game State (focusing on real-time sync method and state machine schema).
2. **Wei:** Challenge the ADR (e.g., handling network drops during the 60s window, race conditions on damage calculations).
3. Finalize and merge ADR before proceeding.

### Phase 3: Implementation (Tara + Sato)
1. **Tara (Red Phase):** Write tests for battle logic (damage calculation based on consensus, player/boss HP limits, revive mechanics).
2. **Sato (Green Phase):** Implement the real-time state synchronization based on the approved ADR.
3. **Sato (Green Phase):** Build the UI for the Squad lobby, countdown timers, voting buttons, and HP bars (ensuring strict adherence to the premium aesthetic mandate).
4. **Sato (Green Phase):** Implement the AI-generated "Hard-Mode" revive question logic.
5. **Code Review:** Multi-lens review (Vik, Tara, Pierrot) with a special focus from Dani on UI/UX polish and accessibility.

## 5. Personas Involved
- **Archie:** System design and ADR authorship for game state synchronization.
- **Wei:** Challenger for architecture choices during the Architecture Gate.
- **Tara:** Test-Driven Development (Red phase), writing failing tests first.
- **Sato:** Implementation (Green phase), writing production code and UI components.
- **Dani / Uma:** UI design validation, ensuring the "Rich Aesthetics" mandate is met for the Arena.
- **Vik & Pierrot:** Code review (Simplicity and Security lenses).
- **Grace:** Sprint and boundary tracking.

## 6. Open Questions
- Are squads pre-assigned, or do students form them dynamically in the lobby?
- Do we enforce exactly 4 players to start a raid, or scale boss HP if there are fewer?
- Which LLM model/prompt structure will generate the hard-mode revive questions reliably in under 2 seconds?

## 7. Acceptance Criteria
- [ ] ADR is written, debated, and merged for real-time game state synchronization.
- [ ] 4-player squads can enter a Boss Raid with real-time synchronized timers.
- [ ] Damage System correctly calculates damage/recoil based on 4/4, 3/4, 2/4, or 0/4 correct votes.
- [ ] Knockout and Revive (with AI-generated hard question) mechanisms function correctly.
- [ ] UI meets the premium aesthetics mandate (glassmorphism, micro-animations, dark mode).
- [ ] 100% test pass rate for all new game logic.
