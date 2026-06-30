# Audit-gaps branch — engineer handoff

Branch: `fix/audit-gaps` (off `origin/main` @ the deployed Emergent V1 merge `0e4ff6b`).
Purpose: give UI to the "backend exists, no frontend" gaps from `docs/FEATURE-WIRING-AUDIT.md`.
**Do not** merge blindly to production — this branch is for you to review and wire into `main`.

## Status
- ✅ Client typecheck (`cd client && npx tsc -b --noEmit`) — clean
- ✅ Vite production build (`cd client && npm run build`) — green, PWA SW generated
- ✅ Wiring audit (qa pass): every new `api.*` call's fields verified against the route handler at source. 2 silent-data bugs found and fixed:
  - CoachInsights race predictions read `predicted_time` → now `predicted_seconds`/`predicted_formatted`
  - CoachZones LT-HR read `lt_hr`/`avg_heartrate` → now `lt_heartrate`
- Backend: **unchanged**. All new UI consumes existing routes only.

## Files changed (11)
| File | Wires |
|---|---|
| `components/coach/CoachRecovery.tsx` *(new)* | `/wellness/today,/week,/recovery-factor,/log`; `/heartrate/hrv/trend`, `POST /heartrate/hrv` |
| `pages/CoachPage.tsx` | adds 6th sub-tab **Recovery** |
| `components/coach/CoachZones.tsx` | `GET/POST /training/lt-test` |
| `components/coach/CoachPlan.tsx` | real `/insights/pre-run` brief |
| `components/coach/CoachInsights.tsx` | real `/runs/chart-data` sparkline + predictions fix |
| `pages/ProgressPage.tsx` | `/progress/monthly`, `/progress/all-time` |
| `pages/EventsPage.tsx` | `/events/my`, `/events/nearby` |
| `pages/SubscriptionPage.tsx` | `POST /subscription/upgrade`, `GET /subscription/history` |
| `pages/ProfilePage.tsx` | `/gamification/history` |
| `pages/RunHistoryPage.tsx` | `/heartrate/analysis/:id`, `/insights/post-run/:id` |
| `pages/SocialPage.tsx` | `/social/discover,/following,/followers` + follow/unfollow + `/gamification/leaderboard,/friend-streaks` |

## Wiring into main — checklist
1. **Merge/PR** `fix/audit-gaps` → `main`. No backend or route changes, so no API contract risk.
2. **Nav:** Recovery is a Coach sub-tab — no nav change. Every other addition lives inside an already-routed page.
3. **Razorpay:** SubscriptionPage upgrade reuses the existing `openRazorpay` order→verify flow — no new keys/config.
4. **Geolocation:** Events → Nearby requests `navigator.geolocation` once; denial shows an empty state (no crash). Confirm prod is HTTPS (it is, on Vercel) so geolocation is allowed.
5. **Regression to confirm:** SocialPage's old "Communities" sub-tab was replaced by social lanes. Communities is still reachable from `BottomNav` (verified). If you want it back on the social pillar, re-add a lane or a header link.
6. **Build:** Vercel runs `cd client && npm install && npm run build` — already green locally.

## Deliberately NOT built (wire into their flows, not standalone screens)
- **Kendu spends with no UI:** `spend/community` (community-create), `spend/event` + `spend/rsvp` (event host/RSVP), `spend/group-challenge`, `upkeep/reactivate`. These are actions inside other flows — add the spend confirm (reuse `components/kendu/KenduSpendConfirmModal`) at the action site.
- **`GET /records/check/:activityId`** PR-celebration — fire from the run-complete flow in `RunTrackerPage` after `POST /runs/log`.
- **Proactive insights** (`GET /insights`, `/insights/athlete-profile`, `/insights/weekly-summary`) — candidate new section in CoachInsights.
- **`/adaptive/load` `/this-week` `/vdot-progression`** — already surfaced via the `/coach/insights` batch; a dedicated screen is optional.

## Still backend-only by design (no UI ever)
`/cron/maintenance` (Vercel Cron), `/subscription/webhook` (Razorpay), `/admin/analytics/track` (beacon), WebSocket `/ws`.

## Design notes
New UI uses the V1 `ss/` kit (`SSSeg`, `SSStates`, `ss-*` classes, `components/ss/icons`) — no emoji, mobile-first 375px, loading/empty/error on every surface. The pre-V1 pages (Progress/Events/Subscription/Social/Profile/RunHistory) still render inside the old `AppShell`/`BottomNav` shell; full V1 shell migration of those pages is future work.
