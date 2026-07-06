# AGENTS.md

## Cursor Cloud specific instructions

Kaneo is a pnpm + Turborepo monorepo. The core product is **web + api + PostgreSQL**.
Standard commands live in `CLAUDE.md`, `README.md`, and `ENVIRONMENT_SETUP.md` — prefer those.
Notes below are non-obvious caveats for running in the Cursor Cloud VM.

### Services
- `@kaneo/api` — backend (Hono), port **1337**. Run: `pnpm --filter @kaneo/api dev`.
- `@kaneo/web` — frontend (Vite/React), port **5173**. Run: `pnpm --filter @kaneo/web dev`.
- `pnpm dev` at the root starts everything (also `site`, `email`, `mcp`); run the two filters above for a focused core setup.

### PostgreSQL (non-obvious)
- Installed as a native apt cluster (`postgresql` 16, cluster `16 main`), not Docker (Docker is not installed here).
- The cluster does **not** auto-start on VM boot. If the API can't connect, start it: `sudo pg_ctlcluster 16 main start`.
- Role/db: user `kaneo` / password `kaneo`, database `kaneo` (plus `kaneo_test` used by integration tests).
- The API runs migrations automatically on startup against `apps/api/drizzle/`.

### Environment
- A root `.env` (gitignored, kept in the VM snapshot) is already configured with `DATABASE_URL=postgresql://kaneo:kaneo@localhost:5432/kaneo`, a 32+ char `AUTH_SECRET`, and the localhost URLs. If it is ever missing, recreate it from `.env.sample` with those values.

### Gotchas
- API health endpoint is `/api/health` (not `/health`) — the app mounts routes under `/api`.
- `pnpm lint` runs `biome check --write .` which **modifies files**. For a read-only lint check use `pnpm exec biome ci .` (this is what the pre-commit hook runs).
- `pnpm install` reports ignored build scripts (`prisma`, `sharp`, `msw`); these are not needed for the core web/api flow.
- Integration tests (`pnpm test:integration`) require PostgreSQL running and the `kaneo_test` database.
