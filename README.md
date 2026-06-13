# Sprint Society ⚡

AI-powered run club platform. Track your runs, level up your fitness, transform your pace.

**A product by Kendu Entertainment.**

> Sprint Society is a running, fitness, and wellness community built for the runners, by the runners. Powered by AI-driven coaching and grounded in real community, Sprint Society meets you exactly where you are and transforms every run into progress. No judgement. No finish line. Just forward.

---

## How It Works

This is a **hosted web app** — once deployed, anyone can access it from their phone/laptop via a URL.

**Production:** [app.sprintsociety.in](https://app.sprintsociety.in) — served by the `poetic-creativity` Railway service, which deploys the whole monorepo from the repo root (`railway.toml`). This is the single source of truth for production.

### Two Access Levels:

| Role | What they see |
|------|--------------|
| **Admin** (you) | Full admin panel — view all runners, their stats/progress, create club sessions, post announcements, manage the community |
| **Runner** (members) | Personal dashboard — registration, Strava sync, AI coaching, challenges, progress tracking, shareable run cards |

---

## Deploy to Railway (Recommended)

### Step 1: Push code to GitHub

1. Go to github.com and create a new repository called `sprint-society`
2. Upload this entire `sprint-society` folder to that repository

### Step 2: Deploy on Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub Repo"**
3. Select your `sprint-society` repository
4. Railway will auto-detect and build it

### Step 3: Set Environment Variables on Railway

In your Railway project settings → Variables, add:

```
PORT=3001
NODE_ENV=production
JWT_SECRET=pick-a-random-secret-string-here
STRAVA_CLIENT_ID=your-strava-client-id
STRAVA_CLIENT_SECRET=your-strava-client-secret
STRAVA_REDIRECT_URI=https://YOUR-RAILWAY-URL/strava/callback
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=your-secure-password
ADMIN_NAME=Your Name
```

### Step 4: Create Your Admin Account

After deploy, run this in Railway's terminal (or locally):
```bash
npm run setup:admin
```

### Step 5: Access the App

- Your URL will be something like: `https://sprint-society-production.up.railway.app`
- Log in with your admin email/password → you'll see the Admin Panel
- Share the same URL with runners → they register and get the runner view

---

## Strava Setup

1. Go to https://www.strava.com/settings/api
2. Create an application:
   - Application Name: `Sprint Society`
   - Website: your Railway URL
   - Authorization Callback Domain: your Railway domain (e.g., `sprint-society-production.up.railway.app`)
3. Copy Client ID and Client Secret to your Railway environment variables

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
| Frontend | React 18, Vite, TypeScript, TailwindCSS, Framer Motion, Recharts |
| Backend | Express, TypeScript, better-sqlite3, JWT |
| Integration | Strava API (OAuth2 + Webhooks) |
| AI Engine | Deterministic sports science formulas (zero cost) |
| Hosting | Railway.app (free tier available) |

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
