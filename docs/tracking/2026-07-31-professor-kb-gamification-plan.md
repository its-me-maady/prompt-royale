---
agent-notes: { ctx: "Tracking artifact for KB and Gamification plan", deps: [docs/plans/professor-kb-gamification-plan.md], state: active, last: "grace@2026-07-31" }
---

# Tracking: Professor KB and Gamification Plan

**Date:** 2026-07-31
**Phase:** Planning
**Prior Phase:** None
**Next Phase:** Architecture (ADRs required)

## Goals
Plan the implementation of:
1. Professor Knowledge Base (Supabase + low-cost APIs).
2. Prompt Lab (Student consumption).
3. Boss Raid Arena (Asymmetric 4v1 real-time game loop).

## Approach Summary
All three epics involve significant architectural decisions (APIs, RAG, Real-time state). Therefore, we must run the Architecture Gate (Phase 2) with Archie and Wei before entering the TDD implementation pipeline (Phase 3) with Tara and Sato.

## Key Constraints
- Supabase for DB (including pgvector) and real-time state.
- Focus on low-cost transcription/OCR APIs.
- Real-time 60-second voting loops for gamification.

## Acceptance Criteria
- Architecture decisions documented and challenged by Wei.
- TDD implemented for KB ingestion, Prompt Lab, and Boss Raid mechanics.
- All game mechanics (damage, knockout, revive) function as designed.
