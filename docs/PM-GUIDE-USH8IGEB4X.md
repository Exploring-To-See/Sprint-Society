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
- **Streak Health Panel** — shows active streaks count, at-risk runners (have streak but haven't run today), and streaks lost today. Lists top at-risk runners by name + streak length for targeted re-engagement nudges.
- Tier breakdown (how many runners in each tier)
- Top 5 runners by XP

### Moderation Tab — Chat Messages

New endpoints for moderating community real-time chat:
- **GET /admin/moderation/chat-messages** — view 50 most recent chat messages across all communities
- **DELETE /admin/moderation/chat-messages/:id** — delete a specific chat message (logged to audit)

### Analytics Tab — Engagement Metrics

New "Engagement (P2 Features)" section at bottom of Analytics showing:
- **Badges Earned** — total achievements unlocked across all users
- **Reactions** — total reactions with breakdown by type (🙌 🔥 💪 🫡 ⚡)
- **Top Streak** — longest active streak
- **Active Clubs** — communities with member activity this week
- Top streaks leaderboard (top 5 by streak length)

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

1. Pulls user's recent runs (up to 50)
2. Calculates 6 factors (V2 engine, audited):
   - **Performance** (40%) — race/best times, age-graded, interpolated against benchmark table (5K/10K/HM/Marathon)
   - **Volume** (15%) — avg weekly km, gender-adjusted (women get 13% boost)
   - **Consistency** (15%) — active weeks out of last 12, platform maturity bonus
   - **Recovery** (15%) — rest days, HRV trend, RPE, sleep hours
   - **VO2max** (10%) — with freshness decay (halved after 3 months stale)
   - **Pace Compliance** (5%) — GPS-only, % runs in prescribed zone
3. Composite score → 40-level system:
   - B1–B10: Beginner
   - I1–I10: Intermediate
   - A1–A10: Advanced
   - P1–P10: Pro (gated behind A5+)

4. **Classification Status** (new):
   - `calibrating` — first 3 weeks, level capped at I5, displayed to user as "Calibrating (X weeks remaining)"
   - `provisional` — training data only, no verified race
   - `validated` — user has at least one Strava race activity (workout_type=1) or manual race PR

5. **Safety Rails** (parallel system, blocks advancement):
   - ACWR > 1.5 (elevated) / > 1.8 (critical)
   - Volume spike > 20% (warning) / > 30% (blocks)
   - Extended break (4+ weeks without activity)

6. **Advancement**: requires 3 consecutive weeks at target level + performance at target + no blocking rails + recovery >= 15/40
7. **Regression**: 4 weeks below → sub-level drop; 8 weeks below tier floor → tier demotion

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

### AI Profile System

The AI coaching backend uses Anthropic's Claude models to provide personalized coaching:

**Architecture:**
- **Sonnet** (claude-sonnet-4-6) — Powers conversational AI chat (Pro/Premium only)
- **Haiku** (claude-haiku-4-5) — Background training evaluations (lightweight, fast)

**Endpoints:**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai/profile` | GET | Get user's AI profile (what coach knows) |
| `/api/ai/profile` | PATCH | User edits their profile (goals, health, diet, context) |
| `/api/ai/chat` | POST | Send message to Sonnet coach |
| `/api/ai/evaluate` | POST | Trigger Haiku background evaluation |
| `/api/ai/usage` | GET | Get today's usage stats |

**Rate Limits:**
- Pro/Premium: 30 chat messages/day
- Free: No AI chat access (403 returned)
- Background evaluations don't count toward chat limit

**AI Profile (Persistent Memory):**
The system automatically extracts and stores insights from conversations:
- Health notes (injuries, conditions mentioned)
- Goals (races, targets, dreams)
- Personal context (schedule, work, diet preferences)
- Conversation history (compressed insights log)

Users can view and edit their AI profile via the My AI Profile page.

**Graceful Degradation:**
- If `ANTHROPIC_API_KEY` is not set, all AI endpoints return friendly error messages
- API failures show random fun coach-themed error messages
- Token tracking continues even if API calls fail

**Database Tables:**
- `ai_profiles` — Permanent memory per user (health, goals, diet, insights)
- `ai_usage` — Token tracking per call (model, input/output tokens, purpose)
- `ai_checkins` — Pre/post run check-in responses with AI summaries

**Environment Variables:**
| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Claude API access (required for AI features) |

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

## Kendu System (Admin Guide)

### What is Kendu?
Kendu is the in-app currency (v2: **1 Kendu = 1 km of running**). It replaces XP as the primary progression system. Runners earn it through running, following their coach, beating PBs, and community participation. They spend it to unlock app features (communities, events, challenges) and redeem brand offers.

### Economy Design (v2)

**Earning rates:**
- 1 Kendu per km (base)
- Bonuses: +5 PB, +3 workout, +20 plan, +5 consistency, +10 streak, +8 event
- Daily cap: 50 Kendu
- Coach multiplier: 1.5x

**Spending costs:**
- Create community: 1000 (requires admin approval + 20/month upkeep)
- Host event: 75
- 1v1 Challenge: 5-50 stake (20% rake burned)
- Priority RSVP: 15, Boost post: 10, Group challenge: 50
- Card skin: 40, AI deep dive: 30, Sponsor leaderboard: 500
- Gift: 3 min (15% fee burned permanently)

**Inflation controls:**
- Community upkeep (20/month) — recurring drain
- Gift fee (15%) — burned on every transfer
- Challenge rake (20%) — burned from winner's pot
- Daily cap (50) — limits earning velocity

**Sustainability math:**
- Casual runner earns ~15-20/week → community takes ~12-15 months
- Committed runner earns ~35-50/week → community takes ~5-7 months
- Max possible/year: ~4,800 (elite grinder) — no "millions" problem

### Admin: Community Approval Flow
1. User submits a community request (name, purpose, category, leader name, contact)
2. Request appears in **Admin Panel → Communities tab → Pending Requests**
3. Admin sees the requester's current Kendu balance
4. **Approve** — charges 1000 Kendu from requester, creates community + monthly subscription
5. **Reject** — marks rejected, no Kendu charged
6. If requester's balance dropped below 1000 by the time admin approves → approval fails with "insufficient Kendu" error

### Admin: Managing Offers
1. Go to **Admin Panel → Kendu tab**
2. Click **+ Create Offer** — fill in brand name, title, cost, quantity
3. After creating, click **Upload Codes** on the offer card
4. Paste coupon codes (one per line) — these get assigned to users on redemption

### Admin: Economy Health Panel
New section on Kendu admin tab shows:
- **Weekly Earned vs Spent** — net flow ratio (healthy = 0.5-1.0)
- **Active Subscriptions** — communities paying monthly upkeep
- **Dormant Communities** — unpaid upkeep, hidden from browse
- **Active Challenges** — 1v1s in progress + total pot value
- **Process Upkeep** button — manually trigger overdue subscription collection

### Admin: Managing Challenges
- Challenges auto-expire at deadline if neither party wins
- Expired challenges refund 80% to both parties (20% burned)
- Admin can see all active challenges and their pot values

### Key Stats (Admin Kendu Tab)
- **In Circulation** — total spendable Kendu across all users
- **Lifetime Earned** — total Kendu ever awarded (includes spent)
- **Redemptions** — number of successful marketplace redemptions
- **Active Offers** — currently available marketplace offers

### Business Model
- Brands pay Sprint Society to list offers (Decathlon, Red Bull, etc.)
- Runners redeem Kendu for brand coupons/products
- Sprint Society = platform connecting verified active runners with brands
- Revenue: brand listing fees + transaction rake (20% challenge, 15% gift)

### Rules
- Daily earn cap: 50 Kendu (prevents farming)
- Minimum 5 completed runs before any marketplace redemption
- Max 1 redemption per user per offer
- Kendu never expires (but upkeep drains it)
- Lifetime earned drives level progression (formula: 10 * 1.5^(level-1) per level)
- Community creation requires 1000 Kendu (non-admin) + admin approval
- Kendu charged only when admin approves the request (not at submission)
- Communities go dormant if 20/month upkeep is unpaid

### API Endpoints (for reference)
- `GET /api/kendu/admin/stats` — dashboard metrics
- `GET /api/kendu/admin/economy` — economy health (earned/spent/flow ratio)
- `POST /api/kendu/admin/process-upkeep` — trigger upkeep collection
- `POST /api/kendu/admin/offers` — create offer
- `POST /api/kendu/admin/offers/:id/codes` — upload coupon codes
- `GET /api/kendu/admin/redemptions` — all redemptions log
- `POST /api/kendu/spend/*` — all spending endpoints (community, event, challenge, etc.)
- `GET /api/kendu/challenges` — user's active challenges
- `GET /api/kendu/subscriptions` — user's active subscriptions

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
Client (React + Vite, static)  →  /api (Express serverless function)  →  Supabase Postgres
                                          ↕
                              Anthropic (AI coach) · Razorpay · Google OAuth
```

### Deployment

- Hosted on **Vercel** — static client + Express API as a serverless function
- Database is **Supabase Postgres** (transaction pooler in production)
- Background jobs run via **Vercel Cron**; full runbook: [DEPLOYMENT.md](DEPLOYMENT.md)

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | Auth token signing (required) |
| `DATABASE_URL` | Supabase Postgres connection (pooler `:6543` in prod) |
| `CLIENT_URL` | Frontend origin (for CORS) |
| `CRON_SECRET` | Guards the maintenance cron |
| `ANTHROPIC_API_KEY` | Claude AI coaching (optional — degrades gracefully) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | Payments |
| `GOOGLE_CLIENT_ID` / `VITE_GOOGLE_CLIENT_ID` | Google sign-in |

### Database

Postgres via `pg` (Supabase). Key tables:
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
3. If connected → check function logs in Vercel
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
- **Kendu currency system** (replaces XP as primary progression)
- Kendu Rewards Marketplace (/rewards)
- Kendu admin panel (create offers, upload coupon codes, view redemptions)
- Achievements
- Leaderboard (now Kendu-based)
- Shareable run cards
- Admin panel (stats, runners, sessions, announcements, Kendu offers)

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
