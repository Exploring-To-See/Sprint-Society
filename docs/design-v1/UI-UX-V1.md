# Sprint Society — UI/UX Design System **V1**

> **Status:** LOCKED baseline. This document is the single source of truth for the
> visual language and the Home screen as built in `sprint-society-home.html`.
> All redesigned pages (AI Coach, Run, Events, Communities, Profile) MUST conform
> to the tokens, components, and rules below. Send this + the HTML for UI/UX audit.
>
> **Reference file:** `C:\Projects\S\sprint-society-home.html` (Home, final)
> **Lineage:** C6 Bento-Depth keystone → UX-A Paired Bento (dominant) + UX-B Trends
> toggle + UX-C coach/forward-motion framing + App Store editorial energy.
> **Date:** 2026-06-25 · **Owner:** Ishan / Kendu Entertainment

---

## 0. Non-negotiable principles (the locks)

1. **One accent.** Orange (`--accent #F97316`) is the single brand accent; violet
   (`--violet #7C6BF0`) is the AI/secondary signal only. Never introduce a third hue
   as an accent. Status colors (green/amber/red) are semantic, not brand.
2. **Mono tabular metrics.** Every number a user reads (pace, distance, XP, %, bpm,
   time) is `JetBrains Mono` with `font-variant-numeric: tabular-nums`. No exceptions.
3. **Liquid glass + depth planes.** Surfaces are frosted glass with a dual-edge
   refraction ring (bright top-left light, dark bottom-right bevel). Importance maps
   to depth: hero floats (brightest), recess tiles sink (darkest well).
4. **Sculpted aurora field.** A single animated violet+orange mesh + conic sweep +
   god-ray + film grain sits behind everything. ONE drift loop. Transform/opacity only.
5. **375/390px mobile-first.** Designed at 390px device width. The 2-col paired bento
   HOLDS at phone width — never lazily collapses to one column.
6. **Locked 5-tab nav.** Home · AI Coach · **Run (center FAB)** · Community · Events.
   This is verbatim and identical on every page. Do not add/remove/reorder tabs.
7. **Reduced-motion = final resting state.** `prefers-reduced-motion:reduce` kills all
   motion and pins every element to its end value. Content NEVER depends on motion.
8. **No JavaScript for presentation.** Mockups render with pure CSS (scroll-snap
   carousels, `:checked`-driven toggles, CSS entrance). JS is only added when wiring
   into the real React app, and never to reveal content.
9. **Accessibility floor.** ≥44px tap targets, semantic roles, `aria-label`s on every
   control and data viz, visible focus rings, WCAG AA contrast on glass.

---

## 1. Design tokens (`:root`) — copy verbatim into every page

### Color
```
--bg:#08080F;        --bg2:#0B0A16;       /* device background, gradient top */
--glass:rgba(255,255,255,.045);           /* default glass fill */
--glass-2:rgba(255,255,255,.07);
--hair:rgba(255,255,255,.09);             /* hairline borders */
--fg:#F4F4F8;        --muted:#9A9CB0;     --muted-2:#86899E;  /* text tiers */
--accent:#F97316;    --accent-2:#FB923C;  /* brand orange + light */
--violet:#7C6BF0;    --violet-2:#A78BFA;  /* AI / secondary */
--green:#34D399;     --amber:#FBBF24;     /* positive / streak */
```
HR-zone palette (charts only): Z1 `#60A5FA` · Z2 `#34D399` · Z3 `#FBBF24` ·
Z4 `#FB923C` · Z5 `#F87171`.

### Type
```
--head:'Space Grotesk',sans-serif;   /* headings, tile labels, buttons */
--body:'Inter',sans-serif;           /* prose, captions */
--mono:'JetBrains Mono',monospace;   /* ALL metrics, tabular-nums */
```
Type scale (locked, 4 metric steps + 1 label step):
```
--m-hero:26px;  /* the single hero number (readiness gauge) */
--m-lg:19px;    /* primary tile metric */
--m-md:15px;    /* secondary metric */
--lbl:9.5px;    /* every uppercase caps label */
--trk:.07em;    /* caps-label letter-spacing — one value everywhere */
```
Section/club card titles use 22px Space Grotesk 600, `-.02em`.

### Motion
```
--ease:cubic-bezier(0.16,1,0.3,1);          /* standard entrance/draw */
--ease-pop:cubic-bezier(0.34,1.45,0.64,1);  /* number/pip pops (gentle overshoot) */
--ease-pill:cubic-bezier(0.22,1,0.36,1);    /* segmented toggle pill slide */
--stag:38ms;        /* per-tile cascade offset */
--press:.97;        /* tactile :active scale */
--press-dur:120ms;  /* press settle ≤120ms */
```

### Spacing / radius
- Bento gap: `--gap:11px` (tightens to 10px ≤430px).
- Body padding: `10px 0 96px` (96px clears the nav). Horizontal gutter `.pad{padding:0 16px}`.
- Radii: device 46px · hero/featured cards 22px · standard tile 18px · inner chips 8–14px · pills 9–14px.

---

## 2. Surface system (liquid glass + depth)

| Surface | Use | Recipe |
|---|---|---|
| **Hero / featured** | Today session card, the one dominant glance | `blur(26px) saturate(165%)`, orange→violet→white gradient, border `rgba(255,255,255,.16)`, brightest top-light inset + soft realistic drop shadow. Floats. |
| **Standard tile** (`.tile`) | Coach, default surfaces | `blur(18px) saturate(150%)`, `--glass` fill, dual-edge `::before` ring. |
| **Recess tile** (`.recess`) | Trends, Level, Streak, Recent, up-next cards | `blur(16px) saturate(135%)`, darker `.022` fill, strong inset shadow → sunk well. |
| **Nav glass** | Bottom nav only | `rgba(11,10,22,.6)` + `blur(22px)`, top hairline. |

**Dual-edge refraction** (`::before`, masked to a 1px ring): bright top-left light →
transparent → dark bottom-right bevel. Hero ring is crispest; recess ring is softer.
**Recess `::after`**: faint top-down radial darkening to deepen the well.

Backdrop-blur lives ONLY on static tiles + fixed chrome — never on a scroll container.

---

## 3. The aurora field (decorative, `aria-hidden`)

Five stacked layers inside `.aurora` (z-index 0), plus a `.veil` depth lens:
1. `.mesh` — 4-stop radial mesh (violet top-right, orange left, violet-2 bottom-right, accent-2 bottom-left), `blur(8px)`, 14s drift.
2. `.sweep` — conic sheen, `blur(30px)`, 18s drift.
3. `.ray` — single violet god-ray descending from top-right, `blur(22px)`, 16s drift.
4. `.vignette` — edge falloff so the field reads as a lit volume.
5. `.grain` — tiled SVG `feTurbulence` film grain, opacity .035, `mix-blend:overlay`, no motion.

All three drift loops are killed under reduced-motion.

---

## 4. Chrome (identical on every page)

- **Status bar** (`.status`): faux `9:41` + battery, `aria-hidden`. 50px.
- **Top bar** (`.topbar`): brand wordmark `**Sprint** Society` (orange→violet gradient on
  "Sprint") · notification bell with count badge (≥44px hit-area) · avatar `IV`.
- **Greeting + status strip** (`.greet`): "Evening, Ishan" + "Tue · 23 June" on the left;
  on the right a compact 3-chip strip — readiness dot **78** · 🔥 streak **3** · **L1**.
  These ride the header so they never spend a tile (density rule #6).

---

## 5. Locked bottom nav (verbatim) — "Glide Pill" floating capsule

```
        ╭───────────────────────────────╮
        │  ⌂      ✦     (●)      ◐     ▦  │   ← floating glass capsule
        ╰───────────────────────────────╯       (Run FAB crowns the center)
          Home  AICoach  Run  Community Events
```
Council-selected (the "Glide Pill" direction, WhatsApp pill + Instagram outline→fill on an
iOS-26 floating glass capsule), refined for restraint, finalized **icon-only**. Built on Home
as `.f2-*`; reference impl in `sprint-society-home-v3.html`.

- **Floating capsule, not a full-bleed bar.** Detached on all edges (`left/right:14px`,
  `bottom:20px`, height 60px, radius 26px), hovering over the aurora via the TRUE locked nav
  glass recipe (`rgba(11,10,22,.6)` + `blur(22px) saturate(140%)`) + a 1px dual-edge refraction
  ring + a real soft drop shadow. Glass blur stays in the 18–24px family (never inflated).
- **5 items, verbatim & in order:** Home · AI Coach · Run (center) · Community · Events. The
  four tabs are **icon-only** (no text labels). A fixed 64px center slot holds the raised
  circular **Run FAB** (orange gradient, 4px `--bg2` border) crowning the capsule — the one
  warm anchor; "Run" is the only caption in the nav.
- **EXACTLY ONE active signal:** a single orange-tinted glass pill (`rgba(249,115,22,.14)` +
  hairline orange edge + faint inner glow) behind the active icon, AND the active icon swaps
  thin outline → filled glyph (`--accent-2`). No underline, no tick, no light-well, no second
  signal. Inactive icons are `--muted-2` outline.
- **Motion:** one-shot entrance only (capsule rise, FAB pop, pill draw-in). **No idle/ambient
  loops** in the nav. Press = `scale(.92)` ≤120ms. `prefers-reduced-motion` resolves everything
  to the lit static state.
- **A11y:** each tab ≥44px hit target, `aria-current="page"` + `aria-label` on the active tab,
  focus rings hug each control (rounded-rect inset for tabs, circle for FAB).
- **Icons (locked):** **Material Symbols Rounded** (filled), real production glyphs imported via
  `@iconify/react` / `@iconify-json/material-symbols` (Apache-2.0). Home = `home-rounded` ·
  AI Coach = `auto-awesome-rounded` (sparkle) · Community = `groups-rounded` · Events =
  `calendar-month-rounded` · Run = `directions-run-rounded` (white on the FAB). Solid family:
  inactive = `--muted-2` glyph, active = `--accent-2` (orange) glyph — the recolor IS the swap
  (no separate outline variant needed). Do NOT hand-draw nav icons.
- **React tier (see §12.2/§12.3):** the pill becomes a `motion` shared-layout element
  (`layoutId="navPill"`) that FLIP-glides between tabs on route change; capsule may shrink/
  minimize on scroll-down (iOS-26 behavior). Both degrade to this static CSS.

---

## 6. Component library (built & locked on Home)

### 6.1 Session Carousel (hero) — `.carousel` / `.ctrack` / `.scard`
- **Full-size swipeable cards.** Each card = full content width (`390 − 32 − 12`), so one
  shows with the next peeking ~10px. CSS `scroll-snap-type:x mandatory`, edge spacers for
  the 16px gutter. NO JS.
- **Cards:** `Today` (featured/floating glass) + `Tomorrow` + `Thursday` (recess wells).
  All three are BIG (same footprint) — up-next cards are NOT shrunk.
- **Card anatomy:** header (icon · `Today · Base phase · W1/16` · status tag) → readiness
  gauge + session info (title, sub, 3 stat chips: Target/Distance/Effort) → CTA row.
- **Today CTA:** `Start run` (primary) + ghost detail `+`. **Up-next CTA:** `View plan`
  (soft) + ghost reschedule (clock).
- **Readiness gauge (the ONE signature, de-sunned final):** 88px radial, `gaugeGrad` **brand
  orange** stroke (`#F97316→#FB923C→#FBBF24`) with a soft orange arc bloom (`drop-shadow`),
  number inside (`78` / "Primed", green semantic caption), draws once on entrance, then ONE
  gentle breath (`gbreath`, ~4.6s, Today only). **No radiating tick register, no glow blob behind
  the number** (removed — read as a "sun"). Up-next gauges use a muted violet "plan" variant
  (Easy/Recover, Hard/Speed) — inert, no fake live readiness. This is Home's single idle loop;
  every other screen gets its own one living centerpiece, never a second idle loop on the same screen.
- **Swipe affordance (low-key):** floating quiet chevrons `‹` (`.cprev`) and `›`
  (`.cnext`) on both edges, 34px frosted circles, opacity .7→1 on hover. Plus 3 dot
  indicators (`.cdots`) below, first active (pill-elongated). Pure visual cue.

### 6.2 Coach tile — `.nudge`
- Violet AI signature surface. Header: gradient sparkle icon · "Your Coach" · `AI` badge
  (disclosure, always present).
- **Benefit-led headline** ("Bank base for **Sub-270**") → why line (readiness/pace,
  bold metrics) → **RPE selector**: 4 big tappable chips `2 Easy / 4 Steady / 6 Mod /
  8 Hard`, today's pick highlighted violet. "Why this? ›" progressive-disclosure link.

### 6.3 Trends tile — `.trends` (pure-CSS segmented toggle)
- ONE tile, THREE jobs: **Pace / Load / HR** segmented control replaces 3 chart tiles.
- 3 hidden radios drive: which readout shows (big value + sub + delta chip), the sliding
  pill position, and which chart panel renders. **Pace default-checked. NO JS.**
- **Pace** = green SVG curve + dashed `7:50` violet target line + end dot (faster plots
  higher). **Load** = 7-bar weekly chart, today highlighted orange, rest days flat,
  dashed target. **HR** = 5-zone time-in-zone bars (Z1–Z5 palette).
- Delta chips: `d-good` (green, "▲ 11s faster"), `d-info` (violet, "68% easy").

### 6.4 Paired stat halves — `.thalf` (Level ⟷ Streak)
- Two recess halves side-by-side, hold at 390px.
- **Level:** XP progress ring (violet, 42% → L2) + tier "Beginner" + "On track" chip +
  "42 XP → L2". Tap-through chevron.
- **Streak:** "3 days" + "Active today" amber chip + 7 segment pips (4 empty dots, 2 lit,
  today = orange flame). Pips pop in sequence.

### 6.5 Recent runs — `.run` rows (layered card)
- Full-width recess tile. Each row: run icon → value (`5.2 km` + `PR 5K` amber tag) →
  attributes (`7:21/km · 38:11`) → time (`Today`/`Sat`). Rhythm: value → comparison →
  attributes → time. Tap-through chevron in header.

### 6.6 "Jump back in" chip rail — `.chiprail` / `.qchip`
- Horizontal scroll-snap pill rail of quick actions: **Log a run** (accent) ·
  **Set a goal** (violet) · **Challenges** · **Plan** · **Community**. Each pill = icon
  tile + label, 44px tall. "All ›" link in the section head.

### 6.7 Shared atoms
- **Delta/trust chip** (`.chip`): compact mono pill, green/violet/amber variants, paired
  with a metric to give it meaning ("▲24%", "On track", "Active today").
- **Tap-through chevron** (`.tap`): muted `›` top-right of a tile head = "opens detail".
- **Section header** (`.railhead`/`.shead`): caps label + optional "All ›" link.

---

## 7. Home screen — final composition (top → bottom)

1. Status bar + top bar (brand · bell · avatar)
2. Greeting + status strip (78 · 🔥3 · L1)
3. **Session carousel** (Today / Tomorrow / Thursday, swipeable, ‹ › + dots)
4. **Coach tile** (benefit headline + RPE chips)
5. **Trends tile** (Pace / Load / HR toggle)
6. **Level ⟷ Streak** paired halves
7. **Recent runs** (2 rows + "history" chevron)
8. **"Jump back in"** chip rail
9. Locked 5-tab nav

> **Removed in final:** the 2-up club "cover cards" (Saturday Long Run / Tempo Tuesday).

---

## 8. Motion choreography

- **Entrance:** staggered rise (greet → carousel → bento tiles by `--i` → chip rail).
  Transform+opacity only; pure CSS on load; reduced-motion shows final state.
- **Gauge:** stroke draws to value, number pops once (`--ease-pop`).
- **Trends pill:** slides between segments (`--ease-pill`); panels cross-fade in.
- **Bars/pips/spark:** rise/pop/draw once, staggered, never loop.
- **Tactile:** every tappable settles to `scale(.97)` ≤120ms; pointer devices get a
  `-2px` hover lift on cards. Nav underline animates in.

---

## 9. Rules for redesigning the 5 target pages

When building AI Coach / Run / Events / Communities / Profile:
1. Reuse §1 tokens and §2 surfaces verbatim — do not redefine colors, type, or glass.
2. Reuse §6 components where the content fits (gauge, chips, toggle, paired halves,
   chip rail, layered rows). Build new components only when no existing one fits, and
   add them back into this doc as V1.x additions.
3. Keep §4 chrome + §5 nav identical; only the active tab changes.
4. Obey the density skill: one dominant glance per screen, pair atomics into halves,
   collapse range-variants into toggles, an action per surface, cheap status in header.
5. Every screen fits ~1.5 screen-heights with one clear hero, mobile-first at 390px.
6. Pass all §0 locks + §10 gates before it's "done".

---

## 10. Verification gates (every page must pass)

- [ ] 0 `<script>` tags (presentation is pure CSS).
- [ ] Device 390px; 2-col paired grids hold at phone width.
- [ ] Locked 5-tab nav present & verbatim; correct active tab.
- [ ] All metrics mono + tabular-nums.
- [ ] One accent (orange); violet only for AI/secondary.
- [ ] Aurora field + veil present; one drift loop.
- [ ] `prefers-reduced-motion` block pins every animated element to its end state.
- [ ] ≥44px tap targets; `aria-label`/roles on controls & data viz; visible focus rings.
- [ ] Renders correctly opened directly in a browser (no network-dependent layout).

---

## 11. Known follow-ups / open items

- Carousel chevrons are a **visual cue** (CSS anchor), not active click-to-page — wiring
  active paging needs JS, deferred to the React integration.
- PNG previews can't be generated on the PwC machine (firewall blocks the font CDN that
  headless Chrome waits on). Render on the personal laptop when screenshots are needed.
- This V1 covers Home only. AI Coach / Run / Events / Communities / Profile to be added
  as §7-style compositions once designed, against the feature map (`FEATURE-MAP-V1.md`).

---

## 12. React-integration backlog (motion/interaction to wire when the mockup becomes the real app)

> These were surfaced by the design council. They are **deliberately NOT in the pure-CSS
> mockup** (lock #8 keeps the mockup JS-free for presentation). When the Home screen is built
> in React, wire these to lift it from "static comp" to a live, flagship-grade surface. Each
> item lists the **target element**, the **library/API**, the **behavior**, and the
> **reduced-motion fallback** (the resting state the CSS already ships). Default lib: **Motion
> for React** (`motion/react`). Everything degrades to the locked CSS resting state.

### 12.1 Signature & metrics
- **Readiness count-up coupled to the gauge arc** — `.scard.today .gnum` + `.grfill`. One
  `useSpring(0 → 78)`; the integer via `useTransform(Math.round)` and `strokeDashoffset` via
  `useTransform` off the **same** value, so digits roll in lockstep with the sweep. The orb's
  CSS breath stays the idle loop; this is the arrival. **RM:** `useReducedMotion()` →
  `value.jump(78)`, final arc + number, no roll.
- **Heartbeat-paced cadence token** on the chosen signature (the readiness orb). Name the breath
  to a physiological tempo (`--pulse: ~3.5s` easy-run breath) instead of an arbitrary duration,
  so the one moving thing pulses like a body. Only the orb pulses. **RM:** pinned `scale(1)`.

### 12.2 Navigation & shell
- **Gliding nav pill** — `.f2-pill` (the Glide Pill nav, §5). One `motion.span layoutId="navPill"`;
  Motion FLIP-glides the single orange pill between tabs (across the Run FAB slot) on route change
  instead of the CSS mockup's parked-behind-Home position. The active icon's outline→fill swap
  rides the same state. **RM:** instant move, no glide. `aria-current` always carries truth.
- **Capsule shrink-on-scroll** — `.f2-cap` minimizes/contracts on scroll-down and re-expands on
  scroll-up (iOS-26 floating-tab-bar behavior) via `useScroll` direction. **RM:** always expanded.
- **Same-document View Transitions** for tab/route changes — `document.startViewTransition()` +
  `view-transition-name` on persistent elements (brand wordmark, active tab, the hero card) so
  navigating Home→Coach **morphs** shared elements rather than hard-cutting. CSS customizes
  `::view-transition-old/new()`. **RM:** `skipTransition()`.

### 12.3 Carousel (the §11 follow-up, resolved)
- **Real paging + honest dots** — `.ctrack` / `.cdots` / `.cnav`. `IntersectionObserver`
  (or Motion `useScroll`) drives the active index → `motion.i layoutId="cdot"` springs the pill
  between dots; chevrons become real `<button>`s calling `track.scrollBy({behavior:'smooth'})`
  and gate to the **disabled** recipe at the ends. Keep native scroll-snap as the swipe mechanism.
  **RM:** `behavior:'auto'`, dots jump.
- **Scroll-driven active-card emphasis** — off-center `.scard`s sit at `scale(.965)/opacity(.62)`
  and the snapped card resolves to full. This is **CSS-now-capable** via
  `animation-timeline: view(inline)` (ship `@supports`-gated in the mockup); the React form drives
  it off the same scroll state. **RM:** all cards `opacity:1`.

### 12.4 Trends & data viz
- **AnimatePresence cross-fade** on the Trends panel swap — true both-direction enter/exit
  (CSS can only animate the incoming panel). Pace line **re-draws** on every re-select via
  `useInView` (CSS only draws on first load). **RM:** instant swap, final paths.
- **`seg-pill` liquid stretch** — `motion layoutId="segPill"` shared-layout: the pill stretches
  toward its destination and settles, and the geometry is label-width-robust (i18n) vs the
  brittle `calc()`. **RM:** instant.

### 12.5 Lists & touch
- **Recent-runs row press** — each `.run` becomes its own `<button>` (wrapper demotes to
  `<section>` + header chevron); `whileTap` scale + the CSS background wash already shipped.
- **Gesture sheets** (when detail/expand screens land) — adopt **Vaul** for bottom sheets with
  rubber-band drag + velocity dismiss; the locked glass = the sheet surface.

### 12.6 Ambient / atmosphere (use sparingly, one at a time)
- **Velocity-coupled aurora lean** — `useVelocity(scrollY) → spring →` a tiny additive transform
  (**≤10px / ≤2.5°**) on **separate wrapper** divs so it composes over (never replaces) the locked
  CSS drift. Fast scroll leans the lit volume; idle springs home. **RM:** hook skipped, static aurora.

### 12.7 Open-source adoption map (decisions)
- ✅ **`lucide-react`** — single icon source (shadcn's set, all stroke-2 on 24×24, `currentColor`
  so it can't break the one-accent or mono locks). Replaces the hand-drawn inline glyphs whose
  stroke widths drifted (2.0/2.2/2.4). Mockup-now leg: pin every UI chevron to `stroke-width:2`.
- ✅ **Motion for React** (`motion/react`) — the motion primitives above.
- ⚠️ **Vaul** — only for bottom sheets on detail screens (not Home).
- ❌ **`vaso` / `shuding/liquid-glass`** displacement — would smear text behind glass (fails WCAG
  AA, lock #9) and replace the hand-tuned brand gradient. The CSS glass already wins.
- ❌ **Swiper / Embla** — native scroll-snap already does the carousel.
- ❌ **React Three Fiber / WebGL** — worst battery trade on a screen users park on; the CSS aurora wins.

> **Rule carried from §0:** wiring any of these must never make content depend on motion, must keep
> ONE ambient signature (the readiness orb), and must pass the §10 gates including reduced-motion.

---

## 13. Design-Fidelity Conformance Gate (permanent — every wave must pass)

> Added after the Wave 2/3 fidelity council caught flat-card drift. Feature-parity is NOT
> enough; every page must diff clean against the locked liquid-glass system below before it ships.
> Reuse the `.ss-surface` / `.ss-recess` / `.ss-hero` alias classes in `ss-base.css` — never
> hand-author a card's background/border/shadow. Page CSS holds LAYOUT ONLY.

1. Every card uses a locked ss-base surface (`.ss-surface`/`.tile`/`.scard.today`) — no bespoke flat cards.
2. Every surface carries the masked dual-edge `::before` refraction ring (150deg, light top-left → dark bottom-right), never a bare 1px border as the visible edge.
3. Ring opacity by plane: standard .22→.34 · recess .12→.38 · hero .5/.42.
4. Three depth planes correct: hero floats (blur26/border.16/drop-shadow), standard mid (blur18/.045), recess sinks (blur16/.022 + inset top-dark well).
5. Recess wells use the inset top-dark shadow + the `::after` AA scrim (WCAG AA over aurora).
6. backdrop-filter on every static tile + fixed chrome; NEVER on a scroll container (mask its edges). Blur 16–26px.
7. All metrics JetBrains Mono + tabular-nums + slashed-zero, locked at the component selector.
8. Type scale only: --m-hero 26 (centerpiece gauge only) · --m-lg 19 · --m-md 15 · --lbl 9.5. No off-scale one-offs.
9. ONE orange accent leads; violet = AI only; green/amber/red/category hues are SEMANTIC BADGES, never surface fills.
10. Sculpted aurora field behind everything; never a flat dark void.
11. Locked Glide-Pill 5-tab nav verbatim; one active signal; raised Run FAB.
12. Exactly ONE living centerpiece per screen; everything else still.
13. Cinematic lead entrance; transform/opacity only; reduced-motion pins all to final.
14. 0 `<script>` for presentation; ≥44px taps; aria on controls/dataviz; per-family focus rings.
15. Side-by-side diff each surface vs ss-base on: fill, blur, border, triple-layer shadow, ::before ring, ::after scrim (recess) — all must match.

---

## 14. Component-Conformance Gate (permanent — every page, every wave)

> Added after the component-conformance council found filled-color selections/tags/toggles drifting across pages.
> The 12 canonical component classes now live in ss-base.css (.ss-tab/.ss-seg/.ss-chip/.ss-tag/.ss-dchip/.ss-prtag/
> .ss-badge/.ss-btn*/.ss-qchip/.ss-dots/.ss-ai). REUSE them — never re-author a tab/chip/tag/toggle/button. Page CSS = layout only.

1. No <script> tags; all presentation is pure CSS (lock #8).
2. Device frame 390px; layout holds and never collapses at 375-390px.
3. Body bottom padding clears the floating nav (>=96-104px).
4. Horizontal content gutter is 16px on every page.
5. Locked Glide-Pill 5-tab nav present verbatim: Home, AI Coach, Run(FAB), Community, Events — none added/removed/reordered, no labels under the 4 side icons.
6. Exactly ONE active nav signal: NEUTRAL frosted-glass pill behind the active icon + the icon goes orange-filled (--accent-2); no underline/tick/second signal.
7. aria-current=page on the active nav tab and the active sub-tab only.
8. Run FAB is the ONLY saturated filled-orange anchor in the nav (58px circle, 135deg gradient, 4px --bg2 border, white glyph).
9. Every sub-tab uses shared .ss-tab/.ss-tab.on; active = neutral glide-pill gradient (rgba(255,255,255,.12)->.06), NEVER a filled orange/glass-hue box (kills coach .subtab.on, events .fpill.on).
10. No filter/segment/day pill uses a filled orange or colored selection background (kills events .fpill.on, coach .daypill.today/.done).
11. Every segmented toggle uses shared .ss-seg/.ss-seg-pill: a NEUTRAL white-glass pill that SLIDES via transform 200ms ease-morph, never a filled/colored segment.
12. Active segment/sub-tab LABEL recolors to --fg only (svg .7->1); it gets NO own filled background box.
13. Inactive segment/tab labels are --muted-2, svg at .7, no background/border.
14. Segmented toggles are hidden-radio :checked, default option pre-checked, no JS; each segment >=44px.
15. Selectable/RPE chips use shared .ss-chip with the VIOLET morph (::before rgba(124,107,240,.32)->.14 fading opacity 0->1), never a filled saturated orange or solid violet chip, never a hard cut.
16. Selected RPE/selectable chip: border rgba(167,139,250,.5) + violet glow; value->#fff, key->--violet-2; real radio input.
17. Unselected selectable chips are quiet glass (rgba(255,255,255,.04) + var(--hair)), value in --muted.
18. Quick-action chips (.ss-qchip) keep a neutral glass body; category tint confined to the 26px .qi tile at low alpha (orange .16/.3, violet .18/.3).
19. Status/category tags use shared .ss-tag: low-alpha tint (~.12-.20) + hairline (~.22-.30) + hue-colored TEXT; no saturated solid-fill tag with white text anywhere.
20. Now/active tags orange tint, soon/upcoming violet, Going green, Maybe amber, Full red/muted — all as low-alpha TINTED tags.
21. Delta/trust chips (.ss-dchip) are low-alpha tint + hairline + hue text, always paired with a metric; green .12/.22, violet .14/.26, amber .13/.26; red is text-tint only.
22. PR tag (.ss-prtag) is amber text on a rgba(251,191,36,.16) wash — not a solid gold badge and not brand orange.
23. The notification badge (.ss-badge) is the ONLY locked saturated-orange fill; this treatment is never reused on a chip/tag/toggle.
24. No #FF6B35 / #FF2E63 / #FC5200 or any third orange — brand orange is #F97316 only (kills events .pin).
25. No non-locked third hue as an accent (kills coach .biomechip.recovery cyan #22D3EE).
26. green/amber/red/HR-zone hues appear ONLY as semantic badges/text/charts, never as a saturated surface, chip, or toggle fill.
27. HR-zone palette (Z1 #60A5FA … Z5 #F87171) is used ONLY inside charts, not on chips/tags.
28. Category hue never tints a card/header/panel SURFACE; it lives only in the badge/label text (kills coach .daypill fills, events .evhead.group_run/.workout, .livepanel, .results).
29. Primary button is the single filled-orange action per surface (.ss-btn-primary: 135deg gradient, #fff, orange glow, 48px/13px); no two primaries per surface.
30. No button is filled violet (violet is AI-only, never the primary action fill) — kills coach .deepdive violet body.
31. Secondary actions use .ss-btn-soft (white .06 glass) or .ss-btn-ghost (48px square); a semantic-green action button is allowed ONLY in an explicit live context.
32. All buttons/status bars on the locked 48px/13px scale — no 50px height or 14px radius, no hardcoded widths that break flex (fixes events .rsvp/.checkin-btn).
33. Disabled controls: opacity:.45 + filter:saturate(.6) + box-shadow:none + cursor:not-allowed and drop the press transform; a disabled state exists wherever an action is not-yet-available.
34. Round icon buttons + avatar carry the ::after 44px hit-area expander; icon buttons are circular glass, not filled orange; avatar uses the locked orange->violet gradient (used nowhere else as chrome).
35. Icon tiles default to neutral glass; contextual tint stays low-alpha and only on the tile; the Coach violet->accent tile is the single AI-signature gradient tile; inner glyphs 14-15px stroke-2.
36. Streak pips use the amber->orange semantic gradient capped at ~.42 alpha; never a 100%-saturated solid box; empty pips neutral glass.
37. Indicator dots (.ss-dots) elongate the active dot into the orange gradient pill — never a flat violet/colored dot (kills coach .patdots i.on).
38. Exactly ONE living centerpiece per screen; no second idle loop (kills coach .node.current .nind nrun pulse running alongside the .presence orb).
39. Readiness gauge arc uses the brand gaugeGrad with the orange bloom; up-next/plan gauges are inert muted-violet; the level/XP ring is violet; no orange ring, no removed sun tick-register/glow-blob.
40. Every metric (pace/distance/XP/%/bpm/time/count) is JetBrains Mono with tabular-nums AND slashed-zero ('tnum'1,'zero'1); unit suffixes are mono too.
41. No metric off the locked scale: --m-hero 26 (single hero number only), --m-lg 19, --m-md 15, --lbl 9.5; card/section titles 22px.
42. All caps labels are 9.5px (--lbl) 600 uppercase with --trk-sm .09em; one label step; no caps label in a brand hue.
43. Every card/well/modal/sheet uses a locked surface (.ss-surface/.ss-recess/.ss-hero) — no bespoke flat card and no flat var(--bg2) modal even with a ring overlaid (fixes coach .ksheet/.sheet).
44. Every surface carries the masked dual-edge ::before refraction ring matching its plane (standard .22->.34, recess .12->.38, hero .5/.42); a bare 1px border is never the visible edge.
45. Three depth planes correct: hero floats (blur26/border .16/drop-shadow), standard mid (blur18/.045), recess sinks (blur16/.022 + inset top-dark well + ::after AA scrim); exactly ONE hero plane per screen.
46. backdrop-filter present on every static tile/chrome (16-26px family) and NEVER on a scroll container (scroll containers alpha-mask their edges instead).
47. Coach/AI surface (.ss-ai) is violet-led with rgba(167,139,250,.18) border; AI badge (.ss-aibadge) is a low-alpha violet wash, not a solid box; one AI moment per screen; AI never reads orange.
48. ONE brand accent leads: orange #F97316; violet only as the AI/secondary signal; no third brand accent hue.
49. Status + top-bar chrome identical to Home: faux 9:41/battery (aria-hidden), brand wordmark with 90deg orange->violet-2 clipped 'Sprint', bell+badge, avatar; chrome z-index>=4 and does not scroll away.
50. All tokens inherited from ss-base.css; no token redefined per page; page CSS holds LAYOUT ONLY and re-authors no surface background/border/shadow.
51. Radii on scale (device 46, hero 22, tile 18, inner chips 8-14, pills 9-15); bento gap var(--gap) 11px (10px <=430px).
52. Cinematic lead entrance: the ONE centerpiece arrives first, the rest cascades behind; all entrance motion transform+opacity only; presses settle to scale(.97/.92/.94/.985) within 120ms.
53. prefers-reduced-motion block pins EVERY animated element to its resting state (gauges filled, numbers shown, pills/sheets at rest, aurora drift off, no orb breath, no node pulse); content never depends on motion.
54. Every interactive control has a visible focus ring (2px --accent-2) whose shape matches its family; all tap targets >=44px (buttons 48px, segments 44px, icon buttons via expander).
55. Every control/data-viz has aria-label or role; decorative cues (.cnav swipe, .ss-dots) are aria-hidden, pointer-events:none, non-focusable; all UI chevrons pinned to stroke-width:2.
56. One action per surface (density rule): a single primary affordance per card; cheap status lives in the header strip; range-variants collapse into a toggle, not parallel chart tiles.
57. No saturated filled color box anywhere a selected/tag/badge/toggle state appears — only the neutral-glass-pill (selection) or low-alpha-tint+hairline+colored-text (tag/badge), per Home.

## 15. Icon Law (permanent — every page, every wave)

> Added after the full-roster design-language council found **62 emoji used as iconography** across Wave 2/3 pages while the locked Home uses **zero**. This was the single largest visible slop source and the prior §13/§14 gates had no iconography rule at all. Root cause: pages were authored fresh into bespoke CSS instead of composing the locked kit.

**The law:** Sprint Society UI contains **ZERO emoji** as iconography, status, category, rank, or decoration. Every interface signal is one of:
1. **Crafted inline SVG** — stroke-width 2, `currentColor`, 24×24 viewBox (matches Home). Copy an existing Home icon; never type an emoji.
2. **Material Symbols Rounded** (filled variant only) — for the locked nav set.
3. **JetBrains Mono tabular numerals** — for rank/index (1/2/3, not 🥇🥈🥉) and all metrics.
4. **Caps text label** — for category/status (BASE, EASY · Z2, GOING).

**The canonical emoji→icon map (locked):** 🌿→leaf SVG · ⚡→bolt SVG · 💧→droplet SVG · 🔥→Home's exact flame path · 🏁→checkered-flag SVG · 🥇🥈🥉→mono numerals · 🏅→medal SVG · 🎯→target SVG · 🏃→`directions_run` (reuse the FAB path) · ☕→cup SVG · 💪→dumbbell SVG · ✓→stroke-3 check SVG · 📍→`location_on` · 📅→`calendar_today` · 🗺️→`map` · 🤷/empty→text-led + `help_outline`.

**Icon-holder rule:** holders that size an emoji via `font-size` must instead size the SVG explicitly (`.holder svg{width/height}`); set `font-size:0` on text-free holders so no fallback glyph leaks. All SVG `currentColor` so one color-token swap recolors every icon in scope.

**The gate (CI/pre-commit grep — fails the build on any hit):**
```
grep -nE '[🌿⚡💧🔥🏔🥇🥈🥉🏅🏆🎯😊💪😤🥵💀🏁📍📅📈🗺🤷☕🏃✓✔]' pages/    # → must be empty
```
*(Legal exceptions, present in Home: `→` All-affordance, `▲/▼` trend, `▮` status-bar chrome.)*

## 16. Palette-Collapse Gate (permanent)

> Added after the council found three unauthorized hues (cyan #22D3EE, Strava #FC5200, map-pin #FF6B35/#FF2E63) and category-coded tag rainbows. The discipline: **one accent leads, color earns its place.**

1. **Orange `#F97316` leads** — one filled-orange primary per surface; active nav; readiness glow; streaks.
2. **Violet `#7C6BF0` = AI only** — Coach surface, presence orb, AI badges, "soon" tags. Never a primary button.
3. **Green/amber/red = semantic only** — as TEXT/dot/chart, never a saturated surface fill. HR-zone 5-color palette is **charts only**.
4. **Tags are NOT hue-coded by category** — every `.typebadge`/`.biomechip`-type tag is ONE neutral frosted-glass tag (`rgba(255,255,255,.05)` + hairline + caps label); category identity comes from the **icon + label**, not the fill. Status tags (going/maybe/full/live) keep their semantic hue.
5. **Banned hues — zero tolerance:** `#22D3EE` `#FC5200` `#FF6B35` `#FF2E63` `#FFD700` and any "cyan". Gate: `grep -niE '#22d3ee|#fc5200|#ff6b35|#ff2e63|#ffd700|cyan' *.css` → empty (comments excepted).

## 17. Layout-Grammar Gate (permanent)

> Added after the council found pages inventing one-off motifs (winding-path boards, custom grids) instead of reusing Home's composition.

1. Every page reuses Home's **bento grammar** — `.ss-surface`/`.ss-recess`/`.ss-hero` tiles, `.shead` section heads (caps label + optional "All →"), list-row rhythm, one-hero-glance.
2. **No bespoke board/path/grid motif.** Any decorative SVG (e.g. the journey path) must be `aria-hidden` + `pointer-events:none` ambiance carrying **no semantic meaning** — the data lives in real tiles/rows.
3. **Compose-from-kit:** content is styled only with §1 tokens + §2 surfaces + §6 `.ss-*` components. Any net-new per-page content class must first be promoted into `ss-base.css` as a documented V1.x component. **Migration smell:** `coach.css`/`events.css`/`run.css` should *shrink* as pages mature; a growing per-page stylesheet = drift, review it.


## 18. Sub-tab + Tint + Authority rules (permanent — from Ishan review of coach-chat)

> Added after Ishan reviewed the AI-Coach Chat page and corrected three recurring mistakes. These are now locked for EVERY page.

**18.1 Sub-tabs within a master tab = ONE segmented control (Home's Pace/Load/HR pattern).** Any set of sub-sections inside a master tab (e.g. Coach's Chat/Plan/Insights/Zones/Records) is rendered as a single recessed segmented container (`.ss-seg`-style: `background:rgba(255,255,255,.04)` + hairline + `inset` shadow) with the active item as the **neutral frosted glide-pill** (`linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.06))` + `.12` border, active label `--fg`, others `--muted-2`). In React the pill slides. NEVER a row of separate free-floating pills, never a scrolling tab-strip, never a hue fill on the active item. This is the same control as the Home Trends toggle — reuse it.

**18.2 No gratuitous tints.** A low-alpha colored fill (orange/violet/green tint behind a surface, bubble, button, chip, tag, or divider) is ONLY allowed when it encodes a genuine **semantic status** the way Home does (`.ss-tag.now/.go/.maybe`, delta `.ss-dchip`, the streak pips). It is NOT decoration. Specifically banned (all caught on coach-chat):
- User chat bubbles are NEUTRAL glass (differentiate sender by SIDE + surface weight: AI = `--glass` left, user = `--glass-2` right), never an orange/accent tint.
- Secondary actions (e.g. Deep Dive) are neutral glass (`.ss-btn-soft`), never a tinted pill. The ONE filled-orange solid primary per surface (e.g. the send button) carries the only accent — exactly like Home's single `.btn-primary`.
- Inline values (RPE, units, counts) are plain mono text, never wrapped in a tinted tag/box.
- Non-interactive labels (day dividers, section captions) are plain caps text — **no box, border, or fill** around something that doesn't click.
- Sender/section label text is `--muted`; the AI identity is carried by the violet ORB + the violet AI-icon badge only, not by tinting every label.

**18.3 No invented identity.** Do not invent names, personas, or personalities for the AI (no "Coach Vera", no "The Scientist"). Use the real product labels from the code: title "AI Coach", subtitle "Knows your data · Always available". Identity = the violet sparkle orb, nothing more.

**18.4 The app's current CSS is NOT a design authority (council-logic fix).** When auditing, take **features and data** from the real source (`.tsx`/routes — what exists, what it's called, what it returns), but take **every visual/styling decision** from locked Home + this doc. A finding must NEVER be dismissed by citing how the existing React code currently styles something (e.g. "the real ChatPage tints the user bubble `bg-accent/15`, so it's fine") — that code is the pre-redesign baseline we are replacing. The chair overrode a correct anti-tint finding with this stale logic; that is now forbidden. Parity ⇐ code. Look ⇐ Home.
