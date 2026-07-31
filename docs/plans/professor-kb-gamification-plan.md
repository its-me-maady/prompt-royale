---
agent-notes: { ctx: "Implementation plan for KB, Prompt Lab, and Boss Raid gamification", deps: [docs/methodology/personas.md, docs/methodology/phases.md], state: active, last: "pat@2026-07-31" }
---

# Plan: Professor Knowledge Base, Prompt Lab, and Boss Raid Arena

## 1. Goal
Implement three massive core epics of PromptRoyale:
1. **Professor Knowledge Base:** Allow professors to upload audio, PPTs, and notes which are processed (using a low-cost transcription/OCR API) and stored in Supabase with pgvector.
2. **Prompt Lab:** An interface where students consume and query the knowledge base to ingest course material easily before raids.
3. **Boss Raid Arena:** An asymmetric team-based game mode where a squad of 4 students (100 HP each) battle an AI Boss (1,000 HP). They have 60 seconds to debate via Discord and lock in answers. Damage scales with team consensus. Features a revive mechanic with AI-generated hard-mode synthesis questions.

## 2. Constraints
- Must use Supabase (pgvector for embeddings, standard Postgres for relational state).
- Must use low-cost APIs for file transcription/processing.
- Real-time game state synchronization required for the 60-second Boss Raid loops.

## 3. Architecture Gate Items (Requires ADR + Wei Debate)
- **Knowledge Base Ingestion Pipeline:** 
  - *Why it's architectural:* Involves selecting third-party APIs for transcription/OCR, deciding how to chunk and embed diverse file types, and schema design for pgvector.
- **Prompt Lab (RAG Implementation):**
  - *Why it's architectural:* Deciding the retrieval strategy, LLM context window management, and how the Prompt Lab interfaces with the KB.
- **Boss Raid Arena Game State Machine:**
  - *Why it's architectural:* Requires real-time sync (WebSockets vs. SSE vs. Supabase Realtime). Complex state transitions (lobby -> battle -> vote lock -> damage calculation -> knockout -> revive).

## 4. Approach
### Phase 2: Architecture (Archie + Wei)
1. Draft ADR for KB Ingestion & Storage (Supabase pgvector).
2. Draft ADR for Boss Raid Game State (Supabase Realtime vs. Next.js SSE).
3. Draft ADR for Prompt Lab RAG Strategy.
4. *Wei challenges ADRs. Finalize and merge.*

### Phase 3: Implementation (Tara + Sato)
**Epic A: Knowledge Base**
1. [Tara] Write tests for file upload and processing API routes.
2. [Sato] Implement upload UI and Supabase Storage integration.
3. [Sato] Implement transcription/OCR API integration and embedding generation.

**Epic B: Prompt Lab**
1. [Tara] Write tests for RAG querying and response generation.
2. [Sato] Implement Prompt Lab UI for students.
3. [Sato] Connect UI to RAG API endpoints.

**Epic C: Boss Raid Arena**
1. [Tara] Write tests for battle logic (damage calculation, HP limits, revive mechanics).
2. [Sato] Implement real-time state synchronization for the 60-second loop.
3. [Sato] Build UI for Squad lobby, countdown timers, voting buttons, and HP bars.
4. [Sato] Implement the AI-generated "Hard-Mode" revive question logic.

## 5. Personas Involved
- **Cam:** Clarified vision (Done).
- **Archie:** System design, schemas, and ADR authorship.
- **Wei:** Challenger for architecture choices.
- **Tara:** TDD Red Phase (tests).
- **Sato:** TDD Green Phase (implementation).
- **Dani:** UI design for the Prompt Lab and Boss Raid Arena.
- **Grace:** Sprint tracking.

## 6. Open Questions
- Which specific low-cost API should we use for audio transcription (e.g., Deepgram, Groq) and PPT parsing?
- Are the squads pre-assigned, or do students form them dynamically in a lobby?

## 7. Acceptance Criteria
- [ ] Professors can upload Audio/PPT/Notes, and text is extracted, embedded, and saved in Supabase.
- [ ] Students can query the Prompt Lab to retrieve context from the uploaded materials.
- [ ] 4-player squads can enter a Boss Raid with real-time synchronized timers.
- [ ] The Damage System correctly calculates damage/recoil based on 4/4, 3/4, 2/4, or 0/4 correct votes.
- [ ] Knockout and Revive (with AI-generated hard question) mechanisms function correctly.
