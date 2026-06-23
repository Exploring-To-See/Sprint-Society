# Home — Feature & UX Teardown

> Council member: **HOME tab**. Renders `client/src/components/dashboard/Dashboard.tsx` via
> `client/src/pages/DashboardPage.tsx` → `AppShell`. Read in full; data traced to API.
> Benchmark bar: Whoop (recovery storytelling), Runna (adaptive plan front-and-center),
> Strava (run feed), Garmin (metric depth). North star: prove runners are getting faster +
> answer "what do I do today?" at a glance.

---

## A. Cluster IA recommendation

**What Home should be:** the *daily decision surface*. A runner opens the app and within one
screen-height must learn two things: (1) **what to do today** (the prescribed session, the CTA
to start it) and (2) **am I getting faster / am I OK to train** (a single progress + readiness
signal). Everything else is secondary scroll.

**What Home currently is:** a long vertical stack of 8 loosely-ordered cards with no hierarchy —
a tier/XP bar, a profile nag, today's session, a 3-up stat strip, a pace-dot SVG, recent runs,
a share-style athlete card, and challenges (`Dashboard.tsx:101-251`). It reads like a component
gallery, not a hub. There is **no single "today" hero**, **no readiness signal on screen**, and
the most science-credible card (`AthleteCard`) is buried near the bottom.

**Recommended post-redesign IA (single scroll, ranked by altitude):**
1. **Greeting + readiness pill** — date, name, one recovery/readiness signal (Whoop pattern).
   `ReadinessCard.tsx` already exists and is **not rendered anywhere** (orphaned, see §C) — wire it in.
2. **Today hero** — the prescribed session as the dominant card with a primary **Start run** CTA.
   Today, `TodaySession.tsx` is a passive ~88px info card with **no CTA at all** (`TodaySession.tsx:54-110`).
3. **Progress proof** — "are you getting faster": the `PaceDotTrail` pace→target chart
   (`PaceDotTrail.tsx`) promoted up, paired with the 3-up stat strip.
4. **Momentum** — XP/level + streak + nearest achievement (`AchievementProgress.tsx`, currently orphaned).
5. **Recent runs** (collapsed to 2-3) and **Challenges** (collapsed, "see all").
6. **Athlete/identity card** — keep low; it's a flex/share artifact, not a daily-decision tool.

**Features that should MOVE:**
- **Challenges** (`ChallengeList.tsx`) is a full habit-tracker with expandable detail + manual
  completion — too heavy for Home. Show a 2-item teaser; the real list belongs on AI-Coach or its
  own `/challenges` route (the "See all" already points there, `Dashboard.tsx:242`).
- **AthleteCard** (`AthleteCard.tsx`) is literally branded "Sprint Society" with VO₂/VDOT/AgeGrade
  — it's a **share card** masquerading as a dashboard widget. Move to Profile / the sharing suite;
  surface only VO₂ + trend on Home.
- **Get-started checklist + locked-coach** (`Dashboard.tsx:146-191`) is good but should be the
  *entire* Home for new users (a dedicated onboarding state), not a card stacked under the XP bar.
- **MOVE IN:** the orphaned `UpcomingEvents`, `CommunityActivity`, `CoachCard` components (§C) —
  Home is the natural place for a one-line "next event / your coach says" teaser, but per the locked
  5-tab nav, deep content lives in Events/Community/AI-Coach. Home should *link*, not duplicate.

---

## B. Screen-by-screen teardown

Home is a single route (`/` → `DashboardPage`). I break it down by the components it renders, then
separately audit the **orphaned dashboard components** that exist in this cluster but are dead code.

### Top bar (`components/layout/AppShell.tsx`)
- **Purpose:** persistent chrome — profile entry + notifications.
- **Features & data:** left avatar (`user.profile_image_url` or initials) → `/profile`
  (`AppShell.tsx:40-55`); brand wordmark; right bell with unread badge from
  `/notifications/unread-count` (`AppShell.tsx:20-26`), badge caps at "9+" (`AppShell.tsx:68`).
  Notification polling adapts to websocket state (`staleTime`/`refetchInterval`, `AppShell.tsx:24-25`).
- **States:** only renders for non-admin logged-in users (`AppShell.tsx:37`). No loading/error
  state for the unread count (silent). `aria-label`s present on both buttons — good a11y.
- **UX problems:**
  - **P2** — Brand wordmark and avatar are one combined button, both navigating to `/profile`
    (`AppShell.tsx:40-55`). Tapping the logo to "go home" is a near-universal expectation
    (consistency & standards, Nielsen #4); here it dumps you on Profile.
- **Redesign:** wordmark → Home; avatar stays → Profile. Add a date/greeting line under the bar on Home.

### XP / Tier bar (`Dashboard.tsx:103-125`)
- **Purpose:** show tier + level progress at a glance.
- **Features & data:** tier chip (`tier.tier`, colored beginner/intermediate/advanced,
  `Dashboard.tsx:105-111`), a **3px** gradient progress bar (`level_progress_percent`,
  `Dashboard.tsx:112-119`), `L{level}` label, and "{xpToNext} XP to Level {n+1}" subcopy
  (`Dashboard.tsx:122-124`). Data from the `/dashboard` batch (`dashboard.routes.ts:21-39`).
- **States:** no explicit loading state — renders with defaults (`level=1`, `0%`) before data
  arrives (`Dashboard.tsx:86-88`), so the bar flashes empty then animates. No error state.
- **UX problems:**
  - **P1** — The progress bar is **3px tall** (`h-[3px]`, `Dashboard.tsx:112`) and the streak —
    arguably the single most motivating daily number — is **not shown here at all**; it's passed
    only into `TodaySession` as urgency copy (`Dashboard.tsx:210`). Visibility of system status
    (Nielsen #1) is weak. Whoop/Gabit make the streak/recovery the hero.
  - **P2** — "BEGINNER" tier and "L1" level are two competing progress systems with no explanation
    of how they relate (recognition vs recall, Nielsen #6).
- **Redesign:** thicken the bar, fold the **streak flame + day count** in next to it, and make the
  whole bar tappable → a level/XP detail or the (orphaned) `LevelCard` which already renders
  next-milestone copy (`LevelCard.tsx:90-101`).

### Pending-profile prompt (`Dashboard.tsx:129-143`)
- **Purpose:** push incomplete users to finish AI profiling.
- **Features & data:** shows whenever `dashboard` loaded **and** `!profilingStatus.complete`
  (`Dashboard.tsx:92,129`); CTA → `/profiling`. `profilingStatus` from `dashboard.routes.ts:86-87`.
- **States:** gated on `dashboard` being present so it doesn't flash. Good.
- **UX problems:**
  - **P2** — This banner and the new-user "Complete AI profiling" checklist row
    (`Dashboard.tsx:154`) can render **simultaneously** for a new user without a profile —
    duplicate prompts to the same `/profiling` screen (consistency, Nielsen #4).

### New-user state (`Dashboard.tsx:146-191`)
- **Purpose:** onboarding checklist + locked-coach teaser when `total_runs === 0`.
- **Features & data:** 4-step checklist — account (always done), photo
  (`user.profile_image_url`), profiling (`hasProfile`), first run — each a button to the relevant
  route (`Dashboard.tsx:151-176`). Below it a 40%-opacity "AI Coach locked" tile (`Dashboard.tsx:181-189`).
- **States:** `isNewUser = !stats?.total_runs || stats.total_runs === 0` (`Dashboard.tsx:91`).
  This is the empty state for Home — and it's genuinely good (clear next actions, done-state styling).
- **UX problems:**
  - **P1** — A user who has completed *every* step except "Log your first run" still sees the full
    checklist and a locked coach, and **none** of the progress widgets. There's no celebratory
    "you're ready — go run" moment. The "Log your first run" step has an icon but **no green CTA
    emphasis** distinguishing it as the one remaining action (aesthetic/minimalist + Nielsen #1).
  - **P2** — "Add a profile photo" is weighted equally with "Complete AI profiling," but profiling
    unlocks the whole product. No priority ordering by impact.
- **Redesign:** make this the entire Home for new users (full-bleed), highlight the single next
  step, and replace the static "locked coach" with a 1-line preview of what unlocks.

### ProgressPill (`Dashboard.tsx:204-206` → `ProgressPill.tsx`)
- **Purpose:** "On track · Week X/Y" pill tied to the active training plan.
- **Features & data:** independently fetches `/training/plan` (`ProgressPill.tsx:9-12`); renders a
  green "✓ On track" pill that expands to goal name + days-to-race + phase
  (`ProgressPill.tsx:21-47`). Returns `null` if no `race_name`/`goal_name` (`ProgressPill.tsx:14`).
- **States:** no loading/error; silent null when no plan.
- **UX problems:**
  - **P0** — **"✓ On track" is hardcoded** (`ProgressPill.tsx:27`). It shows green/on-track
    regardless of whether the runner has actually done the week's sessions. This is a *trust-breaking*
    false signal (error prevention + match between system and real world, Nielsen #5/#2). A runner
    who skipped every run still sees "On track."
  - **P1** — Tiny pill that must be *tapped* to reveal the goal it refers to (recall over
    recognition, Nielsen #6). The plan/goal — the spine of "what am I training for" — is hidden.
  - **P1** — Data duplication: `ProgressPill`, `TodaySession`, and the batch endpoint all
    independently compute current-week/total-weeks (`ProgressPill.tsx:17-18`, `TodaySession.tsx:63`,
    `dashboard.routes.ts:82`). Three sources of the same number = drift risk.
- **Redesign:** compute real adherence (sessions done vs prescribed this week) and color the pill
  honestly; promote goal + days-to-race to always-visible.

### TodaySession (`Dashboard.tsx:209-211` → `TodaySession.tsx`)
- **Purpose:** show today's prescribed session from the training plan.
- **Features & data:** fetches `/training/week` (`TodaySession.tsx:29-32`); finds today's session
  by `getDay()` (`TodaySession.tsx:40-41`); renders icon by `type` (8 types,
  `TodaySession.tsx:10-19`), title, description, week badge `W{n}/{total}` + phase
  (`TodaySession.tsx:63-66`), and a pace + 10-segment RPE bar (`TodaySession.tsx:81-105`),
  ending with a static **"Auto-tracked"** label (`TodaySession.tsx:106`). Streak prop drives
  urgency copy ("Don't break your 3-day streak", `TodaySession.tsx:47-51`).
- **States:** loading skeleton (`TodaySession.tsx:34-36`); returns `null` if no week or no session
  for today (`TodaySession.tsx:38,42`). **No empty/rest-day messaging beyond the bare title.**
- **UX problems:**
  - **P0** — **No CTA.** This is the card that answers "what do I do today?" and it has **no
    Start-run button** (`TodaySession.tsx:54-110`). The user has to find the center Run tab
    themselves. The orphaned `CoachCard.tsx:131-138` *does* have a "Start Run →" button — the
    wrong component shipped. Highest-impact gap on the tab (Nielsen #7, flexibility/efficiency).
  - **P1** — `today = new Date().getDay() || 7` (`TodaySession.tsx:40`) maps Sunday→7, but the
    plan's `session.day` numbering is unverified against this; an off-by-one means the wrong session
    (or none) shows. The orphaned `CoachCard` uses a *different* index math
    (`CoachCard.tsx:37`, `getDay()===0?6:getDay()-1`) — the two disagree, confirming the convention
    is ambiguous (error prevention, Nielsen #5).
  - **P1** — `todaySession.type === 'rest'` is computed (`TodaySession.tsx:45`) but a rest day just
    shows the title with no encouraging "recover today" framing or readiness tie-in.
  - **P2** — "Auto-tracked" (`TodaySession.tsx:106`) is jargon with no explanation of *what* gets
    tracked or how (match to real world, Nielsen #2).
- **Redesign:** make this the Home hero — big session card, distance/pace/RPE inline, a primary
  **Start run** button that deep-links to `/run/track` pre-seeded with the target, and a "swap /
  why this session?" link to the coach.

### Stat strip (`Dashboard.tsx:214-220` → local `StatCard`, `Dashboard.tsx:30-46`)
- **Purpose:** lifetime totals — Runs / KM / Best pace.
- **Features & data:** Runs (`stats.total_runs`), KM (`total_distance/1000` rounded), Best
  (`best_pace` formatted m:ss) (`Dashboard.tsx:216-218`). Count-up animation via `useCountUp`
  (`Dashboard.tsx:30-34`). Data from batch `runStats` (`dashboard.routes.ts:65-71`).
- **States:** defaults to 0 / "—" — no separate loading shimmer (the count-up from 0 doubles as one).
- **UX problems:**
  - **P1** — These are **lifetime cumulative** stats. They never change day-to-day, so they fail the
    "am I making progress *now*?" job. There's no *this week* vs *last week*, no trend arrow
    (Garmin/Whoop always trend). Visibility of progress is static (Nielsen #1).
  - **P2** — "Best" with no label of *what* (best pace) — relies on the header word "Best" only;
    ambiguous (recognition, Nielsen #6).
- **Redesign:** switch to *weekly* deltas (km this week vs last, with ▲/▼), keep lifetime as a
  tappable secondary.

### PaceDotTrail (`Dashboard.tsx:223-225` → `PaceDotTrail.tsx`)
- **Purpose:** the *core "are you getting faster" proof* — last 10 runs' pace vs target.
- **Features & data:** fetches `/runs/chart-data?weeks=6` and `/training/paces`
  (`PaceDotTrail.tsx:5-13`); filters runs >500m with valid pace, takes last 10
  (`PaceDotTrail.tsx:15-17`); hand-rolled SVG with a dashed target line, faint trend line, and dots
  colored green (≤target) / orange (>target) (`PaceDotTrail.tsx:57-93`); header shows "{n}s to goal"
  or "🎯 At target!" (`PaceDotTrail.tsx:52-54`).
- **States:** returns `null` if fewer than 3 qualifying runs (`PaceDotTrail.tsx:19`). No loading
  state (renders nothing until query resolves). No explicit empty/error UI — just disappears.
- **UX problems:**
  - **P1** — This is the most important card for the north star and it's **6th in the stack** and
    can silently vanish (`return null`) with no "log 3 runs to see your trend" placeholder
    (empty-state gap, Nielsen #1). Meanwhile a polished, accessible Recharts version
    (`PaceChart.tsx`) with a proper empty state exists but is **orphaned** (§C).
  - **P2** — `targetPace` falls back to `minPace * 0.9` when no training pace exists
    (`PaceDotTrail.tsx:24`) — an invented goal presented as a real target (match to real world, #2).
  - **P2** — SVG text labels at `fontSize 7` (`PaceDotTrail.tsx:63`) are below legible/WCAG-friendly
    size on a 375px screen (accessibility).
- **Redesign:** promote to position #3, give it a real empty state, and reconcile with `PaceChart`
  (pick one charting approach for the design system).

### RecentRuns (`Dashboard.tsx:228-230` → `RecentRuns.tsx`)
- **Purpose:** last 3 runs.
- **Features & data:** fetches `/runs?limit=3` (`RecentRuns.tsx:30-33`); each row shows
  km · pace/km, relative date (Today/Yesterday/weekday/date, `RecentRuns.tsx:18-26`), and minutes
  (`RecentRuns.tsx:74-93`). Handles both array and `{runs:[]}` response shapes (`RecentRuns.tsx:45`).
- **States:** loading skeleton (3 rows, `RecentRuns.tsx:35-43`); empty state with "Start your first
  run →" CTA (`RecentRuns.tsx:47-58`). Good coverage. No error state (axios rejection → blank).
- **UX problems:**
  - **P2** — Every row navigates to the **list** `/runs`, not the specific run
    (`RecentRuns.tsx:77`) — tapping a run doesn't open *that* run (Nielsen #4, user control). The
    `key={run.id}` is there but unused for routing.
  - **P2** — No kudos/social/PR badge — Strava's recent-run rows carry reactions and PR flags; here
    rows are inert. No indication a run was a PR even though the app tracks PRs (`PRBanner.tsx`).
- **Redesign:** row → `/runs/:id`; add a small PR/achievement badge when relevant.

### AthleteCard (`Dashboard.tsx:233-235` → `AthleteCard.tsx`)
- **Purpose:** identity/share card — VO₂max hero + Age Grade / VDOT / Best / Total.
- **Features & data:** three independent fetches — `/coaching/tier`, `/runs/stats`,
  `/profiling/dna` (`AthleteCard.tsx:8-21`); branded "Sprint Society" header + tier chip; avatar +
  name + lifetime km; big VO₂max with optional ↑ change from `dna.vo2max_change`
  (`AthleteCard.tsx:71-82`); 4-stat footer (`AthleteCard.tsx:85-102`).
- **States:** returns `null` if no VO₂max and no runs (`AthleteCard.tsx:41`). No loading/error — all
  fields fall back to "—".
- **UX problems:**
  - **P1** — This is a **share artifact on the dashboard.** The explicit "Sprint Society" wordmark
    and centered hero layout (`AthleteCard.tsx:50,72-82`) signal "screenshot me," not "use me to
    decide." It duplicates VO₂/VDOT that belong in a metrics screen and competes with the stat strip
    (consistency + minimalism, Nielsen #4/#8).
  - **P2** — Footer stat labels at `text-[7px]` (`AthleteCard.tsx:88`) are unreadable / fail WCAG
    minimum legibility on mobile.
  - **P2** — Three separate queries for data the batch endpoint (`dashboard.routes.ts`) already
    mostly has — redundant network + waterfall (performance; violates the project's own "no N+1" gate).
- **Redesign:** move the share version to Profile/sharing suite; on Home, show only VO₂max + 30-day
  trend in a compact stat.

### Challenges (`Dashboard.tsx:238-248` → `ChallengeList.tsx`)
- **Purpose:** weekly habit challenges.
- **Features & data:** header + "See all" → `/challenges` (`Dashboard.tsx:242`); `ChallengeList`
  **re-fetches** `/coaching/challenges` (`ChallengeList.tsx:27-30`) even though the batch already
  returns `challenges` (`dashboard.routes.ts:54-62`). Each item: category icon, title, category,
  `+xp`, "Auto" badge for auto-detect categories, expandable description + target + tip, and manual
  complete via `POST /coaching/challenges/:id/complete` (`ChallengeList.tsx:32-38,124-132`).
- **States:** loading skeleton (`ChallengeList.tsx:40-48`); empty state (`ChallengeList.tsx:50-59`).
  Mutation has `onSuccess` invalidation but **no error/pending UI** (`ChallengeList.tsx:32-38`) — a
  failed complete silently does nothing (Nielsen #9, error recovery).
- **UX problems:**
  - **P1** — Gated on `challenges && challenges.length > 0` in the parent (`Dashboard.tsx:238`) using
    the *batch* challenges, but the child renders from its *own* fetch — so the section can show its
    skeleton/empty state inconsistently with the parent's gate (data drift, Nielsen #4).
  - **P2** — Full expandable habit-tracker (tips, targets, manual completion) is too much surface for
    a daily hub; competes with the actual training session for attention (minimalism, Nielsen #8).
  - **P2** — Optimistic feedback missing: tapping the complete circle waits on the network with no
    spinner/optimistic check (Nielsen #1).
- **Redesign:** show a 2-item teaser ("2 of 5 done this week"), move the full tracker off Home.

### Level-up celebration (`Dashboard.tsx:96-99`, `68-84`)
- **Features & data:** watches `xp.current_level`; on increase fires confetti + gold toast + sound
  (`Dashboard.tsx:76-84`). `lastLevelRef` guards against firing on first load (`Dashboard.tsx:78`).
- **UX problem:** **P2** — sound plays unconditionally via `playSound('levelup')` (`Dashboard.tsx:82`)
  with no mute/respect for reduced-motion or sound preference (a11y / user control, Nielsen #3).

### Orphaned dashboard components (dead code in this cluster)
Confirmed via grep: **none** of these are imported anywhere in `client/src` — they exist only as
their own definitions. They represent a *parallel, better* dashboard that was never wired in:

| Component | What it does | Notable vs shipped Home |
|---|---|---|
| `ReadinessCard.tsx` | Whoop-style green/yellow/red readiness w/ score %, recommendation, coach tip; fetches `/training/readiness` | **The missing readiness signal.** Home has *no* recovery/readiness anywhere. |
| `LevelCard.tsx` | Tier + sublevel, status (Calibrating/Verified/Provisional), "On Hold" safety rail, next-milestone copy; `/profiling/classification` | Richer + honest level system vs the 3px bar. |
| `TrainingLoadRing.tsx` | A:C ratio ring, acute/chronic/freshness, injury-risk label, VDOT trend | Garmin-grade training-load card, fully built, unused. |
| `PaceChart.tsx` | Recharts area chart of pace w/ proper loading skeleton + empty state; `/runs/chart-data?weeks=12` | Accessible alternative to the hand-rolled `PaceDotTrail`. |
| `AchievementProgress.tsx` | Nearest 3 achievements w/ % progress + "N more runs!"; `/gamification/achievements` | The momentum widget Home lacks. |
| `PRBanner.tsx` | New-PR banner w/ shimmer + improvement delta | PR celebration that never shows. |
| `CoachCard.tsx` | AI coach teaser w/ daily insight, today's session, **and a Start Run CTA**; many `/ai`,`/training`,`/profiling` calls | Has the Start-run button `TodaySession` is missing. |
| `CommunityActivity.tsx` | Horizontal scroll of your communities; `/communities/my` | Home→Community bridge. |
| `UpcomingEvents.tsx` | "This week" events w/ attendee counts; `/events?from=&to=&limit=3` | Home→Events bridge (newly-promoted tab). |

> **This is the single biggest finding for the redesign:** a more capable, more competitor-aligned
> Home already exists in code and is dormant. The redesign is partly an *integration* job, not a
> from-scratch build. Decide per component: wire in, or delete to stop the bit-rot.

---

## C. Reusable components inventory

Candidates to standardize into the design system (with current source):
- **MetricStat** — the count-up `StatCard` (`Dashboard.tsx:30-46`) and `AthleteCard`'s footer
  stats (`AthleteCard.tsx:85-102`) are the same pattern at different sizes; unify (and fix the
  `text-[7px]` label).
- **ProgressBar / XP bar** — the gradient bar appears in 3 places: `Dashboard.tsx:112-119`,
  `LevelCard.tsx:68-79`, `AchievementProgress.tsx:169-176`. One `<ProgressBar value pct>` token.
- **StatusPill** — "On track" pill (`ProgressPill.tsx:24-29`), tier chips
  (`Dashboard.tsx:105-111`, `AthleteCard.tsx:51-53`), challenge "Auto" badge
  (`ChallengeList.tsx:103-106`), `LevelCard` status badges (`LevelCard.tsx:48-62`) — all the same
  pill primitive with color variants.
- **SessionTypeBadge / icon map** — `SESSION_CONFIG` (`TodaySession.tsx:10-19`) and the
  category-icon maps in `ChallengeList.tsx:6-9`, `CommunityActivity.tsx:50-53`,
  `UpcomingEvents.tsx:5-15` are four parallel icon dictionaries; centralize.
- **ListRow** — `RecentRuns` rows (`RecentRuns.tsx:74-93`), `UpcomingEvents` rows
  (`UpcomingEvents.tsx:55-70`), checklist rows (`Dashboard.tsx:157-176`) share an
  icon-tile + title/subtitle + trailing-meta layout. One `<ListRow>` primitive.
- **Ring** — `TrainingLoadRing` SVG arc (`TrainingLoadRing.tsx:33-53`) is a reusable progress-ring
  (Whoop/Garmin staple) — promote to a generic `<ProgressRing>`.
- **Card chrome** — the `card` class + the recurring `rounded-xl bg-bg-secondary border
  border-bg-tertiary` triplet (RecentRuns, PaceDotTrail, ChallengeList) should be one `<Card>`.
- **EmptyState** — `RecentRuns` (`RecentRuns.tsx:47-58`), `ChallengeList`
  (`ChallengeList.tsx:50-59`), `PaceChart` (`PaceChart.tsx:28-39`) each roll their own; standardize
  icon + copy + CTA.
- **Skeleton** — `DashboardSkeleton` (`Dashboard.tsx:199`) plus ad-hoc `animate-pulse` blocks in
  `TodaySession`, `RecentRuns`, `ChallengeList`; consolidate.
- **formatPace** — duplicated **four+ times** (`TodaySession.tsx:21`, `RecentRuns.tsx:11`,
  `AthleteCard.tsx:34`, `PaceDotTrail.tsx:42`) while `lib/formatters` already exports one
  (used by `PaceChart.tsx:4`). DRY violation; import the shared one everywhere.

---

## D. Top 5 highest-impact changes for this tab

1. **Add a primary "Start run" CTA to the Today card (P0).** The hub fails its #1 job — telling the
   runner what to do *and letting them do it*. The button already exists in the orphaned
   `CoachCard.tsx:131-138`; bring it into `TodaySession`, deep-linking to `/run/track` seeded with
   the prescribed pace/distance. *Benefit: turns a passive dashboard into an action surface; fewer
   taps from open→running.*
2. **Make "On track" honest, and surface a real readiness signal (P0/P1).** Replace the hardcoded
   "✓ On track" (`ProgressPill.tsx:27`) with actual session-adherence, and wire in the dormant
   `ReadinessCard.tsx` at the top. *Benefit: restores trust and answers "am I OK to train today?" —
   the Whoop/Runna differentiator.*
3. **Re-stack Home around the two jobs and demote the share card (P1).** Order: greeting+readiness →
   Today hero → pace-trend proof + weekly deltas → momentum → recent/challenges teasers → identity
   card last. Move `AthleteCard` to Profile. *Benefit: the answer to "what do I do / am I improving"
   lands in the first screen-height instead of scattered across 8 cards.*
4. **Switch the stat strip from lifetime to weekly trend (P1).** Cumulative Runs/KM/Best never move;
   show *this week vs last* with ▲/▼ (`Dashboard.tsx:214-220`). *Benefit: makes daily progress
   visible — the static numbers currently can't.*
5. **Resolve the orphaned-component debt + kill data duplication (P1).** Decide per component
   (wire in `AchievementProgress`/`PRBanner`/`UpcomingEvents`/`PaceChart` or delete), and stop the
   redundant per-component fetches — `ChallengeList`, `AthleteCard`, `ProgressPill`, `TodaySession`
   all re-request data the `/dashboard` batch already returns (`dashboard.routes.ts:89`, incl. an
   unused `planWeek`). *Benefit: a coherent, faster Home and an end to the "two dashboards" drift.*
