# Sprint Society — Design V1 Production Polish — PRD

## Original problem statement
Finish Sprint Society (AI-powered run-club mobile web app; React 18 + Vite + TS + Tailwind +
Framer Motion; Express + Supabase/Postgres). Implement/redesign EVERY page to production quality
against a LOCKED design language: `docs/design-v1/sprint-society-home.html` (sealed Home) +
`ss-base.css` (design system) + UI-UX-V1 gates §13–§18 + FEATURE-MAP-V1. Parity (data/behavior)
comes from the real code; look comes entirely from Home + ss-base. Hard gates: zero emoji, one
orange primary per surface, violet = AI only, neutral-glass chrome, liquid-glass surfaces, one
segmented control for sub-tabs, mono tabular metrics, one living centerpiece per screen,
reduced-motion safe, Glide-Pill nav, 390px mobile-first, full loading/empty/error states.

## User decisions (June 2026)
1. Sequence: **AI Coach cluster first** (Plan/Insights/Zones/Records; Chat is the bar), then Run, then rest.
2. Reference: use the existing main-branch frontend code for features/data (no coach-chat-v2.html provided).
3. Data: focus on **frontend visual fidelity** against existing data shapes — no live DB required.
4. Stack stays Vite/Express/Supabase (no migration to FastAPI/Mongo).

## Environment / run notes
- App lives in `/app/client` (Vite, port 3000 here) + `/app/server` (Express, not run — no DB).
- Vite dev server is started manually on port 3000 (`--host 0.0.0.0`); `vite.config.ts` has
  `allowedHosts: true` so the preview URL serves it. Supervisor's default frontend/backend
  programs are unused (FATAL) for this app.
- Verification: Playwright screenshots against the preview URL with `page.route('**/api/**')`
  mocking + a localStorage token to bypass auth (no backend in this env).

## Architecture added (shared design kit — reuse everywhere)
`client/src/styles/ss-base.css` — locked design system, adapted for the live app (mockup-frame
rules replaced by `.ss-screen`/`.ss-aura`; fixed Glide-Pill nav; sticky `.ss-topbar`; helper
classes: `.ss-segbar/.ss-segtab/.ss-segpill`, `.ss-navpill`, `.ss-input`, `.ss-typing`,
`.ss-skel`, `.ss-rise`, `.ss-dchip.neutral`). Imported in `main.tsx`.

`client/src/components/ss/` — `SSScreen` (aurora+chrome+nav shell), `SSAura`, `SSNav`,
`SSSeg` (segmented sub-tabs, Motion shared-layout pill), `Gauge` (readiness orb),
`SSStates` (SSSkeleton/SSEmpty/SSError), `icons.tsx` (crafted inline SVG; nav outline→fill).

`PageTransition` changed to opacity-only (a `y` transform was breaking `position:fixed` chrome).

## Implemented (verified via screenshots, June 30 2026)
- **AI Coach `/coach`** — one segmented control: Chat · Plan · Insights · Zones · Records.
  - Chat → real chat (history/suggestions/balance/send/deep-dive), neutral-glass bubbles, violet AI orb, typing dots, empty prompts, orange send.
  - Plan → goal header + week strip (segmented, status dots) + day detail + pre/post brief + Start-run; wired to /training/week,/training/plan,/goals,/insights/pre-run.
  - Insights → **readiness orb centerpiece** + metric bento + race predictions + pace trajectory; /coach/insights + /training/readiness.
  - Zones → 5 HR zones (zone palette only in chart bars) + key stats + cardiac trend; /heartrate/zones,/heartrate/trends.
  - Records → hero PR + race/effort PRs + PR timeline; /records,/records/timeline.
- **Standalone**: `/plan` (full week-by-week timeline to race day), `/heart-rate`, `/records` — reuse the Coach content inside `SSScreen`.
- Gates checked on the cluster: 0 emoji, 0 banned hues, orange-only primary, neutral glass, mono numerals, one segmented control, reduced-motion safe. `tsc -b` + `vite build` pass clean.

## Backlog (P0 next → page-by-page, same method + ss/ kit)
- P0 Run: track (idle/running/paused/finished/analysis), run detail (+loading/notfound), run history (+empty/loading), progress (stats/journey/empty/loading), heart-rate live.
- P1 Events: list, map (+empty), event detail (upcoming/live/completed/notfound), empty/loading.
- P1 Social/Community; Profile/Account; Goals.
- P2 Share/run-cards; Auth/Landing/Onboarding; Admin.
- Cross-cutting: migrate remaining pages off pre-V1 styling (they still contain emoji); redesign shared modals (e.g. KenduSpendConfirmModal) to ss surfaces.

## Notes / not done
- No automated testing-agent run (no backend/DB in this env per user choice c); verification is
  screenshot-based with mocked APIs. Server routes were read, not executed.
