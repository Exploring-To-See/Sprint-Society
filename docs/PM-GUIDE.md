# Sprint Society — Product Manager & Editor Guide

## Overview

This is your operational guide for managing Sprint Society as the product owner and content editor. Covers admin features, content management, metrics to watch, and how the system works under the hood.

---

## Admin Panel

Access: Log in with an admin account → you'll land on `/admin` instead of the dashboard.

### Overview Tab

KPI cards refresh on load:
- **Total Runners** — all registered accounts
- **Total Runs** — all synced activities across all users
- **Total KM** — aggregate distance
- **This Week** — runs recorded in the current week

Plus:
- Tier breakdown (how many runners in each tier)
- Top 5 runners by XP

### Runners Tab

Full directory of all registered runners. Each entry shows:
- Name, email
- Tier classification
- Total runs, total km, average pace
- Level and XP

Use this to:
- Spot inactive runners (low run count)
- Identify top performers for shoutouts
- Check if new signups are completing onboarding

### Sessions Tab

Create and manage club run sessions:
- **Title** — e.g., "Saturday Morning 5K"
- **Distance** — planned distance
- **Date/Time** — when it happens
- **Location** — meeting point

You can:
- Edit existing sessions
- Delete cancelled sessions
- Track attendance per session

### Announcements Tab

Post messages to the entire community:
- **Title** — headline
- **Body** — full message (supports plain text)
- **Pin** — toggle to keep at top of feed

Pinned posts always show first. Delete old announcements to keep the feed fresh.

---

## How the System Works

### User Journey

```
Sign Up → Profile Setup → Connect Strava → Run → Auto-Sync → Tier Calculated → Challenges Generated → XP Earned → Level Up
```

### Tier Classification Engine

Runs automatically when a user visits their Coaching tab:

1. Pulls user's recent runs (up to 30)
2. Calculates 4 metrics:
   - **Age-graded %** (35% weight) — pace normalized for age/gender
   - **VO2max estimate** (25%) — from pace + distance data
   - **Distance score** (20%) — weekly volume
   - **Consistency score** (20%) — regularity of activity
3. Composite score → tier assignment:
   - 0–34: Beginner
   - 35–64: Intermediate
   - 65+: Advanced

### Pace Zone Calculation

Based on:
- Age and gender adjustment factors
- BMI modifier
- Current fitness level
- Tier classification

Produces 4 zones:
- Easy = 120% of tempo pace
- Tempo = base calculated pace
- Interval = 88% of tempo
- Race = 95% of tempo

### Challenge Generation

Weekly auto-generation (on first access each week):
- Picks from 7 categories
- Scales difficulty by tier
- XP rewards: Beginner 30–50, Intermediate 45–65, Advanced 65–90
- Stored per user per week
- Resets every Monday

### XP & Leveling

- XP sources: runs (auto), challenges (manual completion), achievements
- Level curve: `100 * 1.5^(level - 1)` XP per level
- Streaks tracked by consecutive active days

### Strava Integration

- **OAuth2 flow**: User authorizes → we store access/refresh tokens
- **Token refresh**: Automatic when expired
- **Webhook**: Strava pings us on new activity → we fetch and store it
- **Manual sync**: User-triggered, pulls last 30 activities
- **Filter**: Only `type === "Run"` activities imported

---

## Content & Community Management

### Weekly Cadence

| Day | Action |
|-----|--------|
| Monday | New challenges auto-generate for all users |
| Mid-week | Post an announcement (motivation, tips, events) |
| Friday/Saturday | Create next week's club session |
| Sunday | Review week's stats in admin Overview |

### Announcement Best Practices

- Keep titles short and punchy (under 60 chars)
- Body: 2–3 sentences max
- Pin only 1–2 posts at a time (otherwise pinning loses its value)
- Delete announcements older than 2 weeks
- Good topics: upcoming sessions, achievement shoutouts, tips, events

### Session Management

- Create sessions at least 3 days in advance
- Include specific meeting point details in location
- Standard distances: 3K (beginners), 5K (intermediate), 10K (advanced)
- Track attendance to gauge engagement

---

## Key Metrics to Monitor

### Health Metrics

| Metric | Healthy Signal | Warning Signal |
|--------|---------------|----------------|
| Weekly active runners | Stable or growing | Dropping week over week |
| Runs this week | Consistent with previous | Sharp drop |
| New signups with Strava connected | >80% connect | Many unconnected accounts |
| Challenge completion rate | >40% | <20% (challenges too hard or irrelevant) |
| Tier distribution | Bell curve (most intermediate) | Everyone stuck in beginner |

### Engagement Signals

- **Streak maintenance** — are people running consistently?
- **Challenge completions per week** — are challenges driving behavior?
- **Share card downloads** — are people sharing? (social proof)
- **Session attendance** — are club runs getting traction?
- **Leaderboard activity** — are top runners pulling away or is it competitive?

---

## Technical Quick Reference

### Architecture

```
Client (React + Vite)  →  Server (Express + TypeScript)  →  SQLite DB
                                    ↕
                              Strava API (OAuth2 + Webhooks)
```

### Deployment

- Hosted on **Railway.app**
- Single service deployment (monorepo builds together)
- SQLite file lives on Railway's persistent volume

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `STRAVA_CLIENT_ID` | Strava OAuth app ID |
| `STRAVA_CLIENT_SECRET` | Strava OAuth secret |
| `STRAVA_WEBHOOK_VERIFY_TOKEN` | Webhook validation |
| `JWT_SECRET` | Auth token signing |
| `DATABASE_URL` | SQLite file path |
| `CLIENT_URL` | Frontend URL (for CORS) |

### Database

SQLite via `better-sqlite3`. Key tables:
- `users` — profiles, credentials, fitness data
- `activities` — all synced runs
- `user_xp` — level, XP, streaks
- `challenges` — weekly challenges per user
- `tier_history` — tier changes over time
- `achievements` / `user_achievements` — badge system
- `club_sessions` — managed sessions
- `announcements` — admin posts
- `strava_tokens` — OAuth credentials

### Admin Account Setup

```bash
npm run setup:admin
```

Creates or promotes an account to admin role.

---

## Troubleshooting

### "User says runs aren't syncing"

1. Check their Strava connection status (Runners tab → find user)
2. If disconnected → tell them to reconnect on Profile
3. If connected → check webhook logs on Railway
4. Last resort → tell them to hit manual sync on Profile

### "Tier seems wrong"

- Tier recalculates on each Coaching tab visit
- Needs at least a few runs to produce meaningful scores
- New users with 1–2 runs will get noisy results (expected)

### "Challenges not appearing"

- Challenges generate on first access each week
- If it's Monday and nothing shows → check server logs for generation errors
- User needs at least one synced run for challenges to calibrate

### "XP not updating"

- Run XP: awarded on sync (automatic)
- Challenge XP: awarded on tap (user must mark complete)
- Achievement XP: awarded on unlock condition met

### "Can't access admin panel"

- Account must have `role = 'admin'` in database
- Run `npm run setup:admin` to create/promote
- Only one admin role check — no granular permissions currently

---

## Feature Roadmap Context

### Currently Live
- Registration + onboarding
- Strava OAuth + auto-sync + webhooks
- AI tier classification
- Personalized pace zones
- Transformation journey plans
- Weekly challenges (7 categories)
- XP/leveling/streaks
- Achievements
- Leaderboard
- Shareable run cards
- Admin panel (stats, runners, sessions, announcements)

### Possible Next

These are ideas — not committed. Use as context for planning:

- Push notifications (run reminders, challenge nudges)
- Social features (follow runners, comment on runs)
- Group challenges (team-based competitions)
- Training plans (structured multi-week programs)
- AI run recommendations ("today you should run X km at Y pace")
- In-app messaging
- Club session RSVPs
- Detailed run maps (polyline rendering)
- Heart rate zone analysis

---

## Quick Commands

```bash
# Start development
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Create admin account
npm run setup:admin

# Client only (frontend dev)
npm run dev:client

# Server only (backend dev)
npm run dev:server
```

---

## Content Calendar Template

Use this as a starting template for weekly content:

```
Week of [DATE]

□ Monday — Challenges auto-generate (no action needed)
□ Tuesday — Post motivational announcement
□ Wednesday — Check weekly stats, identify shoutout candidates
□ Thursday — Create weekend session
□ Friday — Post session reminder announcement (pinned)
□ Saturday/Sunday — Run the session, mark attendance
□ Sunday evening — Review week, plan next week's session
```
