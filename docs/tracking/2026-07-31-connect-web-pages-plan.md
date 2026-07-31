# Connect Web Pages (Navigation Structure) Plan

<!-- agent-notes: { ctx: "Tracking artifact for navigation structure plan", deps: ["docs/plans/2026-07-31-connect-web-pages-plan.md"], state: "active", last: "pat@2026-07-31" } -->

## Metadata
*   **Date:** 2026-07-31
*   **Topic:** Connect Web Pages (Navigation Structure)
*   **Prior Phase:** None

## Summary
### Goals
Establish a cohesive navigation structure connecting all distinct sections of the PromptRoyale application: Professor Knowledge Base Ingestion (`/professor`), Prompt Lab (`/prompt-lab`), and the upcoming Boss Raid Arena (`/lobby`, `/arena`).

### Approach
1.  Create `/professor` route and embed the existing `UploadForm` component.
2.  Scaffold placeholder pages for `/lobby` and `/arena` to prevent 404s.
3.  Overhaul the Home Page (`/`) to act as a visually stunning central hub with clear cards/links to the features.
4.  Implement a global navigation bar (Header) in `layout.tsx`.

### Key Constraints
- Use standard Next.js `next/link` for client-side routing.
- Maintain the premium, "wow-factor" dark-mode aesthetics (glassmorphism, gradients, micro-animations) requested in the project guidelines.

### Acceptance Criteria
- [ ] The Home page (`/`) displays styled entry points to all three main app areas.
- [ ] A global Header exists providing consistent navigation across all pages.
- [ ] Clicking the "Professor Portal" link takes the user to `/professor` where `UploadForm` is rendered.
- [ ] No navigation links lead to a 404 error.
