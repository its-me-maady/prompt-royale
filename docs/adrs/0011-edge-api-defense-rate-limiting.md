---
agent-notes: { ctx: "Edge API Defense & Rate Limiting Strategy", deps: ["AGENTS.md", "docs/product-context.md"], state: active, last: "archie@2026-08-25" }
---

# ADR-0011: Edge API Defense, Rate-Limiting & AI Token Safeguards

## Status

Accepted (with Mitigations)

## Context

PromptRoyale provides public anonymous student access to maximize frictionless onboarding. However, endpoints such as `/api/jobs/upload` (PDF parsing & MCQ generation via Gemini) and `/api/lab/chat` (Prompt Lab RAG vector search & AI restyling) trigger Gemini API token usage and vector database queries. Unrestricted public access creates severe financial risk (denial-of-wallet) and service availability risks from automated bots or abuse.

## Options Evaluated

1. **Next.js Middleware Sliding-Window Rate Limiter**: Enforce IP-based rate-limiting directly in `apps/web/src/middleware.ts` using a lightweight sliding-window algorithm with an in-memory/KV store fallback.
2. **External API Gateway / Cloudflare WAF Rate Limiting**: Route traffic through Cloudflare Enterprise / AWS WAF for edge rate-limiting and bot management.
3. **Mandatory User Registration / CAPTCHA**: Require mandatory Google/email login or CAPTCHA validation before allowing any AI interaction.

## Evaluation Criteria

- **Frictionless Student UX**: Per `docs/product-context.md`, students have zero tolerance for clunky authentication or intrusive CAPTCHAs.
- **Cost Safeguard**: Absolute protection against runaway Gemini API token costs and vector DB overload.
- **Implementation Overhead**: Ease of integration within the Next.js App Router and Vercel hosting platform.

## Decision

We will implement **Next.js Middleware Sliding-Window Rate Limiting with Fallback Protection**.

### Defensive Rules
1. **Public AI Endpoint Rate Limits (`/api/jobs/upload`, `/api/lab/chat`):**
   - Maximum 10 requests per minute per IP address.
   - Return HTTP `429 Too Many Requests` with `Retry-After` header when exceeded.
2. **Payload Size Restrictions:**
   - PDF file uploads restricted to maximum 10MB file size limit enforced at middleware and route layer.
3. **Professor Upload Authentication:**
   - Require valid `NEXT_PUBLIC_API_SECRET_TOKEN` bearer header for `/api/ingestion` and professor administrative actions.
4. **Security Headers:**
   - Enforce Content Security Policy (CSP), Strict-Transport-Security (HSTS), X-Content-Type-Options, and CORS controls in `next.config.mjs`.

### Wei Debate & Mitigations (Devil's Advocate Challenge)
- **Challenge (Wei):** In-memory rate limiting across Vercel serverless functions can reset on new function instances or multi-region routing, allowing attackers to bypass rate limits across distributed IP ranges.
- **Mitigation (Pierrot/Sato):** Rate limiting will be enforced via an in-memory sliding-window token bucket in `middleware.ts` for zero external dependencies during initial production launch, with an upgrade path to Vercel KV / Upstash Redis for multi-region state persistence if traffic bursts exceed single-region thresholds.

## Consequences

### Positive
- **Frictionless Student Experience**: Students interact with AI without needing accounts, passwords, or CAPTCHAs.
- **Financial Shield**: Prevents script kiddies or automated bots from draining Gemini API credits.
- **Immediate Rejection**: Abusive requests are blocked at the edge before triggering expensive LLM or vector DB operations.

### Negative
- **Shared IP Rate Limiting**: Students operating on shared campus Wi-Fi IPs could occasionally hit rate limits if many students trigger requests simultaneously.

### Neutral
- **Monitoring Requirement**: Requires monitoring rate-limit trigger metrics (HTTP 429 response counts) to fine-tune rate thresholds.
