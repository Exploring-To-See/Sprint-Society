# AI-Coach — Feature & UX Teardown

> Council member: **AI-COACH tab**. Scope: `pages/CoachPage.tsx` and its sub-tabs (Chat, Plan, Insights, Zones, Records), plus the goal/plan/profiling/challenges screens that feed coaching. Read in full; all citations are `file:line`. No app code changed.

---

## ⚠️ Headline finding (read this first)

**The product's core wedge — "talk to your AI coach" — is shipped, working, and then deliberately hidden behind a "Coming Soon" wall.**

There are TWO chat UIs in the codebase:

1. **The dead one the user sees.** `CoachPage` renders `ChatTab` as the *default* sub-tab (`CoachPage.tsx:23` `initialTab || 'chat'`), and `ChatTab` is a hardcoded "AI Coach Chat — Coming Soon" panel with no input, no messages, no API call (`ChatTab.tsx:3-27`).
2. **The real, fully-built one that is unreachable.** `ChatPage.tsx` is a complete chat client: history (`/chat/history` `ChatPage.tsx:24`), message send (`POST /chat/message` `ChatPage.tsx:42`), typing indicator (`ChatPage.tsx:156-175`), contextual quick-prompts (`/chat/suggestions` `ChatPage.tsx:29`), and a Kendu-gated "Deep Dive" (`ChatPage.tsx:49-56,204-213`). The backend behind it is real too — `chat.routes.ts:22` saves messages, builds runner context (`chat.routes.ts:32`), and routes pro users to Claude Sonnet (`chat.routes.ts:47-60`) with a rule-based fallback for everyone else.

The only reason the user never sees #2 is routing: `App.tsx:155` `<Route path="/chat" element={<Navigate to="/coach" replace />} />`. Every entry point into chat is severed:
- `ChatFAB` navigates to `/chat` (`ChatFAB.tsx:22`) → bounces to `/coach` → lands on the "Coming Soon" `ChatTab`.
- `AIProfilePage`'s "Start Coaching" CTA does `window.location.href = '/coaching'` (`AIProfilePage.tsx:218`) → `App.tsx:141` redirects `/coaching` → `/coach` → same dead end.
- The empty-state copy on the AI Profile page literally tells users to *"Start chatting with your AI coach"* (`AIProfilePage.tsx:216`) — a journey that terminates in "Coming Soon."

This is the single highest-leverage fix in the entire app and it is **a routing/wiring change, not a build**. See D1.

---

## A. Cluster IA recommendation

**What this tab should be:** the runner's *intelligent training cockpit* — the screen that proves Sprint Society makes you faster. Today it is a tab-bar over five loosely related read-only dashboards. The strongest, most differentiated capability (conversational coaching grounded in the user's own data) is the one that's dark.

**Current sub-tab order:** Chat · Plan · Insights · Zones · Records (`CoachPage.tsx:13-19`), default = Chat (`CoachPage.tsx:23`). So a brand-new user's *first impression of the AI coach is a "Coming Soon" sign.*

**Recommended structure post-redesign:**

| Sub-tab | Keep? | Change |
|---|---|---|
| **Coach (Chat)** | YES, default | Replace dead `ChatTab` with the real `ChatPage` content inline. This is the anchor screen. Above the conversation, surface a "today" coaching card (next session + readiness + one proactive nudge) so it's useful even before the user types. |
| **Plan** | YES | Merge the "today's session" detail from `TrainTab` with the week timeline from `PlanPage`; right now they're split across a tab and a separate route (`/plan`) for no clear reason. |
| **Insights** | YES | Rename internally to "Progress". Fix the fake SVG (see B). Fold `Zones` + `Records` *into* Insights as sections rather than top-level tabs — they're both narrow read-only views that bloat the tab bar to 5. |
| **Zones** | MERGE into Insights | Embedded `HRZonesPage` (`CoachPage.tsx:48-52`). One scroll section, not a tab. |
| **Records** | MERGE into Insights | Embedded `RecordsPage` (`CoachPage.tsx:53-57`). One scroll section, not a tab. |

**Net:** drop from 5 sub-tabs to 3 (**Coach · Plan · Progress**), matching Runna/Garmin which never make a runner choose between "Zones" and "Records" as peers.

**Features that should MOVE:**
- **`ChallengesPage` (`/challenges`)** is 1v1 Kendu-staking PvP (`ChallengesPage.tsx:70`). This is **Community**, not Coach. It has nothing to do with the AI coach and should live under the new Community tab. (It is currently not even reachable from Coach — it's an orphan route, see C.)
- **`AIProfilePage` ("What Your AI Coach Knows", `/ai-profile`)** and **`AIProfilingPage` (onboarding DNA quiz, `/profiling`)** should be reachable *from* the Coach tab (e.g. a "What I know about you" link in the Chat header), but they belong as a profile/settings surface, not as their own coach sub-tabs. Today neither is linked from `CoachPage` at all.
- **`CoachingPanel` (Transformation journey)** (`coaching/CoachingPanel.tsx`) appears to be **orphaned** — it's a rich week-by-week milestone path (`CoachingPanel.tsx:68-144`) calling `/coaching/transformation`, but no route renders it (`/coaching` redirects away, `App.tsx:141`). This is a *second* fully-built coaching surface that's gone dark. It should become the spine of the Plan tab.

---

## B. Screen-by-screen teardown

### Chat sub-tab (`/coach` default · `components/coach/ChatTab.tsx`)
- **Purpose:** the headline "talk to your AI coach" experience.
- **Features & data:** none. Static markup: a ⚔️ icon, an h3, two paragraphs, a "Coming Soon" pill (`ChatTab.tsx:11-23`). Zero API calls, zero props, zero state.
- **States:** there is only one state — permanently "Coming Soon." No loading/empty/error because there's no data path.
- **Interactions & nav:** none. It's a terminal screen. The `ChatFAB` and "Start Coaching" CTA both funnel users *here*.
- **UX problems:**
  - **P0 — Dead end on the core value prop.** Violates Nielsen #1 (visibility of system status — it claims "coming soon" when it's actually shipped) and the most basic product principle: don't advertise a feature you've hidden. The working `ChatPage` exists (`ChatPage.tsx`) and the backend is live (`chat.routes.ts:22`). This is a *regression*, not a missing feature.
  - **P1 — Self-contradicting copy.** "Your coach already guides you via training plans, pre-run briefs, and post-run analysis" (`ChatTab.tsx:22`) — but the pre-run brief is itself hardcoded boilerplate (see Plan, P1) and post-run analysis lives on a different screen the chat doesn't link to.
- **Redesign opportunities:** Render `ChatPage`'s conversation inline as the default sub-tab (Runna/Whoop both lead with the coach, not a dashboard). Keep the quick-prompts empty-state (`ChatPage.tsx:114-125`) since it teaches users what the coach can do. Surface "AI-powered" vs "rule-based" honestly — the backend already returns `ai_powered` (`chat.routes.ts:74`) but the client never shows it.

### Plan sub-tab (`/coach` · `components/coach/TrainTab.tsx`)
- **Purpose:** show this week's training and the next session in detail.
- **Features & data:**
  - Training plan meta — `/training/plan` (`TrainTab.tsx:11-14`).
  - This week's sessions — `/training/week` (`TrainTab.tsx:16-19`).
  - Active goals — `/goals` (`TrainTab.tsx:21-24`).
  - Pre-run brief — `/insights/pre-run` (`TrainTab.tsx:26-29`).
  - 7 day-boxes Mon–Sun with status (done/missed/today/upcoming/rest) (`TrainTab.tsx:133-153`), expandable to a session detail card showing target pace, why, duration, distance (`TrainTab.tsx:178-189`).
  - On *today*, three colored blocks: Pre-Run / Post-Run / Nutrition + "Start This Run →" (`TrainTab.tsx:192-218`).
  - "See full plan →" routes to `/plan` (`TrainTab.tsx:127-129`).
- **States:**
  - No-goal empty state with "Set Goal →" CTA (`TrainTab.tsx:81-90`). Good.
  - **MISSING loading state.** None of the four queries gate on `isLoading`; the component renders with `undefined` data and silently collapses to empty fallbacks. A user with a slow connection sees a blank/half-built week with no spinner. (Nielsen #1.)
  - **MISSING error state.** `/training/week` and `/training/plan` have no `.catch` and no error UI; only `/insights/pre-run` swallows errors to `null` (`TrainTab.tsx:28`).
- **Interactions & nav:** tap day-box to expand (`TrainTab.tsx:142`); "Start This Run" → `/run/track` (`TrainTab.tsx:213`); "+ Add another goal" / "Set Goal" → `/set-goal` (`TrainTab.tsx:86,117`); "See full plan" → `/plan` (`TrainTab.tsx:127`).
- **UX problems:**
  - **P0 — The Pre-Run / Post-Run / Nutrition blocks are hardcoded.** "5-min walk warmup / Relaxed shoulders / Hydrate 500ml" etc. (`TrainTab.tsx:196-210`) are **static literals identical for every user, every session, every day.** A `preRun` brief is fetched (`TrainTab.tsx:26`) but its contents are never rendered — the render only checks `preRun` is truthy as a gate (`TrainTab.tsx:192`) then shows the boilerplate. This directly undermines the "intelligent, personal" claim and is exactly what Runna does *not* do. (taste: AI-slop / fake personalization.)
  - **P1 — "Coach: 'Good discipline.'" is also hardcoded** (`TrainTab.tsx:223`) — same canned string on every completed run.
  - **P1 — Two screens for one plan.** The week lives in `TrainTab`; the multi-week timeline lives in `PlanPage` at a *separate route* (`/plan`). The mental model is fractured (Nielsen #2, match between system and real world — runners think of "my plan" as one thing).
  - **P2 — Day-status math fragility.** `getDayStatus` marks any past day without `completed` as "missed" (`TrainTab.tsx:63`), so a rest day or an un-synced run shows a red ✗. Demotivating false-negative.
- **Redesign opportunities:** Render the *actual* `/insights/pre-run` payload (it exists — wire it). Make the session card the hero of a unified Plan tab. Add a "why this session" line sourced from the engine, like Runna's session rationale.

### Insights sub-tab (`/coach` · `components/coach/AIAnalyticsTab.tsx`)
- **Purpose:** the "metric depth" dashboard — VO₂max, VDOT, load, predictions, PRs.
- **Features & data:** one batched query `/coach/insights` (`AIAnalyticsTab.tsx:6-10`) destructured into adaptive / summary / vdotProgression / tier / predictions / stats / records (`AIAnalyticsTab.tsx:12-19`). Renders:
  - 6 metric cards: VO₂ Max, VDOT, Age Grade, Training Load (TSB), Injury Risk (ACWR), Readiness (`AIAnalyticsTab.tsx:49-71`).
  - Race predictions 5K/10K/Half/Marathon (`AIAnalyticsTab.tsx:78-90`).
  - "Pace Trajectory (30d)" chart (`AIAnalyticsTab.tsx:93-108`).
  - Improvement/km/week + Plan compliance (`AIAnalyticsTab.tsx:111-114`).
  - Distance milestone bar, Personal Bests grid, Tier score, streak (`AIAnalyticsTab.tsx:118-173`).
- **States:**
  - **MISSING loading state.** No `isLoading` gate; every field falls back to `'—'`. On first paint a real user sees a wall of em-dashes, indistinguishable from a user with no data. (Nielsen #1.)
  - **MISSING empty state.** No "log a run to unlock your analytics" — just dashes.
  - **Dead code:** `const streakDays = 0;` (`AIAnalyticsTab.tsx:26`) hardcodes streak to 0, so the streak row (`AIAnalyticsTab.tsx:166-173`) is **unreachable** — `streakDays > 0` is never true.
- **Interactions & nav:** none — fully read-only, no taps, no drill-downs. A 178-line metrics screen with zero interactivity.
- **UX problems:**
  - **P0 — The "Pace Trajectory" chart is fake.** The SVG path `d="M0,35 C75,30 150,22 225,15 L300,10"` is a **hardcoded always-improving curve** (`AIAnalyticsTab.tsx:102`) drawn for *every* user regardless of data. A declining runner sees an upward line. This is a data-integrity lie and a trust-killer (taste: AI-slop; Nielsen #1). Recharts is already in the stack per CLAUDE.md — use real points.
  - **P1 — Inconsistent injury-risk typing.** `injuryRisk` is treated as both a string and an object (`AIAnalyticsTab.tsx:24,61-63`); brittle.
  - **P1 — No explanations.** VDOT, TSB, ACWR, Age Grade are jargon with no tap-to-learn. Garmin/Whoop always pair a metric with a one-line "what this means." The `InjuryRiskBanner` component *already has* a great "Learn more" explainer pattern (`ai/AIInsights.tsx:449-481`) that isn't used here.
  - **P2 — 7px labels.** `text-[7px]` metric labels (`AIAnalyticsTab.tsx:184`) and 7px PR sublabels (`AIAnalyticsTab.tsx:148`) are below legibility/WCAG minimums.
- **Redesign opportunities:** Replace fake SVG with a real Recharts sparkline. Make each metric tappable → explainer sheet (reuse the `InjuryRiskBanner` disclosure). Wire in `RacePredictor` from `ai/AIInsights.tsx:308` which computes confidence bands the current static grid lacks.

### Zones sub-tab (`/coach` embedded · `pages/HRZonesPage.tsx`)
- **Purpose:** personalized HR training zones.
- **Features & data:** `/heartrate/zones` (`HRZonesPage.tsx:25-28`) and `/heartrate/trends` (`HRZonesPage.tsx:30-33`). Shows source dot + tip (`HRZonesPage.tsx:57-62`), Max HR / HR Reserve / LT HR (`HRZonesPage.tsx:65-83`), 5 zone cards with animated bars, feel + training effect (`HRZonesPage.tsx:86-126`), cardiac-efficiency trend (`HRZonesPage.tsx:129-144`).
- **States:** loading skeleton present (`HRZonesPage.tsx:48-54`). **MISSING empty state** — a user with no HR data renders nothing below the header; no "connect a HR source" guidance.
- **Interactions & nav:** none. Read-only.
- **UX problems:**
  - **P1 — Duplicate component.** `CoachingPanel` ALSO renders pace zones (`coaching/CoachingPanel.tsx:156-175`); pace zones also appear in the DNA reveal (`AIProfilingPage.tsx:617-634`). Three zone renderings, three styles. (Consistency — Nielsen #4.)
  - **P2 — Bar math can overflow.** `widthPercent * 2` capped at 100 (`HRZonesPage.tsx:115`) is an arbitrary fudge factor, not a real proportion.
- **Redesign opportunities:** This is good content trapped as a tab. Demote to an Insights section. Add an empty state. Standardize ONE `ZoneRow` component (see C).

### Records sub-tab (`/coach` embedded · `pages/RecordsPage.tsx`)
- **Purpose:** personal records.
- **Features & data:** `/records` (`RecordsPage.tsx:22-25`) + `/records/timeline` (`RecordsPage.tsx:27-30`). Race PRs with "New" badge if <14d (`RecordsPage.tsx:68-114`), effort PRs grid (`RecordsPage.tsx:117-132`), PR timeline (`RecordsPage.tsx:135-162`).
- **States:** loading skeleton (`RecordsPage.tsx:47-53`) and a real empty state (`RecordsPage.tsx:56-65`). **Best-behaved screen in the cluster.**
- **Interactions & nav:** none — read-only. A PR is the most shareable moment in running; there's no "share this PR" (the app has a SharePage + RunCard, `App.tsx:146`).
- **UX problems:**
  - **P1 — No share affordance on PRs.** Strava/NRC make a PR a celebration/share moment. Missing the easiest virality hook.
  - **P2 — PRs duplicated.** Same records render in Insights ("Personal Bests", `AIAnalyticsTab.tsx:141-153`) and here, with different layouts.
- **Redesign opportunities:** add "Share PR" → existing `/share` flow; merge into Insights/Progress.

### Full Plan page (`/plan` · `pages/PlanPage.tsx`)
- **Purpose:** the multi-week race-plan timeline (Base/Build/Peak/Taper).
- **Features & data:** `/training/plan` (full) (`PlanPage.tsx:20-23`) + `/goals` (`PlanPage.tsx:25-28`). Header with days-to-go + progress bar (`PlanPage.tsx:82-100`), phase-colored vertical timeline of weeks (`PlanPage.tsx:103-205`), expandable week → session list (`PlanPage.tsx:169-201`), Race Day node with predicted time (`PlanPage.tsx:207-221`).
- **States:** loading skeleton (`PlanPage.tsx:30-40`) and no-plan empty state (`PlanPage.tsx:42-55`). Good. **MISSING error state.**
- **Interactions & nav:** "← Back to Coach" → `/coach` plan tab (`PlanPage.tsx:83`); tap week to expand (`PlanPage.tsx:133`).
- **UX problems:**
  - **P1 — Phase is computed on the client, not from the engine.** `getPhaseForWeek` derives Base/Build/Peak/Taper from a fixed ratio of week number (`PlanPage.tsx:64-70`), overriding any real `weekData.phase` the backend sends (the real value is only used as a label override at `PlanPage.tsx:156`). So the *spine* of the plan is a cosmetic guess, not the actual periodization.
  - **P1 — Should not be a separate route.** Splitting "this week" (`TrainTab`) from "all weeks" (`PlanPage`) forces a context switch for one continuous artifact (Nielsen #2/#7).
  - **P2 — `daysLeft` can go negative** after race day (`PlanPage.tsx:62`) with no "race complete" terminal state.
- **Redesign opportunities:** Make this the Plan tab's expanded view (inline accordion, no route change). Trust the engine's phases. Add a post-race "how'd it go?" state that hands off to chat.

### Set Goal flow (`/set-goal` · `pages/SetGoalPage.tsx`)
- **Purpose:** 4-step wizard to create a goal and generate a plan.
- **Features & data:** local state wizard (`SetGoalPage.tsx:29-37`); on generate, `POST /goals` then `POST /goals/generate-plan` (`SetGoalPage.tsx:59-61`). Steps: type (race/pace/volume) → distance/volume → time + timeline → success (`SetGoalPage.tsx:88-273`).
- **States:** generating spinner inline on the button (`SetGoalPage.tsx:241`); success step (`SetGoalPage.tsx:248-272`). **Error handling is an `alert()`** (`SetGoalPage.tsx:69`) — jarring, off-brand, not styled (Nielsen #9, error recovery). Contrast with `AIProfilingPage` which has a proper retry screen (`AIProfilingPage.tsx:156-172`).
- **Interactions & nav:** Continue/Back between steps; "Skip for now" → `/dashboard` (`SetGoalPage.tsx:127`); success → `/coach` plan tab (`SetGoalPage.tsx:263`).
- **UX problems:**
  - **P1 — `alert()` for failures** (`SetGoalPage.tsx:69`).
  - **P2 — No validation feedback** on the minutes/seconds inputs (`SetGoalPage.tsx:200-214`) — free-typed numbers, no bounds, no inline error.
  - **P2 — Plan generation is a black box.** "Generating your plan..." gives no sense of what the AI is doing; `AIProfilingPage`'s "Calculating VO2max, matching your coach…" (`AIProfilingPage.tsx:184-191`) is far more compelling.
- **Redesign opportunities:** Replace alert with the AIProfiling-style retry screen. Add the "analyzing" theater. Echo the chosen goal back as a confirmation before generating.

### AI Profiling / DNA reveal (`/profiling` · `pages/AIProfilingPage.tsx`)
- **Purpose:** onboarding quiz that produces VO₂max estimate, Kendu coach persona, pace zones, "running DNA."
- **Features & data:** 8-step local-state quiz (`AIProfilingPage.tsx:100-150`), `POST /profiling/generate` (`AIProfilingPage.tsx:113`). `DNAReveal` shows coach persona, VO₂max, pace zones, personality tags, strengths/focus, week-1 preview, motivational message (`AIProfilingPage.tsx:589-700`).
- **States:** analyzing spinner (`AIProfilingPage.tsx:174-196`), error/retry screen (`AIProfilingPage.tsx:156-172`) — both well done. Per-step `canProceed` gating (`AIProfilingPage.tsx:138-150`).
- **Interactions & nav:** stepper with progress dots; on finish → `DNAReveal` → "Start Training" → `/set-goal` (`AIProfilingPage.tsx:153,693`).
- **UX problems:**
  - **P1 — The coach persona dies here.** The quiz matches you to a Kendu coach — Scientist/Energizer/Warrior/Sage (`AIProfilingPage.tsx:73-78`) with distinct vibes. That persona is the emotional payload of the whole onboarding… and then **never appears again** because chat is "Coming Soon" and `ChatTab` shows a generic ⚔️ Warrior icon hardcoded regardless of match (`ChatTab.tsx:12`). The persona should drive the chat's tone and avatar.
  - **P2 — GPS connect step is informational-only** (`AIProfilingPage.tsx:238-249`) — explicitly can't connect, just describes. Mild bait.
- **Redesign opportunities:** Carry the matched coach (name, gradient, vibe) into the Chat header and system prompt so the personality is consistent end-to-end.

### AI Profile / "What Your AI Coach Knows" (`/ai-profile` · `pages/AIProfilePage.tsx`)
- **Purpose:** transparency + editable memory of what the AI knows about the runner.
- **Features & data:** `GET /ai/profile` (`AIProfilePage.tsx:154`), `PATCH /ai/profile` (`AIProfilePage.tsx:166`). Runner summary, editable lists (health notes, goals, diet, personal context), read-only AI insights, usage stats with daily-limit bar (`AIProfilePage.tsx:254-386`).
- **States:** loading skeleton (`AIProfilePage.tsx:180-192`), error+retry (`AIProfilePage.tsx:195-206`), first-time empty (`AIProfilePage.tsx:209-222`). Thorough.
- **Interactions & nav:** inline edit/add/remove per list (`AIProfilePage.tsx:70-133`); empty-state CTA → `window.location.href='/coaching'` (`AIProfilePage.tsx:218`).
- **UX problems:**
  - **P0 (compounding) — "Start Coaching" CTA dead-ends.** `/coaching` redirects to `/coach` → Chat "Coming Soon" (`App.tsx:141`, `ChatTab.tsx`). The whole page's premise ("chat to build your profile") is broken.
  - **P1 — Not linked from the Coach tab.** This is the best "data transparency" surface (a Whoop/Garmin trust pattern) and there's no path to it from Coach. It's an island.
  - **P2 — Optimistic save can silently revert** on error via refetch (`AIProfilePage.tsx:172-174`) with no toast — the user's edit just vanishes.
- **Redesign opportunities:** Link from the Chat header ("What I know about you"). Use `window.location.href` → router `navigate` to avoid full reloads.

### Challenges (`/challenges` · `pages/ChallengesPage.tsx`) — *belongs in Community, flagged here per assignment*
- **Purpose:** 1v1 Kendu-staking wagers between runners.
- **Features & data:** `/kendu/challenges` (`ChallengesPage.tsx:30`), `/kendu/balance` (`ChallengesPage.tsx:35`), accept/decline mutations (`ChallengesPage.tsx:39-47`), create-challenge modal (`ChallengesPage.tsx:167-282`).
- **States:** loading skeletons (`ChallengesPage.tsx:90-95`), empty state (`ChallengesPage.tsx:96-101`). Good.
- **UX problems:**
  - **P1 — Wrong tab.** This is PvP/community, not AI coaching. It should move under Community.
  - **P1 — Opponent is selected by raw numeric User ID.** "Enter their user ID" (`ChallengesPage.tsx:212-219`) — no friend picker, no search. Unusable for a normal runner (Nielsen #6, recognition over recall).
  - **P2 — Orphan route.** Not linked from Coach or anywhere in this cluster; only reachable by typing `/challenges`.

### Shared coaching components (not on a tab, but in-cluster)

**`CoachingPanel` (`coaching/CoachingPanel.tsx`)** — the Transformation journey. Current→target pace, milestone path with the user's avatar as the "you are here" node (`CoachingPanel.tsx:80-99`), VO₂max card, pace zones. Data: `/coaching/tier`, `/coaching/ideal-pace`, `/coaching/transformation` (`CoachingPanel.tsx:19-32`). **P0-adjacent: orphaned** — no route renders it; `/coaching` redirects away (`App.tsx:141`). A genuinely good "data storytelling" screen (Whoop-grade) is sitting unused. Should anchor the Plan tab.

**`ai/AIInsights.tsx`** — four strong, real-data components: `PatternInsights` (rotating data-pattern cards, `AIInsights.tsx:169`), `RacePredictor` (Daniels VDOT with confidence, `AIInsights.tsx:308`), `InjuryRiskBanner` (ACWR with a great learn-more disclosure, `AIInsights.tsx:410`), `PostEventInsights` (split/HR/placement analysis, `AIInsights.tsx:624`). These are *more honest and personalized* than what the Coach tab actually renders (the fake SVG, hardcoded pre-run). The Insights tab should be rebuilt on these. **P1: the good stuff isn't where the user looks.**

**`ChatFAB` (`chat/ChatFAB.tsx`)** — floating coach button, shows a green dot when a high-priority suggestion exists (`ChatFAB.tsx:15,32`). Navigates to `/chat` (`ChatFAB.tsx:22`) which redirects to the dead Chat tab. **P0 (compounding):** the one persistent, app-wide entry to the coach leads nowhere useful.

**`ZoneBar` (`run/ZoneBar.tsx`)** — live pace-vs-target bar for the run tracker (`ZoneBar.tsx:7-47`). Clean, self-contained. Pure presentational; good candidate for the design system. Hides the marker when stationary (`ZoneBar.tsx:13`). No issues.

---

## C. Reusable components inventory

Worth standardizing into the design system:

- **`MetricCard`** — already a local component (`AIAnalyticsTab.tsx:179-189`) with color variants. Promote to shared; reused 8+ times across Insights/Zones. (Fix the 7px label.)
- **`ZoneRow` (NEW)** — collapse the three divergent pace/HR-zone renderings (`HRZonesPage.tsx:86-126`, `CoachingPanel.tsx:156-175`, `AIProfilingPage.tsx:617-634`) into one. Currently 3 implementations.
- **`PRCard` / record row** — duplicated in `RecordsPage.tsx:72-114` and `AIAnalyticsTab.tsx:141-153`. One row component; add "New" badge + "Share" affordance.
- **`InsightCard` disclosure** — the `InjuryRiskBanner` learn-more pattern (`AIInsights.tsx:449-481`) is the right model for *every* jargon metric on Insights. Generalize it.
- **`PhaseTimeline` / `MilestoneTimeline`** — `PlanPage`'s week timeline (`PlanPage.tsx:103-205`) and `CoachingPanel`'s milestone path (`CoachingPanel.tsx:68-144`) and `RecordsPage`'s PR timeline (`RecordsPage.tsx:135-162`) are three near-identical vertical-line-with-nodes layouts. One `Timeline` primitive.
- **`WizardShell`** — `SetGoalPage` and `AIProfilingPage` reimplement stepper + progress dots + AnimatePresence slide independently. Standardize (and standardize the error screen, which only AIProfiling does right).
- **`ChatBubble` + `QuickPrompts` + `TypingIndicator`** — from the real `ChatPage.tsx:130-175,114-125` — the conversational primitives the whole tab should be built on.
- **`ZoneBar`** — promote as-is (`run/ZoneBar.tsx`).
- **`DayBox` / week strip** — `TrainTab.tsx:133-153` is a reusable 7-day status strip.

---

## D. Top 5 highest-impact changes for this tab

1. **Un-hide the AI coach (P0, ~1-line + delete-and-replace).** Change `App.tsx:155` so `/chat` renders the real `ChatPage` (or render `ChatPage`'s content inside the Chat sub-tab in place of `ChatTab`). The chat client, backend, history, suggestions, and Claude-Sonnet integration are all already built (`ChatPage.tsx`, `chat.routes.ts:22-76`). **Benefit:** instantly turns the product's headline feature from a "Coming Soon" sign into a working, data-grounded coach — and rescues `ChatFAB` + the "Start Coaching" CTA from dead-ending. Highest ROI in the app.

2. **Kill the fakery (P0).** Replace the hardcoded always-up "Pace Trajectory" SVG (`AIAnalyticsTab.tsx:102`) with a real Recharts series, and render the *actual* `/insights/pre-run` payload instead of the static Pre/Post/Nutrition boilerplate (`TrainTab.tsx:196-210`). Also remove `streakDays = 0` dead code (`AIAnalyticsTab.tsx:26`) and the canned "Good discipline." (`TrainTab.tsx:223`). **Benefit:** the coaching becomes trustworthy and genuinely personal — the difference between feeling like Runna and feeling like a demo.

3. **Collapse 5 sub-tabs → 3 (Coach · Plan · Progress) and unify the plan (P1).** Fold Zones + Records into a Progress/Insights scroll, and merge `TrainTab` (this week) with `PlanPage` (all weeks) into one Plan tab — no separate `/plan` route, trust the engine's real phases (`PlanPage.tsx:64-70`). **Benefit:** a coherent training cockpit instead of five sibling dashboards; less tab-bar noise, one mental model for "my plan."

4. **Add the missing loading/empty/error states (P1).** `TrainTab` and `AIAnalyticsTab` render with `undefined` data and no spinners (em-dash walls); `SetGoalPage` uses `alert()` for errors (`SetGoalPage.tsx:69`). Adopt the patterns the cluster already has elsewhere (`RecordsPage` empty state, `AIProfilingPage` retry screen). **Benefit:** first-paint no longer looks broken; failures become recoverable instead of jarring.

5. **Make the coach persona and "what I know" persistent (P1).** Carry the matched Kendu coach (Scientist/Energizer/Warrior/Sage, `AIProfilingPage.tsx:73-78`) into the Chat header/tone, and link `AIProfilePage` ("What Your AI Coach Knows") from the Coach tab. Surface the existing `ai_powered` flag (`chat.routes.ts:74`). **Benefit:** the onboarding's emotional payoff stops evaporating — the coach feels like a consistent character that demonstrably remembers you (Whoop/Runna-grade relationship), the core retention loop.
