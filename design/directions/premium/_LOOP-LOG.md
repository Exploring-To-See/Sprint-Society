# C6 enhancement loop — log

Goal: grind `design/directions/premium/C6-bento-depth.html` from "good" to genuinely premium,
then lock + roll across the app. One lens per iteration so each pass adds craft, not churn.
Council agent + matching skill builds; orchestrator QAs the locked perf gates + commits each pass.

## Locked gates (every iteration must keep these green)
- backdrop-blur only on static glass tiles + fixed chrome, NEVER the scroll container
- aurora drift + intentional entrance only; transform/opacity; `prefers-reduced-motion` kills ALL motion
- 390px zero h-scroll · ≥44px targets · single-col collapse ≤640px · min-h:100dvh · nowrap labels
- locked 5-tab nav verbatim · caption "C6 · Bento-Depth" · AI coach disclosure kept
- one accent ~10% · mono tabular-nums on every metric · depth via lightness+hairlines+glass, not glow

## Iteration lenses (rotating)
1. Taste & hierarchy — `taste`, `ui-ux-design-pro`
2. Motion & micro-interactions — `transitions-dev`
3. Depth & material craft — `frontend-design`, `taste-redesign`
4. UX heuristics & accessibility — `ux-designer`, `design-review`
5. Data-viz polish — legibility + honest scale

## Log
| # | Lens | Outcome |
|---|------|---------|
| 0 | baseline (v2 wow pass) | metrics→viz, bento rhythm, mesh+grain aurora, floating hero |
| 1 | Taste & hierarchy | in progress |
