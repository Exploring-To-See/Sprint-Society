# Sprint Society ⚡

AI-powered run club platform. Track your runs, level up your fitness, transform your pace.

**A product by Kendu Entertainment.**

> Sprint Society is a running, fitness, and wellness community built for the runners, by the runners. Powered by AI-driven coaching and grounded in real community, Sprint Society meets you exactly where you are and transforms every run into progress. No judgement. No finish line. Just forward.

---

## How It Works

This is a **hosted web app** — once deployed, anyone can access it from their phone/laptop via a URL.

**Production:** deployed on **Vercel** (static client + the Express API as a serverless function) backed by **Supabase Postgres**. The Vercel project deploys from the repo root on every push to `main`; `app.sprintsociety.in` is attached to that Vercel project as a custom domain. This is the single source of truth for production.

### Two Access Levels:

| Role | What they see |
|------|--------------|
| **Admin** (you) | Full admin panel — view all runners, their stats/progress, create club sessions, post announcements, manage the community |
| **Runner** (members) | Personal dashboard — registration, Strava sync, AI coaching, challenges, progress tracking, shareable run cards |

---

## Deploy to Vercel

The whole app (static client + the `/api` serverless function) deploys from the
repo root. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the full runbook and
the custom-domain cutover.

### Step 1: Import the repo into Vercel

1. Push the repo to GitHub.
2. In Vercel → **Add New… → Project**, import the repository.
3. **Leave the Root Directory as the repo root** (do not set it to `client/`) —
   the API function and the `shared/` types live outside `client/`. `vercel.json`
   already defines the build command, output directory, the `/api` function and
   the daily cron.

### Step 2: Provision Supabase

1. Create a Supabase project; copy the **transaction pooler** connection string
   (`...pooler.supabase.com:6543`).
2. Apply the schema + seed: `DATABASE_URL=<direct 5432 url> npm run migrate`.

### Step 3: Set environment variables on Vercel

Add the variables from [`.env.example`](.env.example) — at minimum
`JWT_SECRET`, `DATABASE_URL` (pooler), `CLIENT_URL` (your Vercel origin),
`ANTHROPIC_API_KEY`, `RAZORPAY_KEY_ID/SECRET` (+ `RAZORPAY_WEBHOOK_SECRET`),
`GOOGLE_CLIENT_ID` + `VITE_GOOGLE_CLIENT_ID`, and `CRON_SECRET`.
Leave `VITE_API_URL` and `VITE_ENABLE_WS` unset (same-origin API, polling realtime).

### Step 4: Create your admin account

```bash
ADMIN_PASSWORD=your-secure-password npm run migrate   # seeds admin@sprintsociety.com
```

### Step 5: Foolproof, then attach the domain

1. Test everything on the `*.vercel.app` URL first.
2. Then add `app.sprintsociety.in` under Vercel → Project → Settings → Domains,
   update `CLIENT_URL` (and the Google OAuth authorized origins) to the custom
   domain, and redeploy.

---

## Features

### For Runners:
- **Quick Registration (< 15 seconds)** — tap grids, sliders, zero typing
- **Strava Auto-Sync** — runs appear automatically
- **AI Tier Classification** — Beginner / Intermediate / Advanced
- **Personalized Pace Zones** — easy, tempo, interval, race targets
- **Weekly Challenges** — bodyweight, nutrition, hydration, technique, gear, breathing
- **Transformation Journey** — week-by-week plan from current to ideal pace
- **XP & Leveling** — gamification with achievements and streaks
- **Shareable Run Cards** — Instagram-story-sized branded graphics

### For Admin (you):
- **Runner Directory** — see all members, their tier, stats, progress
- **Club Sessions** — schedule runs, track attendance
- **Announcements** — post updates visible to all runners
- **Club Stats** — total runners, runs, distance, tier breakdown

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, TailwindCSS, Framer Motion, Recharts (PWA) |
| Backend | Express, TypeScript, Postgres (`pg`), JWT |
| Database | Supabase Postgres |
| Integrations | Razorpay (payments), Anthropic (AI coach), Google OAuth |
| AI Engine | Deterministic sports-science formulas + Anthropic for coaching/chat |
| Hosting | Vercel (static client + serverless API + Vercel Cron) |

---

## Local Development (optional)

If you want to run it locally for development:

```bash
npm install
npm run setup:admin
npm run dev
```

Open http://localhost:5173 in your browser.

---

*Sprint Society — For the runners, by the runners.* ⚡  
*A product by Kendu Entertainment.*
