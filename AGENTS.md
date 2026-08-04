<!-- For a human-readable overview, see README.md and docs/template-guide.md -->
# AGENTS.md — Project Instructions for Antigravity

## Project Overview

<!-- TODO: Replace this section with your project's overview after scaffolding -->

**Project Name:** PromptRoyale
**Description:** A Gamified AI Study & Quiz Arena where students team up in squads, discuss answers via chat, and defeat AI bosses using their course knowledge.
**Tech Stack:** Next.js (React), Tailwind CSS, Turborepo, pnpm

**Codebase map:** `docs/code-map.md` — read this first to understand the package structure, public APIs, and data flow.

> **Note:** Several paths referenced below (e.g., `docs/code-map.md`, `docs/tech-debt.md`, `docs/test-strategy.md`) live under `docs/scaffolds/` until you run a scaffold command, which moves them to their final locations.

## First-Run Detection

**Check this first.** If the Project Name above is still `[Your Project Name]` or `README-template.md` exists in the repo root, this project hasn't been initialized yet. In that case:

- **Skip the Session Entry Protocol** and all process rules below — they don't apply to an empty project.
- Tell the user: "This project hasn't been initialized yet. Would you like to run `/quickstart` (5 min, gets you coding fast) or `/kickoff` (30-60 min, full discovery with architecture and board setup)?"
- Once they choose, run the command. The process rules activate after initialization.

If the project IS initialized (has a real name, `README-template.md` is gone), proceed normally with the rules below.

## Agent-Notes Protocol (MANDATORY)

Every non-excluded file must have agent-notes metadata. See `docs/methodology/agent-notes.md` for spec.

1. Every new file gets agent-notes (excluded: pure JSON, lock files, binaries).
2. Every edit updates `last` to `<agent>@<date>`.
3. `ctx` under 10 words, `deps` = direct deps only, `state` must be accurate.

## Process & Guidelines

> **Note:** Detailed rules for team methodology, critical agent workflows, and the documentation index have been modularized into `.agents/rules/` and the `docs/` folder. They will be loaded automatically when you perform related tasks.

## Tracking

<!-- tracking-adapter: github-projects -->
<!-- project-number: 3 -->
<!-- project-owner: its-me-maady -->
<!-- status-field-id: PVTSSF_lAHOCuI-cM4Bew7FzhZItps -->
<!-- status-backlog: deabd5a9 -->
<!-- status-ready: ffdba244 -->
<!-- status-in-progress: b5bd8c7f -->
<!-- status-in-review: 09a365b9 -->
<!-- status-done: 68d66a29 -->

**Adapter docs:** `docs/integrations/README.md`
**Status flow:** Backlog → Ready → In Progress → In Review → Done

Board commands, pre-flight checks, and setup instructions are in the active adapter file. Grace manages board status. Pat manages priorities.
