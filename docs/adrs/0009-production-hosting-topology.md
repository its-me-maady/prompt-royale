---
agent-notes: { ctx: "Production Hosting & Topology Strategy", deps: ["AGENTS.md", "docs/product-context.md"], state: active, last: "archie@2026-08-25" }
---

# ADR-0009: Production Hosting & Topology Strategy

## Status

Accepted (with Mitigations)

## Context

PromptRoyale requires a production hosting topology that supports high visual polish, sub-second API response times, automated zero-downtime CI/CD deployments, and seamless integration with Supabase (PostgreSQL + pgvector) and Google Gemini API. We need to define the production hosting target and network topology.

## Options Evaluated

1. **Vercel Serverless & Edge Platform (`iad1` US-East)**: Co-locate Next.js App Router serverless endpoints in the `iad1` region alongside Supabase US-East database infrastructure.
2. **Containerized AWS ECS / Fargate Deployment**: Package `apps/web` into a multi-stage Docker container deployed to an AWS ECS cluster behind an Application Load Balancer.
3. **Self-Hosted Virtual Private Server (VPS / Hetzner / DigitalOcean)**: Host via Docker Compose on a single dedicated Linux VM.

## Evaluation Criteria

- **Operational Overhead**: Maintenance effort required to manage infrastructure, SSL, and scaling.
- **Latency & Co-location**: Network round-trip time between Next.js serverless functions, Supabase, and Gemini API.
- **Zero-Downtime CI/CD Integration**: Ease of automated preview deployments, rollback capabilities, and git-push triggers.
- **Financial Cost**: Infrastructure expenses during initial launch and scale.

## Decision

We will standardize on **Vercel Serverless Platform co-located in `iad1` (US-East)**.

### Architectural Rules
- `apps/web` will deploy as a Next.js 14 App Router application on Vercel.
- Function region is strictly pinned to `iad1` in `vercel.json` to minimize network latency to Supabase PostgreSQL (also hosted in US-East).
- Automatic deployments are triggered via `.github/workflows/deploy-production.yml` on merges to `main`.

### Wei Debate & Mitigations (Devil's Advocate Challenge)
- **Challenge (Wei):** Serverless function cold starts and short-lived execution environments can exhaust Postgres connection limits if every function invocation creates a new direct DB connection.
- **Mitigation (Ines/Archie):** All serverless API routes must use Supabase's transaction pooler (pgBouncer on port 6543) or Supabase JS client with standard connection limits. Direct DB connections on port 5432 are prohibited in serverless runtime routes.

## Consequences

### Positive
- **Zero Infrastructure Maintenance**: Automated SSL provisioning, global CDN edge caching, and preview deployment URLs for PRs.
- **Low Latency**: Sub-10ms intra-region ping between Vercel `iad1` functions and Supabase US-East database.
- **Instant Rollbacks**: Instant rollback capability from Vercel deployment history if production bugs occur.

### Negative
- **Serverless Cold Starts**: Occasional ~200ms cold start latency on infrequently hit endpoints.
- **Vendor Dependency**: Relies on Vercel runtime specifics (`next.config.mjs` and Vercel environment configurations).

### Neutral
- **Connection Management**: Requires enforcing pgBouncer pooling across all serverless API handlers.
