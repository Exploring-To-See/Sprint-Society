# Sprint Society — Milestone 1: Green Build + Installable PWA + Runs Locally

**Date:** 2026-06-17  **Verdict from Phase 0:** FIX (not rebuild) — executed and verified.

## Gate — all green
| Check | Command | Result |
|-------|---------|--------|
| Client typecheck | `client> tsc -b --noEmit` | ✅ pass |
| Server typecheck | `server> tsc --noEmit` | ✅ pass |
| Client prod build | `client> vite build` | ✅ pass — emits `sw.js` + `workbox-*.js` (PWA) |
| Tests | `server> vitest run` | ✅ **114/114 pass (9/9 files)** |
| Server boot | `tsx src/index.ts` | ✅ `Schema applied successfully`, serves `/api/health` 200, 0 SSL errors |

## What was fixed (root cause: an unfinished SQLite→Postgres migration)
1. **Async migration** — `pg.ts` query generic; added missing `await` to ~27 call sites
   (`kendu.routes.ts` ×23, plus `coaching/communities/events/notifications.routes.ts`). Server compiles.
2. **`pg.ts` SSL** — made conditional: off for local/test (localhost/`NODE_ENV` dev|test), on for remote
   (Railway). Fixes "server does not support SSL connections" locally while keeping prod SSL.
3. **Schema drift** — ported 9 SQLite `ALTER TABLE` columns into `schema.pg.sql` as idempotent
   `ADD COLUMN IF NOT EXISTS` (notably `users.timezone`, `users.google_id`, `activities.rpe/suspicious/
   deleted_at`, `communities/community_posts.deleted_at`, `kudos.reaction_type`).
4. **Boot safety** — `config.ts` now fails fast if `DATABASE_URL` is missing in prod/staging; warns on
   missing `ANTHROPIC_API_KEY`.
5. **Test harness** — rewrote `subscription.test.ts` for the async pg layer (was mocking the dead SQLite
   module + calling async code synchronously).
6. **Installable PWA** — added `vite-plugin-pwa` (Workbox service worker + offline app-shell, SPA
   navigate-fallback excluding `/api`, font runtime-cache); enriched `manifest.json` (192/512/maskable).

## How to run locally (Windows, no admin)
- Node + Postgres are portable (no system install). Paths:
  - Node: `%LOCALAPPDATA%\node-portable\node-v20.18.1-win-x64`
  - Postgres: `%LOCALAPPDATA%\pg-portable\pgsql\bin` (data: `%LOCALAPPDATA%\pg-portable-data`), running on
    `localhost:5432`, role `sprint` (trust auth), db `sprint_society` (+ `sprint_society_test` for tests).
- `DATABASE_URL=postgresql://sprint:sprint@localhost:5432/sprint_society` (already in `.env`).
- Start: prepend the node dir to PATH, then `npm run dev` (client + server). Server applies the schema on
  boot. Tests: create/seed `sprint_society_test`, then `vitest run` with `DATABASE_URL` → that DB.
- A normal machine: `docker compose up -d` (see `docker-compose.yml`) replaces the portable Postgres.

## Known follow-ups (not blocking M1)
- `kendu_offers` schema (`name/cost/category`) vs `kendu.routes.ts` admin offers (`brand_name/offer_title/
  kendu_cost/...`) mismatch — admin offer endpoints need schema reconciliation (untested path).
- LandingPage founder form is a mock (`LandingPage.tsx:74`); wire to a real endpoint.
- Duplicate dead `RunnerCardPopup` (ui/ + social/) — delete one.
- Real PNG app icons at exact sizes + optional custom A2HS install prompt.
- Add tests for the 16 currently-untested engine modules.
