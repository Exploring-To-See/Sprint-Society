# Part 2 (Launch-readiness) — setup & deploy steps

**Part 1** (`142b07d` — audit-gaps UI, client-only) is already on `main`.
**Part 2** = the launch-readiness commits on this `fix/audit-gaps` branch:

| Commit | What |
|---|---|
| `7bdbd82` | Legal pages (`/privacy`, `/terms`) + cookie consent |
| `83ae282` + `85ebfb9` | Email verification (non-blocking) + HTML-escape hardening |
| `4d5aeab` | Subscription downgrade (period-end, reversible) |
| `0a9c19c` | Analytics + SEO (robots/sitemap/OG/JSON-LD) + feedback |
| `2c1bdce` | Handoff docs |

> Part 2 is **additive** (new routes/pages + 3 nullable DB columns). But do the setup below **before** it reaches production, or the new endpoints 500 on missing columns.

---

## 1. Database migration — REQUIRED, do first
Part 2 adds 3 idempotent schema changes: `users.email_verified`, table `email_verification_tokens`, `user_subscriptions.scheduled_plan_key`.

Run `npm run migrate` against Supabase using the **direct** connection (port 5432 — DDL, not the pooler):
```bash
# on this branch; get the direct string from Supabase → Connect → "Direct connection"
DATABASE_URL="postgresql://postgres:<DB_PASSWORD>@db.<project-ref>.supabase.co:5432/postgres" npm run migrate
```
Verify:
```bash
psql "$DATABASE_URL" -c "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='email_verified';"
psql "$DATABASE_URL" -c "SELECT to_regclass('public.email_verification_tokens');"
psql "$DATABASE_URL" -c "SELECT column_name FROM information_schema.columns WHERE table_name='user_subscriptions' AND column_name='scheduled_plan_key';"
```

## 2. Vercel environment variables
- **`RESEND_API_KEY`** — from resend.com. Without it, verification emails only log to console (no send).
- Confirm existing: `DATABASE_URL` (pooler `:6543`), `JWT_SECRET`, `CRON_SECRET`, `RAZORPAY_KEY_ID/SECRET/WEBHOOK_SECRET`, `GOOGLE_CLIENT_ID` + `VITE_GOOGLE_CLIENT_ID`, `CLIENT_URL=https://app.sprintsociety.in`.

## 3. Replace the placeholder domain (`sprintsociety.app` → `app.sprintsociety.in`)
Edit on this branch:
- `client/public/robots.txt`
- `client/public/sitemap.xml`
- `client/index.html` (canonical `<link>`, Open Graph tags, JSON-LD)

Then: add the Google Search Console verification tag (slot is in `index.html`), and submit `sitemap.xml` to Google Search Console + Bing Webmaster Tools.

## 4. Legal + support
- `client/src/lib/support.ts` → set `SUPPORT_EMAIL` and `LEGAL_ENTITY`.
- Have counsel review the `/privacy` + `/terms` template copy (India DPDP + GDPR).

## 5. Make the downgrade actually apply on expiry
Downgrade is **intent-only** — it writes `scheduled_plan_key`. The renewal/cron path must apply it. In `server/src/scheduler/jobs.ts` (`runMaintenance`, run daily via `/api/cron/maintenance`): when a Pro subscription expires, if `scheduled_plan_key` is set, activate that plan (or drop to free) instead of just expiring.

## 6. QA (needs Razorpay test keys + a running server)
- Payment lifecycle in Razorpay **test mode**: buy → upgrade → downgrade → cancel.
- Wire `analytics.track(...)` at key events (signup, run logged, subscribe) — the pipeline + page views are already live; these are one-liners at each call site.

---

## 7. Bring Part 2 to `main` (AFTER steps 1–5)
**Part 1 (`142b07d`) is already on `main`.** Do **NOT** merge the whole branch — that re-applies `142b07d` and will conflict/duplicate. Cherry-pick **only** the Part 2 commits, in order:
```bash
git checkout main && git pull
git cherry-pick 7bdbd82 83ae282 85ebfb9 4d5aeab 0a9c19c 2c1bdce
cd client && npx tsc -b --noEmit && npm run build   # must be green
git push origin main
```
Alternative: rebase this branch onto `main` dropping `142b07d`, then open a PR.

## Rollback
Part 2 is additive. Revert the Part 2 cherry-picks to remove the frontend/routes; the new DB columns are nullable/defaulted and harmless if unused.
