# Feature Wiring Audit — Emergent Design V1 merge

**Date:** 2026-06-30 · **Trigger:** merge of `Emergent-designs` → `main` (Vercel production).
**Method:** machine cross-map of every `api.*`/`fetch('/api/...')` call in `client/src` (159 distinct)
against every `router.<verb>` definition across the 40 route files (289 routes), normalizing
`:param` ↔ `${var}`. Reference: `docs/design-v1/FEATURE-MAP-V1.md`.

## Merge provenance
`Emergent-designs` = `origin/main` (`55de8da`) + 3 auto-commits — a clean **fast-forward** (0
behind). It rebuilds the AI Coach cluster (`/coach` with Chat·Plan·Insights·Zones·Records
sub-tabs) and the `/plan` `/heart-rate` `/records` pages onto the Design V1 `ss/` kit.
**Build verified green** locally with Vercel's exact command (client typecheck + Vite build + PWA SW).

## ✅ Frontend → Backend (wiring): fully connected
**Zero orphan calls.** Every endpoint the redesigned frontend hits resolves to a live route:
- Chat: `/chat/history` `/chat/suggestions` `/chat/message`, `/kendu/balance` `/kendu/spend/ai-deep-dive`
- Plan: `/training/plan` `/training/week` `/goals` `/insights/pre-run`
- Insights: `/coach/insights` (batch) `/training/readiness`
- Zones: `/heartrate/zones` `/heartrate/trends`
- Records: `/records` `/records/timeline`
- One-way coach client (`lib/coach/api.ts`): `/coach/personas` `/coach/pre-run` `/coach/run-cues` `/coach/post-run`

### Cosmetic gaps inside the new design (UI shows static data, backend exists)
- **CoachPlan** pre/post-run brief bullets are **hardcoded strings**; it fetches `/insights/pre-run`
  but uses it only as a show/hide gate. Wire the real brief text.
- **CoachInsights** "Pace trajectory · 30d" sparkline is a **static SVG path**; only the avg-pace
  number is live. Feed it `/runs/chart-data` (or add a pace-series field to `/coach/insights`).

## ⚠️ Backend → Frontend: capability exists, no user UI
These routes work but nothing in the app calls them (genuine product gaps, not bugs):

| Domain | Unsurfaced routes | Note |
|---|---|---|
| **Wellness** | `POST /wellness/log`, `GET /wellness/today` `/week` `/recovery-factor` | No UI to log sleep/stress/energy — yet it drives the plan's recovery factor. Highest-value gap. |
| **HRV** | `POST /heartrate/hrv`, `GET /heartrate/hrv/trend` | No HRV logging / recovery-trend screen. |
| **HR analysis** | `GET /heartrate/analysis/:activityId` | Per-run HR breakdown unused. |
| **Social graph** | `GET /social/following` `/followers` `/discover` | Feed/kudos/comments/follow work; the lists + "discover runners" have no screen. |
| **Events** | `GET /events/my` `/events/nearby` `/events/:id/checkins` | List/detail/RSVP/checkin/recap work; "my events", map/nearby, attendee list don't. |
| **Progress** | `GET /progress/monthly` `/all-time` | UI shows weekly + improvement + journey only. |
| **Gamification** | `GET /gamification/leaderboard` `/history` `/friend-streaks` | XP/achievements/badge-collection wired; these aren't. |
| **Adaptive** | `GET /adaptive/load` `/this-week` `/vdot-progression` | Surfaced indirectly via `/coach/insights` batch; no direct screen. |
| **Insights (proactive)** | `GET /insights` `/athlete-profile` `/weekly-summary` `/post-run/:id` | Only `/insights/pre-run` is used. |
| **Training** | `GET/POST /training/lt-test` | Lactate-threshold test has no UI. |
| **Kendu economy** | `spend/community` `spend/event` `spend/rsvp` `spend/group-challenge` `upkeep/reactivate`, `earn-*` | Many spends + balance/offers/redeem/skins/leaderboard wired; these aren't. |
| **Subscription** | `POST /subscription/upgrade`, `GET /subscription/history` | Plans/status/order/verify/cancel wired; upgrade flow + payment history not. |
| **Records** | `GET /records/check/:activityId` | PR-celebration check endpoint unused by UI. |
| **Onboarding** | `/onboarding/status` `/detect` `/smart-profile` `/profile` | **Legacy** — superseded by `/profiling/*` (AIProfilingPage). Candidate for removal. |
| **Admin (partial)** | runner detail/mgmt, invite-codes, exports, health, moderation actions, segments, flags overrides, content publish | Admin panel covers the core; these specific ops have no control yet. |

### By-design backend-only (correct, not gaps)
`GET/POST /cron/maintenance` (Vercel Cron) · `POST /subscription/webhook` (Razorpay) ·
`POST /admin/analytics/track` · WebSocket `/ws` (community chat + notification push).

## Divergence flags (separate from this merge)
- Your local branch's commit `6bd4401` (Google-auth uniqueness + limiter) is **not on
  production**; `origin/main` already carries a parallel limiter fix (`7710121`) but possibly not
  the Google-auth-uniqueness part. Cherry-pick if still needed.
- A **second, competing redesign** exists on branch `ui-masterhaul` (design-system v2 + 5-pillar
  nav). This merge ships **Emergent** V1, not that. `ui-masterhaul` is preserved, undeployed.
- Emergent auto-commits added a stray root `.gitconfig` (emergent-agent identity, inert) and
  gitignored/removed `.env.example`. Harmless to the build; clean up at leisure.
