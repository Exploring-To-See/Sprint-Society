# RESEARCH — AI UI/UX Patterns 2026 (for the AI-Coaching-Premium redesign)

Distilled from 10 Claude-skill GitHub repos (downloaded as tarballs; `git clone`/`npx skills` were blocked in-env). Goal: feed a **premium, AI-native, mobile-375px fitness-coaching** redesign — cinematic dark, glassmorphism/depth, ambient glow, the AI coach's voice as hero, violet×orange duotone, tasteful motion.

**How to read this:** every pattern is attributed to its source repo (R1–R10). The most actionable bits are checklists and named values. Apply, don't admire.

---

## Download status

| # | Repo | Status |
|---|------|--------|
| R1 | `ceorkm/mobile-app-ui-design` | OK (main) |
| R2 | `kylezantos/design-motion-principles` | OK (main) |
| R3 | `delphi-ai/animate-skill` | OK (main) |
| R4 | `Dammyjay93/interface-design` | OK (main) |
| R5 | `Laith0003/ux-skill` | OK (main) — richest single source (anti-patterns DB, motion presets, type pairs, arsenal) |
| R6 | `bergside/awesome-design-skills` | OK (main) — registry of ~50 DESIGN.md style tokens |
| R7 | `tommyjepsen/awesome-ux-skills` | OK (main) — the AI-native UX framework set (Governors/Wayfinders/Identifiers/Inputs/Trust) |
| R8 | `Owl-Listener/designer-skills` | OK (main) — design-ops + motion-system tokens |
| R9 | `HermeticOrmus/LibreUIUX-Claude-Code` | OK (main) — orchestration/agents, archetypal color |
| R10 | `Leonxlnx/taste-skill` | OK (main) — imagegen-frontend-mobile + soft + minimalist premium specs |

All 10 downloaded. No substitutions needed.

---

## 1. Anti-AI-slop rules (the "don't do this" tells + fixes)

The unifying thesis across R4, R5, R10: **slop is compositional, not line-level.** It's the *sum* — every number the same size, every card identical, one accent smeared everywhere, structure built from borders instead of space. You catch it by *squinting at the render first*, then fixing the lines. (R4 `design-deslop`)

### The squint test — top 5 compositional tells (R4)
1. **No focal point** — nothing leads; eye has nowhere to land → make the ONE thing the user came for dominate (size/weight/contrast/isolation); demote the rest.
2. **Flat hierarchy** — can't tell primary/secondary/metadata without reading → build tiers from **weight + a 4-step color ramp**, not size alone.
3. **Monotone layout** — grid of identical boxes → vary density by zone, group by proximity, differentiate cards by content & role.
4. **Timid color** — palette spread evenly across 5 low-commitment tints → one intentional accent at ~10%, rest structural neutrals.
5. **Borders doing the work of space** — lines everywhere instead of whitespace/tonal shift → replace dividers with spacing + surface steps; keep borders only where separation genuinely needs a line.

### Named hard-bans (R5 anti-patterns DB, 152 entries; R10 soft/minimalist)
| Don't | Do instead |
|---|---|
| **Inter (or Roboto/Open Sans) as a DISPLAY face** at ≥40px / `text-5xl+` | Pair Inter-as-body with a distinct display: **Geist, Satoshi, Cabinet Grotesk, General Sans, Outfit, Clash Display, PP Editorial**. Inter as *body* is fine. (R5, R10) |
| **The purple→blue "AI gradient"** (`from-violet-500 to-blue-500`, `#8b5cf6→#3b82f6`) on white | Single restrained accent; if gradient used, keep hue spread **<60°**. *(For us: violet→orange is intentional brand, not the slop default — but stay narrow-window and treat it as accent, never canvas.)* (R5) |
| **Three equal cards in a row** (icon + heading + paragraph ×3) — the strongest layout fingerprint | Asymmetric: bento, 2-and-1 splits, 4-with-one-spanning. Size by content priority. (R5) |
| Generic names "John/Jane Doe", "Acme Corp", `99.99%` | Plausible market-fit names (e.g. Maya Iqbal, Wen Zhang, Layla Haddad). Content is a design surface. (R5) |
| Lorem ipsum / `{TODO_FILL}` / mustache `{{ }}` left in markup | Real copy; OMIT the affordance if a value is absent — never print the token. (R5) |
| Pure black `#000000` / pure white `#FFFFFF` on premium | Off-black `#0a0a0a`/`#111`, warm off-white `#FAFAF8`–`#F7F6F3`. (R5) |
| Oversaturated accents (>80% sat) | Desaturate — contrast comes from **value, not saturation**. (R5) |
| Text-fill gradient on large headers | Solid color + weight hierarchy. Max one gradient word per page. (R5) |
| Default `box-shadow` glows / neon outer glows | Inner border `border-white/10` + tinted inner shadow `inset 0 1px 0 rgba(255,255,255,.1)`. (R5) |
| Heavy dark drop shadows on dark surfaces (they smudge/vanish) | **Elevation via a lightness ladder, not shadows.** (R5) |
| `backdrop-blur` on scrolling content | Reserve glass for fixed/sticky surfaces only (nav, modal, overlay). (R5, R10) |
| Banned thick icons: default Lucide/FontAwesome/Material | Ultra-light precise lines: **Phosphor (Light/Bold), Remix Line, Radix**. Standardize stroke width. (R10) |
| **Same icon repeated across differentiated items** (worse than no icon) | Distinct meaningful icon per item, or drop icons and differentiate via type/scale/number/color. (R5) |
| `border-radius:9999px` on pill *cards*/large containers | Pills reserved for tags, status badges, sometimes the primary CTA. (R5, R10) |
| Mixing warm-gray + cool-gray in one project | Pick Zinc OR Slate and commit. (R5) |
| Inconsistent radii (4/8/12/16/24 mixed on one page) | Pick 2–3 radii and commit. (R5) |
| Default shadcn look, untouched | Customize radii/colors/shadows — the default is a known fingerprint. (R5) |
| AI copy clichés: "Elevate / Seamless / Unleash / Next-Gen / Game-changer / Delve" | Plain, specific language. (R10) |
| Emoji soup in UI/headings/alt text | Real icons / clean SVG primitives. (R10 minimalist) |
| Short labels (wordmark, CTA, nav) wrapping to 2 lines at 375px | `white-space:nowrap` + size-to-fit; if it still won't fit, drop to logomark alone. Invisible to scroll-width checks — verify line height directly. (R5) |

### What is NOT slop — don't flatten intent (R4)
A cleanup that strips intent is worse than the slop. Leave alone: a **bold motivated choice** (saturated palette, dramatic type scale, asymmetric layout — distinctive is the *goal*); an **intentional deviation with a reason** (one-off radius, heavier border on a focal card); anything outside the diff; anything a linter owns. **When unsure whether something is a tell or a decision, treat it as a decision.** "Generated UI looks generated because it defaulted; it does not become good by defaulting harder."

---

## 2. Premium aesthetic rules (depth, glass, shadow, gradient, spacing, type)

### Depth & elevation (the single biggest premium lever for dark UI)
- **Dark-mode elevation = lightness ladder, NOT shadows.** 4–5 step surface ramp: page → card → raised → popover → overlay, each ~**+3–5% L**. Cumulative effect creates real depth with zero shadow smudge. (R5 arsenal, R10)
- **1px hairline borders** for surface separation in dark mode instead of drop shadows. Low-opacity rgba (`white/8`–`white/12`), not solid gray. (R5, R4)
- **Concentric radii (the "double-bezel" / Doppelrand):** never place a premium card flatly on the bg. Outer shell (`bg-white/5`, `ring-1 ring-white/10`, `p-1.5`, `rounded-[2rem]`) wrapping an inner core with its own bg + inner highlight `inset 0 1px 1px rgba(255,255,255,.15)` + a smaller radius `rounded-[calc(2rem-0.375rem)]`. Reads as "glass plate in an aluminum tray." (R10 soft)
- **Nested-radius rule:** `outer_radius = inner_radius + padding`. Same radius on nested parent/child is a tell. (R4)

### Glass / blur (use as a moment, not a system)
- **True glass = blur + TWO edge layers**, or it just reads as "blurred div": `backdrop-blur` + 1px inner refraction border (`border-white/10`) + inner shadow (`inset 0 1px 0 rgba(255,255,255,.1)`). (R5 arsenal)
- Apply blur **only to fixed/sticky/overlay** surfaces. Never on scrolling content — continuous GPU repaint kills mobile frame rate. (R5, R10 perf guardrails)
- **Lens-blur depth:** blur background UI layers to isolate a foreground action (focus mode, modal). `backdrop-filter` on a sibling layer. (R5)

### Shadows (when light, or for ambient depth)
- Multi-layer soft shadows over solid borders — shadows adapt to any bg via transparency; borders are solid and clash. (R2 Jakub, R3)
- Tinted/ambient shadows keyed to surface or brand (a violet section gets violet-mist shadow), never hard gray/black. (R5, R1)
- Light-mode card recipe (R2): `0 0 0 1px rgba(0,0,0,.06), 0 1px 2px -1px rgba(0,0,0,.06), 0 2px 4px rgba(0,0,0,.04)`; darken a touch on hover.
- Ban heavy drop shadows >24px blur at >15% alpha → hairline border or near-invisible 4–8% alpha long-blur. (R5)

### Gradient discipline
- **Narrow hue window** (<60°), low saturation, **2–3 stops axis-aligned**, used as accent not canvas. Max one gradient feature per screen. (R5) — *our violet→orange spans wider, so treat it as a deliberate brand signature confined to hero/glow moments, not body surfaces.*
- Use **`oklch` interpolation** for gradients to avoid muddy sRGB midpoints: `linear-gradient(in oklch, …)`. (R2 Jakub)
- **Mesh gradient background:** 3–5 large blurred radial blobs in brand colors, drifting slowly (4–8s ease loops, 3–6px translation), positioned *out of the safe text area* so copy contrast stays constant. Cheap to build, expensive-looking. (R5 arsenal)

### Spacing & rhythm
- **8-pt grid:** all spacing divisible by 8 or 4 (8/12/16/24/32/48/64/80/96). (R1)
- **Relationship-based spacing:** related elements close, unrelated far. Multiplier rule — if related text is 16px apart, gap to next group is 2× (32px). (R1)
- Card internal padding **24–32px** baseline (up to 40 on premium). Macro-whitespace between sections. (R1, R10)
- Constrain text content width (`max-w` ~600px / `max-w-4xl`) for readability. (R1, R10)

### Type scale & pairing (athletic/premium)
- **One font family, two max.** Max **4 sizes, 2 weights**. Hierarchy from **weight + color + spacing, not `text-9xl`**. "Premium type whispers at scale." (R1, R5)
- **Monospace for big numbers** (paces, splits, stats, XP) — and `tabular-nums` / `font-variant-numeric: tabular-nums` for any updating number so digits don't jitter. (R1, R4)
- Tight tracking on large display headings: `letter-spacing: -0.02em` to `-0.04em`, line-height ~1.1. (R10)
- Body text never pure black; off-black `#111`/charcoal, line-height ~1.6, secondary text muted at 60–70% opacity. (R10, R1)
- **Recommended pairings for athletic-premium (dark):**
  - Display **Clash Display / Cabinet Grotesk** + body **Geist / Inter** + mono **Geist Mono / JetBrains Mono** — wide geometric grotesk reads athletic and tech-forward. (R10 soft, R5 type-pairs)
  - Display **Satoshi / General Sans** + body **Inter** + mono **JetBrains Mono** — clean, confident, broadly buildable.
  - For an editorial/cinematic register: **Fraunces** or **Instrument Serif** display + Inter body (use sparingly, big quotes / coach's voice only). (R5 type-pairs)

### 60/30/10 color system (R1)
- 60% neutral base (dark canvas), 30% complementary (structural elements/text), 10% brand accent (CTAs, key indicators).
- Text hierarchy via **opacity of the neutral**: 100% headings / 80% body / 60–70% secondary.
- Accent at 5% opacity for secondary buttons & subtle card highlights. Save strong color for meaningful moments — overuse kills hierarchy.

---

## 3. AI-native UI patterns (the coach's voice as hero)

This is the freshest, most differentiated material — R7's framework set is purpose-built for AI products. Map directly to "the AI coach's voice as hero."

### AI Identity — make the coach a character, not a feature (R7 ai-identifiers)
Five identifiers: **Name, Avatar, Color, Iconography, Personality.** Work best when they reinforce each other.
- **Name:** four stances — *persona* (warm, e.g. "Coach Vera"), *entity/role* (honest, e.g. "Coach", "Pacer"), *company*, or bare *AI*. Persona drives attachment but risks overpromising. Allow user-renaming for ownership. **Disclosure must stay unambiguous** — never let a user mistake the AI for human.
- **Avatar does 3 jobs:** communicates **state** (listening / generating / idle), anchors identity, mediates trust. Forms: minimal mark (utility/speed) → branded character (warmth) → photoreal/voice. For a coach: a **minimal animated mark with state** (idle glow → "thinking" pulse → "speaking" waveform) is the premium-restraint sweet spot.
- **Color:** give AI moments a *consistent* signature hue (our violet) so AI surfaces are instantly recognizable across chat header, nudges, cards, notifications.

### Wayfinders — kill the blank slate (R7 ai-wayfinders)
8 patterns: Initial CTA, Example Gallery, Suggestions, Templates, Nudges, Follow-ups, Prompt Details, Randomize.
- **Never surface an empty AI box on an empty state.** Surround the input with scaffolding that shifts work from prompt-engineering → *selection/refinement*.
- **Contextual CTA:** wait until there's data (a synced run, a filled plan) then surface AI as the natural next step — "Ask Coach about today's run."
- **Suggestion chips / Follow-ups:** offer 3–4 tappable prompts ("How's my pace trending?", "Why was today hard?", "Plan tomorrow"). Action-first, contextual to current screen.

### Inputs — pick the right interaction (R7 ai-inputs)
13 patterns; most relevant for a coach: **Open Input** (chat), **Suggestions/Madlibs** (structured tappable prompts — great for the 375px tap-first ethos), **Auto-fill** (AI populates the plan from synced data), **Regenerate** ("re-plan this week"), **Inline Action** (preset actions on a run card). Rules: set a clear default scope after first prompt; treat blank canvas as a UX problem; keep parameters (tone/mode) accessible, not hidden.

### Governors — keep the runner in control (R7 ai-governors)
13 human-in-the-loop patterns. For a coach that adapts plans autonomously:
- **Action Plan** (advisory vs contractual) — show intended steps before committing ("I'll shift your long run to Sat and cut Tue's volume — apply?").
- **Stream of Thought** — surface reasoning for autonomous background adjustments.
- **Verification** before anything destructive (overwriting a plan).
- **Citations/References** — when the coach grounds advice in sports-science, cite it; builds trust + differentiates from generic chatbots.
- Every Governor adds friction — calibrate where oversight is worth the cost.

### Trust Builders (R7 ai-trust-builders)
7 patterns: **Caveat, Consent, Data Ownership, Disclosure, Footprints, Incognito, Watermark.**
- **Caveat** at the moment of decision, plain language ("Estimates — listen to your body"), specific not blanket. Don't rely on it alone; pair with citations.
- **Disclosure:** make AI-authored content visibly AI (badge/color), never ambiguous.

### Conversational layout craft
- Streaming/typing: animate the coach's *arrival* and *thinking* states; once text streams, let it appear instantly (don't fade every token). (R2 frequency gate)
- **Context cards** inside the conversation (a run summary, a pace-zone chart) > walls of text. Imagery/data-viz as a design surface. (R1, R5)
- Agentic affordances: action chips, "apply plan" buttons, undo. (R7)

---

## 4. Motion (curves, durations, springs, what to / not to animate)

### The two gates before any animation
1. **Frequency gate (R2 Emil):** Rare (monthly) → delightful motion welcome. Daily → subtle/fast. Hundreds/day → no animation / instant. **Keyboard-initiated → never animate.**
2. **The golden rule:** "The best animation goes unnoticed." If users say "nice animation!" on every interaction, it's too prominent (exception: deliberate celebration/peak moments). (R2)

### Named easing curves (copy these)
| Token | Curve | Use |
|---|---|---|
| ease-out-quint | `cubic-bezier(.23, 1, .32, 1)` | Hover lift, card move (R3) |
| ease-out-expo | `cubic-bezier(.16, 1, .3, 1)` | Entry fade-up (R5 preset, R10) |
| ease-out-cubic | `cubic-bezier(.33, 1, .68, 1)` | General enter (R3) |
| ease-in-out-cubic | `cubic-bezier(.645, .045, .355, 1)` | State change in place (R3) |
| ease-standard | `cubic-bezier(.2, 0, 0, 1)` | Most UI transitions (R8) |
| ease-decelerate | `cubic-bezier(0, 0, .2, 1)` | Entering screen (R8) |
| ease-accelerate | `cubic-bezier(.3, 0, 1, .3)` | Leaving screen (R8) |
| ease-spring (tactile) | `cubic-bezier(.34, 1.56, .64, 1)` | FAB/drawer — *playful only* (R8) |
| premium-glide | `cubic-bezier(.32, .72, 0, 1)` | Cinematic 600–800ms reveals (R10 soft) |
- **Never** ship default `ease`/`ease-in-out`/`linear` for UI — they "lack strength." (R2, R10)

### Duration tokens (R8 motion-system; R2/R3)
`instant 50ms` · `fast 100ms` · `normal 200ms` · `moderate 300ms` · `slow 400ms` · `deliberate 600ms`.
- Productivity UI: **<300ms, 180ms ideal** (R2 Emil). 200–300ms is the everyday sweet spot (R3).
- **Exits ~75% of enter duration**, and subtler — less movement, no equal attention. (R2 Jakub, R3)
- Smaller elements animate faster; one duration for everything is a tell. (R2)

### Springs (Framer Motion)
- Professional default: `{ type:'spring', duration:.45, bounce:0 }` (smooth decel, no overshoot). Slightly looser: `duration:.55, bounce:.1`. (R2 Jakub)
- **Bounce > 0 only on playful/celebration** moments — never on dropdowns, toggles, modals, settings (utility actions). (R2 anti-checklist)
- Shared-element morph (tab indicator, expanding card): `layoutId` + `{ type:'spring', stiffness:400, damping:30 }`. (R3)

### The "materializing" enter recipe (R2 Jakub, R5 fade-up-12 preset)
```
initial: { opacity:0, y:12, filter:'blur(4px)' }
animate: { opacity:1, y:0,  filter:'blur(0)' }
transition: { duration:.36, ease:[.16,1,.3,1] }   // hero reveals: y:24, .56s
```
Blur→sharp signals "coming into focus." **Use selectively** — not on every element.

### What NOT to animate (AI-slop motion fingerprints — R2 anti-checklist)
- **Pulsing indicators** (glowing dots, breathing CTAs, "AI active" throbs) — flag *any* instance; almost always slop. *(Tension w/ our "ambient glow" — keep glow static/very-slow ambient, NOT a per-element pulse loop.)*
- **Blur-everywhere entrances** — flag when ≥3 components share the same blur enter.
- **Hover-scale on everything** — flag when ≥3 components share `scale(1.0x)` on hover.
- **Stagger-spam on every list** — flag when ≥2 lists in a view stagger. Reserve for one deliberate moment.
- **Bouncy springs on utility actions.**
- **Uniform fade-in on every element** — flag ≥4 identical enters.
- **Motion-on-mount for static text/nav** — headings/paragraphs/nav should appear instantly.

### Performance & a11y guardrails (R2, R10, R8 — non-negotiable)
- Animate **only `transform` + `opacity`** (GPU). Never `top/left/width/height`.
- `will-change` sparingly, only on actively-animating elements.
- `backdrop-blur` only on fixed/sticky; grain/noise only on fixed `pointer-events:none` pseudo-elements.
- Scroll reveals via `IntersectionObserver` / `whileInView` — never `addEventListener('scroll')`.
- **`prefers-reduced-motion` handled at `:root` level**: disable slide/scale/rotate, replace with instant or opacity-only, preserve essential state motion (loading/progress). Define a global `duration-instant` override. Not optional.
- Press feedback: `:active { transform: scale(.97) }`.

### Emotional / peak-end design (R1)
Users remember the **peak** (most intense) and the **end**. Design both: the peak = milestone/PR moment (micro-celebration, glow, badge); the end = summary card + progress affirmation + gentle nudge to return. Celebrate small wins intentionally (the rare-frequency slot where expressive motion is *welcome*).

---

## 5. Color & typography specifics for the dark coaching app

### Palette scaffold (synthesizing R5 bans + R6 tokens + brand brief)
- **Canvas:** OLED-near `#050505`–`#0A0A0A` (never pure `#000`). (R10 "Ethereal Glass", R5)
- **Surface ladder (dark elevation):** `#0E0E11` page → `#16161A` card → `#1E1E24` raised → `#26262E` popover → `#2E2E38` overlay (each ~+4% L; tune to taste). Hairlines `rgba(255,255,255,.06–.12)`. (R5)
- **Brand duotone (hero/accent only):** Violet `#7C5CFF`–`#8B5CF6` × Orange `#FF6B2C`–`#FF7A18`. Keep on glow/CTA/AI-signature surfaces; **don't** use the full violet→orange sweep as body canvas (that's the wide-hue slop risk). Desaturate slightly for large fills; reserve peak saturation for small accents. (R5 discipline)
- **AI signature hue = violet** — consistent across chat header, nudges, coach avatar glow, AI-authored badges. (R7 ai-identifiers)
- **Semantic:** success `#16A34A`, warning `#D97706`, danger `#DC2626` (R6 common), but desaturate toward the dark canvas.
- **Text:** heading `rgba(255,255,255,.95)`, body `.80`, secondary `.62`, disabled `.40`.
- **Ambient glow:** radial mesh blobs in violet+orange at very low opacity (0.04–0.10), slow drift, OUTSIDE text safe-area. (R5 mesh, R10)

### Type system (recommended)
- Display: **Clash Display** (or Cabinet Grotesk) — athletic, geometric, wide.
- Body/UI: **Geist** (or Inter) — 2 weights max in any one view.
- Numeric/mono: **Geist Mono / JetBrains Mono** with `tabular-nums` for paces, splits, HR, XP.
- Optional cinematic accent for the coach's "voice" pull-quotes: **Instrument Serif / Fraunces**, used *very* sparingly.
- Sizes: cap at 4. Tight tracking on big display (−0.02 to −0.03em).

---

## 6. Mobile (375px) specifics

- **Design at 375px (iPhone SE) as baseline.** Verify **zero horizontal scroll** at 360–390px — assert `documentElement.scrollWidth <= innerWidth`. Horizontal scroll is a *critical* fail and the #1 shipped defect. (R1, R5)
- **Touch targets ≥ 44×44pt** (40 min). Extend hit areas; don't shrink. (R1, R4)
- **Thumb zone:** primary actions in the **bottom 1/3** of the screen. Bottom-nav / floating action for the coach. (R1)
- **Safe-area awareness:** respect notch/home-indicator insets; tab-bar clarity; restrained top chrome. (R10 imagegen-mobile)
- **`min-h-[100dvh]`, never `h-screen`** — iOS Safari address-bar collapse breaks `h-screen`. (R5, R10)
- **Every multi-column block collapses to one column ≤640px.** Asymmetric bento/Z-cascade must reset `col-span`/rotations/negative-margins to a clean `w-full px-4` stack below `768px` (overlaps cause touch-target conflicts). (R5, R10 soft)
- **Short labels never wrap** (wordmark/CTA/nav): `nowrap` + size-to-fit; logomark-only fallback. Verify line-height directly (scroll-width won't catch a 2-row nav). (R5)
- **Tap-first input** over typing: tappable selections, sliders/scroll-wheels for one-time setup, suggestion chips for AI prompts; reserve text fields for precise/repeated entry. (R1, R7)
- **Don't hide content behind taps/banners**; expose directly. Turn empty states into guidance + CTA. (R1)
- Modern card aesthetic: `rounded-2xl`/`rounded-3xl`; `backdrop-blur` only on sticky surfaces. (R1)

---

## 7. Five premium Home-screen concept directions (seed the 5 variation builds)

Each is a genuinely different *organizing idea*. All share: dark canvas, violet×orange accent discipline, ≤44pt targets, bottom-thumb primary actions, AI-signature violet.

**A. Conversation-First ("The Coach Speaks").** The home screen *is* the coach. Open on a large, calm AI greeting in the coach's voice ("Morning, Maya — you recovered well. Ready for 5×800m?") rendered in the cinematic serif accent, with the coach's minimal animated mark glowing softly above it. Below: 3–4 contextual suggestion chips (Wayfinder pattern) and one hero context-card (today's session). No dashboard wall — the conversation pulls everything else in on demand. Premium because it inverts the dashboard cliché: the AI's *voice* is the hero, data is summoned, not splattered. Risk to manage: keep the ambient glow static/slow, never a per-element pulse. (Sources: R7 wayfinders/identifiers, R1 emotional, R5 restraint.)

**B. Ring/Dial-Centric ("One Number That Matters").** A single dominant circular gauge (readiness / today's target / streak) owns the upper 60% — massive mono numeral, concentric double-bezel ring, violet→orange progress arc in `oklch`. Everything else demotes to a quiet ladder of secondary stats beneath. The focal-point discipline made literal: one thing leads, hard. Motion: the arc fills once on load with ease-out-expo; the number counts up with `tabular-nums`; nothing loops. Premium because of obsessive restraint + the machined-ring depth. (Sources: R4 focal point, R1 monospace stats, R5 oklch + double-bezel.)

**C. Journey/Timeline ("The Transformation Spine").** A vertical, scroll-driven week-by-week spine down the center — past sessions (dimmed, sharp), today (raised, glowing, in focus via blur→sharp on enter), future (faint, blurred, "materializing as you approach"). The narrative of getting faster, made spatial. Each node is a context-card the coach annotates. Premium because it sells *progress over time* — the emotional core of a coaching product — using blur-as-signal and a real lightness ladder for depth. Motion is meaningful (orientation), not decorative. (Sources: R5 blur-as-signal/lens depth, R1 peak-end, R2 motion-with-meaning.)

**D. Bento-Modular ("Cockpit, Tastefully").** An asymmetric bento grid — one marquee tile (next session, spanning 2×) plus differentiated smaller tiles (pace trend sparkline, hydration, weekly load, a coach-nudge tile). Tile *size carries hierarchy* instead of headline weight; each tile a context-card with one distinct icon (never the same icon twice). Collapses to a clean single-column `w-full` stack at ≤640px. Premium because it reads dense-yet-controlled and defeats the three-equal-cards default. Discipline: one accent at ~10%, hairline borders, vary density by zone. (Sources: R5/R6 bento, R4 monotone-layout fix, R1 spacing.)

**E. Spatial-Depth ("Ambient Coach Field").** Full-bleed cinematic dark field with a slow violet+orange mesh-gradient aurora drifting behind frosted-glass cards floating at layered z-depths (Z-axis cascade) — a hero glass panel (today), a secondary tooltip-card (a tip), a peripheral nudge. True liquid-glass treatment (blur + dual edge layers), lens-blur isolating the focal card. The most "premium product render" feel — depth, atmosphere, glow as environment rather than ornament. Highest perf risk: blur only on fixed cards, aurora out of text safe-area, no scroll-blur, reduced-motion kills the drift. (Sources: R5 mesh/glass/Z-cascade/lens-blur, R10 Ethereal Glass, R2 perf gates.)

> Recommended split if building 5: ship all five as distinct organizing ideas — they don't overlap. If forced to 3, prioritize **A (conversation-first, most differentiated + on-brief), B (ring-centric, most disciplined), E (spatial-depth, most premium-feel)**.

---

## Quick build checklist (pin this)

- [ ] Squint test passes: one focal point, legible tiers, uneven breathing, restrained color, space>borders.
- [ ] Dark elevation via **lightness ladder + hairlines**, not drop shadows.
- [ ] Glass = blur + dual edge layers, fixed/sticky surfaces only.
- [ ] One accent at ~10%; violet→orange confined to hero/glow/CTA, narrow on body.
- [ ] Type: display ≠ Inter; ≤4 sizes, 2 weights; mono + `tabular-nums` for all metrics; hierarchy from weight+color.
- [ ] AI coach has Name + stateful Avatar + signature violet + Disclosure; no empty AI box (Wayfinder scaffolding).
- [ ] Governors on autonomous plan changes (Action Plan + Verify); Caveat at point of decision.
- [ ] Motion: custom curves only; <300ms UI, exits 75% & subtler; bounce only on celebration; animate transform/opacity only.
- [ ] No slop-motion: no pulse loops, no blur-everywhere, no hover-scale-everywhere, no stagger-spam, no motion on static text.
- [ ] `prefers-reduced-motion` at `:root`; reveals via IntersectionObserver.
- [ ] 375px: zero h-scroll, ≥44pt targets, thumb-zone primary, `min-h-[100dvh]`, single-column ≤640px, labels nowrap.
