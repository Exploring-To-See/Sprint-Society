# Design Handoff — 29 Jun (branch `29.6-latest-design`)

This branch carries the **finalized design language** + the **first fully-reviewed page** for engineering pickup. More pages are being finalized one at a time and will land on later branches.

## What's FINAL (build against these)

| File | What it is |
|------|------------|
| `docs/design-v1/sprint-society-home.html` | **The locked design language.** Home screen, sealed. This is the single visual source of truth. |
| `docs/design-v1/ss-base.css` | **The shared design system** — all tokens, liquid-glass surfaces (`.ss-surface`/`.ss-recess`/`.ss-hero`), the component vocabulary (`.ss-tab`/`.ss-seg`/`.ss-tag`/`.ss-btn*`/etc.), chrome, and the Glide-Pill nav. Every page links this. **Do not re-author surfaces/components per page — compose from this kit.** |
| `docs/design-v1/UI-UX-V1.md` | **The design spec + gates.** Read §13–§18 — they are the hard rules (surface fidelity, component conformance, Icon Law / zero-emoji, palette discipline, layout grammar, segmented sub-tabs, no gratuitous tints, app-CSS-is-not-authority). |
| `docs/design-v1/FEATURE-MAP-V1.md` | The exhaustive feature map (what each page must do). |
| `docs/design-v1/pages/coach-chat-v2.html` | **Page 1 — AI Coach · Chat.** The first page taken through full review. Self-contained: links only `ss-base.css` + its own layout block. |

## How to read the mockups
- They are **static HTML reference**, not the implementation. Pure CSS, no build step — open in a browser.
- Pixel values, colors, motion, and component choices are intentional and locked to `ss-base.css` tokens. Match them.
- `coach-chat-v2.html` maps to the real app's `client/src/pages/ChatPage.tsx` + `server/src/routes/chat.routes.ts`. The mockup honors those features (Deep Dive = 30-Kendu spend modal, dynamic quick-prompts from `GET /chat/suggestions`, message thread, typing indicator, sub-tabs Chat/Plan/Insights/Zones/Records). Take **data/behavior from the code, look from the mockup.**

## Status / open items
- This is **1 of ~6 page clusters.** AI-Coach Chat is reviewed and final; the other pages (Plan, Insights, Zones, Records, Run, Events, Social, Profile…) are being finalized one at a time.
- Known nuance on `coach-chat-v2.html`: the quick-prompt rail currently sits in a bottom band above the composer; final placement is still under founder review — treat the **components/tokens** as final, the **prompt-rail position** as not-yet-locked.

## Hard rules (from UI-UX-V1 §13–18 — enforce in code review)
1. **Zero emoji** as iconography — crafted inline SVG / Material Symbols / mono numerals only.
2. **One accent** (orange `#F97316`); violet `#7C6BF0` = AI only; green/amber/red = semantic text/chart only. No other hues.
3. **No gratuitous tints** — tinted fills only encode genuine semantic status; chrome (bubbles, buttons, dividers) is neutral glass.
4. **Sub-tabs = one segmented control** (the Home Pace/Load/HR pattern), never a row of separate pills.
5. **Compose from `ss-base.css`** — never re-author a surface/tab/chip/tag/button per page.
