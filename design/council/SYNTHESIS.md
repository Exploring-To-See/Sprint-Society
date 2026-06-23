# Sprint Society Redesign — Council Synthesis

Synthesis of all 6 feature-UX teardowns (Home · AI-Coach · Run · Community · Events · Profile/Account).
Read the per-cluster files for cited `file:line` detail. This is the cross-cutting picture + the
global design-system / IA decisions that the per-page artifacts will follow.

---

## 1. The single biggest finding: **the app is more built than it is wired**

Every cluster independently surfaced fully-built, better-than-shipping components and endpoints that
are **orphaned** (imported nowhere) or **redirected away**. The redesign is as much an *integration &
honesty* job as a visual one. Highlights:

| Area | Built but dark | Impact of wiring it in |
|------|----------------|------------------------|
| Home | `ReadinessCard`, `TrainingLoadRing`, `AchievementProgress`, `PRBanner`, `PaceChart`, `CoachCard` (+ Start-run button), `UpcomingEvents`, `CommunityActivity`, `LevelCard` — 9 orphaned | A Whoop/Garmin-grade dashboard already exists, dormant |
| AI-Coach | A complete **chat client (`ChatPage.tsx`) + live Claude backend (`chat.routes.ts`)** — unreachable because `/chat`→`/coach` redirect. Plus `CoachingPanel` (transformation journey) | The flagship "AI coach" is built and hidden behind "Coming Soon" |
| Run | `RunShareCard` (proper 1080×1920), `ZoneSplitChart` — orphaned; `/runs`, `/progress`, `/share` routes exist but FAB only opens `/run/track` | A real post-run + history loop already coded |
| Community | `/events/nearby`, `/events/my`, weekly digest, leaderboard exist but buried/unused | The "alive club" parts exist, just hidden |
| Profile | `KenduWidget`, `KenduLeaderboard`, `PostRunKenduModal` orphaned; `/kendu/spend/*` + confirm modal unwired | The reward dopamine loop never fires |

**Recommendation:** the redesign artifacts will assume these are wired in (they reflect the *intended*
product). A companion "wire-up backlog" is the cheapest path from mockup → real app.

## 2. Trust-breaking fake/hardcoded data (fix in every redesign)

These actively mislead users and must be designed out:
- **Home** "✓ On track" pill is hardcoded green regardless of adherence (`ProgressPill.tsx:27`).
- **AI-Coach** "Pace Trajectory" is a hardcoded always-up SVG, identical for every user (`AIAnalyticsTab.tsx:102`); Plan's Pre/Post/Nutrition blocks are static literals (`TrainTab.tsx:196-210`).
- **Run** calories are `seconds*0.07` (`RunTrackerPage.tsx:612`); ZoneBar hardcodes `375/405` so it can disagree with the fetched zones; "AI analysis" is client-side heuristics, not AI.
- **Community** feed reads the wrong response key (`feed?.activities` vs `{feed:[]}`) so it shows empty even with data; reactions send emoji where backend wants keys → never round-trip.
- **Profile** pricing differs across 3 sources (₹9/19/49 vs DB ₹9/99 vs hardcoded ₹99); "Spent" stat math is wrong.

**Principle for artifacts:** every number shown is either real or visibly labeled as an estimate;
no green "you're fine" without evidence. (Nielsen #1 visibility, #2 match-to-real-world, #5 error-prevention.)

## 3. Broken loops / dead ends (design the path through)

- AI-Coach **Chat** is a "Coming Soon" wall and is the destination every coach CTA funnels into.
- Run **History** rows are non-interactive and **there is no run-detail screen** — after the biggest
  moment in the app, the user can't reopen a run, see its map/splits, or share from history.
- Events sells "Host Event" (Rewards, 75 Kendu) but there is **no create-event flow**.
- Rewards "Spend" buttons mostly `navigate()` to `null` routes; the economy can't actually spend.
- Notifications gamification rows link to `null` (dead taps).

## 4. Pervasive missing states

Loading/empty/error coverage is inconsistent. Best-in-codebase to standardize from: `RecentRuns`
(empty+skeleton), `RecordsPage`, `AIProfilingPage` retry, `PaceChart` (empty). Worst offenders:
`EventsPage` (no error → failure looks like "no events"), `TrainTab`/`AIAnalyticsTab` (render undefined),
`SetGoalPage` (`alert()` for errors), most Profile/Kendu fetches swallow errors silently.

## 5. Global IA & navigation (LOCKED 5 tabs)

**Bottom nav:** `Home · AI-Coach · Run (center FAB) · Community · Events`.
- Rename **Social → Community**; **promote Events** into the bar.
- 375px fit: 4 labels + center FAB is tight with "AI Coach"/"Community". Use compact labels
  (**Coach**, **Club**?) or icon-forward with 10px labels (validated in the mockups at 11px).
- Top bar: **wordmark → Home** (currently wrongly → Profile), avatar → Profile, bell → Notifications.

**Cross-tab feature moves the council recommends:**
- **Home** = daily decision surface only. Move the full `ChallengeList` habit-tracker OFF Home
  (teaser only); move `AthleteCard` (a share artifact) to Profile/Sharing.
- **AI-Coach**: collapse 5 sub-tabs → **3 (Coach · Plan · Progress)**; fold Zones+Records into
  Progress; merge `TrainTab`+`PlanPage` into one Plan. Move **Challenges** (1v1 PvP) to **Community**.
- **Run**: the center FAB should open a run *hub* (Start / History / Progress / Share), not only the
  live tracker — give users a path back to their data. Add a **run-detail** screen.
- **Community**: dedupe the two communities lists (`CommunitiesTab` vs `CommunitiesPage`); surface
  the weekly digest + leaderboard at tab level (not buried in one community); add challenges.
- **Events**: 3 sub-tabs **Upcoming · Nearby (map) · Mine**; wire the existing nearby/my endpoints;
  real RSVP + (optional) Razorpay paid events + add-to-calendar/reminders + check-in.
- **Profile**: split identity (stats, achievements, VO₂, gear) from Settings; fire the post-run
  Kendu earn celebration; make Rewards actually spend.

## 6. Design-system through-lines (apply in every artifact)

From the reusable-components inventories across clusters — standardize these primitives:
- `Card` (one chrome), `ProgressRing` (Whoop/Garmin staple, already in `TrainingLoadRing`),
  `ProgressBar`/XP bar (3 copies today), `StatusPill` (tier/auto/status variants),
  `MetricStat` (count-up; kill the `text-[7px]` labels — WCAG fail), `ListRow` (runs/events/checklist),
  `EmptyState`, `Skeleton`, and a single `formatPace` (currently re-implemented 4+ times).
- Honest data contracts, real empty/error states, `prefers-reduced-motion` + sound preference respect
  (Home plays level-up sound unconditionally today).

## 7. Visual direction (pending founder pick)

Three Home directions rendered in `/design/directions/` — Performance-Dark (A), Athletic-Bold (B),
AI-Coaching-Premium (C). The chosen language + the decisions above become the spec the per-page
HTML artifacts follow, starting with the 5 core tabs + Profile + Notifications.
