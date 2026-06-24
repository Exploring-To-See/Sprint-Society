---
name: sprint-ux-council
description: Sprint Society's UX council-in-a-loop — the end-to-end workflow for enhancing the UI/UX of any app screen to premium, glanceable, accessible quality. Use to redesign or audit any Sprint Society screen (home, coach, run, social, events, profile, etc.), to roll the locked design language across the app, or to run iterative multi-lens design passes. Spawns specialist lenses (taste, motion, depth, UX, a11y, data-viz) as council members and loops them with hard quality gates. Triggers on "redesign", "UX overhaul", "make this premium", "roll the design across", "enhance the UI/UX", "run the design council".
---

# Sprint Society — UX Council in a Loop

The proven workflow that took the Home screen from generic to a 9.4-rated premium cockpit.
Apply it to every screen of the app. This skill is the **process**; `mobile-ux-density`
governs **information design**; the premium spec governs **surface/visual language**.

## The council (members = skills + agents, each a lens)
Run these as the reviewing/building lenses — invoke the skill, apply it, then build:
- **`taste` + `ui-ux-pro-max` + `ui-ux-design-pro`** — visual hierarchy, anti-slop, one focal point, type/spacing/color discipline.
- **`mobile-ux-density`** — information architecture: pairing, toggles, glanceable hero, action-per-surface, header status, rails.
- **`transitions-dev`** — purposeful motion, tactile press, one-time draws, reduced-motion.
- **`frontend-design` + `taste-redesign`** — depth, liquid-glass material, realistic light.
- **`ux-designer` + `design-review`** — Nielsen heuristics, ARIA/a11y, contrast, keyboard, focus.
Builder agent: **`frontend-lead`**. Orchestrate/gate with the parent session (or `council-lead`).

## The locked design language (never re-litigate — fork it)
Reference `design/ux-handoff/00-home-keystone-C6.html` and `design/directions/premium/_PREMIUM-SPEC.md`:
- Sculpted **violet+orange aurora** field (mesh + sweep + god-ray + fine grain), transform-only drift.
- **Liquid-glass** tiles: backdrop blur+saturate, dual-edge refraction, inset highlight; **3 depth planes** (hero closest → trend mid → wells deepest) via a lightness ladder, not shadow soup.
- **One accent ~10%** (orange = action, violet = AI signature). **Mono `tabular-nums`** on every metric. **≤4 type sizes / 2 weights.** Depth from light + hairlines, never glow.
- **Locked 5-tab nav** verbatim (Home / AI Coach / center FAB / Community / Events).
- **AI disclosure**: any AI-authored content carries an "AI" badge + first-person coach voice.
- Metrics become **data-viz** (gauge, curve, bars, ring, pips), not prose. Values stay honest.

## NON-NEGOTIABLE gates (every screen, every pass — verify each)
1. **Renders with NO JavaScript.** Content is never gated behind a JS-added class. Entrance
   runs on CSS load (`animation-fill-mode:both`); interactivity (toggles) via `:checked`/CSS.
   *(This bit us once: JS-gated reveal left the screen blank in previews. Never again.)*
2. **`backdrop-blur` only on static glass tiles + fixed chrome — NEVER the scroll container.**
3. **One persistent loop only** (the aurora). No per-element pulse/breathe loops.
4. **`prefers-reduced-motion`** kills all motion and pins every element to its final state.
5. **375px / 390px: zero horizontal scroll**, ≥44px targets, `min-h:100dvh`, labels nowrap,
   primary action in the thumb zone. Mobile collapses to a **2-col bento, not 1 column**.
6. **Honest data**, loading + error states, real ARIA, keyboard navigable.

## The 5-lens enhancement loop (per screen)
Run lenses in order, one per pass; each pass builds (frontend-lead + that lens), then the
orchestrator QAs the gates, commits, and advances. Each pass ADDS craft, never churns:
1. **Taste & hierarchy** — one focal point, type/spacing/accent lock.
2. **Motion & micro-interactions** — entrance cascade, one-time draws, tactile press.
3. **Depth & material** — glass refraction, lightness ladder, realistic light.
4. **UX heuristics & a11y** — landmarks, ARIA on viz, AA contrast, focus, 44px.
5. **Data-viz polish** — honest encoding, cross-viz consistency, legibility.
Before the loop, do an **information-design pass** with `mobile-ux-density`: pair atomic stats
into halves, collapse range-variants into toggles, lift status into the header, give each
surface an action, ensure one dominant glance and ~1.5-screen height.

## Variant → synthesis method (when direction is open)
Build 2–3 distinct organizing ideas as separate files (parallel `frontend-lead` agents, different
files = safe to parallelize), each using the full council. Then synthesize the winners. The Home
synthesis target: **UX-A's paired-bento grid + UX-B's segmented trend toggle + UX-C's Today/Up-Next rail**
(rail → hero/coach → toggled trend → paired atomics).

## Rollout across the app (order)
Foundation first (design tokens, aurora layer, glass utilities, bottom nav as shared React/Tailwind),
then the 5 core nav screens, then secondary:
1. `/dashboard` `DashboardPage.tsx` (Home keystone) → `/coach` `CoachPage.tsx` → `/run/track`
   `RunTrackerPage.tsx` → `/social` `SocialPage.tsx` → `/events` `EventsPage.tsx`.
2. Secondary: Plan, Progress, RunHistory, Records, HRZones, Challenges, Rewards, Notifications,
   Profile, Subscription, Communities, SetGoal, AIProfile, Share.
Per screen: information-design pass → 5-lens loop → typecheck/test/build green → update
`docs/USER-GUIDE.md` + `docs/PM-GUIDE.md`. When porting to React, keep first paint SSR/hydration-safe
(never blank if a script is slow) — the no-JS-render gate applies to the real app too.

## How to run it
"Run the UX council loop on <screen>": load this skill, do the info-design pass, then loop the
5 lenses with `frontend-lead`, gating each pass on the NON-NEGOTIABLE gates, committing per pass.
Keep the locked language; this skill changes structure & craft, not the brand surface.
