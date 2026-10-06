---
agent-notes: { ctx: "implementation tracking for threat model, config manifest, tech debt update, dependency cleanup, font hosting, and lint enforcement", deps: ["docs/threat-model.md", "docs/config-manifest.md", "docs/tech-debt.md", "apps/web/package.json", "apps/web/src/app/layout.tsx", ".github/workflows/ci.yml"], state: complete, last: "sato@2026-09-20" }
---

# Implementation: Docs and Cleanup Pass

**Date:** 2026-09-20  
**Lead:** sato  
**Status:** Complete  
**Prior Phase:** [Boss Raid Arena Race Condition Fixes](file:///home/maady/learning/prompt-royale/docs/tracking/2026-09-16-raid-race-condition-fixes-implementation.md)

## Key Decisions

1. **Threat Model Canonicalization:** Replaced template in `docs/threat-model.md` with complete PromptRoyale threat model, including a comprehensive Mermaid Data Flow Diagram (DFD), explicit trust boundaries (anonymous session boundary TB-1, RAG indirect prompt injection boundary TB-2, RLS and RPC write boundary TB-3, and LLM API key boundary TB-4), STRIDE matrix across all system components, attack surface inventory, and open risk registry.
2. **Configuration Manifest Alignment:** Documented all required and optional/fallback environment variables in `docs/config-manifest.md` based on `.env.example`, `docs/runbooks/production-deployment.md`, `apps/web/src/services/llm.ts`, and `apps/web/src/lib/db/supabase.ts`. Documented secret rotation policies and drift detection procedures.
3. **Technical Debt TD-001 Resolution:** Updated TD-001 in `docs/tech-debt.md` from Pending to Resolved, documenting the live Google Gemini primary LLM integration with Groq (`llama3-8b-8192`) fallback and contextual grounded static fallback responses.
4. **Dead Dependency Removal:** Removed unused packages (`express`, `multer`, `@types/express`, `@types/multer`, `supertest`, `@types/supertest`) from `apps/web/package.json` after confirming zero references in `src/` and `test/`, reducing bundle and install footprint.
5. **Font Hosting Strategy:** Replaced `next/font/google` in `apps/web/src/app/layout.tsx` with the default Tailwind CSS font-sans system stack (`ui-sans-serif, system-ui, sans-serif`). This eliminates external network requests during font loading and avoids checking binary font files into the git repository.
6. **Strict Lint Enforcement:** Added `eslint` (`^8.57.0`) and `eslint-config-next` (`14.2.5`) matching the installed Next.js version to `apps/web/package.json`. Turborepo and `apps/web` now enforce Next.js Core Web Vitals linting rules across all workspaces.

## Artifacts Produced

- **Threat Model:** `docs/threat-model.md`
- **Config Manifest:** `docs/config-manifest.md`
- **Tech Debt Register:** `docs/tech-debt.md`
- **App Layout:** `apps/web/src/app/layout.tsx`
- **Dependencies & Lockfile:** `apps/web/package.json`, `pnpm-lock.yaml`

## Verification

- `pnpm run lint`: Passed across all packages with 0 errors.
- `pnpm test`: 23 test suites passed (100 / 100 tests passed, 100% success rate).
- `pnpm run build`: Production Next.js build compiled successfully (20 / 20 static pages generated).

## Open Questions

- None

## Next Phase

- Sprint review and release tagging.
