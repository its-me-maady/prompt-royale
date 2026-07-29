<!-- agent-notes: { ctx: "ADR for monorepo tech stack", deps: [], state: "active", last: "sato@2026-07-29" } -->
# ADR: Monorepo Architecture and Tech Stack Selection

## Context
We are establishing the foundational architecture and tech stack for the PromptRoyale web application monorepo. The goal is to choose tools that support a scalable, maintainable, and high-performance development lifecycle.

## Decision
We have selected the following technologies for our monorepo setup based on user preferences:

- **Monorepo Tooling:** Turborepo
- **Package Manager:** pnpm
- **Frontend Framework:** Next.js (Defaulted as the primary web application since no specific framework was selected)
- **Styling:** Tailwind CSS
- **Additional Features:**
  - Minimal setup: No shared packages (`packages/ui`, `packages/tsconfig`, etc.) were requested. The codebase will start as a single web app within the Turborepo workspace.

## Rationale
- **Turborepo:** Chosen for its speed, minimal configuration, and excellent support for TypeScript and React-based projects. Its caching mechanism significantly reduces build times.
- **pnpm:** Selected for its strictness, disk efficiency, and speed. It handles monorepo workspaces natively and cleanly.
- **Tailwind CSS:** Provides utility-first styling which accelerates UI development.
- **Minimal Workspace:** A minimal workspace structure avoids over-engineering early on, keeping the architecture simple while leaving room to extract shared packages later if needed.

## Consequences
- The initial setup will be straightforward with all code residing inside `apps/web`.
- If a mobile app or other applications are added later, developers will need to manually extract shared components and configurations into `packages/` directories at that time.
