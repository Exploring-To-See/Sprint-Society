# Design Reference — for emergent

This folder is a **design reference**, not production code. It shows the *intended*
redesign of every Sprint Society page on the locked `ss-base` design system, so you
(emergent) can port these into the real React app in `../client/` — the same way the
AI Coach cluster was built.

> ⚠️ These are **references, not finished code.** They were built quickly and may
> contain layout bugs, spacing issues, or imperfect data wiring. That's expected —
> use them for **intent, structure, and design-system usage**, then rebuild properly
> in React. Where a reference looks wrong, trust the design system + the real page's
> features over the reference.

## What's here

### `preview-app/` — a Flask + Jinja preview of the whole app
A Node-free, server-rendered replica (Python) so the redesign could be clicked through
without a build step. **It is NOT React** — treat the templates as design/layout specs.
- `templates/pages/*.html` — one page each, on `ss-base`. Layout + which ss-base
  surfaces/components each page should use.
- `templates/base.html` — the shared shell (aurora + top bar + floating glide-pill nav).
- `templates/partials/ui.html` — crafted **inline SVG icon set** (ZERO emoji) + macros.
- `templates/partials/nav.html` — the glide-pill bottom nav markup.
- `static/css/ss-base.css` — the locked design system (verbatim copy of the one in
  `../client/src/styles/ss-base.css`).
- `seed.py` — realistic sample data shaped to the real API fields (what each page shows).
- `GAP-REPORT.md` — **every route: old vs new design + coverage.** Read this first.
- `BUILD-GUIDE.md` — the exact design rules used (the gates below).

### `design-preview/` — standalone HTML mockups (highest-fidelity references)
- `pages/home.html`, `social.html`, `run.html` — the most-polished single-file mockups.
- `kit/ss-base.css`, `kit/_shell.html` — the system + shell used to render them.
- `BRIEF.md` — the per-page design brief.

## The locked design gates (match these when you rebuild in React)
1. **ZERO emoji** — crafted inline SVG or Material-Symbols only (see `ui.html`).
2. Every panel = an **ss-base liquid-glass surface** (`.tile` / `.tile.recess` /
   `.ss-surface` + `.ss-recess`/`.ss-hero`). No flat cards.
3. Sub-tabs = **one segmented glide-pill** (`.ss-segbar` + `.ss-segpill`), never
   filled-orange tab buttons.
4. **Neutral glass by default; tint is semantic only** (status/delta/primary/AI).
   Orange leads; **violet = AI signal only**.
5. **Metrics are mono instruments** — JetBrains Mono, tabular-nums, slashed zero.
6. Tokens only for color/type (see `:root` in `ss-base.css`).

## How pages map (reference → real React page)
| Reference template | Real page to enhance |
|--------------------|----------------------|
| `home.html` | `client/src/pages/DashboardPage.tsx` (+ `components/dashboard/`) |
| `social.html` | `client/src/pages/SocialPage.tsx` (+ `components/social/`) |
| `run.html` | `client/src/pages/RunTrackerPage.tsx` |
| `events.html` | `client/src/pages/EventsPage.tsx` |
| `communities.html` / `community_detail.html` | `CommunitiesPage.tsx` / `CommunityDetailPage.tsx` |
| `progress.html` / `runs.html` / `challenges.html` / `rewards.html` | matching pages |
| `subscription.html` / `profile.html` / `notifications.html` | matching pages |
| `profiling.html` / `ai_profile.html` / `set_goal.html` | onboarding pages |
| `admin.html` | `AdminPage.tsx` |
| `coach/plan/heart_rate/records` | **already redesigned & live — reference only** |

**Goal:** enhance/fix the real React pages in `../client/` to match this intended
design, then push back to GitHub — exactly like the AI Coach flow.
