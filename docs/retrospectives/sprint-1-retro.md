# Sprint 1 Retrospective

## Overview
Sprint 1 focused on building the core engine and MVP mechanics of PromptRoyale, validating our "Minimalist Focus Mode" design, and proving out the asynchronous AI generation architecture.

## What Went Well
- TDD Red-Green-Refactor process was strictly followed and yielded 100% path coverage for the core game logic engine.
- Successfully implemented the Async Pipeline, avoiding the < 2.0s latency trap by pre-generating Question Banks.
- Reached consensus quickly on relying on the Discord API instead of building custom WebRTC solutions.

## What Didn't Go Well / Lessons Learned
- **Framework Alignment:** We built Express endpoints within a Next.js App Router codebase, which caused testing and deployment mismatches. In the future, we must stick to the selected framework's conventions (Next.js API Routes).
- **Security Oversights:** We initially accepted file uploads directly into memory without bounding size or validating file types. This was caught during code review but could have led to a DoS vulnerability.
- **Next.js Static Generation:** Next.js tries to statically evaluate API routes by default during `next build`. We learned that streaming endpoints (like SSE) must be marked with `export const dynamic = 'force-dynamic';` to prevent 60-second build timeouts.

## Architecture Gate Compliance
- 2/2 ADRs (0002 and 0003) had Wei debates tracked in `2026-07-29-prompt-royale-debate.md`.
- 0 architectural decisions were made without ADRs.

## Board Compliance
- 3/3 items followed the full status flow (In Progress -> In Review -> Done).
- 0 items skipped statuses.

## Operational Baseline Audit (Sprint 1)

### Ines: Operational Concerns
| Concern | Status | Finding |
|---------|--------|---------|
| Logging | Below | No dedicated logging module configured yet. |
| Error UX | Below | Basic error handling in API, but no unified error wrapper. |
| Config | Below | No schema validation (Zod) for environment config. |

*Note: As this is Sprint 1, the Below-Foundation status is not blocking. Grace will create P1 work items to address these concerns in the upcoming sprints.*

### Diego: README 5-Minute Test
- **Result:** Pass
- **Issues found:** None. The Next.js application builds successfully without errors.
