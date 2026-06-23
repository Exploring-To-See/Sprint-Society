# Sprint Society — UI/UX Redesign · App Analysis

> Working brief for the design council. No app code is modified by this effort.
> Deliverables are interactive HTML mockups (mobile, 375px) + design specs under `/design`.

## 1. Product in one line
AI-powered run-club platform: track runs, get an AI coach, complete challenges,
share run cards, run together in communities and events. PWA, mobile-first.

## 2. Navigation — current vs. target

**Current bottom nav (4 items + center):** Home (`/dashboard`) · **Run** (center, `/run/track`) · AI Coach (`/coach`) · Social (`/social`)
**Top bar:** left avatar → Profile (`/profile`), right bell → Notifications (`/notifications`) with unread badge.

**Target 5 tabs (locked):** Home · AI-Coach · **Run** (center) · Community · Events
- `Social` → rename/reframe as **Community**
- **Events** promoted into the nav (currently only reachable by route)
- Profile + Notifications stay as top-bar icons (not tabs)

## 3. Page inventory → tab mapping (~35 pages)

| Tab | Primary page | Secondary / supporting pages |
|-----|--------------|------------------------------|
| **Home** | DashboardPage `/dashboard` | — (hub: surfaces today's plan, streak, XP, quick actions) |
| **AI-Coach** | CoachPage `/coach` | PlanPage `/plan`, SetGoalPage `/set-goal`, ChallengesPage `/challenges`, AIProfilePage `/ai-profile`, AIProfilingPage `/profiling` |
| **Run** (center) | RunTrackerPage `/run/track` | RunHistoryPage `/runs`, RecordsPage `/records`, HRZonesPage `/heart-rate`, ProgressPage `/progress`, SharePage `/share` |
| **Community** | SocialPage `/social` | FeedPage, CommunitiesPage `/communities`, CommunityDetailPage `/communities/:id`, CreateCommunityPage, UserProfilePage `/user/:id` |
| **Events** | EventsPage `/events` | EventDetailPage `/events/:id` |
| **Top bar / account** | ProfilePage `/profile`, NotificationsPage `/notifications` | SubscriptionPage `/subscription`, RewardsPage `/rewards` |
| **Auth / onboarding** | HomePage `/` (landing), LandingPage `/join` `/founding` | RegisterPage, ForgotPasswordPage, ResetPasswordPage, AIProfilingPage (onboarding) |
| **Admin** | AdminPage `/admin` | AdminLoginPage `/` |

**Redesign order (chosen):** Core first → Home, AI-Coach, Run, Community, Events, Profile, Notifications. Then secondary pages.

## 4. Current design tokens (starting point)

- **Background:** `#09090B` primary, `#131316` secondary, `#1E1E22` tertiary (dark)
- **Accent:** `#F97316` (orange) · warm `#FB923C` · gold `#FBBF24` · green `#10B981`
- **Tier colors:** beginner `#10B981`, intermediate `#F97316`, advanced `#FBBF24`
- **Fonts:** Space Grotesk (heading), Inter (body), JetBrains Mono (numbers/data)
- **Radii:** card 16, button 12, input 10, badge 8, pill full
- **Type scale:** display 28/800, h1 22/700, h2 18/600, body 14, caption 11, label 10
- **Layout:** mobile-first, `max-w-lg` centered, fixed top bar + bottom nav

Read: dark, orange, athletic. Reasonable base; the redesign refines hierarchy,
data-density, motion, and consistency rather than throwing it all away.

## 5. Competitor positioning (for the council)

| App | What they're great at | Steal this |
|-----|----------------------|------------|
| **Runna** | Adaptive training plans, friendly coaching tone, clean plan UI | Plan/week structure, encouraging coach voice |
| **Whoop** | Recovery/strain rings, data storytelling, dark precision UI | Single-glance daily readiness, data viz craft |
| **Gabit** | Habit + health blend, Indian market fit | Habit streaks, simple daily loop |
| **Garmin** | Deep metrics, training load, records | Metric depth on demand (progressive disclosure) |
| **Nike Run Club** | Bold editorial, guided runs, motivation | Energy, typography, shareability |
| **Strava** | Social feed, segments, kudos, club culture | Community feed, social proof, run cards |

**Sprint Society's wedge:** AI coach that makes runners *provably faster* + community/club energy. The UI should make (1) the daily "what do I do today" obvious, (2) progress feel earned, (3) the club feel alive.

## 6. Installed design skills (the "council" toolkit)

- `ui-ux-pro-max` — 161 palettes / 57 font pairs / 99 UX rules / reasoning CLI (functional)
- `ui-ux-design-pro` — premium data-driven interface patterns + design systems
- `ux-designer` — UX best practices, WCAG/EAA, microcopy, forms, onboarding
- `taste` / `taste-redesign` — anti-AI-slop visual point of view, redesign audits
- `ux-redesign` + `design-review` — surgical redesign + heuristic audit (Nielsen)
- `transitions-dev` — production motion/transition patterns
- `canvas-design`, `web-artifacts-builder`, `frontend-design` — artifact generation

## 7. Open inputs needed
- [ ] Current-page **screenshots** from founder (analyze real UI)
- [ ] Pick winning **visual direction** from the 2–3 the council proposes
