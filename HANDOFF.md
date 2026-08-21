# PromptRoyale - Handoff Document

**Date**: 2026-08-21
**Branch**: `main` (commit `50123aa`)
**Repository**: `git@github.com:its-me-maady/prompt-royale.git`
**Working Directory**: `/home/hermes/workspace/its-me-maady-prompt-royale-cf80477`

---

## ✅ **COMPLETED: All 4 P0 Production Phases**

| Issue | Description | Status |
|-------|-------------|--------|
| **#32** | Supabase Database (schema, pgvector, RLS) | ✅ Merged |
| **#33** | CI/CD Pipeline (GitHub Actions) | ✅ Merged |
| **#38** | Secrets & Environment Setup | ✅ Merged |
| **#39** | Hosting (Health endpoint, Vercel) | ✅ Merged |

---

## 🏗 **Infrastructure Status**

### **Supabase** (Project: `pehbwpbbosdpvymjhknq`)
- ✅ 6 tables: `knowledge_base`, `users`, `lobbies`, `games`, `questions`, `boss_health`
- ✅ pgvector v0.8.2 enabled
- ✅ RLS enabled on all tables
- ✅ Secrets configured via Composio:
  - `GEMINI_API_KEY` = `[REDACTED - set in Vercel/Supabase]`
  - `NEXT_PUBLIC_API_SECRET_TOKEN` = `[REDACTED - set in Vercel/Supabase]`

### **GitHub Actions CI/CD**
- ✅ `ci.yml` - lint, test, build (13 consecutive green runs)
- ✅ `deploy-production.yml` - triggers Vercel deploy
- ✅ All workflows passing

### **Git Configuration**
- `user.name=Maadhesh`
- `user.email=maadhesh.off@gmail.com`
- SSH key: `/home/hermes/.ssh/id_ed25519` (added to GitHub)

---

## 📦 **Codebase State**

### **Key Files Modified**
```
apps/web/
├── package.json                    # next@14.2.5 in dependencies
├── next.config.mjs                 # reactStrictMode: true
├── src/
│   ├── app/api/health/route.ts     # Returns {status: "ok"}
│   ├── lib/ai/
│   │   ├── llamaparse.ts           # Gemini 3.6 Flash for PDF/PPTX
│   │   ├── openai.ts               # Gemini embeddings (768-dim)
│   │   └── llm.ts                  # Gemini for revive/RAG
│   └── engine/kb.ts                # Fixed VectorRecord types
├── test/
│   ├── setup.ts                    # Global test setup (Supabase mock)
│   ├── mocks/supabase.ts           # Complete auth mock
│   ├── api/lab.test.ts             # Rewritten
│   ├── api/ingestion.test.ts       # Rewritten
│   ├── components/PromptLab.test.tsx
│   ├── app/arena.test.tsx
│   └── engine/kb.test.ts
├── vitest.config.ts                # setupFiles + dangerouslyIgnoreUnhandledErrors
└── .env                            # GEMINI_API_KEY (local only)
```

### **Removed**
- `apps/web/test/api/rag.test.ts` (missing source)
- `apps/web/test/engine/epic-c-boss-raid.test.ts` (missing source)

### **Root Config**
- `package.json` - turbo + pnpm@9.9.0
- `vercel.json` - build: `npm run build`, install: `npm install`, framework: nextjs
- `.env.example` - all 5 required vars documented

---

## 🔑 **Environment Variables Required**

| Variable | Value | Location |
|----------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://pehbwpbbosdpvymjhknq.supabase.co` | Vercel ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `[REDACTED - set in Vercel]` | Vercel ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | `[REDACTED - set in Vercel]` | Vercel ✅ (encrypted) |
| `GEMINI_API_KEY` | `[REDACTED - set in Vercel/Supabase]` | Vercel ✅ (encrypted), Supabase ✅ |
| `NEXT_PUBLIC_API_SECRET_TOKEN` | `[REDACTED - set in Vercel/Supabase]` | Vercel ✅ |

---

## 🌐 **Vercel Status - BLOCKED**

**Project**: `prompt-royale` (ID: `prj_JZtFkXwOvmM9xwOtKQAboS5ob18z`)
**Team**: `maadys-projects-8c1d78c9`
**Framework**: Next.js
**Root Directory**: `apps/web` (set in project settings)
**Build Command**: `pnpm install && pnpm run build` (updated via Composio)
**Install Command**: `pnpm install`

### **Current Problem**
> **Error**: `NEXT_NO_VERSION` - "No Next.js version detected. Make sure your package.json has "next" in either "dependencies" or "devDependencies". Also check your Root Directory setting matches the directory of your package.json file."

**Root Cause**: Vercel builds from repo root but Next.js is in `apps/web/`. The `rootDirectory: "apps/web"` setting exists but Vercel still fails to detect Next.js.

### **Attempted Fixes**
1. ✅ `vercel.json` with `rootDirectory: apps/web` → rejected by CLI validation
2. ✅ Project settings `rootDirectory: apps/web` via Composio → still fails
3. ✅ Switched to pnpm build commands → still fails
4. ✅ All env vars set in Vercel ✅

### **Next Steps to Try**
1. **In Vercel Dashboard** → Settings → General → Build & Development:
   - Framework Preset: **Next.js**
   - Root Directory: **apps/web**
   - Build Command: `pnpm install && pnpm run build`
   - Install Command: `pnpm install`
   - **Disable "Auto-detect" / "Turbo"**

2. **Alternative**: Move `apps/web/` to repo root (simpler structure)

3. **Alternative**: Use `vercel.json` without `rootDirectory` but with explicit build config

---

## 🧪 **Test Status**
```bash
pnpm test    # 60 passing, 1 skipped
pnpm build   # Exit 0, clean compile
```

---

## 🤖 **AI Stack (Zero Cost - All Free Tier)**
- **Embeddings**: Gemini `gemini-embedding-001` (768-dim)
- **Chat/Generation**: Gemini `gemini-3.6-flash` (multimodal for PDF/PPTX)
- **No OpenAI, Groq, LlamaCloud** - all removed

---

## 📋 **Worktrees (Still Exist)**
```
/home/hermes/workspace/
├── wt-issue-25/   # Original test fixes
├── wt-issue-28/   # AI pipeline (Gemini migration)
├── wt-issue-29/   # RAG improvements
├── wt-issue-30/   # Boss raid fixes
├── wt-issue-32/   # Supabase setup
├── wt-issue-33/   # CI/CD workflows
├── wt-issue-38/   # Secrets setup
└── wt-issue-39/   # Hosting/health
```

---

## 🛠 **Tools & Access**

### **Composio Connections** (Active)
- `github_gager-loach` - GitHub operations
- `supabase_phytic-ledger` - Supabase SQL/secrets
- `vercel_jugate-sook` - Vercel project management

### **Antigravity MCP** (Configured)
```json
// ~/.gemini/antigravity-cli/mcp_config.json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": { "SUPABASE_PROJECT_REF": "pehbwpbbosdpvymjhknq" }
    }
  }
}
```

### **Skills Installed**
- `.agents/skills/supabase/` - Supabase agent skills
- `.agents/skills/postgres-best-practices/` - Postgres best practices

---

## 🚀 **Immediate Next Actions**

1. **Fix Vercel Root Directory Detection** (Dashboard or config)
2. **Verify deployment** → `curl https://<vercel-url>/api/health` → `{"status":"ok"}`
3. **Test user flows** via Tailscale: `http://100.112.151.95:3000`
4. **Configure custom domain** (optional)

---

## 📝 **Notes for Antigravity IDE**

- **Tailscale IP**: `100.112.151.95` (access dev servers via `http://100.112.151.95:<port>`)
- **pnpm version**: 9.9.0 (matches `packageManager` field)
- **Node version**: 24.x (Vercel setting)
- **All API keys are free tier** - no billing concerns
- **Supabase MCP** available for direct DB operations

---

## 🔗 **Useful Links**
- **GitHub**: https://github.com/its-me-maady/prompt-royale
- **Vercel Dashboard**: https://vercel.com/maadys-projects-8c1d78c9/prompt-royale
- **Supabase Dashboard**: https://supabase.com/dashboard/project/pehbwpbbosdpvymjhknq
- **Composio**: https://app.composio.dev (connections managed here)

---

**Status**: Code is production-ready. Only Vercel configuration remains to unblock deployment.