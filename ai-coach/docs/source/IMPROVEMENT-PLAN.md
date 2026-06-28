# Sprint Society — Production Plan v2 (App)

> Decisions locked 2026-06-12 after founder Q&A. Execute as Opus 4.6 waves —
> ready-to-run prompts in §3.
>
> **Scope note:** the AI coach is being built as a **separate track** and will be
> connected to the app later. Everything the coach is and does is specified in
> `docs/AI-COACH-SPEC.md` — it is intentionally NOT part of this plan. This plan
> makes the app itself production-ready so the coach has a solid home to plug into.

---

## 0. Diagnosis

Foundation is good: 13 deterministic engines, React Query + code-split client, real
token system. Problems are execution-level:

- **Lag**: 4–8 queries per page (AIAnalyticsTab fires 7), 30s polling, heavy Framer
  Motion stagger, leaflet/html-to-image in main bundle, N+1 queries on feed/events/admin.
- **Disconnected**: silent `.catch(() => {})` everywhere, inconsistent API shapes,
  dead duplicate pages, half-built features (push, email reset, Razorpay, flags).
- **Confirmed bugs**:
  1. `middleware/subscription.ts` hierarchy is `{free, pro, premium}` but DB seeds
     `base`/`pro` → **paying ₹9 users resolve to `undefined` and fail every gate**.
  2. `ai.service.ts:235` calls model `claude-sonnet-4-6-20250514` — **invalid model
     ID** (correct: `claude-sonnet-4-6`). Cheap one-line fix now; matters when the
     coach connects.

---

## 1. Locked product decisions (app-level)

- **Naming:** the coach feature stays the **AI Coach** — no separate brand name.
  (Kendu remains the in-app currency only.)
- **Tiers:** no free tier. `base` ₹9/mo and `pro` ₹99/mo (`subscription_plans`).
  Middleware hierarchy `{free:0, base:1, pro:2}` where `free` = no active
  subscription = locked previews only. Lapsed subscription → existing plan becomes
  view-only, auto-tracking continues, no new generation/adaptation.
  Which coach capabilities belong to which tier: see `docs/AI-COACH-SPEC.md` §4.
- **Feature flags** get wired for real (currently dead code) — they gate launch-risky
  features and will be the AI kill switch when the coach connects.
- **Timezone:** users get a `timezone` column (default `Asia/Kolkata`) — scheduled
  jobs (and later the coach's Sunday summaries) run per user's local time.
- **Privacy:** user chats (when the coach connects) are never admin-readable;
  admin sees aggregates only.
- **Payments:** Razorpay wired + tested end-to-end pre-launch; founder flips live
  keys (SS-031).
- **Data:** SQLite is fine to ~500 users; nightly backups to object storage.
- **Launch:** ASAP — 50 beta testers, open signup, then widen. **Nothing is cut**;
  anything unverified by beta day is hidden behind a feature flag, not deleted.
- **Quality gate on every wave:** typecheck + tests green before merge.

---

## 2. Wave plan

| Wave | Parallel Opus sessions | Outcome |
|---|---|---|
| 1 | (a) tier fix + model-ID fix + gating audit, (b) silent failures + API envelope, (c) N+1 + indexes + timezone column, (d) env validation + feature-flag wiring | Nothing broken for a paying user |
| 2 | (a) batch endpoints + client adoption, (b) animation/bundle/image budget, (c) WebSocket notifications | Strava feel |
| 3 | (a) tests + CI, (b) logging + Sentry + backups, (c) Razorpay end-to-end + subscription lifecycle | Production hardening |
| 4 | (a) design polish pass (type scale, icons, skeletons), (b) admin metrics dashboard | Launch quality |
| 5 | `/audit` + `/sprint-team` review, fix wave, beta-day flag review | Launch |
| — | **AI coach connection — separate track, later.** Build per `docs/AI-COACH-SPEC.md`; integrate behind the `ai_*` feature flags when ready. | Coach plugs into a healthy app |

---

## 3. Ready-to-run Opus 4.6 prompts

Every prompt ends with: *"Quality gate: npm run build passes, typecheck clean, new
code has vitest coverage, docs/USER-GUIDE.md and docs/PM-GUIDE.md updated."*

**Wave 1a — tier + model ID**
```
Two production-blocking bugs. (1) server/src/middleware/subscription.ts uses
PLAN_HIERARCHY {free, pro, premium} but server/src/database/db.ts:186-208 seeds plan
keys 'base'(₹9)/'pro'(₹99) — paying Base users resolve to undefined and fail every
requirePlan check. Change hierarchy to {free:0, base:1, pro:2}, remove 'premium',
audit EVERY requirePlan/getUserPlan call site against the tier matrix in
docs/AI-COACH-SPEC.md §4 (AI-specific gates stay in place for when the coach
connects; non-AI features: Base = plans, summaries, pace/HR zones, events,
communities, social, leaderboard; Pro adds adaptive engine, transformation plans,
weekly challenges, PRs, create communities). Free (no sub) = registration + locked
previews only; there is NO free tier of features. Lapsed subscription: plan becomes
view-only, auto-tracking continues, no adaptation. (2) server/src/services/
ai.service.ts:235 uses invalid model 'claude-sonnet-4-6-20250514' — replace with
'claude-sonnet-4-6' and centralize model IDs in config. Also fix chatWithSonnet
hardcoding checkUsageLimit(userId,'pro'). Vitest tests for getUserPlan/requirePlan
across free/base/pro/expired.
```

**Wave 1b — silent failures + API envelope**
```
Eliminate silent failures and standardize API responses. Server: every route returns
{ data } on success or { error: { code, message } } on failure; wrap all JSON.parse of
DB fields (server/src/routes/runs.routes.ts:131, social.routes.ts:190) in safe parsers;
replace the empty catch in server/src/websocket.ts:95 with logged handling; make
/api/runs return one shape. Client: extend client/src/lib/api.ts to unwrap the envelope
and throw typed errors; add a global error toast + per-query inline error states with
retry buttons for every useQuery currently using .catch(() => {}) or no error UI
(start with RunTrackerPage.tsx:116-123). Share envelope types via shared/types.ts.
No raw error text shown to users. Must work at 375px viewport.
```

**Wave 1c — N+1 + indexes + timezone**
```
Fix N+1 queries: rewrite social.routes.ts:23-34 (4 correlated subqueries per feed
activity), events.routes.ts:66-67 (friendsGoing per event in a loop),
admin.routes.ts:33-42 (3 subqueries per runner) as JOIN+GROUP BY. Add indexes:
ai_usage(user_id, created_at), community_chat_messages(community_id, created_at),
kendu_transactions(user_id, created_at). Add users.timezone TEXT DEFAULT
'Asia/Kolkata' migration + expose in profile edit. Benchmark feed endpoint before/after.
```

**Wave 1d — env validation + feature flags**
```
(1) Startup env validation: fail fast in production when JWT_SECRET missing/short;
remove hardcoded fallback in websocket.ts:28; loud warnings for RAZORPAY_* and
GOOGLE_CLIENT_ID. (2) Wire the existing feature_flags table (currently dead):
server-side isFlagEnabled() helper + GET /api/flags for the client; create one flag
per launch-risky feature plus reserved flags ai_chat, ai_voice, ai_generation for
the future AI coach connection (off by default). Admin panel toggle UI exists
(admin-flags.routes.ts) — verify it works end to end.
```

**Wave 2a — batch endpoints**
```
Create GET /api/dashboard and GET /api/coach/insights batch endpoints. Dashboard returns
{xp, tier, challenges, runStats, planWeek, profilingStatus} in one response (the data
currently fetched by 4-6 separate queries in client/src/components/dashboard/Dashboard.tsx).
Insights returns everything AIAnalyticsTab.tsx fetches with its 7 queries (adaptive load,
weekly summary, vdot, tier, race predictions, stats, records). Implement as single
handlers running the existing prepared statements. Update the client to use one useQuery
per page with staleTime 2 minutes, and invalidate these keys after run-log and
goal mutations. Delete the replaced per-widget queries. Verify identical rendered data.
```

**Wave 2b — animation/bundle/image budget**
```
Performance pass on the client. Stagger only the first ~6 visible cards and use
viewport={{ once: true }} on Framer Motion lists (Dashboard.tsx currently animates
hundreds of motion.divs with 0.07s stagger); reduce Confetti to CSS or 12 particles.
React.memo feed/run cards; useMemo chart data; virtualize the social feed with
@tanstack/react-virtual. Dynamic-import leaflet (EventMapView, RunTrackerPage) and
html-to-image (SharePage). Add loading="lazy" + fixed aspect ratios to all images.
Add rollup-plugin-visualizer and record bundle size before/after; set a budget.
Must stay smooth at 375px on a mid-range phone.
```

**Wave 2c — WebSocket notifications**
```
Replace notification polling (AppShell refetchInterval 30s, ChatFAB 60s) with pushes
over the existing /ws WebSocket server (server/src/websocket.ts). Server emits
notification events on create; client updates the react-query cache on message;
fall back to 5-minute polling only when the socket is disconnected. Remove the
fixed intervals.
```

**Wave 3a — tests + CI**
```
Add a test foundation and CI. Vitest covering: all pure engines (tierClassifier,
paceCalculator, vo2max, trainingPlanGenerator phase math, adaptiveEngine ACWR
thresholds, classification-engine advancement rules), subscription gating, auth flow
(register/login/me via supertest with a temp sqlite db), run-log cascade (activity
insert → XP → PR detection). GitHub Actions workflow: install, typecheck both
workspaces, lint, test, build on every PR and push to main. Add npm run test +
npm run typecheck root scripts. Suite under 2 minutes.
```

**Wave 3b — logging + Sentry + backups**
```
(1) Structured logging with pino + request IDs; replace every bare console.error;
no PII in logs. (2) Sentry on client and server (free tier), sourcemaps uploaded on
build. (3) Nightly sqlite backup: scheduler job runs sqlite3 .backup, uploads to
object storage, prunes to 14 days; write docs/RESTORE.md and test a restore once.
```

**Wave 3c — Razorpay end-to-end**
```
Complete Razorpay: order creation, checkout, webhook signature verification,
payment_history, subscription activate/renew/expire lifecycle (expiry → view-only
plan mode), upgrade Base→Pro (simplest: new period), test-mode E2E test with
Razorpay test keys. Leave LIVE keys as env placeholders + a docs/PM-GUIDE.md launch
checklist item for the founder.
```

**Wave 4a — design polish**
```
Design system pass: semantic type scale in tailwind.config.ts (display/h1/h2/body/
caption/label) replacing arbitrary text-[22px] values; one card/button/input
vocabulary actually used everywhere (Button component exists but pages bypass it);
lucide-react icons replacing the emoji/SVG mix; consistent radius/spacing scale;
skeletons (not spinners) on every async surface including the map. Hero surfaces
first: dashboard "today" block and post-run share card. 375px always.
```

**Wave 4b — admin metrics dashboard**
```
Admin metrics dashboard: WAU, runs/user/week, D7/D30 retention, Base→Pro
conversion, subscription/payment stats, and (reserved panels reading ai_usage,
empty until the coach connects) AI cost per user. Automate daily_metrics population
via the scheduler (currently manual). Aggregates only — no user conversation
content anywhere in admin, ever.
```

---

## 4. Launch checklist (beta day, 50 users)

- [ ] Wave 1 bugs verified fixed (a Base user pays ₹9 and every Base feature works)
- [ ] Razorpay live keys flipped by founder (SS-031)
- [ ] Feature flags tested (toggle off → feature hidden cleanly)
- [ ] Unverified features behind flags (hidden, not deleted)
- [ ] Nightly backup ran + restore tested once
- [ ] Sentry receiving events; CI green on main
- [ ] /audit + /sprint-team review passed
- [ ] AI coach: NOT connected yet — `ai_*` flags off, chat tab shows "Coming Soon";
      connection happens later per `docs/AI-COACH-SPEC.md`
