# Sprint Society — Phase 0 Clone & Health Audit

**Date:** 2026-06-17
**By:** LLM Council (parallel domain auditors + dynamic verification)
**Clone:** `Exploring-To-See/Sprint-Society` @ main → `c:\Users\User\Desktop\Projects\sprint-society`
**Headline verdict:** **FIX, don't rebuild.** The app is fundamentally complete and well-architected.
The "broken" state is one coherent, mechanical defect cluster: an **incomplete SQLite→Postgres
migration**, plus PWA hardening and a few half-built spots. No from-scratch rebuild is warranted.

---

## Method
1. Fresh shallow clone to a standalone git root (isolated from the AIPL-Ops repo).
2. Parallel static audit by three domain agents (frontend / backend / AI+build), each evidence-based.
3. **Verified** every bold static claim by opening files — caught 3 false positives (below).
4. Installed portable Node 20.18.1 (no system Node present) and ran the **real** toolchain for ground truth.

## Ground-truth results (the decisive signal)

| Check | Command | Result |
|-------|---------|--------|
| Client typecheck | `client> tsc -b --noEmit` | ✅ **PASS** (exit 0) |
| Client prod build | `client> vite build` | ✅ **PASS** (exit 0, 20.3s, all pages bundled) |
| Server typecheck | `server> tsc --noEmit` | ❌ **FAIL** (exit 2, ~42 errors) |
| Server tests | `server> vitest run` | ❌ **FAIL** (exit 1) — `ECONNREFUSED 127.0.0.1:5432` |
| Install (per-dir) | `npm install` client + server | ✅ ok (no workspaces; root install is `concurrently` only) |

**Client is healthy. Server fails to compile and tests can't connect to a DB.** Both server failures
trace to the same root cause.

## Root cause: unfinished SQLite → Postgres migration
The data layer was moved from synchronous **better-sqlite3** (`server/src/database/db.ts`, now orphaned)
to async **pg/Postgres** (`server/src/database/pg.ts`, the live one). The migration was not completed:

- **Missing `await` on now-async engine/route calls** → the bulk of the ~42 type errors, e.g.
  `Property 'success' does not exist on type 'Promise<SpendResult>'`,
  `Operator '>' cannot be applied to 'Promise<number>'`. Concentrated in `kendu.routes.ts` (~35),
  plus `coaching.routes.ts:133`, `communities.routes.ts:516-517`, `events.routes.ts:308`,
  `notifications.routes.ts:70`.
- **`pg.ts:23` generic bug** — `query<T>` returns `QueryResult<T>` but `T` isn't constrained to
  `QueryResultRow` (TS2322/TS2344).
- **No local DB** — runtime and tests now hard-require Postgres on `:5432`; none is running, and the
  SQLite fallback is no longer wired. This is the "won't run/test locally" symptom.

This is a **fixable, ~1–2 day cleanup**, not architectural rot.

## Verified false positives (static agent over-claims — corrected)
- `engine/eventBus.ts` is **NOT empty** — it's a complete typed EventEmitter (39 lines). Matches SS-060.
- `engine/ai-profiler.ts` functions are **NOT missing** — all defined in-file (lines 89–255), hoisted.
- `engine/kenduEngine.ts` `getDailyEarnedToday()` is **fully implemented** (lines 98–106) with `DAILY_CAP`.
- `shared/types` resolution does **NOT** break the build — client typechecks and builds clean.

## Other real defects (independent of the migration)
- **P1 — Google OAuth crash:** `google-auth.routes.ts:118` inserts empty `password_hash` into a
  `NOT NULL` column (`schema.pg.sql:11`). New Google signups will fail.
- **P1 — `DATABASE_URL` not validated at boot** (`config.ts`/`pg.ts:4`): server starts, then fails on
  first query. Should fail fast in prod.
- **P2 — `kendu_transactions` vs `kendu_ledger`:** `kenduEngine` writes ledger to `kendu_ledger` but
  reads daily total from `kendu_transactions` — verify both tables exist / unify.
- **P2 — LandingPage founder form is a mock** (`client/src/pages/LandingPage.tsx:74-78`) — `setTimeout`,
  no API call; signups are lost.
- **P2 — Duplicate dead `RunnerCardPopup`** (`components/ui/` and `components/social/`), neither imported.
- **P2 — PWA not installable:** manifest only — **no service worker**, no `vite-plugin-pwa`, single icon,
  no apple-touch-icon. Needed for add-to-homescreen.
- **P3 — 16/28 engine modules have no tests** (math itself looks correct on spot-check).
- **P3 — Tests target Postgres** with no ephemeral DB in CI/local; need a test DB strategy.

## Decision matrix (keep / fix / rebuild / cut)

| Area | Status | Decision |
|------|--------|----------|
| Client (React/Vite UI, 40+ pages) | Healthy (typechecks + builds) | **KEEP** |
| Sports-science engine (`server/src/engine/*`) | Sound; under-tested | **KEEP** + add tests |
| AI service (`@anthropic-ai/sdk`, Haiku/Sonnet, graceful no-key) | Real, working | **KEEP** + build agentic-RAG on top |
| Admin suite (analytics/flags/segments/CMS/moderation/audit) | Mounted, guarded | **KEEP** |
| Payments (Razorpay REST create-order + HMAC verify + UI) | Integrated; needs keys+test | **KEEP** + wire keys |
| Data layer (sync→async migration) | Broken (missing awaits, pg generics) | **FIX** (P0) |
| Local/test DB story | No local Postgres / no fallback | **FIX** (P0) — add dev/test DB |
| Auth boot validation + Google OAuth | Buggy | **FIX** (P1) |
| PWA installability | Manifest-only | **FIX** (P1) — vite-plugin-pwa + icons |
| LandingPage form, duplicate RunnerCardPopup | Half-built / dead | **FIX/CUT** (P2) |
| Whole-app rebuild from scratch | — | **REJECT** — discards a large working codebase |

## Recommended Milestone 1 (get to green)
1. **P0 — Finish the async migration:** add missing `await`s (kendu.routes.ts + 4 routes), fix `pg.ts`
   generic constraint (`<T extends QueryResultRow>`), until `server> tsc --noEmit` is green.
2. **P0 — Local/test DB:** either a one-command local Postgres (Docker) **or** restore a SQLite adapter
   for dev/test so `npm run dev` and `npm test` work with zero external services.
3. **P1 — Boot safety:** validate `DATABASE_URL`/`JWT_SECRET` at startup; fix Google-OAuth password_hash.
4. **P1 — Real PWA:** `vite-plugin-pwa` (Workbox SW + offline shell), icon set (192/512/maskable +
   apple-touch-icon), iOS meta, install prompt; verify add-to-homescreen on a real phone.
5. **Gate:** `npm run typecheck` + `npm test` + `npm run build` all green; app boots; PWA installs.

**Effort estimate:** ~2–4 focused days to a green, installable, locally-runnable baseline.
