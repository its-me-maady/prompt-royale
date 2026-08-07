# PromptRoyale

A gamified AI study and quiz arena.

## Tech Stack
- Next.js (React)
- Tailwind CSS
- Turborepo
- pnpm

## Development Environment

This project is configured with a **Devcontainer** for a consistent and reproducible local development environment. It comes pre-installed with Node.js 22, pnpm, Docker (for running Supabase locally), and the Supabase CLI.

**To get started:**
1. Open this project in VS Code.
2. When prompted, click **"Reopen in Container"** (or press `F1` and run `Dev Containers: Reopen in Container`).
3. The container will automatically install all dependencies (`pnpm install`) and extensions (Prettier, ESLint, Tailwind).

If you are not using Devcontainers, follow the manual steps below.

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Run the development server:
   ```bash
   pnpm dev
   ```

3. Build the project:
   ```bash
   pnpm build
   ```

4. Run tests:
   ```bash
   pnpm test
   ```
