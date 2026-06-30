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
Sign Up (Google or Email) → AI Profiling → Set Goal → Training Plan → Run → Auto-Sync → Tier Calculated → Challenges Generated → XP Earned → Level Up
```

### Authentication

Two sign-in methods:
- **Google OAuth2** — "Continue with Google" button using Google Identity Services. Zero password friction. New users get auto-created with Google profile data (name, email, photo). Existing users with matching email get their account linked.
- **Email/Password** — Traditional registration with bcrypt hashing. Phone number also supported for login.

Backend verifies Google's `id_token` using their public JWKS certs. No third-party auth service (no Firebase, no Auth0). All sessions use our own JWT (7-day expiry).

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

- Hosted on **Vercel** — static client (`client/dist`) + the Express API as a
  serverless function (`api/[...path].ts`)
- Database is **Supabase Postgres** (transaction pooler in production)
- Background jobs run via **Vercel Cron** (`/api/cron/maintenance`)
- Full runbook: [DEPLOYMENT.md](DEPLOYMENT.md)

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | Auth token signing (required) |
| `DATABASE_URL` | Supabase Postgres connection (pooler `:6543` in prod) |
| `CLIENT_URL` | Frontend origin (for CORS) |
| `CRON_SECRET` | Guards the maintenance cron |
| `ANTHROPIC_API_KEY` | Claude AI coaching (optional — degrades gracefully) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | Payments |
| `GOOGLE_CLIENT_ID` | Google OAuth2 client ID (enables "Sign in with Google") |
| `VITE_GOOGLE_CLIENT_ID` | Same value as GOOGLE_CLIENT_ID (exposed to frontend at build time) |

Full list with formats: [.env.example](../.env.example).

### Database

Postgres via `pg` (Supabase). Key tables:
- `users` — profiles, credentials, fitness data, timezone (default 'Asia/Kolkata')
- `activities` — all synced runs
- `user_xp` — level, XP, streaks
- `challenges` — weekly challenges per user
- `tier_history` — tier changes over time
- `achievements` / `user_achievements` — badge system
- `club_sessions` — managed sessions
- `announcements` — admin posts
- `strava_tokens` — OAuth credentials

### Performance Indexes

Key indexes for feed/event/admin query performance:
- `idx_ai_usage_user_date` — ai_usage(user_id, created_at)
- `idx_community_chat_messages_community_date` — community_chat_messages(community_id, created_at DESC)
- `idx_kendu_transactions_user_date` — kendu_transactions(user_id, created_at DESC)
- `idx_activities_user_date` — activities(user_id, start_date DESC)
- `idx_event_rsvps_event` — event_rsvps(event_id, status)
- `idx_kudos_activity` — kudos(activity_id)

**N+1 fixes applied:**
- Social feed: 4 correlated subqueries → LEFT JOIN aggregates (1 query instead of 4N+1)
- Events list: N friendsGoing queries in loop → single batched query
- Admin runners: 3 subqueries per runner → JOIN + GROUP BY pre-aggregation

**Benchmark (50 runners, 500 activities):**
- Social feed: ~80ms → ~12ms (6.7× faster)
- Events (20 events): ~45ms → ~8ms (5.6× faster)
- Admin runners (50): ~120ms → ~15ms (8× faster)

### Subscription System

**Plan hierarchy:** `free` (0) → `base` (1) → `pro` (2)

| Plan | Price | Duration | Key Features |
|------|-------|----------|--------------|
| Base | ₹9/mo | 30 days | Plans, summaries, pace/HR zones, events, communities, social, leaderboard |
| Pro | ₹99/mo | 30 days | Everything in Base + adaptive engine, transformation plans, weekly challenges, PRs, create communities, AI chat coach |

**Access control:**
- `requirePlan('base')` gates all paid features
- `requirePlan('pro')` gates AI-specific features (chat coach, adaptive engine, transformation plans, weekly challenges, PRs, community creation)
- Free (no subscription) = registration + locked previews only
- Lapsed subscription: plan becomes view-only, auto-tracking continues, no adaptation

**AI usage limits:**
- Pro: 30 messages/day
- Base: 5 messages/day (background eval only, no chat)

**Model configuration:** Centralized in `server/src/config.ts` → `config.anthropic.models`
- Chat: `claude-sonnet-4-6`
- Background eval: `claude-haiku-4-5-20251001`

**Tables:** `subscription_plans`, `user_subscriptions`
**Routes:** `/subscription/plans`, `/subscription/status`, `/subscription/create-order`, `/subscription/verify`, `/subscription/cancel`
**Payment:** Razorpay integration (env: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`)

**Payment endpoints:**
- `POST /subscription/create-order` — creates Razorpay order, returns order_id + key_id for checkout
- `POST /subscription/verify` — verifies signature, activates subscription
- `POST /subscription/upgrade` — upgrade Base→Pro (new billing period)
- `POST /subscription/cancel` — cancel auto-renewal (plan stays until expiry)
- `POST /subscription/webhook` — Razorpay server-to-server webhook (signature verified)
- `GET /subscription/history` — user's payment history

**Subscription lifecycle:**
1. User picks plan → `create-order` → Razorpay checkout opens
2. Payment succeeds → client calls `verify` → subscription activated
3. Razorpay webhook also confirms (redundant safety)
4. Hourly scheduler job expires subscriptions past `expires_at`
5. Expired = view-only mode (auto-tracking continues, no adaptation/plans/AI)
6. Upgrade: creates new Pro order, expires old Base sub on verify

**Launch checklist (for founder):**
- [ ] Create Razorpay account at https://razorpay.com
- [ ] Get TEST keys from Dashboard → Settings → API Keys
- [ ] Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in Vercel (test mode first)
- [ ] Test: buy Base subscription with test card `4111 1111 1111 1111`
- [ ] Test: upgrade Base→Pro
- [ ] Test: verify subscription expires after duration
- [ ] Switch to LIVE keys when ready to accept real payments
- [ ] Set webhook URL in Razorpay Dashboard: `https://app.sprintsociety.in/api/subscription/webhook`
- [ ] Enable events: `payment.captured`, `payment.failed`

### Feature Flags (Kill Switches)

Server-side feature gate system with admin toggle UI.

**How it works:**
- `isFlagEnabled(key, userId?)` — server-side check, returns boolean
- `GET /api/flags` — client-facing endpoint, returns all flags evaluated for the current user
- Admin panel: `/admin/flags` — toggle flags on/off, set rollout %, per-user overrides

**Active flags:**
| Key | Purpose | Default |
|-----|---------|---------|
| `social_feed` | Activity feed with kudos | ON |
| `live_events` | Event creation/RSVPs | ON |
| `communities` | Community chat/creation | ON |
| `razorpay_payments` | Payment processing | ON |
| `strava_sync` | Strava OAuth + webhooks | ON |
| `ai_chat` | Sonnet chat coach (Pro) | OFF (reserved) |
| `ai_voice` | Voice coaching (future) | OFF (reserved) |
| `ai_generation` | AI plan generation (future) | OFF (reserved) |

**Kill switch process:** Admin panel → Flags tab → toggle OFF → feature returns 503 immediately. No deploy needed.

### API Envelope Format

All API responses follow a standard envelope:
- **Success:** `{ data: <payload> }`
- **Error:** `{ error: { code: "ERROR_CODE", message: "Human-friendly message" } }`

Client-side (`client/src/lib/api.ts`) auto-unwraps the envelope:
- Success: `response.data` is the inner payload directly
- Error: throws `ApiError` with `.code`, `.message`, `.status`
- Global error toast fires automatically on any non-401 API error

**Error UI components:**
- `<ErrorToast />` — global toast (mounted in App root), auto-dismisses after 4s
- `<QueryError message="..." onRetry={refetch} />` — inline error state with retry button

No raw error text is ever shown to users.

### Batch Endpoints (Performance)

Two batch endpoints collapse multiple round-trips into one:

**GET /api/dashboard** — returns `{ xp, tier, challenges, runStats, planWeek, profilingStatus }` in one response. Replaces 6 separate queries from the Dashboard page.

**GET /api/coach/insights** — returns `{ adaptive, summary, vdotProgression, tier, predictions, stats, records }` in one response. Replaces 7+ separate queries from the AI Analytics tab.

Client uses `staleTime: 2 minutes` to avoid re-fetching on tab switches. Query keys: `dashboard-batch` and `coach-insights-batch`.

### WebSocket Notifications (Real-time Push)

Notifications are pushed in real-time via the existing `/ws` WebSocket server.

**How it works:**
- `createNotification()` inserts into DB then calls `pushToUser(userId, event)` via WebSocket
- Client connects to `/ws?token=<jwt>` (no community param = notification-only connection)
- On receiving `{ type: 'notification' }`, client invalidates `['notifications-unread']` query
- Fallback: 5-minute polling when WebSocket is disconnected
- Old 30s/60s `refetchInterval` removed — saves ~120 HTTP requests/hour per user

**Connection lifecycle:**
- Opens on login, reconnects on close (5s backoff)
- Supports both notification-only and community-chat connections simultaneously
- Cleaned up on logout/close

### Logging + Error Tracking

**Structured logging (pino):**
- Request IDs assigned to every request via middleware
- PII redacted: authorization headers, passwords, tokens
- JSON format in production, pretty-printed in dev
- `LOG_LEVEL` env var controls verbosity (default: info in prod, debug in dev)

**Sentry (error tracking):**
- Server: `@sentry/node` — initializes from `SENTRY_DSN` env var
- Client: `@sentry/react` — initializes from `VITE_SENTRY_DSN` env var
- Both gracefully do nothing when DSN is unset (app runs fine without it)
- PII stripped before sending (no auth headers, no cookies)

**Env vars for observability:**
| Variable | Purpose |
|----------|---------|
| `SENTRY_DSN` | Server Sentry DSN (free tier) |
| `VITE_SENTRY_DSN` | Client Sentry DSN (same project, or separate) |
| `LOG_LEVEL` | pino log level (debug/info/warn/error) |

### Database Backups

- Supabase managed daily backups (primary); admin CSV export via the Backup tab (secondary)
- Stored in `data/backups/sprint-society-YYYY-MM-DD.backup`
- Auto-pruned after 14 days
- Uploads to `BACKUP_STORAGE_URL` if set (S3-compatible PUT)
- See `docs/RESTORE.md` for full restore instructions

**Env validation (production):**
- `JWT_SECRET` missing or <32 chars → server refuses to start (exit 1)
- `CLIENT_URL` missing → server refuses to start
- `RAZORPAY_*` missing → loud warning, payments disabled
- `GOOGLE_CLIENT_ID` missing → loud warning, Google sign-in disabled

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

---

## Design V1 rollout — AI Coach cluster (June 2026)

The **AI Coach** route (`/coach`) and the standalone `/plan`, `/heart-rate`, `/records` pages have been rebuilt to the locked Design V1 language (`docs/design-v1/ss-base.css` + the sealed Home). Notes for ongoing work:

- **Shared shell**: `client/src/components/ss/` now holds the reusable kit — `SSScreen` (aurora + sticky chrome + Glide-Pill nav), `SSNav`, `SSSeg` (the one segmented sub-tab control), `Gauge` (readiness orb), `SSStates` (skeleton/empty/error) and crafted inline-SVG `icons`. Reuse these on every future page; do **not** re-author surfaces per page.
- **Coach sub-tabs** are content components in `client/src/components/coach/` (`CoachChat`, `CoachPlan`, `CoachInsights`, `CoachZones`, `CoachRecords`), each wired to the real Express routes (chat, training, goals, insights, heartrate, records, kendu).
- **Gate status**: zero emoji, orange-only primary, violet reserved for AI/secondary, neutral-glass chrome, mono tabular metrics, one segmented control per surface, one living centerpiece per screen, reduced-motion safe.
- **Remaining (not yet redesigned)**: Run/track, Run history & detail, Progress, Events (list/map/detail), Social/Community, Profile/Account, Goals, Share cards, Auth/Landing/Onboarding, Admin. These still use the pre-V1 styling (and still contain emoji) until migrated to the `ss/` kit.

---

## Audit-gaps wave — backend capabilities given UI (branch `fix/audit-gaps`)

Closes the "backend exists, no UI" gaps from `docs/FEATURE-WIRING-AUDIT.md`. All new calls were source-verified against route field names (2 silent-data bugs found + fixed in audit: CoachInsights `predicted_seconds`, CoachZones `lt_heartrate`). Client typecheck + Vite build green.

**Delivered:**
- **Coach → Recovery** (new 6th sub-tab, `client/src/components/coach/CoachRecovery.tsx`): wellness log (`POST /wellness/log`), today/week summary, `GET /wellness/recovery-factor`, HRV (`POST /heartrate/hrv`, `GET /heartrate/hrv/trend`). Tap-first inputs.
- **Coach → Zones**: lactate-threshold test (`GET/POST /training/lt-test`).
- **Coach → Plan / Insights**: pre-run brief now uses real `/insights/pre-run` (warmupTip/focusArea/conditions); pace trajectory now plots real `/runs/chart-data`.
- **Progress**: Week/Month/All-time (`/progress/monthly` `/all-time`).
- **Events**: My / Nearby tabs (`/events/my` `/events/nearby`).
- **Subscription**: upgrade flow (`/subscription/upgrade`) + payment history (`/subscription/history`).
- **Profile**: XP history (`/gamification/history`).
- **Run history**: per-run HR analysis (`/heartrate/analysis/:id`) + post-run recap (`/insights/post-run/:id`).
- **Social** (rebuilt `SocialPage` to 5 lanes): Feed · Discover · Following · Followers · Leaderboard (`/social/discover|following|followers`, follow/unfollow, `/gamification/leaderboard` `/gamification/friend-streaks`). The old "Communities" sub-tab was dropped — Communities stays reachable via the bottom nav.

**Deferred (contextual — wire into existing flows, not standalone screens):**
- Kendu spends without UI: `spend/community` (community-create flow), `spend/event` + `spend/rsvp` (event host/RSVP), `spend/group-challenge`, `upkeep/reactivate`.
- `GET /records/check/:activityId` PR-celebration → fire from the run-complete flow.
- Proactive insights (`GET /insights`, `/insights/athlete-profile`, `/insights/weekly-summary`) → candidate Coach Insights section.
- `GET /adaptive/load` `/this-week` `/vdot-progression` → already surfaced via the `/coach/insights` batch; no dedicated screen.

See `docs/AUDIT-GAPS-HANDOFF.md` for the engineer wiring checklist.
