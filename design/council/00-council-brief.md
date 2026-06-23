# Sprint Society Redesign — Council Brief (READ FIRST)

You are one member of a UI/UX redesign **council** for Sprint Society, an AI-powered
run-club PWA (React + Vite + TS + Tailwind + Framer Motion, mobile-first, dark theme).
Your job in THIS phase: **deep-read the REAL code for your assigned cluster and produce a
feature-level UX teardown.** Do NOT build HTML mockups yet (visual direction not chosen).
Do NOT modify any app code.

## Product context
- North star: make runners *provably faster* + give the club a living community.
- Target bottom nav (LOCKED, 5 tabs): **Home · AI-Coach · Run (center) · Community · Events**.
  - Today's nav has only 4 (Home·Run·AI-Coach·Social). "Social" → becomes **Community**;
    **Events** gets promoted into the bar. Profile (top-left avatar) + Notifications
    (top-right bell) stay as top-bar icons, not tabs.
- Competitors to benchmark against: **Runna** (adaptive plans, friendly coaching),
  **Whoop** (recovery/strain rings, data storytelling, dark precision), **Gabit** (habits),
  **Garmin** (metric depth, training load), **Nike Run Club** (bold editorial, guided runs),
  **Strava** (social feed, kudos, segments, run cards).
- Current tokens: bg #09090B/#131316/#1E1E22; accent #F97316 (orange), gold #FBBF24,
  green #10B981; fonts Space Grotesk (head)/Inter (body)/JetBrains Mono (data);
  card radius 16. Mobile `max-w-lg`, fixed top bar + bottom nav.

## Design lenses to APPLY (installed skills — read their SKILL.md if useful)
Skills live in `/home/user/Sprint-Society/.claude/skills/`:
- `design-review/SKILL.md` — Nielsen's 10 heuristics + 6-dimension scoring. Use to grade each screen.
- `ux-designer/` references — accessibility (WCAG), microcopy, forms, onboarding, empty states.
- `taste/SKILL.md` — spot generic "AI-slop" patterns to kill.
- `ui-ux-pro-max/` — pattern/palette/UX-rule database. CLI: `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain ux` (also style/color/product/chart).
Apply them as analytical lenses; cite which heuristic/principle a problem violates.

## What to read
Read the FULL source of every file in your assigned list (use Read, not excerpts).
Trace child components and data sources (`api.get(...)`, react-query keys, props).
Stay within your cluster — don't redesign other tabs.

## Output (write ONE markdown file)
Write to `/home/user/Sprint-Society/design/council/<cluster>-teardown.md`.
Be concrete and cite `file:line`. Use THIS structure exactly:

```
# <Cluster> — Feature & UX Teardown

## A. Cluster IA recommendation
- What this tab should be; how sub-screens/sub-tabs should be organized post-redesign.
- Any features that should MOVE in or out of this tab (and where to).

## B. Screen-by-screen teardown
For EACH screen/sub-tab/major component:
### <Screen name> (`route` / `component path`)
- **Purpose:** one line.
- **Features & data:** every element shown, the data behind it, and its source (cite file:line).
- **States:** loading / empty / error / edge cases that exist (or are MISSING) — cite code.
- **Interactions & nav:** taps, modals, gestures, routes in/out.
- **UX problems (P0/P1/P2):** prioritized, each tagged with the heuristic/principle it breaks.
- **Redesign opportunities:** specific, competitor-informed moves.

## C. Reusable components inventory
- Components in this cluster worth standardizing into the design system (cards, rings, charts, list rows, etc.).

## D. Top 5 highest-impact changes for this tab
- Ranked, each with the expected user benefit.
```

Keep it tight and useful (~400–900 lines). Cite real code. Then STOP — no code changes, no HTML.
