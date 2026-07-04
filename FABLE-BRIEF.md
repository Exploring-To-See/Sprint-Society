# FABLE-BRIEF — Redesign the Sprint Society frontend onto the `ss-base` system

You are Fable 5, taking over frontend design for **Sprint Society**
(repo: `github.com/Exploring-To-See/Sprint-Society`). This branch was cut from
`main`, so you have the **full app** here: the React frontend (`client/`), the
backend (`server/`, `api/`), the shared types (`shared/`), and complete git history.

A tool called **emergent** previously redesigned ONE part of this app (the AI Coach)
and merged it to `main`, creating a reusable design system on the way. **Your job is
to finish that redesign** — apply the same design system to every remaining page —
and open a PR back to `main`, the same way emergent's work landed.

> ⚠️ Do NOT trust this brief blindly. Verify every claim below from git and the files
> (read before you write). If something here contradicts the actual code, the code wins.

---

## STEP 1 — Study what emergent did (learn the pattern)

Emergent authored these commits on `main` (verify): `fffc00d`, `88171c0`, `60d185c`.
It **created a reusable design kit** and applied it to only 4 pages.

Read and internalize, in this order:
1. **The design system** — `client/src/styles/ss-base.css` (tokens, liquid-glass
   surfaces, glide-pill nav, gauges, all `ss-*` classes). This is the single source
   of the look. Do not redefine its tokens.
2. **The kit primitives** — `client/src/components/ss/` (`SSScreen`, `SSSeg`, `SSNav`,
   `SSAura`, `SSStates`, `Gauge`, `icons`). These are your building blocks.
3. **The reference page** — `client/src/pages/CoachPage.tsx` + `client/src/components/
   coach/` (CoachChat/Insights/Plan/Records/Zones). This shows exactly how a real page
   composes the kit + wires real data. Copy this pattern.
4. **The emergent design branch** — `git show --stat origin/Emergent-designs` and
   `git diff origin/main origin/Emergent-designs -- client/src`. This is emergent's
   own design branch; study how it structured the redesign.

Confirm which pages already use the kit (everything else is the gap you're filling):
```
git grep -l "components/ss/\|ss-base" -- client/src
```

## STEP 2 — Study what we (the prior agent) prepared for you

The folder **`design-reference/`** (in this branch, at repo root) is a full preview of
the INTENDED redesign of every remaining page, on the ss-base system. It is a
**design reference, not code to ship** — it may contain layout bugs (that's expected;
that's why the work is coming to you). Read:
- `design-reference/preview-app/HANDOVER.md` — page→file mapping + the design gates.
- `design-reference/preview-app/GAP-REPORT.md` — **every route: old vs new design +
  which backend features exist but have no UI yet.** Read this first.
- `design-reference/preview-app/templates/pages/*.html` — layout + ss-base usage per
  page (Flask/Jinja — treat as spec, not code).
- `design-reference/design-preview/pages/{home,social,run}.html` — highest-fidelity
  standalone mockups.

**Fidelity:** use these as a **strong guide** — match the layout and ss-base usage
closely, but **fix obvious bugs and improve where clearly better**. When a reference
looks wrong, trust the ss/ kit + the real page's actual features over the reference.

## STEP 3 — What to build

Redesign **every page still on the old design** onto emergent's `ss/` kit + ss-base.css,
in **real React/TS** (reimplement — do not paste the Jinja/HTML). Work **one page at a
time**. For each page: read the real `.tsx` and its API calls FIRST, preserve every
real feature and data hook (drop nothing), then rebuild the UI on the kit.

**Scope = all remaining old pages** (see GAP-REPORT.md), roughly:
Home/Dashboard, Social, Events, Run, Communities (+ detail), Event detail, Runner
profile, Progress, Run history, Challenges, Rewards, Notifications, Subscription,
Profile, Share, onboarding (AI profiling / AI profile / Set goal), Admin.

**Also (allowed):** where GAP-REPORT.md lists a backend feature that exists but has
**no UI yet** (e.g. wellness logging, HRV, social graph lists, events my/nearby,
progress monthly/all-time, gamification leaderboard/history, LT test, subscription
upgrade/history), you MAY add the UI for it — consuming the EXISTING backend routes
only. Verify the route + its response fields in `server/src/routes/` before wiring;
do not invent endpoints.

**AI Coach cluster (Coach/Plan/Heart-rate/Records):** already redesigned & live. You
MAY polish/refine these for consistency with the rest — but they are working, shipped
pages, so change them conservatively and keep every feature.

### Locked design gates (emergent's rules — non-negotiable)
1. **ZERO emoji** — crafted inline SVG / the `ss` icon set only.
2. Every panel = an ss-base **liquid-glass surface** (`SSScreen`/`SSSeg` + `.tile` /
   `.ss-surface` recipes). No flat cards, no bespoke card styles.
3. Sub-tabs = **ONE segmented glide-pill** (`SSSeg`), never filled-color tab buttons.
4. **Neutral glass by default; tint is SEMANTIC only** (status / delta / primary / AI).
   Orange leads; **violet = AI signal only**.
5. **Metrics are mono instruments** (JetBrains Mono, tabular-nums, slashed zero).
6. **Tokens only** for color/type (the `:root` vars in ss-base.css). Mobile-first, 375px.

### Boundaries
- **Frontend + missing-UI wiring only.** Do NOT change `server/`, `api/`, API
  contracts, route shapes, or data models. Consume existing endpoints as-is.
- Suggested order (highest visible impact first): Home → Social → Run → Events →
  Communities → then the rest. Match the page→file table in HANDOVER.md.

## STEP 4 — Verify EACH page before committing (hard gate)
For every page you finish:
1. `cd client && npm run build` and typecheck — must stay **green**.
2. **Run the app against the real backend** and click the page: confirm it loads,
   shows live data, sub-tabs switch, nav works, no console errors. (Backend is in this
   branch — start it per the repo README; frontend talks to it via `/api`, or set
   `VITE_API_URL`.)
3. Only then commit — **one commit per page**, clear message
   (e.g. `design(social): rebuild SocialPage on ss-base`).

## STEP 5 — Hand back
- **Do NOT commit the `design-reference/` folder.** It was only for you. Keep it out of
  every commit so `main` ships only real React code. (Add it to `.git/info/exclude` or
  simply never `git add` it.)
- Push your branch and **open a PR to `main`** (this branch is cut from main, so the
  merge is clean). Title it clearly; in the PR body, list which pages you redesigned,
  which missing-UI features you wired, and anything you were unsure about.
- Never touch the backend. Never commit secrets or `.env`.

**Goal:** `main` ends up with the whole app on one consistent design system — the
redesign emergent started, finished by you, merged smoothly via PR.
