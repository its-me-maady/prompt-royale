---
agent-notes: { ctx: "ADR for full edge authentication using Supabase SSR in Next.js", deps: ["apps/web/package.json", "apps/web/src/middleware.ts", "apps/web/src/app/lobby/page.tsx", "apps/web/src/app/arena/page.tsx"], state: accepted, last: "archie@2026-08-31" }
---

# ADR-0013: Edge Authentication using Supabase SSR in Next.js App Router

## Status

Accepted

## Context

Currently, route protection and user authentication checking (specifically anonymous user sign-in) for the Squad Lobby (`/lobby`) and Boss Raid Arena (`/arena`) are deferred entirely to client-side components. The components query `supabaseClient.auth.getSession()` and run `signInAnonymously()` in a React `useEffect` hook. 

This layout presents several severe architectural and security risks:
1. **Unsecured Route Access:** Unauthenticated users can load and render the code bundles for protected pages (`/lobby` and `/arena`) prior to any session checking.
2. **Flash of Unauthenticated Content (FOUC):** Users experience visible layout shifts and flickering while the client component initiates anonymous authentication.
3. **Server-Side Render Integration (SSR) Mismatch:** The App Router features Server Components and Route Handlers that run on the server. If authentication state is only managed client-side via LocalStorage, the server cannot natively read the user session to secure server-side fetching or render content dynamically.
4. **Session Expiry & Token Refresh:** When tokens expire, requests made by Server Components fail because they cannot refresh sessions. `@supabase/ssr` resolves this by keeping session tokens synchronized via cookies.

We need a centralized, edge-compatible authentication layer that intercepts requests, validates sessions, transparently updates cookies, and redirects unauthenticated users to `/login`.

## Options Evaluated

1. **Client-Side Auth Guards (Status Quo)**
   - Force all authentication checks to run in `useEffect` and handle anonymous logins on mount.
   - *Pros:* Simple client-only configuration; no middleware changes needed.
   - *Cons:* Visual layout flickering; sensitive page bundles downloaded before verification; server-side rendering is blocked from knowing the session.

2. **Next.js Edge Middleware with `@supabase/ssr` (Edge Authentication)**
   - Leverage HTTP cookies to store session states and perform verification/refresh inside `middleware.ts` at the edge before rendering pages.
   - *Pros:* Complete security at the page-load boundary; zero FOUC; server components can read authenticated sessions; automatic cookie-based token refreshing.
   - *Cons:* Slight middleware latency due to JWT verification and cookie refresh operations.

3. **Next-Auth (Auth.js) with Supabase Adapter**
   - Migrate session management away from native Supabase Auth to Auth.js.
   - *Pros:* Broad social login provider support and standardized Next.js ecosystem.
   - *Cons:* Duplicates session management; high refactoring overhead; introduces database roundtrips to map sessions.

## Evaluation Criteria

- **Security & Route Guarding:** Secure routes prior to rendering or downloading bundle assets.
- **Latency / Performance:** Minimize overhead at the Next.js middleware execution layer.
- **Ecosystem Fit & Maintainability:** Align natively with Next.js App Router and the Supabase stack.
- **User Experience (UX):** Eliminate visual layout flashes and support anonymous sign-in transitions smoothly.

## Decision

We will implement **Option 2: Next.js Edge Middleware with `@supabase/ssr`** to handle centralized edge-level session verification and cookie synchronization.

### Detailed Architecture & Implementation Steps

#### 1. Add Dependencies
We will add `@supabase/ssr` (specifically a stable version compatible with Next.js 14, such as `^0.5.0`) to `apps/web/package.json`.

#### 2. Create Supabase Client Helpers
We will establish standard Supabase SSR factories under `apps/web/src/utils/supabase/`:
- **`client.ts` (Browser Client):** Uses `createBrowserClient` for Client Components.
- **`server.ts` (Server Client):** Uses `createServerClient` along with the Next.js `cookies()` header function for Server Components and Route Handlers.
- **`middleware.ts` (Middleware Client):** Uses `createServerClient` to intercept request cookies and safely inject refreshed cookie headers back into both the incoming request and the outgoing response.

#### 3. Update Edge Middleware (`apps/web/src/middleware.ts`)
We will rewrite `middleware.ts` to perform two critical tasks:
1. **Session Refresh & Protection:**
   - Construct a middleware Supabase client.
   - Call `await supabase.auth.getUser()` to safely inspect the current JWT.
   - If the request targets a protected route (e.g. starting with `/lobby` or `/arena`) and the user session is invalid/empty, redirect the browser to `/login?next=<original_url>`.
2. **AI Rate Limiting Safeguards:**
   - Retain the existing IP-based rate limiting logic for `/api/jobs/upload` and `/api/lab/chat`.
3. **Matcher Optimization:**
   - Adjust `config.matcher` to ensure both rate-limited API routes, the new `/login` route, and protected `/lobby` & `/arena` pages are captured while skipping static assets (`_next/static`, favicon, images).

#### 4. Introduce the Login Route (`apps/web/src/app/login/page.tsx`)
We will introduce a dedicated `/login` page that:
- Acts as the entrypoint for unauthenticated users.
- Automatically signs in users anonymously (preserving frictionless student onboarding) or displays social/email login options if needed.
- Inspects the `next` query parameter and redirects the user back to their intended target (e.g. `/lobby?id=...`) upon successful session creation.

#### 5. Clean up Client Components
- Refactor `apps/web/src/app/lobby/page.tsx` and `apps/web/src/app/arena/page.tsx` to remove their mount-level anonymous sign-in calls. Instead, they will rely on the session verified by the server/middleware and instantiate their browser clients using `createBrowserClient` for real-time channel subscriptions.

---

## Risk Mitigation

To address the key operational, security, and testing challenges identified during peer reviews, the following mitigation strategies will be implemented:

### 1. Bot Session Flood (Session Creation Decoupling)
To prevent search engines, web crawlers, and automated scraping scripts from triggering unnecessary database writes and exhausting Supabase database guest/anonymous session limits:
- **Redirection vs. Session Generation Decoupling:** Next.js Edge Middleware will restrict access to protected routes (`/lobby` and `/arena`) and redirect unauthenticated users to `/login?next=<path>`. However, loading the `/login` page itself **will not** trigger any session creation or anonymous authentication.
- **Explicit User Interaction Guard:** The `/login` page will render a static interface with a call-to-action button (e.g., "Enter Arena" or "Sign in as Guest"). Anonymous session creation via `supabase.auth.signInAnonymously()` will only execute *after* the user explicitly clicks this button.
- **Robots Exclusion:** We will update `public/robots.txt` to disallow crawlers from traversing `/login` and routing paths related to session acquisition.

### 2. Edge Middleware Latency (Fast Verification & Routing Optimization)
To ensure the Edge Middleware does not block every request or introduce noticeable latency:
- **Strict Path Filtering:** The middleware matcher config in `middleware.ts` will explicitly target only protected page routes (like `/lobby` and `/arena`) and select rate-limited APIs. All static assets, styling, public homepages, and non-auth API routes will bypass the middleware completely.
- **Local JWT Verification:** Instead of performing a database/network roundtrip to verify the session JWT on every request via `supabase.auth.getUser()`, the middleware will use the fast runtime JWT verification library `jose` to validate the token's cryptographic signature locally using the environment variable `SUPABASE_JWT_SECRET`.
- **Lazy Network Refreshes:** Network-based session token refresh will be executed lazily. We will check the local session token expiration. Only if the token is close to expiry (e.g., within 5 minutes) will we invoke the Supabase server client's session refresh and write updated cookie headers.

### 3. HTTP 431 Header Bloat (Cookie Pruning Strategy)
To prevent cookie header sizes from exceeding standard server limits (HTTP 431 Request Header Fields Too Large):
- **Automated Chunking:** We will utilize `@supabase/ssr`'s built-in cookie chunking mechanism to safely split larger sessions across multiple cookies.
- **Aggressive Cookie Pruning:** A dedicated response helper in the middleware will intercept and delete redundant or obsolete cookies (e.g., temporary oauth state cookies, duplicate supabase cookies, or expired sessions) before forwarding headers to the browser.
- **Payload Minimization:** The JWT payload size will be strictly minimized. We will avoid storing large user metadata strings inside the JWT, utilizing database queries for profile details post-authentication instead.

### 4. Testing & Mocking (Vitest Strategy)
To ensure testability of components and utilities that depend on Next.js `cookies()` and Supabase SSR's `createServerClient` in Vitest:
- **Mocked Cookie Store:** We will mock `next/headers` to return a predictable, stateful cookie mock that supports `get()`, `getAll()`, `set()`, and `delete()` in an in-memory map.
- **Custom `createServerClient` Mock:** We will mock `@supabase/ssr` to return a structured Supabase mock client that interfaces with our mocked cookie store, preventing runtime errors in tests.
- **Vitest Mock Structure:**
  ```typescript
  import { vi } from 'vitest';

  export const mockCookieStore = {
    get: vi.fn(),
    getAll: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  };

  vi.mock('next/headers', () => ({
    cookies: () => mockCookieStore,
  }));

  vi.mock('@supabase/ssr', () => ({
    createServerClient: vi.fn((url, key, options) => ({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
        getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'mock-jwt' } }, error: null }),
        signInAnonymously: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
      },
    })),
    createBrowserClient: vi.fn(() => ({
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      },
    })),
  }));
  ```

---

## Consequences

### Positive

- **Robust Defensive Boundary:** Direct protection of page routes at the CDN edge before rendering/loading bundles.
- **Elimination of Visual Shifts (FOUC):** Page bundle is only served once the user has an active, valid session, producing a seamless user experience.
- **Server Actions & SSR Synergy:** Server components can now securely read cookies and query database tables using the client's session context during initial render.
- **Transparent Session Refresh:** Access tokens are automatically refreshed in the middleware, avoiding mid-game session timeout failures.

### Negative

- **Middleware Response Latency:** Checking/updating sessions via `supabase.auth.getUser()` adds a small network cost on page transitions.
- **Refactoring Overhead:** Requires rewriting existing Supabase Client initialization files and modifying test mocks.

### Neutral

- **Cookie Management Overhead:** Care must be taken to manage session cookie size and configure environment variables accurately for the edge runtime.
