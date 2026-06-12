# Sprint Society — Execution Runbook (Single Terminal, Sequential)

> **How to use this document:** work top to bottom, one task at a time, on your
> laptop with Claude Code (Opus 4.6). For each task: start a **fresh** Claude
> session, paste the prompt exactly as written, let it finish, run the
> verification checklist, push, check the deployed app on your phone, then move
> to the next task. Never run two tasks in one session.
>
> **Priorities if you run out of time:** Tasks 1–5 are MUST (the app is broken
> for paying users without them). Tasks 6–10 are SHOULD. Tasks 11–12 are POLISH.
> Stopping after any verified task leaves the app in a safe state.

---

## Step 0 — One-time setup (~15 min)

In your terminal, inside the Sprint-Society repo:

```bash
git checkout main
git pull origin main
git merge origin/claude/app-improvement-ai-coach-2rtpst   # brings in the plan docs
git push origin main
npm install
```

Then start Claude Code and confirm the model:

```bash
claude
/model        # should show Opus 4.6 (claude-opus-4-6)
```

Rules for the whole run:

1. **One fresh session per task** — type `/clear` (or exit and rerun `claude`)
   before each new task. Long sessions get confused.
2. **Work directly on `main`** (you have no users yet; simplest is safest for a
   single-terminal workflow). Claude commits each task; you push only after the
   task's verification passes.
3. After each push, Railway redeploys — wait for the deploy to finish, then do
   the phone checks listed in each task.
4. If a task goes sideways: `git status` → ask Claude to fix; worst case
   `git reset --hard origin/main` reverts everything unpushed.
5. If you get stuck for more than ~20 minutes, open a Claude web session
   (Sprint-Society repo) and ask for help debugging — that's the reviewer side.

---

## DAY 1 — MUST tasks

### Task 1 — Subscription tier bug + invalid model ID  `[MUST]`

**Fixes:** paying ₹9 users are locked out of everything; chat calls a model that
doesn't exist.

Paste into Claude:

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
hardcoding checkUsageLimit(userId,'pro'). Add vitest + a test script if the repo has
none yet, with tests for getUserPlan/requirePlan across free/base/pro/expired.
Quality gate: npm run build passes, typecheck clean, tests green, update
docs/USER-GUIDE.md and docs/PM-GUIDE.md, then commit with a clear message and show
me the build + test output.
```

**Verify, then push:**
- [ ] Claude showed passing build + tests in its final output
- [ ] `git log --oneline -3` shows the commit
- [ ] `git push origin main` → Railway deploys → app loads on your phone, you can
      log in and see the dashboard

---

### Task 2 — Tests + CI  `[MUST]`

**Why now:** you verify on your phone only — CI is your safety net for every
following task.

```
Add a test foundation and CI. Vitest covering: all pure engines (tierClassifier,
paceCalculator, vo2max, trainingPlanGenerator phase math, adaptiveEngine ACWR
thresholds, classification-engine advancement rules), subscription gating, auth flow
(register/login/me via supertest with a temp sqlite db), run-log cascade (activity
insert → XP → PR detection). GitHub Actions workflow: install, typecheck both
workspaces, lint, test, build on every PR and push to main. Add npm run test +
npm run typecheck root scripts. Suite under 2 minutes.
Quality gate: npm run build passes, typecheck clean, tests green, then commit and
show me the test output.
```

**Verify, then push:**
- [ ] `npm run test` passes locally
- [ ] After push: GitHub → Actions tab → workflow runs and goes green

---

### Task 3 — N+1 queries + indexes + timezone  `[MUST]`

```
Fix N+1 queries: rewrite social.routes.ts:23-34 (4 correlated subqueries per feed
activity), events.routes.ts:66-67 (friendsGoing per event in a loop),
admin.routes.ts:33-42 (3 subqueries per runner) as JOIN+GROUP BY. Add indexes:
ai_usage(user_id, created_at), community_chat_messages(community_id, created_at),
kendu_transactions(user_id, created_at). Add users.timezone TEXT DEFAULT
'Asia/Kolkata' migration + expose in profile edit. Benchmark feed endpoint
before/after and show me the numbers.
Quality gate: npm run build passes, typecheck clean, tests green, docs updated,
then commit.
```

**Verify, then push:**
- [ ] Tests green; benchmark numbers improved
- [ ] Phone: social feed and events pages load and feel snappier

---

### Task 4 — Env validation + feature flags (kill switch)  `[MUST]`

```
(1) Startup env validation: fail fast in production when JWT_SECRET missing/short;
remove hardcoded fallback in websocket.ts:28; loud warnings for RAZORPAY_* and
GOOGLE_CLIENT_ID. (2) Wire the existing feature_flags table (currently dead):
server-side isFlagEnabled() helper + GET /api/flags for the client; create one flag
per launch-risky feature plus reserved flags ai_chat, ai_voice, ai_generation for
the future AI coach connection (off by default). Admin panel toggle UI exists
(admin-flags.routes.ts) — verify it works end to end and gate at least one real
feature with a flag as proof.
Quality gate: npm run build passes, typecheck clean, tests green, docs updated,
then commit.
```

**Verify, then push:**
- [ ] Server still boots locally (`npm run dev:server` for 10 seconds, Ctrl-C)
- [ ] Phone: admin panel → flip the proof flag off → feature disappears; flip back on

---

### Task 5 — Silent failures + API envelope  `[MUST — run alone, it touches everything]`

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
Quality gate: npm run build passes, typecheck clean, tests green, docs updated,
then commit.
```

**Verify, then push:**
- [ ] Tests green (this task breaks things if done sloppily — trust the suite)
- [ ] Phone: walk every main page (dashboard, coach, social, events, runs,
      profile, admin) — everything renders, no blank screens

**End of Day 1 (recommended):** open a Claude web session and say:
*"Review everything pushed to main today on Exploring-To-See/Sprint-Society —
look for bugs, regressions, and missed call sites in the subscription and envelope
changes."* Fix tomorrow morning whatever it finds.

---

## DAY 2 — SHOULD tasks

### Task 6 — Batch endpoints (dashboard speed)  `[SHOULD]`

```
Create GET /api/dashboard and GET /api/coach/insights batch endpoints. Dashboard returns
{xp, tier, challenges, runStats, planWeek, profilingStatus} in one response (the data
currently fetched by 4-6 separate queries in client/src/components/dashboard/Dashboard.tsx).
Insights returns everything AIAnalyticsTab.tsx fetches with its 7 queries (adaptive load,
weekly summary, vdot, tier, race predictions, stats, records). Implement as single
handlers running the existing prepared statements. Update the client to use one useQuery
per page with staleTime 2 minutes, and invalidate these keys after run-log and
goal mutations. Delete the replaced per-widget queries. Verify identical rendered data.
Quality gate: npm run build passes, typecheck clean, tests green, docs updated,
then commit.
```

**Verify, then push:** phone — dashboard and Insights tab load noticeably faster,
all numbers still show.

### Task 7 — Animation / bundle / image budget  `[SHOULD]`

```
Performance pass on the client. Stagger only the first ~6 visible cards and use
viewport={{ once: true }} on Framer Motion lists (Dashboard.tsx currently animates
hundreds of motion.divs with 0.07s stagger); reduce Confetti to CSS or 12 particles.
React.memo feed/run cards; useMemo chart data; virtualize the social feed with
@tanstack/react-virtual. Dynamic-import leaflet (EventMapView, RunTrackerPage) and
html-to-image (SharePage). Add loading="lazy" + fixed aspect ratios to all images.
Add rollup-plugin-visualizer and report bundle size before/after.
Quality gate: npm run build passes, typecheck clean, tests green, docs updated,
then commit.
```

**Verify, then push:** phone — feed scrolls smoothly, share card still exports,
events map still loads.

### Task 8 — WebSocket notifications  `[SHOULD]`

```
Replace notification polling (AppShell refetchInterval 30s, ChatFAB 60s) with pushes
over the existing /ws WebSocket server (server/src/websocket.ts). Server emits
notification events on create; client updates the react-query cache on message;
fall back to 5-minute polling only when the socket is disconnected. Remove the
fixed intervals.
Quality gate: npm run build passes, typecheck clean, tests green, docs updated,
then commit.
```

**Verify, then push:** phone — trigger a notification (e.g., kudos from a second
account) and watch it appear without refreshing.

### Task 9 — Logging + Sentry + backups  `[SHOULD]`

```
(1) Structured logging with pino + request IDs; replace every bare console.error;
no PII in logs. (2) Sentry on client and server (free tier), sourcemaps uploaded on
build, reading SENTRY_DSN from env (leave placeholder if unset, must not crash
without it). (3) Nightly sqlite backup: scheduler job runs sqlite3 .backup, uploads
to object storage (read target from env), prunes to 14 days; write docs/RESTORE.md.
Quality gate: npm run build passes, typecheck clean, tests green, docs updated,
then commit.
```

**Verify, then push:** create a free Sentry project, set `SENTRY_DSN` on Railway,
confirm a test event arrives. Backup job needs storage credentials — set them when
you have them; the app must run fine without.

### Task 10 — Razorpay end-to-end  `[SHOULD]`

```
Complete Razorpay: order creation, checkout, webhook signature verification,
payment_history, subscription activate/renew/expire lifecycle (expiry → view-only
plan mode), upgrade Base→Pro (simplest: new period), test-mode E2E test with
Razorpay test keys. Leave LIVE keys as env placeholders + a docs/PM-GUIDE.md launch
checklist item for the founder.
Quality gate: npm run build passes, typecheck clean, tests green, docs updated,
then commit.
```

**Verify, then push:** set Razorpay **test** keys on Railway, buy Base on your
phone with a test card, confirm the subscription activates and gates open.

---

## DAY 2 evening / Day 3 — POLISH

### Task 11 — Design polish  `[POLISH]`

```
Design system pass: semantic type scale in tailwind.config.ts (display/h1/h2/body/
caption/label) replacing arbitrary text-[22px] values; one card/button/input
vocabulary actually used everywhere (Button component exists but pages bypass it);
lucide-react icons replacing the emoji/SVG mix; consistent radius/spacing scale;
skeletons (not spinners) on every async surface including the map. Hero surfaces
first: dashboard "today" block and post-run share card. 375px always.
Quality gate: npm run build passes, typecheck clean, tests green, docs updated,
then commit.
```

### Task 12 — Admin metrics dashboard  `[POLISH]`

```
Admin metrics dashboard: WAU, runs/user/week, D7/D30 retention, Base→Pro
conversion, subscription/payment stats, and (reserved panels reading ai_usage,
empty until the coach connects) AI cost per user. Automate daily_metrics population
via the scheduler (currently manual). Aggregates only — no user conversation
content anywhere in admin, ever.
Quality gate: npm run build passes, typecheck clean, tests green, docs updated,
then commit.
```

### Final pass

In a fresh Claude session on the laptop, run the repo's own review skills:

```
/audit
```

then

```
/sprint-team
```

Fix what they flag, then walk the launch checklist in
`docs/IMPROVEMENT-PLAN.md` §4 on your phone against the deployed app.

---

## Cheat sheet

| Situation | Do |
|---|---|
| Starting a new task | `/clear`, paste the task prompt |
| Claude says done | Check it showed build+test output; `git log --oneline -3` |
| Verification passed | `git push origin main`, wait for Railway, phone-check |
| Something broke after push | Tell Claude: "the deploy broke X, investigate and fix" — or `git revert HEAD && git push` |
| Unpushed mess | `git reset --hard origin/main` (throws away local changes) |
| Stuck > 20 min | Open Claude on the web, ask it to review/debug that area |
| Out of time | Stop after any verified task — every stopping point is safe |
