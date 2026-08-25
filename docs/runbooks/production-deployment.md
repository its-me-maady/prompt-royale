---
agent-notes: { ctx: "Production Deployment Operational Runbook", deps: ["AGENTS.md", "docs/adrs/0009-production-hosting-topology.md"], state: active, last: "ines@2026-08-25" }
---

# Runbook: Production Deployment & Zero-Downtime Operations

**Service:** PromptRoyale (Next.js Monorepo + Supabase + Gemini API)  
**Severity:** P1 (Deployment Failure / Outage)  
**Last tested:** 2026-08-25  

---

## 1. Prerequisites & Required Secrets

Ensure the following GitHub Secrets are configured in the repository prior to initiating production deployments:

| Secret | Description |
|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL (`https://<project-ref>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous client API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role admin key for backend operations |
| `GEMINI_API_KEY` | Google Gemini API Key for LLM generation & embeddings |
| `NEXT_PUBLIC_API_SECRET_TOKEN` | Bearer token for professor upload endpoint |
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI personal access token for migrations |
| `SUPABASE_PROJECT_ID` | Target Supabase Project Reference ID |

---

## 2. Standard Deployment Procedure

Production deployments are fully automated via GitHub Actions:

1. **Pull Request Validation:**
   - Push feature branches and open a PR into `main`.
   - `.github/workflows/ci.yml` triggers automatically: lints code, validates `supabase/migrations`, and runs unit/integration tests.
   - Vercel automatically generates a Preview Deployment URL.

2. **Merge & Automated Production Cutover:**
   - Merge approved PR into `main`.
   - `.github/workflows/deploy-production.yml` runs:
     - Step 1: Validates and pushes new Supabase DB migrations (`supabase db push`).
     - Step 2: Builds `apps/web` with production environment variables.
     - Step 3: Vercel deploys the new build to production with zero downtime.

---

## 3. Post-Deployment Verification

Run the following checks to confirm production operational status:

1. **Health Check Verification:**
   ```bash
   curl -i https://<YOUR_PRODUCTION_DOMAIN>/api/health
   ```
   *Expected Response:* `HTTP 200 OK` with `{"status": "healthy", ...}`

2. **Edge Security & Rate Limiting Check:**
   ```bash
   curl -i https://<YOUR_PRODUCTION_DOMAIN>/api/jobs/upload
   ```
   *Expected Response:* `HTTP 415` or `HTTP 400` (not HTTP 500).

3. **Supabase Vector Connectivity Check:**
   - Verify that Prompt Lab RAG search (`/api/lab/chat`) responds without database errors.

---

## 4. Rollback & Emergency Procedures

If a deployment introduces severe runtime errors or broken features:

1. **Instant Vercel Rollback:**
   - Log into Vercel Dashboard -> Projects -> `prompt-royale` -> Deployments.
   - Select the previous successful deployment and click **Promote to Production**.

2. **Database Migration Rollback (if applicable):**
   - Author a new additive rollback migration file in `supabase/migrations/<timestamp>_revert_<name>.sql`.
   - Commit and push to `main` to trigger automated deployment.

3. **Emergency Escalation:**
   - Contact DevOps/SRE lead (**Ines**) or Principal Engineer (**Sato**).
