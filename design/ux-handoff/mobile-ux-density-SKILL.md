---
name: mobile-ux-density
description: Information-design and UX patterns for dense, glanceable mobile product screens. Use when designing or reviewing a mobile app home/dashboard where the goal is to show a lot at a glance with clear hierarchy and an action per surface — pairing tiles, segmented toggles, hero stats, trust/delta chips, personalization rails, progressive disclosure. Triggers on "be smarter about showing things", "UX overhaul", "too much scroll", "pair these tiles", "information design", or building Sprint Society home/stat screens.
---

# Mobile UX Density — show more, scanned faster, with an action per surface

This is a UX (information-design) skill, not a coat of paint. The job is to decide
**what to show, at what size, in what order, and what the user does next** — then let the
visual system serve that. Distilled from high-density consumer mobile apps (quick-commerce,
food delivery) and applied to Sprint Society's running cockpit.

## The core principle
**Every surface earns its space by answering one question and offering one next move.**
A full-width row is a promise that the content deserves the whole width. Most stats don't —
they deserve a *half*. Reserve width for the one thing that needs it.

## 10 patterns (with the source insight, then the rule)

1. **One dominant glance per screen.** (Blinkit leads with a giant "20 minutes" — the single
   fact you came for.) → Sprint Society: the hero is the session + readiness gauge. Nothing
   else competes at that size. Everything else is clearly secondary.

2. **Pair atomic stats into halves.** A single number (pace, level, streak, weekly total)
   never needs full width. Put two related stats side-by-side (2-up) so the eye compares them
   in one fixation and the screen is half as tall. *This is the default for atomic metrics,
   even on a 375px phone.* Full width is the exception, not the rule.

3. **An action per surface.** (Every Blinkit card has an ADD; every Zomato circle is tappable.)
   → Each tile should be tappable to its detail, and the key ones surface a micro-action
   (Start, Log, View plan). No dead, read-only cards where an action makes sense.

4. **Segmented toggles change what a viz shows.** (Zomato "Protein / Calories"; tab chips.)
   → A pace or load chart gets a Week/Month (or Pace/HR) toggle instead of two separate tiles.
   One tile, more information, user-controlled. Density without clutter.

5. **Delta & trust chips inline.** (Blinkit: "31% OFF", "Low return rate", "1 left";
   Zomato nutrient chips.) → Pair every metric with its context chip: "▲11s faster", "▲24%",
   "On track", "PR". The number states the value; the chip states the meaning. Keep them
   compact, mono, one accent for positive.

6. **Status lives in the header.** (District shows wallet ₹620 + location up top.) → Surface
   the cheap, always-relevant status (streak flame, XP/level, today's readiness dot) as a
   compact header strip so it's free — not spending a whole tile on it.

7. **Personalization rail.** (District "Recommended for you"; horizontal category scrollers.)
   → A horizontal, swipeable rail for "today's plan / suggested sessions / next up" packs
   several choices into one row height and signals the product is adapting to the user.

8. **Big tappable value selectors over prose.** (Zomato's 20-30 / 30-40 / 40+ gram circles.)
   → When offering a choice (intensity, distance, RPE), use large value chips/circles, not a
   sentence and a dropdown. Faster, more glanceable, thumb-friendly.

9. **Progressive disclosure / benefit-led framing.** (Zomato "Healthy Score — your guide to…"
   with a "Know more" pill.) → Lead a tile with the benefit/outcome and a clear way in; hide
   the detail behind the tap. Don't dump everything at the top level.

10. **Layered cards that stack value → comparison → attributes → action.** (Blinkit product
    card.) → For a rich tile (recent run, session), order it: headline value, comparison
    (PR / vs target), supporting attributes (pace, HR, duration), then the action. Consistent
    internal rhythm across every rich card.

## Layout heuristics for the run cockpit
- **Bento on mobile, not a single column.** Collapse to a 2-column grid, not 1. Pair:
  **Pace ⟷ Level**, **Week ⟷ Streak**. Hero + wide trend may still span full width.
- **Tile-size = importance.** Hero (full, tallest) → wide trend (full) → paired atomics (half).
- **Vertical budget.** Target the whole cockpit in ~1.5 screen heights, not 3. Pairing is the
  single biggest lever; toggles (one tile doing two jobs) is the second.
- **Thumb zone.** Primary action (Start run) reachable in the bottom third.

## Anti-patterns to kill
- A full-width tile holding one small number. → halve it and pair it.
- Two separate tiles showing the same metric over different ranges. → one tile + a toggle.
- A read-only card where a tap-through or action obviously belongs.
- A prose sentence where a value chip would be read faster.
- Header whitespace while a stat that belongs in the header eats a tile below.

## How to use this skill
When designing or auditing a stat-dense mobile screen: (1) list every surface and the one
question it answers; (2) demote anything answering a small question to a half-tile and pair it;
(3) collapse range-variants into toggles; (4) ensure each surface has a next move; (5) lift
cheap always-on status into the header; (6) verify the whole thing fits ~1.5 screens with one
dominant glance. Keep Sprint Society's locked visual language (aurora, liquid-glass, depth,
one accent, mono tabular metrics, reduced-motion, 375px, locked 5-tab nav) — this skill governs
*structure and information*, the premium spec governs *surface*.
