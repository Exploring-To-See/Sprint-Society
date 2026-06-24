# Rollout plan — apply C6 Bento-Depth across the app

Approved direction: **C4 + C5 fusion → C6 · Bento-Depth** (bento structure on an ambient
liquid-glass field). Keystone mockup: `design/directions/premium/C6-bento-depth.html`.

## Premium language → React/Tailwind
Port the locked tokens, glass dual-edge recipe, aurora field, lightness-ladder depth, coach-voice
patterns, motion gates, and 5-tab nav into the real PWA. Tailwind + Framer Motion. Respect
`prefers-reduced-motion`. Mobile-first 375px, zero h-scroll.

## Core screens (the 5 nav destinations) — do first
| Route | Page file | Redesign focus |
|---|---|---|
| `/dashboard` | `DashboardPage.tsx` | **Keystone** — bento-depth Home |
| `/coach` | `CoachPage.tsx` | Coach voice hero, conversational, suggestion chips, [AI] disclosure |
| `/run/track` | `RunTrackerPage.tsx` | Glass run HUD, mono metrics, thumb-zone controls |
| `/social` | `SocialPage.tsx` | Glass feed cards on ambient field |
| `/events` | `EventsPage.tsx` | Glass event cards, bento detail |

## Shared chrome (do alongside keystone)
- `components/layout/` — bottom nav (locked 5 tabs), top bar, aurora background layer, page shell.
- A shared design-tokens layer (Tailwind theme extend + a `premium` CSS layer for glass/aurora).

## Secondary screens — second wave
Plan, Progress, RunHistory, Records, HRZones, Challenges, Rewards, Notifications, Profile,
Subscription, Communities, SetGoal, AIProfile, Share. Apply the same tokens/components.

## Gates per screen
- Squint test (one focal point), lightness-ladder depth, glass on fixed surfaces only.
- Real data, honest numbers; loading + error states; ARIA + keyboard.
- Typecheck + build green before commit. Update `docs/USER-GUIDE.md` + `docs/PM-GUIDE.md`.
