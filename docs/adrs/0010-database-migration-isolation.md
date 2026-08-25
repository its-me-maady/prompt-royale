---
agent-notes: { ctx: "Database Migration & Schema Isolation Strategy", deps: ["AGENTS.md", "docs/adrs/0004-kb-ingestion-storage.md"], state: active, last: "archie@2026-08-25" }
---

# ADR-0010: Database Migration Automation & Schema Isolation Strategy

## Status

Accepted

## Context

PromptRoyale relies on Supabase PostgreSQL with `pgvector` v0.8.2 extension (768-dimension embeddings for Gemini) and RLS security policies. Manual SQL execution on production databases introduces risk of schema drift, broken index queries, or downtime during live multiplayer raids. We need an automated, reliable database migration and environment isolation strategy.

## Options Evaluated

1. **Automated Supabase CLI Migrations in GitHub Actions Pipeline**: Commit idempotent SQL migration scripts in `supabase/migrations/` and apply them automatically via Supabase CLI during the CI/CD deployment workflow.
2. **ORMDriven Auto-Migrate (e.g. Prisma / Drizzle Migrate)**: Use an ORM to automatically alter production tables on deployment startup.
3. **Manual SQL Console Execution**: Run migration scripts manually via Supabase Web Dashboard prior to feature launches.

## Evaluation Criteria

- **Safety & Reliability**: Guarantee zero schema drift between local, preview, and production database environments.
- **Auditability**: Complete version control history for all database DDL changes in git.
- **Downtime Minimization**: Ability to run migrations without taking down live game sockets or vector search APIs.

## Decision

We will adopt **Automated Supabase CLI Migrations via GitHub Actions Pipeline**.

### Migration Rules
1. All database schema changes (tables, columns, indexes, RLS policies, functions) MUST be authored as version-controlled migration files in `supabase/migrations/<timestamp>_<name>.sql`.
2. `.github/workflows/ci.yml` will perform a dry-run migration check on every Pull Request using `supabase db lint` / `supabase migration list`.
3. `.github/workflows/deploy-production.yml` will execute migrations against the production database project using `supabase db push --linked` prior to triggering frontend deployment on Vercel.
4. Schema migrations must be additive and backwards-compatible to prevent breaking active client sessions during rolling deployments.

### Wei Debate & Mitigations (Devil's Advocate Challenge)
- **Challenge (Wei):** Destructive schema changes (e.g. dropping columns or altering vector dimensions) applied automatically in CI could break active multiplayer raid sessions or cause instant vector query failures.
- **Mitigation (Archie/Ines):** Destructive DDL operations (DROP, ALTER TYPE) are banned in single-step migrations. Schema changes must follow the Expand/Contract pattern: expand schema in Migration N, update app code in Release N+1, contract old schema in Migration N+2.

## Consequences

### Positive
- **Immutable Audit Trail**: Every database modification is reviewed in PRs and tracked in git history.
- **Zero Schema Drift**: Eliminates discrepancies between development, CI test databases, and production.
- **Predictable Deployment**: Automated schema migration runs before code deployment, ensuring database readiness.

### Negative
- **Strict Discipline Required**: Developers cannot make manual tweaks in the Supabase Dashboard SQL Editor; all changes must go through `supabase/migrations`.
- **Migration Rollback Complexity**: Additive schema design requires explicit rollback SQL scripts if a release must be reverted.
