# Discovery Phase Tracking
**Date:** 2026-07-29
**Topic:** PromptRoyale Core Platform
**Prior Phase:** None

## Vision
Transform exam preparation into a multiplayer, team-based "Boss Fight". PromptRoyale turns solitary study sessions into 4-player cooperative raids where squads defeat AI bosses using their course knowledge, heavily prioritizing gamification and engagement.

## Goals
- **Engagement:** 75%+ of registered students join 2+ raids per week.
- **Retention:** 80% completion rate for study topics (far exceeding the 35% industry average).
- **Outcomes:** 15% average increase in test scores after 4+ raids.
- **Growth:** 1,000 active monthly users within 60 days of launch.

## Constraints & Architecture Decisions
- **AI Latency:** Full PDF parsing and Question Bank generation is decoupled and happens asynchronously in the background. Live AI generation is strictly limited to short, dynamic combat narratives (< 2.0s latency).
- **Communication:** MVP strictly relies on the Discord API (auto-generated voice channel invites) to handle voice and text chat, avoiding native WebRTC complexity.
- **Revive Mechanics:** "Hard-mode" is explicitly defined as Concept Synthesis and Application (combining two concepts, no simple definitions, plausible distractors), ensuring gameplay feels fair rather than punishing with obscure trivia.

## Key Insights
- The product leans heavily into gaming terminology and psychology (HP, Bosses, Critical Strikes, Save Throws, Recoil Damage).
- MVP scoping is pragmatic—willing to offload complex features (chat) to established platforms (Discord) to maintain focus on the core voting and damage loop.
