---
agent-notes:
  ctx: "Boss Raid Gamification Review"
  deps: ["apps/web/src/app/arena/page.tsx", "apps/web/src/app/api/arena/revive/route.ts", "apps/web/test/app/arena.test.tsx", "apps/web/src/services/llm.ts"]
  state: active
  last: "code-reviewer@2026-08-05"
---
<Code Review: Epic C Boss Raid Gamification>
**Date:** 2026-08-05
**Reviewed by:** Vik (simplicity), Tara (testing), Pierrot (security), Archie (conformance)
**Files reviewed:** `apps/web/src/app/arena/page.tsx`, `apps/web/src/app/api/arena/revive/route.ts`, `apps/web/test/app/arena.test.tsx`, `apps/web/src/services/llm.ts`, `apps/web/src/lib/db/supabase-client.ts`
**Verdict:** Changes requested

## Context
This PR introduces the Host-Client Inversion Model for the Boss Raid Arena using Supabase Realtime, replacing the previous SSE implementation. It also adds an AI-generated revive question feature via the Groq API and updates the testing suite to accommodate the new realtime architecture.

## Findings

### Critical
1. **Side-effects inside State Updater (Vik)**
   In `apps/web/src/app/arena/page.tsx`, `resolveRound()` is called inside the `setTimeLeft(prev => ...)` state updater function. React state updaters must be pure functions. In Strict Mode, React can invoke updaters twice, which will result in `resolveRound()` executing twice, causing double state resolutions and double network broadcasts. 
   *Fix:* Separate the timer logic from round resolution. Use a `useEffect` that watches `timeLeft` to trigger `resolveRound()` when it reaches 0, rather than embedding it inside the setter.

2. **Unauthenticated Paid API Endpoint (Pierrot)**
   The `GET /api/arena/revive` route calls the Groq LLM API but has no authentication or rate limiting. Any user can repeatedly call this endpoint, leading to an immediate Denial of Wallet by exhausting API quotas.
   *Fix:* Add authentication checks (e.g., session validation) and implement rate limiting on the route before triggering the LLM generation.

3. **Split-Brain Host Election & Interval Thrashing (Vik)**
   - The host election logic sets `setIsHost(true)` if `playersIds[0] === playerId` but never sets it to `false`. If a host's network lags and presence drops temporarily, multiple players might permanently consider themselves the host, leading to conflicting broadcast storms. Add an `else { setIsHost(false); }`.
   - The `setInterval` for the game timer is inside a `useEffect` dependent on `votes`. Every time a player votes, the interval is cleared and restarted, which resets the 1-second delay. If players vote rapidly, the timer will indefinitely stall.

### Important
1. **Severe Test Coverage Regression (Tara)**
   The PR removes existing behavioral tests for the game state and replaces them with a single dummy test that explicitly avoids testing the new logic, citing "we cannot easily test the exact realtime callback execution". The new complex state machines (host election, timer logic, voting) are completely uncovered.
   *Fix:* Refactor the tests to properly mock the Supabase channel. Simulate presence syncs and broadcast payloads to verify the state transitions programmatically.

2. **Swallowed LLM Server Errors (Ines)**
   In the `/api/arena/revive` route, errors during LLM generation are caught and returned as JSON 500s, but they are not logged on the server. This will result in silent failures in production monitoring.
   *Fix:* Add `console.error('LLM Generation failed:', error)` inside the catch block.

3. **Unhandled Edge Case in fetchQuestion (Tara / Ines)**
   If `fetchQuestion()` fails on the host, `question` remains null. The game loop will stall indefinitely because the timer and vote logic depend on `question` being present.
   *Fix:* Implement retry logic or a static fallback question if the fetch fails, or transition the game to an error state so users aren't left waiting forever.

### Suggestions
1. **Random ID Generation Mismatch (Vik)**
   `const [playerId] = useState('p' + Math.floor(Math.random() * 10000));` may cause hydration mismatches if Next.js attempts SSR. Consider initializing this in a `useEffect` or using a stable UUID strategy.

2. **Archie:** No architectural conformance issues detected. Shared types were not modified in a consumer-specific way.

## Lessons
- **React State Updaters Must Be Pure:** Never put side effects (like API calls or broadcasting events) inside a `setState(prev => ...)` function. React assumes these functions are pure and may run them multiple times without warning.
- **Always Demote, Not Just Promote:** When implementing leader election via presence sync, remember to handle demotions. Always implement the `else` case to strip privileges if a node is no longer the leader.
- **Never Mock Away the Complexity:** When a feature is hard to test, that's exactly when it needs testing the most. Mock the boundaries (like the Realtime channel) so you can synchronously drive and test the complex state machine inside your components.
</Code Review: Epic C Boss Raid Gamification>
