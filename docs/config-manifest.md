---
agent-notes:
  ctx: "Configuration manifest, environment variables, secrets, and fallback policies"
  deps: [".env.example", "docs/runbooks/production-deployment.md", "apps/web/src/services/llm.ts", "apps/web/src/lib/db/supabase.ts"]
  state: canonical
  last: "ines@2026-09-20"
  key: ["Ines owns, audited before releases", "Strictly required vs runtime fallback mapping"]
---
# Configuration Manifest

**Project:** PromptRoyale  
**Last audited:** 2026-09-20  
**Owner:** Ines  

## Environment Variables

| Variable | Required? | Default / Fallback Behavior | Dev | Staging | Prod | Description |
|----------|-----------|-----------------------------|-----|---------|------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | None (falls back to `http://localhost:54321` in local dev only) | `http://localhost:54321` | `https://<staging-ref>.supabase.co` | `https://<prod-ref>.supabase.co` | Supabase project API gateway endpoint. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | None (falls back to dummy key in `src/lib/db/supabase.ts` if missing) | `[local-anon-key]` | `[staging-anon-key]` | `[prod-anon-key]` | Public anonymous client JWT key for browser-side queries adhering to RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Falls back to `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `dummy_key` if missing | `[local-service-key]` | `[vault]` | `[vault]` | Elevated privileges key used for backend RPC execution and administrative DB operations. |
| `GEMINI_API_KEY` | **Yes** | Falls back to `GROQ_API_KEY`, then static fallback questions in `services/llm.ts` | `[dev-gemini-key]` | `[vault]` | `[vault]` | Google Gemini API key for prompt restyling, query expansion, and grounded quiz generation. |
| `SUPABASE_ACCESS_TOKEN` | **Yes (CI/Deploy)** | None (required by Supabase CLI in GitHub Actions) | N/A | `[github-secret]` | `[github-secret]` | Personal access token for Supabase CLI automated database schema migrations. |
| `SUPABASE_PROJECT_ID` | **Yes (CI/Deploy)** | None (required by Supabase CLI in GitHub Actions) | N/A | `[github-secret]` | `[github-secret]` | Target Supabase Project Reference ID for migration synchronization. |
| `GROQ_API_KEY` | Optional / Fallback | Fallback provider when Gemini rate limits or fails in `services/llm.ts` | `[dev-groq-key]` | `[vault]` | `[vault]` | Groq Cloud API key powering fast Llama-3 fallback inference for revive/quiz loops. |
| `LLAMA_CLOUD_API_KEY` | Optional / Fallback | Local text extraction fallback if LlamaParse cloud service is not configured | `[dev-llama-key]` | `[vault]` | `[vault]` | LlamaParse cloud parsing key for PDF and unstructured document ingestion. |
| `OPENAI_API_KEY` | Optional / Fallback | Optional fallback provider for vector embeddings / LLM generation | `[dev-openai-key]` | `[vault]` | `[vault]` | OpenAI API key reserved for secondary embeddings/completion fallback. |
| `NEXT_PUBLIC_API_SECRET_TOKEN` | Optional / Fallback | Open dev upload if unset | `dev_secret_token` | `[vault]` | `[vault]` | Shared bearer authentication token securing the professor course material upload endpoints. |

### Secret Variables

Variables containing sensitive API keys and tokens. **Never commit these values to source control.**

| Variable | Source | Rotation Policy | Last Rotated |
|----------|--------|-----------------|--------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard | 90 days / On Compromise | 2026-08-25 |
| `GEMINI_API_KEY` | Google AI Studio | 90 days | 2026-08-25 |
| `GROQ_API_KEY` | Groq Cloud Console | 90 days | 2026-08-25 |
| `LLAMA_CLOUD_API_KEY` | LlamaIndex Cloud | 90 days | 2026-08-25 |
| `SUPABASE_ACCESS_TOKEN` | Supabase User Account | 180 days | 2026-08-25 |
| `NEXT_PUBLIC_API_SECRET_TOKEN` | Internal Keygen | 90 days | 2026-08-25 |

## Configuration Files

| File | Environment-Specific? | Description |
|------|-----------------------|-------------|
| `.env.example` | No | Template repository environment configuration documentation. |
| `apps/web/.env.local` | Yes (Local Only) | Git-ignored local development environment variables. |
| `supabase/config.toml` | No | Supabase local CLI stack and database configuration. |
| `turbo.json` | No | Turborepo pipeline configuration and global environment dependencies. |

## Drift Detection

To verify configuration consistency and detect drift:

- **Audit Procedure:** Cross-reference `.env.example`, `docs/runbooks/production-deployment.md`, and Vercel Project Environment Variables.
- **CI Check:** GitHub Actions `.github/workflows/ci.yml` validates syntax, dependency lockfile alignment, and Supabase migrations.
- **Last Audit Findings:** Audited on 2026-09-20. All required variables mapped to fallback logic in `services/llm.ts` and `lib/db/supabase.ts`.

## Adding a New Config Value

1. Add the variable to this manifest first (`docs/config-manifest.md`).
2. Mark whether the variable is strictly required or includes runtime fallback handling.
3. Update `.env.example` with a dummy placeholder.
4. If secret: add to GitHub Secrets and Vercel Environment Variables.
5. Update application code to read `process.env.<VARIABLE_NAME>`.
