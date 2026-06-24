# AI-Coaching-Premium — Base Spec (the locked lane)

All 5 Home variations (C1–C5) share THIS language. They differ only in the *organizing idea*
of the screen, not the tokens/chrome/nav. (Enriched by `design/reference/RESEARCH-ai-uiux-2026.md`.)

## Design tokens
```css
/* Surfaces — cinematic dark, never pure black */
--bg:#08080F; --bg2:#0B0A16;
--glass:rgba(255,255,255,.045);   --glass-2:rgba(255,255,255,.07);
--hair:rgba(255,255,255,.09);
/* Text */
--fg:#F4F4F8; --muted:#9A9CB0; --muted-2:#62657C;
/* Brand duotone — orange (energy) × violet (intelligence) */
--accent:#F97316; --accent-2:#FB923C;
--violet:#7C6BF0; --violet-2:#A78BFA;
/* Signals */
--green:#34D399; --amber:#FBBF24; --red:#F87171; --blue:#60A5FA;
/* Type */
--head:'Space Grotesk'; --body:'Inter'; --mono:'JetBrains Mono';
/* Shape & motion */
--radius:20px; (cards) / 15px (buttons) / 13px (chips)
--ease:cubic-bezier(0.16,1,0.3,1);   spring: damping 20 / stiffness 90
```

## Signature treatments (what makes it "premium AI")
1. **Ambient glow** — 2 blurred duotone blobs (violet top-right, orange mid-left), slow drift,
   opacity ≤ .5, `filter:blur(48px)`. Behind content, never over text.
2. **Glassmorphism cards** — `--glass` fill, `--hair` border, `backdrop-filter:blur(16px)`,
   `inset 0 1px 0 rgba(255,255,255,.05)` top-edge highlight. Used for elevated/interactive surfaces.
3. **Coach voice as hero** — the AI coach gets an avatar (violet→orange gradient tile), an `[AI]`
   tag, and speaks in first person. Streaming/typing dots where it's "thinking." Reclaims the
   chat the live app hid behind "Coming Soon".
4. **Duotone accents** — orange for action/energy, violet for intelligence/AI. Gradients only on
   the coach avatar, primary CTA, and progress fills — not on backgrounds-as-decoration.
5. **Mono numerals** — all metrics in JetBrains Mono; labels in Inter uppercase 10px/.06em.
6. **Honest data** — every number real or labeled an estimate; readiness/adherence reflect truth,
   no hardcoded "✓ On track".

## Persistent chrome (identical in all 5)
- **Status bar** (mock), **top bar**: wordmark→Home (gradient "Sprint"), bell w/ badge→Notifications,
  avatar→Profile. Glass, blur(12px).
- **Bottom nav (LOCKED 5):** Home · AI-Coach · **Run** (center gradient FAB, −22px lift) ·
  Community · Events. Glass blur(22px), 10–11px labels, active = orange icon + light label.
- Device frame 390×844, safe-area top/bottom.

## Anti-AI-slop guardrails (from taste / ux-skill / Laith0003)
- No generic purple-blue hero gradients as the whole background; glow is ambient + subtle.
- No emoji soup — at most a single intentional glyph (🔥 streak) per screen.
- Not everything equal weight — one clear hero per screen, strict type hierarchy.
- Real content, real numbers; no lorem, no "Lorem ipsum" stats.
- Motion only with purpose (entrance stagger, coach typing, ring fill); respect `prefers-reduced-motion`.
- Touch targets ≥ 44px; label legibility ≥ 11px (kill the app's current `text-[7px]`).

## Shared content model (same data, 5 layouts)
Greeting (name + date) · **Coach message** (readiness-aware, first person) · **Readiness** (score 78 / Primed) ·
**Today session** (Long Run 5km · 7:50/km · RPE4) + **Start run** CTA · **This-week trend** (dist/runs/pace ▲) ·
**Getting-faster** pace proof · **Momentum** (🔥3 streak · L1 Beginner · 42 XP) · **Recent runs** (2, PR badge).

## The 5 variations (concepts) — finalized after research lands
C1 … C5 each take a different *organizing idea* for arranging the model above. Builders fork
`design/directions/C-ai-coaching-premium.html` for the chrome and rebuild the body per concept.
