# Design Preview Brief — port 3 pages onto the emergent `ss-base` design system

You are producing **standalone HTML mockups** (rendered to PNG for review) that show what each
page looks like rebuilt on the locked Sprint Society design system. Faithful to BOTH:
- **look** ⇐ the locked design system (`kit/ss-base.css`) + the Home reference
- **features** ⇐ the REAL page code on origin/main (paths below). Drop NO real feature.

## Files you MUST read first
- `audit/design-preview/kit/ss-base.css` — the design system (tokens, surfaces, components). SINGLE source of look.
- `audit/design-preview/kit/_shell.html` — the shared shell (aurora + status + topbar + floating glide-pill nav). Start from a copy of this.
- The real page source in the origin/main worktree at `audit/design-preview/main-src/…` (per-page paths below).

## HARD design gates (these are the locked council rules — violating any = fail)
1. **ZERO emoji.** The real code is full of emoji (🧬 📸 🏃 🔒 🔥 👟 ⚡ 🙌 💪 🫡 🎉 🏆). Replace EVERY one with a crafted inline SVG (stroke or Material-Symbols style, `viewBox="0 0 24 24"`) or a mono numeral. If you emit a single emoji character, you have failed.
2. **Compose from ss-base surfaces only.** Use `.tile`, `.tile.recess`, `.glass`, `.glass.recess`, or the alias `.ss-surface` / `.ss-surface.ss-recess` / `.ss-surface.ss-hero`. NO flat cards, NO `background:#xxx` boxes, NO bespoke card recipes. Every panel is liquid glass with the dual-edge `::before` ring.
3. **Sub-tabs = ONE segmented control** using the locked `.ss-segbar` + `.ss-segpill` (neutral frosted glide-pill on the active tab). NEVER a filled-orange tab button. The real Social page uses filled-orange `bg-accent text-white` tabs — that is WRONG, convert it.
4. **Palette discipline.** Neutral glass by default. Tint (orange/violet/green/amber) is SEMANTIC ONLY — status, deltas, the ONE primary button, the AI/coach violet surface. No decorative tints. Orange leads, violet = AI signal only. Never invent new hues (no raw indigo/purple/red-400/yellow-400 from the old code — map them onto tokens: violet, green, amber, `--accent`).
5. **Numbers are instruments.** Every metric uses `var(--mono)` (JetBrains Mono) with `font-variant-numeric:tabular-nums` and slashed zero. Use the `.num`/`.gnum`/`.tval` families.
6. **Type + tokens.** Headings `var(--head)` (Space Grotesk), body `var(--body)` (Inter). Only token colors (`--fg --muted --muted-2 --accent --violet --green --amber` etc.). Caps labels use `--lbl` size + `--trk-sm` tracking.
7. **Tags** use `.ss-tag` (low-alpha tint + hairline + hue TEXT), never a saturated fill. Buttons use `.ss-btn`/`.ss-btn-primary`/`.ss-btn-soft`/`.ss-btn-ghost`. Chips use `.ss-qchip`, deltas `.ss-dchip`.
8. **Nav:** keep the shared floating glide-pill nav from `_shell.html`. Set the correct active tab (move `<span class="f2-pill">` into the active `.f2-it` and give it `on` + `aria-current="page"`). Home→Home tab, Social→Community tab, Run→(none active; the Run FAB is the run entry, but this IS the run screen so leave nav as-is with no tab "on" OR mark none — keep the FAB).
9. Mobile-first, 390px column (the `.ss-screen` is `max-width:480px`, content gutter 16px via `.pad`). Realistic sample data (Indian names ok, e.g. Ishan; km/pace in metric; ₹ where money appears).
10. Fill the page with realistic content so the render looks like a real populated screen (NOT empty states, unless showing one deliberately). Include enough vertical content to feel complete.

## Output
Write a COMPLETE standalone HTML file (inline `<style>` for page-layout only; link `../kit/ss-base.css` for the system). It must render correctly opened directly in Chrome. Page-specific CSS = LAYOUT ONLY (grid/padding/height); never redefine tokens or re-author surface recipes.

---

## PAGE: HOME  → write to `audit/design-preview/pages/home.html`  (active nav tab: Home)
Real source: `main-src/client/src/components/dashboard/Dashboard.tsx` (+ its imports in `components/dashboard/`).
Active-user Home must include, top→bottom:
- **Greeting + stat strip**: "Evening, Ishan" + date; readiness chip (green dot + `78`), streak chip (flame SVG + `3`), level chip (`L1`). Use `.greet`/`.statstrip`/`.schip`.
- **Tier + Level bar**: tier tag (`beginner`/`intermediate`/`advanced` → use `.ss-tag` green/orange/amber-by-tier), a thin progress track (orange→amber gradient fill), `L1` mono label, and "120 XP to Level 2" subtext.
- **Today's Session** hero: use `.scard.today` treatment (or `.ss-surface.ss-hero`) — the readiness **gauge** (88px arc, `78`, "Primed" cap — copy the gauge markup + `#gaugeGrad` from shell), session title "Long Run — 5 km", sub "Conversational · bank base for Sub-270", 3 stat cells (Target 7:50/km, Distance 5.0km, Effort RPE 4), and a primary "Start run" button (`.ss-btn-primary`) + a ghost `+` button.
- **Stats row**: 3 recessed cells — Runs `24`, KM `186`, Best `4:52` (mono).
- **Pace trend** (PaceDotTrail): a small recessed tile with a pace sparkline/dot-trail across recent runs (violet target line ok).
- **Recent runs**: a `.tile.recess` list of 3 rows — icon, title + distance (mono), pace/time meta, a PR tag (`.ss-prtag`) on one. Reuse the `.run`/`.runico`/`.ri` pattern.
- **Athlete card**: compact identity tile — avatar, name, tier, level ring.
- **Challenges**: section head "Challenges" + "See all"; 1–2 challenge rows with progress (e.g. "Hydration streak 5/7").
Also show (smaller, secondary) that a **pending-profile nudge** exists — a violet AI surface (`.ss-ai`) "Complete your profile — unlock your AI coach, pace zones & training plan" with a chevron. (Real app shows this when profile incomplete.)

## PAGE: SOCIAL  → write to `audit/design-preview/pages/social.html`  (active nav tab: Community)
Real source: `main-src/client/src/pages/SocialPage.tsx`, `components/social/FeedTab.tsx`, `CommunitiesTab.tsx`, `RunCard.tsx`.
- **Sub-tabs**: `Feed` · `Communities` as ONE `.ss-segbar` (Feed active). NOT filled-orange buttons.
- **Feed tab** (show active): 3 activity cards on `.tile`/`.glass`:
  - avatar (initials fallback tile), runner name (e.g. "Priya S", "Arjun M", "Ishan V"), time-ago ("2h ago"), a streak marker (flame SVG + `12` in `--accent`, NOT emoji).
  - a run line: distance + pace + time as mono metrics; optional caption text.
  - a stats row "Kudos" / "Comments" counts.
  - **Reactions**: the real code uses emoji 🙌🔥💪⚡🫡 — replace with 5 crafted mono SVG reaction glyphs in a neutral chip row, plus a kudos count.
- Include the empty-state pattern once conceptually is NOT needed — show the POPULATED feed.
- (Communities tab is not the active view but keep the segbar correct.)

## PAGE: RUN (IDLE / ready state)  → write to `audit/design-preview/pages/run.html`  (nav: keep FAB; no tab "on")
Real source: `main-src/client/src/pages/RunTrackerPage.tsx` (states IDLE / RUNNING / PAUSED / FINISHED / ANALYSIS).
Show the **IDLE "Ready to Run"** screen (what the user sees first), rebuilt premium:
- A map preview area (200px) — render as a recessed glass panel with a stylized route line + a "you are here" dot (SVG; do NOT try to load real map tiles). Small "GPS ready" status chip (green dot).
- Centered hero: heading "Ready to Run" (`var(--head)`), sub "GPS will track your route, pace & distance".
- A big circular **START** control — orange gradient disc (reuse the `.f2-fab` gradient/shadow language but larger, ~120px), "START" label.
- Below: a preview of **target pace zone** ("Easy 6:15–6:45 /km" from pace zones) as a recessed tile, and the **today's session context** ("Long Run · 5 km" pulled from plan) so the runner knows what they're about to do.
- Keep it calm and focused (this is a pre-run screen) but on-system (aurora, glass, mono metrics).
- Also add a small secondary row of recessed stat cells showing last-run quick context (Last run 5.2km · 2 days ago) so the screen isn't sparse.

Remember: every panel = liquid glass, every number = mono, ZERO emoji, one segmented control, semantic tint only.
