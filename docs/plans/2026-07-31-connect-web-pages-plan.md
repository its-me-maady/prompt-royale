# Plan: Connect Web Pages (Navigation Structure)

<!-- agent-notes: { ctx: "Plan for connecting Next.js routes and adding navigation", deps: ["apps/web/src/app/page.tsx", "apps/web/src/app/layout.tsx"], state: "active", last: "pat@2026-07-31" } -->

## 1. Goal
Establish a cohesive navigation structure connecting all distinct sections of the PromptRoyale application: Professor Knowledge Base Ingestion, Prompt Lab, and the upcoming Boss Raid Arena.

## 2. Constraints
- Use standard Next.js `next/link` for client-side routing.
- Maintain the premium, "wow-factor" dark-mode aesthetics (glassmorphism, gradients, micro-animations) requested in the project guidelines.

## 3. Architecture Gate Items
**None.** This work consists entirely of standard Next.js UI routing and layout scaffolding. It does not introduce new data models, integrations, or system patterns.

## 4. Approach
1.  **Phase 3: Implementation (Sato + Dani)**
    *   **Step 1:** Create `apps/web/src/app/professor/page.tsx` and embed the existing `UploadForm` component within it.
    *   **Step 2:** Scaffold placeholder pages for `apps/web/src/app/lobby/page.tsx` and `apps/web/src/app/arena/page.tsx` to prevent 404s.
    *   **Step 3:** Overhaul `apps/web/src/app/page.tsx` (Home Page) to act as a visually stunning central hub with clear cards/links to:
        *   **Professor Portal** (`/professor`)
        *   **Prompt Lab** (`/prompt-lab`)
        *   **Boss Raid Arena** (`/lobby`)
    *   **Step 4:** Implement a global navigation bar (Header) in `apps/web/src/app/layout.tsx` so users can traverse between features without relying solely on browser back buttons.

## 5. Personas Involved
- **Dani (Design/UX):** To ensure the navigation and home hub look premium, vibrant, and interactive.
- **Sato (Implementation):** To implement the Next.js routes and layouts.

## 6. Open Questions
- Do we need role-based access control (RBAC) on the navigation links right now? (e.g., hiding `/professor` from students). *Assumption: We will just expose all links for now during development, to be secured later.*

## 7. Acceptance Criteria
- [ ] The Home page (`/`) displays styled entry points to all three main app areas.
- [ ] A global Header exists providing consistent navigation across all pages.
- [ ] Clicking the "Professor Portal" link takes the user to `/professor` where `UploadForm` is rendered.
- [ ] No navigation links lead to a 404 error.
