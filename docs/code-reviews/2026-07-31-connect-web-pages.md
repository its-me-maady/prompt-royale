---
agent-notes:
  ctx: "Connect Web Pages UI navigation changes"
  deps: ["apps/web/src/app/page.tsx", "apps/web/src/app/arena/page.tsx", "apps/web/src/app/lobby/page.tsx", "apps/web/test/app/arena.test.tsx", "apps/web/test/app/lobby.test.tsx"]
  state: active
  last: "coordinator@2026-07-31"
---
# Code Review: Connect Web Pages UI Navigation

**Date:** 2026-07-31
**Reviewed by:** Vik (simplicity), Tara (testing), Pierrot (security), Archie (conformance)
**Files reviewed:** 
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/professor/page.tsx`
- `apps/web/src/components/Header.tsx`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/arena/page.tsx`
- `apps/web/src/app/lobby/page.tsx`
- Associated test files
**Verdict:** Changes requested

## Context
This review covers the main navigational structure and page placeholders for PromptRoyale, including the Home Hub, Professor Portal, Prompt Lab, Lobby, and Boss Raid Arena. It includes the integration of Server-Sent Events (SSE) for the Arena and a basic lobby creation fetch call.

## Findings

### Critical
- **XSS Vulnerability in Link (Pierrot):** In `apps/web/src/app/lobby/page.tsx`, the `inviteLink` from the API response is rendered directly into the `href` attribute of an anchor tag without validation. If the API returns a malicious protocol (e.g., `javascript:alert(1)`), it creates an XSS vulnerability. The URL must be validated before rendering.
- **Missing Test Coverage for Active States (Tara):** `arena.test.tsx` and `lobby.test.tsx` only check the initial placeholder/loading states. There is no test coverage for the post-lobby-creation state (displaying the invite link) or the active arena state when SSE data is received. These are critical user paths.

### Important
- **No User-Facing Error Handling (Vik/Ines):** In `lobby/page.tsx`, `createLobby()` suppresses errors via `console.error(e)`. The user receives no feedback if the network request fails, leaving the UI stuck. An error state must be introduced to show an actionable message to the user.
- **Fragile State Parsing (Vik):** In `arena/page.tsx`, the SSE payload is parsed blindly: `const state = JSON.parse(event.data)`. If the payload format changes or is malformed (missing `.players` or `.boss`), the UI will crash trying to map over these properties. Implement schema validation (e.g., Zod) or optional chaining to degrade gracefully.
- **Accessibility - Buttons vs Links:** The "Start Raid" button in `lobby/page.tsx` triggers a route push (`router.push('/arena')`). For semantic HTML and accessibility, navigation elements should use Next.js `<Link>` components (which render `<a>` tags under the hood), styled as buttons.

### Suggestions
- **Redundant Client Check (Vik):** The check `typeof window !== 'undefined'` is unnecessary inside a `useEffect` hook in `arena/page.tsx`, as effects only run on the client.
- **Performance:** Heavy use of large pulsating background divs (`blur-[150px]`, `mix-blend-screen`, `animate-pulse`) could cause painting performance issues or jitter on lower-end devices. 
- **Hardcoded Placeholder Data:** `arena/page.tsx` currently has hardcoded quiz questions and answers. Make sure these are wired up to the dynamic `gameState` as the backend evolves.

## Lessons
- **Test All Component States, Not Just Mount:** A common anti-pattern is testing only the initial loading state. Always mock asynchronous data sources to test the "loaded" and "error" states to ensure actual functionality is covered.
- **Never Trust API Payloads in href:** Never place unvalidated strings originating from an API into an `href` or `src` attribute. Always validate the protocol to ensure it is safe (e.g., `http:` or `https:`).
- **Graceful Failure in UI:** Catching an error and merely logging it to the console ignores the error from the user's perspective. Always translate technical failures into informative UI states.
