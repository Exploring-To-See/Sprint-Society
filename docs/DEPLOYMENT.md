# Sprint Society — Deployment Runbook (Vercel + Supabase)

This is the single, authoritative deploy topology. Railway is retired.

## Architecture

```
                      Vercel project (one deploy from repo root)
        ┌────────────────────────────────────────────────────────────┐
Browser │  Static SPA  (client/dist)   ──same origin──>  /api/*        │
   │    │                                                  │           │
   │    │                          api/[...path].ts  →  server/src/app │
   │    │                          (Express, serverless)   │           │
   └────┤                                                  ▼           │
        │  Vercel Cron (daily) ─────────────>  /api/cron/maintenance   │
        └───────────────────────────────────────────────┬─────────────┘
                                                         ▼
                                            Supabase Postgres (pooler :6543)
```

- **One origin.** The SPA and the API share the Vercel origin, so the client uses
  same-origin `/api` (leave `VITE_API_URL` unset). No CORS hop, no second host.
- **Stateless API.** `api/[...path].ts` wraps `createApp()` from `server/src/app.ts`.
  No WebSocket, no in-process scheduler, no static serving (Vercel does that).
- **Background jobs.** Vercel Cron calls `/api/cron/maintenance` daily
  (challenge/subscription expiry, streak decay, Kendu challenge resolution),
  guarded by `CRON_SECRET`.
- **Realtime.** Chat + notifications poll over REST on Vercel (WebSocket can't run
  on serverless). Supabase Realtime is the planned upgrade — see the bottom.

## Repository layout that matters

| Path | Role |
|------|------|
| `vercel.json` | build command, output dir, `/api` function, SPA rewrite, cron |
| `api/[...path].ts` | Vercel serverless entry → `createApp({ serveStatic: false })` |
| `server/src/app.ts` | `createApp()` — the shared Express app (all 45 routes) |
| `server/src/index.ts` | self-host entry only (adds WebSocket + scheduler + listen) |
| `server/src/scheduler/jobs.ts` | shared job logic (scheduler + cron both call it) |
| `server/src/routes/cron.routes.ts` | `/api/cron/maintenance` (Vercel Cron target) |
| root `package.json` | mirrors server runtime deps so Vercel bundles the function |

> **Do not** set the Vercel project's *Root Directory* to `client/`. The API
> function and `shared/types.ts` live outside `client/`; the build must run from
> the repo root.

## First-time setup

1. **Supabase** — create a project. From Project Settings → Database:
   - copy the **transaction pooler** string (`...pooler.supabase.com:6543`) → this
     is the production `DATABASE_URL`.
   - copy the **direct** string (`:5432`) for one-off migrations/restores.
2. **Apply schema + seed** (from your machine, using the direct URL):
   ```bash
   DATABASE_URL="<direct 5432 url>" ADMIN_PASSWORD="<pick one>" npm run migrate
   ```
3. **Vercel** — import the repo (root directory = repo root). Set env vars from
   `.env.example` (Production scope), notably:
   - `JWT_SECRET` (32+ chars), `DATABASE_URL` (**pooler :6543**), `CLIENT_URL`
     (your `*.vercel.app` origin for now), `CRON_SECRET`
   - `ANTHROPIC_API_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
     `RAZORPAY_WEBHOOK_SECRET`, `GOOGLE_CLIENT_ID`, `VITE_GOOGLE_CLIENT_ID`
   - leave `VITE_API_URL` and `VITE_ENABLE_WS` **unset**
4. **Deploy** (push to `main` or trigger in the Vercel dashboard).
5. **Smoke test** on the `*.vercel.app` URL — see checklist below.

## Verification checklist (on the Vercel URL)

- [ ] `GET /api/health` returns `{"status":"ok"}`
- [ ] Register + log in (email/password), then Google sign-in
- [ ] Log a run → response includes a populated `cascade` (XP/Kendu/PB update)
- [ ] Open a community → chat sends and appears within a few seconds (polling)
- [ ] Notification badge updates within ~20s of an action
- [ ] Razorpay test order → `/subscription/verify` upgrades the plan
- [ ] Admin → Backup → "Download Backup" streams a CSV
- [ ] In Vercel → Cron, "Run" the maintenance job → returns `{ ok: true }`

## Custom domain cutover (`app.sprintsociety.in`)

Do this **after** the Vercel URL passes the checklist.

1. Vercel → Project → Settings → **Domains** → add `app.sprintsociety.in`.
2. At your DNS provider, repoint the record Vercel shows (CNAME/A) **away from
   Railway** to Vercel. Remove the old Railway DNS record.
3. Update env + redeploy:
   - `CLIENT_URL=https://app.sprintsociety.in`
   - Google Cloud Console → OAuth client → Authorized JavaScript origins → add
     `https://app.sprintsociety.in`
   - Razorpay → Webhooks → point the webhook URL at
     `https://app.sprintsociety.in/api/subscription/webhook` and set
     `RAZORPAY_WEBHOOK_SECRET` to the dashboard webhook secret.
4. Re-run the checklist on the custom domain.

## Decommission Railway

Once the custom domain serves from Vercel and is verified:

1. Confirm no DNS record still points to Railway.
2. In Railway, **remove the custom domain** from the old service, then
   **delete the service / project** (or pause it first if you want a rollback
   window).
3. Railway build files are already removed from the repo (`railway.toml`,
   `nixpacks.toml`). Nothing in the codebase references Railway anymore.

## Notes & known limitations

- **Connection limits.** Always use the Supabase **pooler** in `DATABASE_URL` on
  Vercel; the per-instance pool is capped at 1 (`server/src/database/pg.ts`).
- **Rate limiting** is in-memory, so it is per-function-instance on Vercel
  (weaker under fan-out). Move to Upstash/Redis if you need global limits.
- **Function duration.** `vercel.json` sets `maxDuration: 30`. If your plan caps
  lower, reduce it; AI coaching calls are the longest requests.
- **Backups.** Supabase managed backups are the durable copy; the app CSV export
  is secondary. See [`RESTORE.md`](RESTORE.md).

## Planned upgrade — Supabase Realtime (true real-time on Vercel)

Polling is the interim. To restore instant chat/notifications without an
always-on host:

1. Add `@supabase/supabase-js` to the client; expose `VITE_SUPABASE_URL` +
   `VITE_SUPABASE_ANON_KEY`.
2. Enable Realtime on `community_chat_messages` and `user_notifications`; add
   Row-Level-Security policies (members can read their community's messages;
   users can read their own notifications).
3. Replace the polling in `CommunityDetailPage` / `useNotificationSocket` with
   Realtime subscriptions; keep REST `POST` for sending.
