# Run — Feature & UX Teardown

> Council member: **RUN tab** (center primary action). Scope: full run lifecycle —
> start → live tracking → finish summary → AI analysis → share → history → progress.
> Files traced: `RunTrackerPage`, `RunHistoryPage`, `ProgressPage`, `SharePage`,
> `RunShareCard`, `RouteShape`, `ProgressRing`, `SplitChart`, `ZoneBar`,
> `ZoneSplitChart`, `PaceChart`, plus routing (`App.tsx`), `BottomNav`, `AppShell`,
> and the backend `runs.routes.ts`.

---

## A. Cluster IA recommendation

### What the Run tab should be
The Run tab is the product's reason to exist: it is where the user *makes themselves
provably faster*. Today it is reduced to a single deep route — the center FAB only
navigates to `/run/track` (`BottomNav.tsx:21`). Everything else in the run lifecycle
(History `/runs`, Progress `/progress`, Share `/share`) is **orphaned**: those routes
exist (`App.tsx:144-146`) but no tab, FAB, or in-app link routes to them. The post-run
analysis screen links to `/share` and `/dashboard` (`RunTrackerPage.tsx:496,502`) but
never to History or Progress. A user who finishes a run has no path back to their own
history except typing a URL. This is the single biggest IA failure in the cluster.

**Recommendation: make "Run" a section, not a single screen.** The center FAB should
still launch tracking on tap (that's the locked behavior and matches NRC/Strava's big
record button), but the Run *destination* needs sub-navigation. Proposed structure:

```
RUN  (center tab)
├── Track      → live GPS recorder (the FAB's primary tap target)
├── History    → run list + per-run detail (currently /runs, no detail screen exists)
├── Progress   → Stats + Journey (currently /progress)
└── (Share is a flow, not a tab — reached from a run, not browsed)
```

Concretely: on the Run landing, show the big START button **plus** a segmented control
or top tabs (Track · History · Progress) so the recorder, the log, and the trend data
live under one roof — the way Strava unifies Record / You / Progress and Garmin unifies
its activity feed.

### Features that should MOVE
- **Share** (`/share`, `SharePage.tsx`) should *not* be a browsable top-level destination.
  It's a post-run action. Keep the route for deep-linking, but surface it as a "Share"
  button on (a) the post-run analysis card (already there, `RunTrackerPage.tsx:496`) and
  (b) a future run-detail screen. Template browsing without a run selected
  (`SharePage.tsx:521-555`) is a dead-end gallery.
- **Records** (`/records`, `RecordsPage`) and **Personal Records** rendered inside
  ProgressPage (`ProgressPage.tsx:212-232`) overlap. PRs are a Progress concern — keep
  them in Progress and fold the standalone `/records` route into the Progress → Stats view.
- **PaceChart** (`components/dashboard/PaceChart.tsx`) currently lives in the Dashboard
  cluster but is the cleanest pace-trend visualization in the codebase (proper recharts
  `AreaChart`, gradient fill, skeleton + empty states). ProgressPage rebuilds an inferior
  `LineChart` inline (`ProgressPage.tsx:148-187`). **Standardize on PaceChart and reuse it
  in Progress** instead of maintaining two pace charts.
- **Journey** timeline (`ProgressPage.tsx:80-104`) is really a "transformation" narrative.
  It can stay in Progress but should be promoted from a flat toggle to a richer sub-screen.

### Dead code to delete or wire up
- `RunShareCard.tsx` is **never imported anywhere** (confirmed by grep). It's a
  fixed-360×640 card with PB glow + spring badge that's arguably *better designed* than
  several `SharePage` templates, yet it's orphaned. Either adopt it as a template or delete it.
- `ZoneSplitChart.tsx` is **never imported anywhere** either. It's a genuinely good
  per-km pace-vs-zone area chart with "X/Y in zone" framing — exactly what the post-run
  summary is missing. Wire it into the FINISHED/ANALYSIS states.

---

## B. Screen-by-screen teardown

### Run Tracker — IDLE / pre-run (`/run/track` · `RunTrackerPage.tsx`)

- **Purpose:** Get the user from "I want to run" to "I'm recording" in one tap.
- **Features & data:**
  - Initial geolocation via `navigator.geolocation.getCurrentPosition`
    (`RunTrackerPage.tsx:111-114`); sets `userLocation` for the map center.
  - Non-critical fetch of `/api/training/paces` to seed the easy-pace zone, with silent
    fallback to hardcoded defaults `{375, 405}` (`:95`, `:116-123`).
  - Mini dark map preview (CartoDB dark tiles) at `h-[200px]` (`:528,536`).
  - Big circular **START** button, 160×160, orange with glow (`:561-566`).
  - GPS error banner (`:555-559`).
- **States:**
  - Loading: "Locating you..." spinner (`:517-524`). Good.
  - Error: `gpsError` shown for unsupported GPS / denied location (`:110,113`). Good.
  - **MISSING:** no countdown ("3-2-1-GO") before recording starts — NRC/Strava both do
    this so the first GPS fix and the first stride line up. The run begins instantly on tap
    (`:222`), so the first seconds are recorded while the phone is still in the pocket.
  - **MISSING:** no GPS-signal-strength indicator before start. NRC/Garmin show
    "Acquiring GPS / GPS Ready" so the user doesn't start a run with a bad fix.
- **Interactions & nav:** Tap START → `startTracking()` resets all state and begins
  `watchPosition` (`:205-233`). Nav is hidden once `state === 'RUNNING'|'PAUSED'`
  (`AppShell hideNav`, `:514`).
- **UX problems:**
  - **P1 — No GPS readiness signal (Visibility of system status, NN/g #1).** User can't
    tell if GPS is locked. A weak first fix corrupts early distance/pace.
  - **P2 — Goal is invisible & hardcoded.** The ring goal is a fixed `goalDistance={5000}`
    (`:589`) with no way to set today's target before starting. Runna/NRC let you pick a
    distance/time/workout goal pre-run.
  - **P2 — No run-type / workout selector.** Every run is a generic free run. No "easy run
    / intervals / long run / from-plan" choice, so the tracker can't reference the user's
    training plan (which exists — `/plan`).
- **Redesign opportunities:**
  - Add a pre-run sheet: goal (distance/time/open), run type, audio-cue cadence, and a
    "Start workout from plan" entry point (Runna/NRC pattern).
  - Show GPS bars + a 3-2-1 countdown (NRC/Strava) so recording starts clean.

---

### Run Tracker — LIVE (RUNNING / PAUSED) (`RunTrackerPage.tsx:571-640`)

- **Purpose:** The hero screen — glanceable live metrics while moving.
- **Features & data:**
  - Full-bleed follow-map with orange route polyline (`:528-543`); `MapFollower`
    re-centers on each position (`:60-66,540`).
  - Floating glass stat card (`:574`) containing:
    - Status dot (pulsing green / yellow) + elapsed time (`:576-585`).
    - **ProgressRing** (`run/ProgressRing.tsx`) showing *current pace* big in the center,
      a zone label (IN ZONE / TOO FAST / SLOW DOWN / WAITING), and distance/goal
      (`ProgressRing.tsx:46-57`). Fed `currentDistance`, `goalDistance={5000}`,
      `currentPace`, and target band from `paceZones` (`:588-594`).
    - **ZoneBar** (`run/ZoneBar.tsx`) — a red→green→red gradient with a white marker for
      live pace (`:598-602`).
    - Secondary metrics row: km, **cal**, elev (`:606-619`).
  - Pace recomputed every 5s over the last ~100m of GPS (`:137-157`).
  - Elevation gain accumulated with a ±2m deadband (`:168-174`).
  - Splits auto-generated per km crossed (`:187-194`).
- **States:**
  - PAUSED: status dot turns yellow, label "Paused" (`:580-582`); resume re-attaches
    `watchPosition` (`:240-243`).
  - In-run GPS warning banner at top (`:707-711`).
  - **MISSING / BROKEN:** **no background tracking.** This is a browser PWA using
    `watchPosition`; when the screen locks or the tab backgrounds, the OS throttles or
    suspends geolocation and the timer `setInterval` (`:129`). A run will under-count
    distance and time the moment the user pockets the phone. There is no Wake Lock,
    no service-worker background sync, no "keep screen on." For a *run tracker* this is
    a P0 correctness failure, not a polish item.
  - **MISSING:** no auto-pause (Strava/Garmin auto-pause when you stop at a light).
  - **MISSING:** no persistence of an in-progress run. If the PWA reloads or crashes
    mid-run, everything in refs/state (`positionsRef`, `splits`, `elapsedSeconds`) is lost
    — there's no localStorage/IndexedDB checkpoint.
- **Interactions & nav:** Pause/Resume toggle + Stop (red square) at the bottom
  (`:625-637`). Stop → `FINISHED` (`:245-248`). Controls are reachable but small (64px).
- **UX problems:**
  - **P0 — Background/locked-screen tracking absent (system status + match to real
    world).** The defining feature of a GPS run app doesn't survive a screen lock.
  - **P0 — "Calories" is fabricated.** `Math.round(elapsedSeconds * 0.07)` (`:612`) is
    time × a constant — it ignores distance, pace, weight, HR. Presenting an invented
    number as data erodes trust (violates *honesty/credibility*; NN/g "match between
    system and real world"). Either compute it properly (MET × weight × time) or remove it.
  - **P1 — Two sources of truth for the target zone.** ProgressRing gets the *fetched*
    `paceZones` (`:592-593`) but ZoneBar is passed **hardcoded** `375/405`
    (`:600-601`), so the ring and the bar can disagree about what "in zone" means.
  - **P1 — The single biggest number on screen is *current* pace (ProgressRing center),
    not distance or time.** Current pace is the noisiest metric (5s window over 100m);
    NRC/Strava lead with elapsed distance or time as the hero. Glanceability suffers when
    the dominant figure jitters.
  - **P1 — Map auto-follows with no "recenter" control and no way to see the whole route
    while running.** `MapFollower` hard-locks the viewport (`:62-64`); a user can't pan to
    check where they are without it snapping back.
  - **P2 — Goal ring is meaningless** because `goalDistance` is a constant 5000 (`:589`).
    Every run shows progress toward 5k regardless of intent.
  - **P2 — No audio/haptic cues.** No km-split callout, no "pick up the pace" voice —
    table stakes for NRC and Garmin. The whole value of a zone is lost if you must stare
    at the screen to stay in it.
  - **P2 — Controls (pause/stop) are 64px and bottom-center only**; no lock-screen
    widget, no large "swipe to stop" guard, so an accidental tap can end a run with no undo.
- **Redesign opportunities:**
  - Implement `navigator.wakeLock` + persist run state to IndexedDB every few seconds so a
    locked screen or reload doesn't lose the run.
  - Make **distance or time** the hero metric; demote current pace to the ring/zone-bar.
  - Add audio cues (Web Speech API) on each km split and zone breach.
  - Add auto-pause and a "recenter / view full route" map toggle.
  - Unify the zone source so ring + bar always agree (single `paceZones` prop).

---

### Run Tracker — FINISHED summary (`RunTrackerPage.tsx:642-704`)

- **Purpose:** Confirm the effort, let the user log RPE, and save.
- **Features & data:**
  - 4-up stat grid: km / time / pace / elev (`:651-656`).
  - Split list — flat rows, Km N + pace (`:660-670`).
  - **RPE selector** — 5 emoji buttons (Easy→All Out), local state only (`:672-693`).
  - Discard / Save buttons; Save disabled if `totalDistance < 10` m (`:697-701`).
- **States:**
  - Saving spinner on the button (`:700`).
  - Save error: now correctly throws on non-2xx and `alert()`s + reverts to FINISHED so
    the run isn't silently lost (`:267-283`) — good, but `alert()` is a crude error UI
    inconsistent with the app's `ErrorToast`.
  - **MISSING:** no map of the just-run route on the FINISHED screen (the map element is
    only `h-[180px]` and only renders when `routeCoords.length > 1`, `:528,541`); the
    summary doesn't foreground the route shape the way Strava/NRC do.
- **Interactions & nav:** Save → POST `/runs/log` (`:253-265`) with distance, time,
  start, elevation, splits, rpe, polyline → backend `runs.routes.ts:113` runs the cascade
  and returns XP/Kendu/PB/achievements. On success → `ANALYSIS` state.
- **UX problems:**
  - **P1 — Splits here are a plain list (`:660-670`) while the *same data* gets the
    beautiful animated `SplitChart` two screens later in ANALYSIS (`:416-420`).**
    Inconsistent representation of identical data (NN/g "consistency & standards").
  - **P1 — RPE is optional and easy to skip** with no prompt; yet RPE is load-bearing for
    the AI coach's training-load model. No nudge to fill it in.
  - **P2 — `< 10m` save guard is arbitrary** and gives no feedback about *why* Save is
    disabled (just `opacity-40`). A 9-meter run and a GPS-glitch run are treated the same.
  - **P2 — `alert()` for save failure** breaks the design system and isn't dismissible in-app.
- **Redesign opportunities:**
  - Show the route map + `SplitChart` + `ZoneSplitChart` on this screen; make FINISHED and
    ANALYSIS one continuous, scrollable post-run report rather than two states.
  - Make RPE a one-tap requirement with a skip affordance, and explain why it matters.

---

### Run Tracker — ANALYSIS / celebration (`RunTrackerPage.tsx:357-511`)

- **Purpose:** Celebrate + give an "AI" read on the run, then route to Share/Dashboard.
- **Features & data:**
  - Animated **score ring** /100 (`:365-385`).
  - **Tags** (max 2) e.g. Strong Finish, Steady Pacer, Hill Crusher (`:387-392`).
  - **Commentary** sentence (`:394-397`).
  - 3-up stats (km/pace/time) (`:399-413`).
  - `SplitChart` if >1 split (`:416-420`).
  - Fastest/slowest km callout (`:422-428`).
  - **Cascade rewards**: +XP, +Kendu, streak, PB, level-up, achievements — all driven by
    `data.cascade` from the backend (`:430-491`).
  - Actions: **Share Card** → `/share`, **Back to Dashboard** (`:494-507`).
- **States:** Only renders when `state==='ANALYSIS' && analysis` (`:358`). If analysis
  generation produced nothing meaningful it still renders (analysis always set, `:333`).
- **Interactions & nav:** Share → `/share` (`:496`); the SharePage then re-fetches runs and
  auto-selects the most recent (`SharePage.tsx:436-440`) — i.e., it re-loads the run we
  *just* saved instead of being handed it. Round-trip + refetch for data we already have.
- **UX problems:**
  - **P1 — The "AI analysis" is fully client-side heuristics, not AI.** Score
    (`:292-302`), tags (`:304-315`), and commentary (`:317-324`) are computed locally in
    `generateAnalysis()`. The backend cascade already returns real PB/achievement data;
    presenting a hand-rolled rubric as "Run Analysis / AI" is a credibility risk and
    duplicates logic the server should own. (Honesty + single-source-of-truth.)
  - **P1 — No path to History or the run's own detail.** Only Share + Dashboard exist
    (`:494-507`). After the biggest moment in the app, the user can't view the run again.
  - **P2 — Celebration is a long vertical scroll of stacked cards** (score, tags, commentary,
    stats, chart, fastest/slowest, then up to 6 reward chips). No hierarchy of "the one
    thing that matters today" (a PB, a level-up) — everything competes. NRC/Strava lead with
    the single headline achievement then let you scroll for detail.
  - **P2 — No confetti / haptic / sound** on a PB or level-up despite spring animations on
    the chips (`:457-463,467-473`). The peak emotional moment is under-celebrated.
- **Redesign opportunities:**
  - Lead with one hero headline (PB! / Level N! / "Fastest 5k"), then the score and detail.
  - Pass the saved run straight into Share (router state) instead of refetch+auto-select.
  - If "AI analysis" stays, source it from the server (the coach engine) so it's real and
    consistent with the AI-Coach tab.

---

### Run History (`/runs` · `RunHistoryPage.tsx`)

- **Purpose:** Browse past runs and at-a-glance totals.
- **Features & data:**
  - Query `['runs']` → `api.get('/runs?limit=30')` (`:22-25`) → backend
    `runs.routes.ts:9` returns `{ runs, total, page, limit }` (envelope unwrapped by the
    axios interceptor, `lib/api.ts:31-35`).
  - Summary trio: total runs, total km, best pace (`:42-57`); `bestPace` via
    `Math.min(...average_pace_per_km)` (`:30`).
  - Run rows: date, optional elevation, km / pace / min (`:80-103`).
- **States:**
  - Loading skeleton (4 bars) (`:60-66`). Good.
  - Empty: 🏃 "No runs yet" (`:69-75`). Good.
  - **MISSING:** error state — `useQuery` exposes only `isLoading`; a failed fetch shows the
    empty state ("No runs yet"), which lies about the cause (NN/g "help users recognize
    errors").
- **Interactions & nav:** **None.** Run rows are plain `<div>`s (`:81`) — not tappable.
  There is no run-detail screen at all. You cannot open a run to see its map, splits, or
  share it from here.
- **UX problems:**
  - **P0 — Rows aren't interactive; no run-detail screen exists.** The history is a
    read-only ledger. Every competitor opens a run to a full detail view (map, splits,
    laps, HR, share). This is the most glaring gap in the cluster after background tracking.
  - **P1 — No route thumbnail per row.** `RouteShape` exists and could render a tiny map
    glyph per run (Strava's signature list affordance), making the list scannable.
  - **P1 — `bestPace` uses `999` sentinel** when `average_pace_per_km` is null (`:30`); a
    run missing pace poisons the min only if all are null, but the sentinel can leak into
    `formatPace(999)` → "16:39" on edge data.
  - **P2 — No filtering/sorting** (by distance, date range, run type), and a hard
    `limit=30` with no pagination despite the backend supporting `page`/`offset`
    (`runs.routes.ts:9-16`).
  - **P2 — No grouping by week/month** — competitors chunk history into weeks with weekly
    mileage headers.
- **Redesign opportunities:**
  - Make rows tap → a **Run Detail** screen (map via Leaflet or `RouteShape`, `SplitChart`,
    `ZoneSplitChart`, RPE, share button). This single screen unlocks Share-from-history and
    re-view-after-celebration.
  - Add per-row `RouteShape` thumbnails and week grouping with mileage subtotals.
  - Add a real error state.

---

### Progress (`/progress` · `ProgressPage.tsx`)

- **Purpose:** Prove the user is getting faster over time; tell the transformation story.
- **Features & data:**
  - Toggle **Stats | Journey** (`:65-77`).
  - **Stats** view:
    - Before→After card from `/progress/improvement` (`:21-24,112-145`): started-at pace,
      now pace, "Ns faster", distance growth %, total runs.
    - Inline pace-trend `LineChart` from `improvement.trend` (`:148-187`).
    - Weekly comparison message from `/progress/weekly` (`:190-209`).
    - Personal Records list (`:212-232`).
    - Next milestone with progress bar (`:235-250`).
    - Improvement velocity (s/km/week) (`:253-262`).
  - **Journey** view: vertical milestone timeline from `/progress/journey`, lazy-fetched
    only when the tab is opened (`:33-37,80-104`).
- **States:**
  - Loading: full skeleton (`:39-54`). Good.
  - Empty (no improvement data): 📈 prompt (`:266-273`); Journey empty: 🗺️ prompt (`:98-103`).
  - **MISSING:** error states — all three queries silently degrade to empty; `journey`
    even `.catch(() => null)` (`:35`), so a server error is indistinguishable from "no data."
- **Interactions & nav:** Stats/Journey toggle only. No drill-down from a PR or milestone.
- **UX problems:**
  - **P1 — Duplicate, weaker pace chart.** This page hand-builds a `LineChart`
    (`:148-187`) while the codebase already has the polished `PaceChart` `AreaChart`
    (`dashboard/PaceChart.tsx`). Two implementations, inconsistent styling/empty states.
  - **P1 — Gated empty state.** The whole Stats view is hidden behind
    `improvement?.has_data` (`:112,267`); a user with 1–2 runs sees only "Complete a few
    runs," even though weekly data might exist. The thresholds for "enough data" are opaque.
  - **P2 — Journey is a flat list of dots**, not a story. The brief's "transformation
    journey" deserves richer, more emotional treatment (before/after, milestone art).
  - **P2 — Improvement-velocity sign logic is confusing.** `pace_improvement_per_week > 0`
    renders a leading `'-'` (`:257-259`) — improvement shown as a negative number. Easy to
    misread.
  - **P2 — PR list here overlaps the standalone `/records` page** — two homes for PRs.
- **Redesign opportunities:**
  - Replace inline chart with shared `PaceChart`; add a distance/volume trend (the
    `/runs/trends` endpoint already returns 8-week volume, `runs.routes.ts:86`).
  - Whoop-style "you're trending faster" storytelling: one headline number (e.g. "−18s/km
    in 6 weeks") with a sparkline, then detail.
  - Make Journey a real timeline with run links and milestone artwork.
  - Add error states to all three queries.

---

### Share (`/share` · `SharePage.tsx`)

- **Purpose:** Generate an Instagram-story-sized card from a run and share/download it.
- **Features & data:**
  - Run picker if none selected (`:521-555`); auto-selects most recent on load
    (`:436-440`).
  - 9 templates (`TEMPLATES`, `:22-32`): 6 free + 3 premium (Neon/Gold/Midnight) gated by
    Kendu purchase (`ownedSkins`, `:457-460,568`).
  - Premium unlock via `KenduSpendConfirmModal` (cost 40, `:647-656`).
  - `photo_route` template supports a user background photo (≤5MB, `:597-620`).
  - Each template is a `9/16` card composed in `CardTemplate` (`:34-417`) using
    `formatDistance/formatPace/formatDuration/formatDate` and optional `RouteShape`.
  - Data: runs `/runs?limit=10` (`:430-433`), XP/streak `/gamification/xp` (`:442-445`),
    tier `/coaching/tier` (`:447-450`), Kendu balance (`:452-455`).
  - Export: `html-to-image` `toJpeg` at `pixelRatio: 3` (`:474-509`); native `navigator.share`
    with download fallback (`:495-509`).
- **States:**
  - Empty (no runs): 🏆 "Complete a run first" (`:547-553`). Good.
  - Download in-progress label (`:636-637`).
  - **MISSING:** no loading state while runs fetch (initial render shows the picker empty);
    no error state if `toJpeg` throws (only `console.error`, `:490`) — the user taps
    Download and *nothing happens* with no feedback.
- **Interactions & nav:** Reached from ANALYSIS (`RunTrackerPage.tsx:496`) — but it
  refetches and auto-selects rather than receiving the run. Template strip is horizontally
  scrollable (`:566`). Locked template tap → buy modal (`:573-578`).
- **UX problems:**
  - **P1 — Fragile data-shape handling.** `selectedRun` is computed as
    `data?.find ? data.find(...) : data?.runs?.find(...)` (`:472`) and
    `runs = data?.runs || data` (`:511`) — the code hedges against two possible shapes
    because the dev wasn't sure what `api.get('/runs')` returns. With the interceptor,
    `data` is always `{ runs, ... }`, so `data?.find` is always falsy and the fallback path
    is the real one. Dead-branch hedging is a smell and a latent bug if the envelope changes.
  - **P1 — Card preview is `max-w-[320px]` but exports at the same DOM size × pixelRatio 3
    (`:478-483,623`).** A 9:16 story is 1080×1920; a 320-wide card at 3× is ~960px tall —
    close but not the canonical story resolution, and the preview is cramped on a 375px
    screen. There's no "preview at true aspect / full-bleed" mode.
  - **P2 — Two parallel card systems.** `CardTemplate` (9 inline templates, `SharePage`)
    and the orphaned `RunShareCard` component both render run cards; the latter has nicer PB
    treatment but is unused. Consolidate.
  - **P2 — Templates show the same run data with cosmetic skins**; none surface *splits*,
    *route prominently*, or *pace zones* — the things that make a run card *earned* vs.
    generic. Strava's cards lead with the map; only `dark_minimal`/`photo_route` use the
    route here, and `RouteShape` falls back to a 🏃 emoji when there's no polyline (`:379-382`).
  - **P2 — Premium gating mid-celebration.** Tapping a locked skin opens a spend modal —
    fine, but there's no preview of the locked card before paying.
- **Redesign opportunities:**
  - Pass the just-finished run into Share via router state (no refetch).
  - Render/export at true 1080×1920; offer a 1:1 feed variant for Strava/Insta-feed.
  - Foreground the route map + splits on the "earned" templates.
  - Collapse `RunShareCard` and `CardTemplate` into one template system; reuse the PB-glow
    treatment from `RunShareCard.tsx:36-44,55-68`.
  - Add a download/share error toast.

---

## C. Reusable components inventory

These are the run-cluster components worth promoting into a shared design system:

| Component | File | Notes |
|---|---|---|
| **ProgressRing** | `run/ProgressRing.tsx` | Pace + zone + goal ring. Standardize, but unify its zone source with ZoneBar and make `goalDistance` a real prop, not a caller constant. |
| **ZoneBar** | `run/ZoneBar.tsx` | Live pace-vs-zone gauge. Good; drive from one zone source. |
| **SplitChart** | `run/SplitChart.tsx` | Animated per-km bar chart, fastest/slowest badges, legend. The best split viz in the app — use it in FINISHED, ANALYSIS, and Run Detail (currently only ANALYSIS). |
| **ZoneSplitChart** | `run/ZoneSplitChart.tsx` | **Orphaned.** Per-km pace line vs. target band with "X/Y in zone." Adopt for post-run + detail. |
| **RouteShape** | `share/RouteShape.tsx` | Polyline → normalized SVG path. Reuse as list-row thumbnails in History and as the route glyph everywhere. Parses `JSON.stringify(routeCoords)` written at `RunTrackerPage.tsx:263`. |
| **PaceChart** | `dashboard/PaceChart.tsx` | Canonical pace `AreaChart` w/ skeleton + empty. Make this *the* pace trend chart; retire ProgressPage's inline `LineChart`. |
| **CardTemplate / RunShareCard** | `SharePage.tsx:34`, `share/RunShareCard.tsx` | Consolidate into one share-card system with a template registry; lift the PB-glow + spring-badge treatment from `RunShareCard`. |
| **Score ring** | inline `RunTrackerPage.tsx:365-385` | Duplicated inline; promote to a shared `<ScoreRing value>` (also reused in `RunShareCard.tsx:94-117`). |
| Stat-tile (mono number + uppercase label) | repeated in every screen | The single most-duplicated pattern in the cluster (history rows, finished grid, analysis grid, every share template). Extract `<StatTile value label />`. |
| RPE selector | `RunTrackerPage.tsx:672-693` | Reusable emoji-scale input; pull out for any effort-logging. |

---

## D. Top 5 highest-impact changes for this tab

1. **Make live tracking survive a locked/backgrounded screen (P0).** Add `navigator.wakeLock`,
   persist in-progress run state to IndexedDB, and handle visibility changes. Today a pocketed
   phone silently under-records distance and time (`RunTrackerPage.tsx:127-157` timer + pace
   intervals; `watchPosition` at `:224`). Without this, the core promise — *accurately
   measure the run* — is broken. **Benefit: trustworthy run data; the app actually works as a tracker.**

2. **Build a Run Detail screen and make History rows tappable (P0/P1).** History is a dead
   ledger (`RunHistoryPage.tsx:81` non-interactive divs) and there's no detail route at all.
   A detail screen (map + `SplitChart` + `ZoneSplitChart` + RPE + Share) is the connective
   tissue the whole cluster is missing — it lets users re-view a run after the celebration and
   share from history. **Benefit: the run lifecycle becomes navigable instead of one-way.**

3. **Wire the Run section together with sub-navigation (P1).** Track / History / Progress all
   exist but are orphaned (`App.tsx:144-146`); the FAB only opens Track (`BottomNav.tsx:21`) and
   the analysis screen only links to Share + Dashboard (`RunTrackerPage.tsx:494-507`). Give the
   Run destination top tabs so the recorder, log, and trends live together.
   **Benefit: users can actually reach their own history and progress.**

4. **Fix the integrity of live + post-run data (P1).** (a) Remove or properly compute the fake
   calorie figure (`:612`); (b) unify the pace-zone source so ProgressRing and ZoneBar agree
   (the bar is hardcoded `375/405`, `:600-601`); (c) move the "AI analysis" off client-side
   heuristics (`:287-334`) onto the server coach engine. **Benefit: the numbers are real and
   self-consistent, protecting credibility — the foundation of a "provably faster" product.**

5. **Upgrade the post-run + share moment (P1/P2).** Lead the celebration with one headline
   achievement (PB / level-up / fastest-distance) instead of a long stack
   (`:430-491`); add confetti/haptic on a PB; pass the saved run directly into Share via router
   state instead of refetch+auto-select (`SharePage.tsx:436-440`); export cards at true
   1080×1920 and foreground the route+splits. **Benefit: a shareable, emotionally rewarding
   finish that drives retention and organic growth.**
