# Sprint Society — UI/UX Redesign Handoff

Everything from the design council session, saved here so you can pull it on any laptop.

**Branch:** `claude/app-ui-ux-redesign-kzzo1q` (pushed to GitHub — just `git pull`, no PR opened).

## What's here
| File | What it is |
|---|---|
| `00-home-keystone-C6.html` | The locked Home keystone (C6 Bento-Depth) after the full 5-lens polish loop. The visual language reference for the whole app. |
| `UX-A-paired-bento.html` | Variant A — density via pairing. 2-col mobile bento; Pace⟷Level & Week⟷Streak paired into halves; header status strip. |
| `UX-B-toggle-cockpit.html` | Variant B — one tile, many jobs. CSS-only Pace/Load/HR segmented toggle; 8→6 tiles; densest (~1.25 screens). |
| `UX-C-coach-rail.html` | Variant C — forward motion. Swipeable "Today & Up Next" rail; answers "what do I do now?"; RPE value chips. |
| `mobile-ux-density-SKILL.md` | The UX information-design skill distilled from reference apps (Blinkit/Zomato/District). |
| `loop-log.md` | The 5-lens enhancement loop log + the no-JS render fix writeup. |

All HTML files are self-contained (fonts via CDN) and **render with no JavaScript** — open them
directly in any browser or phone preview.

## The skills (live in the repo, reusable by the council)
- `.claude/skills/mobile-ux-density/SKILL.md` — information design: pairing, toggles, glanceable
  hero, action-per-surface, header status, personalization rails, progressive disclosure.
- `.claude/skills/sprint-ux-council/SKILL.md` — the **synthesis of this whole session**: the
  council-in-a-loop UX workflow, the council members (which skills/agents as lenses), the locked
  design language, the non-negotiable gates, the 5-lens loop, the variant→synthesis method, and
  the app-wide rollout order. Run it with: *"Run the UX council loop on <screen>"*.

## Recommended synthesis (Home)
UX-A's paired-bento grid + UX-B's segmented trend toggle + UX-C's Today/Up-Next rail →
**rail → hero/coach → toggled trend → paired atomics.**

## To continue on another laptop
```
git fetch origin
git checkout claude/app-ui-ux-redesign-kzzo1q
git pull origin claude/app-ui-ux-redesign-kzzo1q
```
Open the HTML files in a browser, or tell the assistant: *"Run the sprint-ux-council loop to
build the Home synthesis, then roll it across the app."*
