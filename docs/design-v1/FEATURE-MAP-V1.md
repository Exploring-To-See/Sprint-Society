# Sprint Society — Feature Map **V1**

> **Status:** ✅ **FINAL v1.0 — SEALED** (council converged at R9: 2 consecutive clean rounds R8+R9, both unanimous 0/0/0, all claims independently repo-verified at source). 9-round audit trail: R1 3crit/5maj · R2 found a live WebSocket subsystem + 4-job scheduler R1 missed (Strava dormant) · R3 0crit/1maj (Web Push schema-only) · R4 clean · R5 +§11 Q12/Q13 · R6 Q12 wording · R7 fixed fake `/gamification/challenges`→`/coaching/challenges` · R8+R9 clean → sealed. Every finding across all rounds repo-verified; none dropped. Built by exhaustive repo inventory (not memory). **Ready for external repo audit.**
> **Purpose:** Single, complete map of every backend + frontend feature, the data model,
> how they connect, the full page/navigation graph, and what is missing. Send this +
> `UI-UX-V1.md` + `sprint-society-home.html` for external audit against the repo.
> **Date:** 2026-06-25 · **Owner:** Ishan / Kendu Entertainment
> **Repo state at capture:** 39 route files · 282 API endpoints · 22 engine modules ·
> 73 Postgres tables · 35 React pages · 17 component dirs · **+ 1 WebSocket server (`/ws`)
> + 1 background scheduler (4 cron jobs)** — neither is a route file (see §1E, §10.3).
>
> **How to read:** §1 backend by domain · §2 engines · §3 data model · §4 pages · §5
> components · §6 the cross-layer Feature→Page→Endpoint→Engine→Table map (what the audit
> checks) · §7 redirection & navigation graph · §8 pages have-vs-need · §9 missing /
> incomplete features · §10 dependencies · §11 open questions.
>
> Legend: 🎯 = one of the 5 redesign targets · ⚠️ = dead/unrouted legacy code.

---

# 1. Backend Feature Inventory (by domain)

## 1A. Auth & Onboarding

### `server/src/routes/auth.routes.ts` (mount `/api/auth`)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/api/auth/register` | Create a new user account (zod-validated), optionally apply an invite code, seed XP, auto-join Sprint Social Club, award welcome bonus, and return a JWT. | public |
| POST | `/api/auth/login` | Authenticate by email or Indian phone number plus password (bcrypt compare) and return a JWT. | public |
| GET | `/api/auth/me` | Return the authenticated user's profile fields (parses injury_history JSON). | user |
| PUT | `/api/auth/profile` | Update an allowlisted set of the authenticated user's profile fields with per-field validation. | user |

**Engines/Services:** `engine/kenduEngine.awardWelcomeBonus`, `routes/notifications.routes.createNotification`, `utils/jwt.signToken`, `bcryptjs`, `zod`
**Tables:** `invite_codes`, `users`, `invite_code_usage`, `user_xp`, `communities`, `community_members`

### `server/src/routes/password.routes.ts` (mount `/api/auth`)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/api/auth/forgot-password` | Issue a password reset token (rate-limited to 3/hour/user) and email a reset link; always returns generic success to prevent email enumeration. | public |
| POST | `/api/auth/reset-password` | Validate a non-expired reset token, set the new bcrypt password hash, and delete all of that user's reset tokens. | public |
| PUT | `/api/auth/change-password` | Change the authenticated user's password after verifying the current password. | user |

**Engines/Services:** `services/email.service.sendPasswordResetEmail`, `crypto`, `zod`, `config`, `bcryptjs`
**Tables:** `users`, `password_reset_tokens`

### `server/src/routes/google-auth.routes.ts` (mount `/api/auth`)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/api/auth/google` | Verify a Google ID token (cached Google certs, RS256, audience/issuer/email_verified checks), then log in by google_id, link to an existing email account, or atomically create a passwordless user (seed XP, auto-join Sprint Social Club, welcome bonus); returns a JWT. | public |

**Engines/Services:** `engine/kenduEngine.awardWelcomeBonus`, `routes/notifications.routes.createNotification`, `utils/jwt.signToken`, `axios (Google oauth2 v1 certs)`, `jsonwebtoken`, `config.google.clientId`
**Tables:** `users`, `user_xp`, `communities`, `community_members`

### `server/src/routes/invite.routes.ts` (mount `/api/invite`)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/api/invite/validate` | Validate an invite code (active, under max_uses, not expired) and return its name and remaining spots. | public |
| POST | `/api/invite/waitlist` | Add an email/phone (and optional name) to the waitlist if not already present, returning the waitlist position (total count). | public |

**Engines/Services:** none
**Tables:** `invite_codes`, `waitlist`

### `server/src/routes/onboarding.routes.ts` (mount `/api/onboarding`)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/onboarding/status` | Compute the user's onboarding step (track_run/analyzing/smart_questions/generating_plan/complete) from run count, profile, and plan existence, plus an auto-detected runner profile. | user |
| GET | `/api/onboarding/detect` | Auto-detect a runner profile from up to 100 recent activities and return it with a data summary (or has_data=false if none). | user |
| POST | `/api/onboarding/smart-profile` | Upsert the user's onboarding profile (goal, schedule, race target, injuries, lifestyle) and auto-update users.running_experience from detected activity data. | user |
| GET | `/api/onboarding/profile` | Legacy: return the user's raw user_profiles row (parses medical_conditions and previous_sports JSON), or {} if none. | user |
| POST | `/api/onboarding/profile` | Legacy: 307-redirect to /api/onboarding/smart-profile (or 400 if that route is missing). | user |

**Engines/Services:** `engine/autoDetection.detectRunnerProfile`, `zod`
**Tables:** `users`, `activities`, `user_profiles`, `transformation_plans`


## 1B. Runs, Records & Heart Rate

### `server/src/routes/runs.routes.ts` — mounted at `/api/runs`

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/` | user | Paginated list of the user's runs (page/limit query params), excluding soft-deleted rows. |
| GET | `/stats` | user | Aggregate lifetime stats: total runs, distance, time, avg/best pace, longest run, total elevation. |
| GET | `/chart-data` | user | Per-run series (date, distance, time, pace) for the last N weeks (default 12) for charting. |
| GET | `/weekly-summary` | user | Current-week totals (distance, runs, time, avg pace) plus pace improvement vs last week. |
| GET | `/trends` | user | Last 8 weeks of weekly volume (km), run count, and days-run for consistency tracking. |
| POST | `/log` | user | Log a completed run with anomaly validation, insert activity, then run XP/Kendu/achievement/notification cascade. |
| GET | `/:id` | user | Fetch a single run owned by the user, with parsed latlng/splits JSON. |

**Engines/Services:** `executeRunCascade` (engine/runCascade), `safeJsonParse` (utils/response)
**Tables:** `activities`

### `server/src/routes/records.routes.ts` — mounted at `/api/records`

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/` | user | All personal records (race + effort PRs) computed from the user's activities, with summary. |
| GET | `/check/:activityId` | user | Check whether a specific activity set any new PRs vs all prior activities; returns celebration payload. |
| GET | `/timeline` | user | PR progression over time (5K, 10K, fastest pace) built by replaying activities chronologically. |

**Engines/Services:** `calculateAllPRs`, `getPRSummary`, `checkForNewPRs` (engine/personalRecords); `generateCelebration`, `formatSeconds`, `formatPace` (local helpers)
**Tables:** `activities`

### `server/src/routes/heartrate.routes.ts` — mounted at `/api/heartrate`

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/zones` | user | Personalized HR zones from estimated/activity-derived max HR and estimated resting HR, with calibration source. |
| GET | `/analysis/:activityId` | user | Analyze HR for one activity: infer session type from pace and assess HR against the user's zones. |
| GET | `/trends` | user | Cardiac efficiency (pace vs HR) per run over last N weeks (default 12) with early-vs-recent improvement summary. |
| POST | `/hrv` | user | Log a daily HRV reading (rmssd/sdnn/source), upserting on (user_id, date). |
| GET | `/hrv/trend` | user | 7-day HRV trend vs 30-day baseline, producing recovery status, recovery factor, and recommendation. |

**Engines/Services:** `estimateMaxHR`, `calculateHRZones`, `analyzeActivityHR`, `detectAerobicDecoupling` (engine/heartRateZones)
**Tables:** `users`, `activities`, `hrv_readings`

### `server/src/routes/adaptive.routes.ts` — mounted at `/api/adaptive`

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/load` | user | Training load metrics (ATL/CTL/TSB, monotony, strain, injury risk) over last 35 days plus advice. |
| GET | `/this-week` | user | Adapt the current plan week based on last week's performance, training load, and pace/volume adjustments. |
| GET | `/vdot-progression` | user | VDOT evolution from qualifying runs (1.5km+) with current training paces and trend interpretation. |
| GET | `/summary` | user | Dashboard overview: training load, VDOT fitness, detraining, running economy, weekly run count, summary message. |

**Engines/Services:** `calculateTrainingLoad`, `analyzeWeekPerformance`, `adaptNextWeek`, `trackVDOTProgression`, `detectDetraining`, `calculateRunningEconomy` (engine/adaptiveEngine); `getTrainingPaces` (engine/trainingPlanGenerator); `inferSessionType`, `buildSummaryMessage` (local helpers)
**Tables:** `users`, `activities`, `transformation_plans`


## 1C. Coaching, AI & Training

### `coaching.routes.ts` — mount `/api/coaching`

| Method | Path | Purpose | Auth | Engines / Services | Tables |
|---|---|---|---|---|---|
| GET | `/tier` | Classify user's running tier and log result to tier_history | user | `tierClassifier.classifyTier` | users, activities, tier_history |
| GET | `/ideal-pace` | Compute ideal pace zones from tier and compare to recent runs | user | `tierClassifier.classifyTier`, `paceCalculator.calculateIdealPace`, `paceCalculator.analyzeCurrentPace` | users, activities |
| GET | `/transformation` | Generate a transformation plan from current vs target pace and persist it | user | `tierClassifier.classifyTier`, `paceCalculator.calculateIdealPace`, `transformationPlan.generateTransformationPlan` | users, activities, transformation_plans |
| GET | `/challenges` | Fetch this week's challenges, generating them if none exist | user | `tierClassifier.classifyTier`, `challengeGenerator.generateWeeklyChallenges` | challenges, users, activities |
| POST | `/challenges/:id/complete` | Mark a challenge complete, award XP + Kendu, level up, notify | user | `kenduEngine.awardKenduForChallenge`, `notifications.createNotification`, local `calculateLevel()` | challenges, user_xp, xp_transactions, notifications |

### `ai.routes.ts` — mount `/api/ai` (aiLimiter rate limiter; router-level authenticate on all routes)

| Method | Path | Purpose | Auth | Engines / Services | Tables |
|---|---|---|---|---|---|
| GET | `/status` | Report whether AI features/chat are available based on API key and active subscription plan | user | `process.env.ANTHROPIC_API_KEY` | user_subscriptions |
| GET | `/daily-insight` | Return a rule-based daily coaching insight from weekly run stats and streak (no LLM) | user | — | users, user_xp, activities |
| GET | `/profile` | Get the user's AI profile (My AI Profile page) | user | `ai.service.getAIProfile` | ai_profiles (user AI profile storage) |
| PATCH | `/profile` | Update one allowed AI profile field (health_notes, goals, diet_preferences, personal_context) | user | `ai.service.updateAIProfile` | ai_profiles (user AI profile storage) |
| POST | `/evaluate` | Trigger background Haiku training evaluation (called after run sync) | user | `ai.service.evaluateTrainingWithHaiku` (Anthropic Haiku) | via ai.service |
| GET | `/usage` | Return today's AI usage with chat limit/remaining for the user's tier | user | `ai.service.getTodayUsage`, `ai.service.checkUsageLimit` | user_subscriptions (usage tracking) |

### `kendu.routes.ts` — mount `/api/kendu` (router-level authenticate; admin routes also check `users.role==='admin'`)

| Method | Path | Purpose | Auth | Engines / Services | Tables |
|---|---|---|---|---|---|
| POST | `/earn` | Award Kendu after a run (admin-only; normal earning is automatic via runCascade) | admin | `kenduEngine.calculateKenduForRun` | users |
| POST | `/earn-event` | Award Kendu for attending a community event | user | `kenduEngine.awardKenduForEvent`, `getKenduBalance` | kendu_transactions, kendu_balances |
| POST | `/earn-plan` | Award Kendu for completing a training plan | user | `kenduEngine.awardKenduForPlan`, `getKenduBalance` | kendu_transactions, kendu_balances |
| POST | `/earn-workout` | Award Kendu for completing a coach-assigned workout | user | `kenduEngine.awardKenduForWorkout`, `getKenduBalance` | kendu_transactions, kendu_balances |
| GET | `/balance` | Get the current user's Kendu balance | user | `kenduEngine.getKenduBalance` | kendu_balances |
| GET | `/balance/:userId` | Get a specific user's Kendu balance (public info) | user | `kenduEngine.getKenduBalance` | kendu_balances |
| GET | `/history` | Paginated Kendu transaction log for the current user | user | — | kendu_transactions |
| GET | `/offers` | List active offers with per-user redeemed status | user | — | kendu_offers, kendu_redemptions |
| POST | `/redeem` | Redeem an offer for a coupon code | user | `kenduEngine.redeemOffer` | kendu_offers, kendu_redemptions, kendu_coupon_codes, kendu_balances, kendu_transactions |
| GET | `/leaderboard` | Top Kendu earners overall or scoped to an event | user | `kenduEngine.calculateLevel` | kendu_transactions, users, kendu_balances |
| POST | `/admin/offers` | Create a new brand offer | admin | — | users, kendu_offers |
| PUT | `/admin/offers/:id` | Update an existing offer | admin | — | users, kendu_offers |
| DELETE | `/admin/offers/:id` | Deactivate an offer (sets active=0) | admin | — | users, kendu_offers |
| POST | `/admin/offers/:id/codes` | Bulk-upload coupon codes for an offer and bump quantities | admin | — | users, kendu_offers, kendu_coupon_codes |
| GET | `/admin/stats` | Kendu economy dashboard stats (circulation, redemptions, top earner) | admin | — | users, kendu_balances, kendu_redemptions, kendu_offers |
| GET | `/admin/redemptions` | Paginated list of all redemptions with user/offer detail | admin | — | users, kendu_redemptions, kendu_offers |
| GET | `/admin/economy` | Economy health metrics: weekly flow, net-flow ratio, challenge pot | admin | `kenduEngine.getEconomyStats` | users, kendu_transactions, kendu_challenges |
| POST | `/admin/process-upkeep` | Manually trigger community upkeep/subscription processing | admin | `kenduEngine.checkAllUpkeepDue` | users, kendu_subscriptions, kendu_balances, kendu_transactions |
| POST | `/admin/resolve-challenges` | Manually trigger resolution of expired 1v1 challenges | admin | `kenduEngine.resolveExpiredChallenges` | users, kendu_challenges, kendu_balances, kendu_transactions |
| POST | `/spend/community` | Spend Kendu to create a community | user | `kenduEngine.spendToCreateCommunity` | kendu_balances, kendu_transactions, communities |
| POST | `/spend/event` | Spend Kendu to host an event | user | `kenduEngine.spendToHostEvent` | kendu_balances, kendu_transactions |
| POST | `/spend/challenge` | Stake Kendu and create a 1v1 challenge | user | `kenduEngine.spendForChallenge` | kendu_challenges, kendu_balances, kendu_transactions |
| POST | `/challenge/accept` | Accept a pending challenge (stake deducted, status->active) | user | `kenduEngine.spendForChallenge` | kendu_challenges, kendu_balances, kendu_transactions |
| POST | `/challenge/decline` | Decline a pending challenge and refund the challenger | user | — | kendu_challenges, kendu_balances, kendu_transactions |
| GET | `/challenges` | List the user's challenges (as challenger or opponent) | user | — | kendu_challenges, users |
| POST | `/spend/rsvp` | Spend Kendu for priority RSVP to an event | user | `kenduEngine.spendForPriorityRSVP` | kendu_balances, kendu_transactions |
| POST | `/spend/gift` | Gift Kendu to another runner | user | `kenduEngine.giftKendu` | kendu_balances, kendu_transactions |
| GET | `/skins` | List the user's owned premium card skins | user | — | user_skins |
| POST | `/spend/card-skin` | Unlock a premium card skin (rejects if already owned) | user | `kenduEngine.spendForCardSkin` | user_skins, kendu_balances, kendu_transactions |
| POST | `/spend/boost-post` | Boost/pin a community post for 24h | user | `kenduEngine.spendToBoostPost` | community_posts, kendu_balances, kendu_transactions |
| POST | `/spend/group-challenge` | Create a group challenge | user | `kenduEngine.spendToCreateGroupChallenge` | kendu_balances, kendu_transactions |
| POST | `/spend/ai-deep-dive` | Pay Kendu for an extended AI coaching session | user | `kenduEngine.spendForAIDeepDive` | kendu_balances, kendu_transactions |
| POST | `/spend/sponsor` | Sponsor a community leaderboard | user | `kenduEngine.spendToSponsorLeaderboard` | kendu_balances, kendu_transactions |
| GET | `/subscriptions` | List the user's active Kendu subscriptions (e.g. community upkeep) | user | — | kendu_subscriptions, communities |
| POST | `/upkeep/reactivate` | Reactivate a dormant community subscription | user | `kenduEngine.reactivateCommunity` | kendu_subscriptions, kendu_balances, kendu_transactions |

### `insights.routes.ts` — mount `/api/insights` (router-level authenticate on all routes)

| Method | Path | Purpose | Auth | Engines / Services | Tables |
|---|---|---|---|---|---|
| GET | `/` | Generate proactive coaching insights for the user | user | `proactiveCoach.generateInsights` | activities, users, wellness/training data |
| GET | `/athlete-profile` | Return the athlete memory profile for the user | user | `athleteMemory.getAthleteProfile` | activities, users |
| GET | `/weekly-summary` | Generate a weekly training summary | user | `coachingOutputs.generateWeeklySummary` | activities |
| GET | `/pre-run` | Generate a pre-run brief | user | `coachingOutputs.generatePreRunBrief` | activities, training data |
| GET | `/post-run/:activityId` | Generate post-run analysis for a specific activity | user | `coachingOutputs.generatePostRunAnalysis` | activities |

### `insights.batch.routes.ts` — mount `/api/coach/insights` (router-level authenticate on all routes)

| Method | Path | Purpose | Auth | Engines / Services | Tables |
|---|---|---|---|---|---|
| GET | `/` | Single batched call returning adaptive load, weekly summary, VDOT progression, tier, race predictions, lifetime stats, and PRs | user | `adaptiveEngine.calculateTrainingLoad`, `adaptiveEngine.trackVDOTProgression`, `adaptiveEngine.detectDetraining`, `tierClassifier.classifyTier`, `trainingPlanGenerator.estimateVDOT`, `trainingPlanGenerator.getTrainingPaces`, `trainingPlanGenerator.predictRaceTime`, `personalRecords.calculateAllPRs`, `personalRecords.getPRSummary` | users, activities |

### `training.routes.ts` — mount `/api/training` (router-level authenticate on all routes)

| Method | Path | Purpose | Auth | Engines / Services | Tables |
|---|---|---|---|---|---|
| GET | `/plan` | Fetch the latest transformation plan or generate+persist a default one | user | `trainingPlanGenerator.generateTrainingPlan` | users, transformation_plans, activities |
| POST | `/plan` | Generate and persist a training plan for a specific race goal | user | `trainingPlanGenerator.generateTrainingPlan` | users, activities, transformation_plans |
| GET | `/week` | Return current week's sessions with wellness-adjusted recovery factor | user | — | transformation_plans, daily_wellness |
| GET | `/readiness` | Compute a daily training readiness score from last 7 days of runs | user | `trainingPlanGenerator.calculateReadiness` | activities |
| GET | `/paces` | Return current VDOT-based training paces | user | `trainingPlanGenerator.estimateVDOT`, `trainingPlanGenerator.getTrainingPaces` | activities |
| GET | `/predict` | Predict race time for a given distance from estimated VDOT | user | `trainingPlanGenerator.estimateVDOT`, `trainingPlanGenerator.predictRaceTime` | activities |
| POST | `/complete-session` | Mark a planned session done and award 30 XP | user | — | user_xp, xp_transactions |
| POST | `/lt-test` | Save a lactate-threshold test result (validates 15-25 min duration) | user | — | lt_tests |
| GET | `/lt-test` | Get the latest LT test result with staleness flag | user | — | lt_tests |


## 1D. Gamification, Goals, Progress & Profiling

### `server/src/routes/gamification.routes.ts` — mounted at `/api/gamification`

| Method | Path | Auth | Purpose | Engines / Services | Tables |
|---|---|---|---|---|---|
| GET | `/xp` | user | Return user's XP, level, streaks and computed progress to next level (level math via local helpers). | `xpNeededForLevel` (local), `totalXpToReachLevel` (local) | `user_xp` |
| GET | `/achievements` | user | List all achievements with an earned flag for the current user. | — | `achievements`, `user_achievements` |
| GET | `/leaderboard` | user | Top 50 users by total XP with level, latest tier, and total distance km. | — | `users`, `user_xp`, `tier_history`, `activities` |
| GET | `/history` | user | Last 50 XP transactions for the current user. | — | `xp_transactions` |
| GET | `/friend-streaks` | user | Followed friends who ran in the last day plus the user's own current streak. | — | `follows`, `users`, `user_xp`, `activities` |
| GET | `/badge-collection` | user | Achievements grouped by category with per-badge rarity percent (batched count, no N+1) and earned/total summary. | — | `achievements`, `user_achievements`, `users` |

### `server/src/routes/goals.routes.ts` — mounted at `/api/goals`

| Method | Path | Auth | Purpose | Engines / Services | Tables |
|---|---|---|---|---|---|
| GET | `/` | user | List the user's active goals (joined to events) plus last 5 completed goals. | — | `user_goals`, `events` |
| POST | `/` | user | Create a goal (race/pace/volume/event) with type-specific validation and auto-generated name. | — | `user_goals` |
| PUT | `/:id` | user | Update a goal: complete (sets `completed_at`), abandon, or modify target_date/target_time_seconds/name. | — | `user_goals` |
| DELETE | `/:id` | user | Delete one of the user's goals by id. | — | `user_goals` |
| POST | `/generate-plan` | user | Build one training plan from the primary active goal + user data + recent runs, then store the plan. | `engine/trainingPlanGenerator.generateTrainingPlan` | `user_goals`, `users`, `activities`, `transformation_plans` |

### `server/src/routes/progress.routes.ts` — mounted at `/api/progress`

| Method | Path | Auth | Purpose | Engines / Services | Tables |
|---|---|---|---|---|---|
| GET | `/weekly` | user | This week vs last week progress report from last 100 runs. | `engine/progressTracker.generateProgressReport` | `activities` |
| GET | `/monthly` | user | This month vs last month progress report from last 200 runs. | `engine/progressTracker.generateProgressReport` | `activities` |
| GET | `/all-time` | user | All-time progress report over the user's full run history. | `engine/progressTracker.generateProgressReport` | `activities` |
| GET | `/improvement` | user | "You were HERE, now you're HERE" before/now pace + distance deltas and weekly pace trend. | `getWeekStart` (local) | `activities` |
| GET | `/journey` | user | Milestone timeline: tier changes/promotions, distance milestones, achievements earned, and first run, sorted by date. | — | `tier_history`, `activities`, `user_achievements`, `achievements` |

### `server/src/routes/profiling.routes.ts` — mounted at `/api/profiling`

| Method | Path | Auth | Purpose | Engines / Services | Tables |
|---|---|---|---|---|---|
| POST | `/generate` | user | Generate Runner DNA from profiling answers + user info, upsert into runner_profiles, and record a tier_history row. | `engine/ai-profiler.generateRunnerDNA` | `users`, `runner_profiles`, `tier_history` |
| GET | `/status` | user | Return whether profiling is complete for the user. | — | `runner_profiles` |
| GET | `/dna` | user | Return stored Runner DNA (regenerated from saved profile + user data); 404 if profiling not complete. | `engine/ai-profiler.generateRunnerDNA` | `runner_profiles`, `users` |
| PUT | `/coach` | user | Switch the user's AI coach (validates against allowed coach names); upsert into runner_profiles. | — | `runner_profiles` |
| GET | `/classification` | user | Compute current V2 classification (tier/subLevel/score/status), per-factor scores, safety rails, stats, and next milestone from runs, PRs, and profile. | `engine/classification-engine`: `normalizePerformance`, `normalizeVolume`, `normalizeConsistency`, `normalizeRecovery`, `normalizeVO2max`, `normalizePaceCompliance`, `calculateRunnerLevel`, `checkSafetyRails`, `tierDisplayName` | `users`, `runner_profiles`, `activities`, `personal_records` |


## 1E. Social, Chat, Communities & Events

### Social — `server/src/routes/social.routes.ts` (mount: `/api/social`)

| Method | Path | Auth | Purpose | Engines / Services | Tables |
|---|---|---|---|---|---|
| GET | `/feed` | user | Paginated activity feed from followed users plus own activities, with kudos/comment counts and the user's reaction. | `isFlagEnabled` (gated by `social_feed` flag), `formatPace` | follows, activities, users, kudos, comments |
| POST | `/kudos/:activityId` | user | Give a reaction (kudos) to an activity; awards 5 XP to owner and notifies them. | `createNotification` | activities, kudos, user_xp, xp_transactions, users |
| DELETE | `/kudos/:activityId` | user | Remove the user's kudos and return the updated count. | — | kudos |
| GET | `/comments/:activityId` | user | List all comments on an activity chronologically with author info. | — | comments, users |
| POST | `/comments/:activityId` | user | Add a comment; awards 3 XP to owner and notifies them. | `createNotification` | activities, comments, user_xp, users |
| POST | `/follow/:userId` | user | Follow a user; notifies target (idempotent on duplicate). | `createNotification` | users, follows |
| DELETE | `/follow/:userId` | user | Unfollow a user. | — | follows |
| GET | `/following` | user | List users the current user follows, with level and XP. | — | follows, users, user_xp |
| GET | `/followers` | user | List users who follow the current user, with level and XP. | — | follows, users, user_xp |
| GET | `/discover` | user | Suggest up to 10 unfollowed runner-role users, ranked by XP. | — | users, user_xp, activities, follows |

### Chat — `server/src/routes/chat.routes.ts` (mount: `/api/chat`, with `chatLimiter` rate-limit middleware)

| Method | Path | Auth | Purpose | Engines / Services | Tables |
|---|---|---|---|---|---|
| POST | `/message` | user | Send a message to the AI running coach; builds runner context, persists user+assistant messages, uses Sonnet for active 'pro' subscribers else rule-based fallback. Own per-route 20/min limiter. | ai.service `chatWithSonnet`; engine/trainingPlanGenerator `estimateVDOT`, `getTrainingPaces`, `calculateReadiness`; engine/adaptiveEngine `calculateTrainingLoad`; `config.anthropic.apiKey`; `generateCoachResponse` + `buildRunnerContext` (rule-based) | users, chat_messages, user_subscriptions, activities, user_xp, transformation_plans |
| GET | `/history` | user | Return chat history (default 50 messages) chronologically. | — | chat_messages |
| DELETE | `/history` | user | Clear all of the user's chat history. | — | chat_messages |
| GET | `/suggestions` | user | Generate up to 4 dynamic, priority-sorted contextual prompts based on last run, streak, and upcoming events. | — | activities, user_xp, events, event_rsvps |

### WebSocket — `server/src/websocket.ts` (mount: `/ws`, attached to the HTTP server, **not** an Express router)

Live, JWT-authenticated WebSocket server started in production via `initWebSocket(server)` (`index.ts:171-172`). **Not catalogued as a REST route** — it is the real-time backend behind community chat and in-app notification push. Connects with `?token=<jwt>&community=<id>` query params; verifies the JWT, looks up the user name, and gates community connections on `community_members`. Two channels share one socket:

| Channel | Trigger | Behavior | Tables |
|---|---|---|---|
| Chat persist + broadcast | client sends `{type:'chat', body}` on a community-scoped socket | Trims/validates body (≤1000 chars), **`INSERT`s into `community_chat_messages`** (`websocket.ts:94`), then broadcasts the saved message to all sockets in that community. **This is the SOLE writer of `community_chat_messages`** — the REST route `GET /communities/:id/chat` only READS it; no REST endpoint inserts chat. | community_chat_messages, community_members (gate), users (name) |
| Typing indicator | client sends `{type:'typing'}` | Broadcasts to other community members (no DB write). | — |
| Notification push (`pushToUser`) | exported fn called by `notifications.routes.ts:141-142` | Pushes `{type:'notification', notification}` to all of a user's open sockets (community-less "notification-only" connections register here too). Real-time delivery of in-app notifications. | — (reads from notification creation flow) |
| Connection lifecycle | `on('close')` handlers (`websocket.ts:61-66` notification sockets, `:132-141` community sockets) | De-registers the socket from the `userSockets`/`communities` maps on disconnect to prevent leaks. | — |

### Communities — `server/src/routes/communities.routes.ts` (mount: `/api/communities`)

| Method | Path | Auth | Purpose | Engines / Services | Tables |
|---|---|---|---|---|---|
| GET | `/` | user | Browse/search non-deleted communities with category filter + pagination, flagging the user's membership/role. | — | communities, users, community_members |
| GET | `/my` | user | List communities the user belongs to, newest-joined first. | — | community_members, communities, users |
| GET | `/discover` | user | Suggest up to 10 unjoined communities, ranked by member count. | — | communities, users, community_members |
| GET | `/:id` | user | Community detail plus 20 recent posts with like counts and the user's like state. | — | communities, users, community_members, community_posts, community_post_likes |
| POST | `/` | admin | Admin-only direct community creation; adds creator as owner-member and awards 25 XP. | `awardXP` | users, communities, community_members, user_xp, xp_transactions |
| PUT | `/:id` | admin | Edit community name/description/category; owner or community-admin only. | — | community_members, communities |
| POST | `/:id/join` | user | Join a community; increments member count, awards 5 XP, notifies owner (idempotent). | `awardXP`, `createNotification` | communities, community_members, user_xp, xp_transactions, users |
| DELETE | `/:id/leave` | user | Leave a community; blocked for mandatory 'Sprint Social Club' and for owners; decrements member count. | — | communities, community_members |
| GET | `/:id/posts` | user | Paginated community posts with like counts and the user's like state. | — | community_posts, users, community_post_likes |
| POST | `/:id/posts` | user | Create a post in a community; members only. | — | community_members, community_posts, users |
| POST | `/:id/posts/:postId/like` | user | Toggle like on a post (insert, or unlike on duplicate); returns new count. | — | community_post_likes |
| GET | `/:id/members` | user | List members ordered owner > admin > member, then by join date. | — | community_members, users |
| POST | `/:id/posts/:postId/react` | user | Toggle a validated emoji reaction; returns aggregated reactions and the user's reactions. | — | community_post_reactions |
| POST | `/:id/posts/:postId/pin` | admin | Toggle pin state of a post; owner or community-admin only. | — | community_members, community_posts |
| POST | `/:id/polls` | user | Create a poll (question + >=2 options); members only. | — | community_members, community_polls |
| GET | `/:id/polls` | user | List up to 10 polls with per-option tallies, totals, and the user's vote. | — | community_polls, users, community_poll_votes |
| POST | `/:id/polls/:pollId/vote` | user | Cast a vote on a poll option (409 if already voted). | — | community_poll_votes |
| POST | `/:id/broadcasts` | admin | Send a broadcast; owner/admin only; notifies all non-muted members. | — | community_members, community_broadcasts, communities, community_mutes, user_notifications |
| GET | `/:id/broadcasts` | user | List up to 20 recent broadcasts with author info. | — | community_broadcasts, users |
| POST | `/:id/mute` | user | Toggle mute status for a community for the current user. | — | community_mutes |
| GET | `/:id/mute` | user | Check whether the current user has muted a community. | — | community_mutes |
| POST | `/request` | user | Submit a community-creation request (name/purpose/category/leader/contact) for admin approval. | — | community_requests |
| GET | `/requests` | admin | List pending community requests with requester info and Kendu balance. | — | users, community_requests, kendu_balances |
| POST | `/requests/:id/approve` | admin | Approve a request, charge 1000 Kendu, create community + owner membership + community subscription. | engine/kenduEngine `spendToCreateCommunity`, `createCommunitySubscription` | users, community_requests, communities, community_members |
| POST | `/requests/:id/reject` | admin | Reject a pending request with no Kendu charge. | — | users, community_requests |
| GET | `/:id/chat` | user | Paginated group-chat history (cursor via `before` id), returned oldest-first. | — | community_chat_messages, users |
| GET | `/:id/leaderboard` | user | Weekly/monthly community leaderboard by distance, with the user's own rank. | — | community_members, users, activities, user_xp |
| GET | `/:id/digest` | user | Auto-generated weekly summary: active members, runs, distance, avg pace, top runner. | — | community_members, activities, users, communities |

### Events — `server/src/routes/events.routes.ts` (mount: `/api/events`)

| Method | Path | Auth | Purpose | Engines / Services | Tables |
|---|---|---|---|---|---|
| GET | `/` | user | List upcoming/live events with type/date filters, visibility rules (public + followers_only from followed creators), attendee counts, user RSVP, and batched 'friends going'. | — | events, users, event_rsvps, follows |
| GET | `/nearby` | user | Find upcoming/live events within a radius via bounding-box pre-filter then haversine refinement. | — | events, users, event_rsvps |
| GET | `/my` | user | List upcoming/live events the user is attending (going/maybe) or hosting. | — | event_rsvps, events, users |
| GET | `/:id` | user | Event detail with attendee count, maybe count, user RSVP, attendee list, and host list. | — | events, users, event_rsvps, event_hosts |
| POST | `/:id/rsvp` | user | RSVP going/maybe (upsert); enforces capacity; awards 15 XP and notifies creator on first 'going'. | `awardXP`, `createNotification` | events, event_rsvps, user_xp, xp_transactions, users |
| DELETE | `/:id/rsvp` | user | Cancel the user's RSVP; return updated going count. | — | event_rsvps |
| GET | `/:id/comments` | user | List event comments chronologically with author info. | — | event_comments, users |
| POST | `/:id/comments` | user | Add a comment to an event (max 500 chars). | — | events, event_comments, users |
| GET | `/:id/my-awards` | user | Return the user's awards from an event plus their best matching-date activity. | — | event_awards, activities, events |
| POST | `/:id/checkin` | user | Check in to a live event with the organizer code; awards 50+10 XP and Kendu, notifies the user. | `awardXP`, engine/kenduEngine `awardKenduForEvent`, `createNotification` | events, event_checkins, user_xp, xp_transactions |
| GET | `/:id/checkins` | user | List users who have checked in, in check-in order. | — | event_checkins, users |
| GET | `/:id/recap` | user | Post-event recap: checked-in attendees, aggregate run stats, and a pace-ranked leaderboard for the event date. | — | events, event_checkins, users, activities |

### Feedback — `server/src/routes/feedback.routes.ts` (mount: `/api/feedback`)

| Method | Path | Auth | Purpose | Engines / Services | Tables |
|---|---|---|---|---|---|
| POST | `/` | user | Submit feedback of type bug/idea/complaint/praise with message and optional page context. | — | feedback |


## 1F. Profile, Subscription, Wellness, Notifications & Dashboard

The ACCOUNT domain covers a user's personal surface: public/own profile, paid subscription lifecycle (Razorpay), daily wellness logging and recovery readiness, in-app notifications, and the batched home dashboard.

### `server/src/routes/profile.routes.ts` — mount `/api/profile`

| Method | Path | Purpose | Auth | Engines / Services | Tables |
|--------|------|---------|------|--------------------|--------|
| GET | `/:id` | Public-facing profile of another user: identity, tier, lifetime stats, follow status, communities, recent achievements. | user | — | users, user_xp, tier_history, activities, follows, community_members, communities, user_achievements, achievements |
| PATCH | `/photo` | Update the authenticated user's profile photo from a base64 data URL (validates prefix, rejects >~1.5MB). | user | — | users |

### `server/src/routes/subscription.routes.ts` — mount `/api/subscription`

| Method | Path | Purpose | Auth | Engines / Services | Tables |
|--------|------|---------|------|--------------------|--------|
| GET | `/plans` | List all active subscription plans, parsing each plan's JSON features array. | public | — | subscription_plans |
| GET | `/status` | Return the current user's active subscription (or a synthetic free-plan default) with days_remaining. | user | — | user_subscriptions, subscription_plans |
| POST | `/create-order` | Create a Razorpay order for a paid plan and store a pending payment_history row. | user | Razorpay Orders API (fetch); config (razorpayKeyId/Secret) | subscription_plans, payment_history |
| POST | `/verify` | Verify Razorpay payment signature, mark payment success, expire old subs and activate the new subscription. | user | crypto (HMAC-SHA256 signature verify); config (razorpayKeySecret) | payment_history, subscription_plans, user_subscriptions |
| POST | `/cancel` | Cancel auto-renewal on the user's active subscription (plan stays active until expiry). | user | — | user_subscriptions |
| POST | `/upgrade` | Upgrade an active Base subscription to Pro by creating a new Razorpay order + pending payment_history row. | user | Razorpay Orders API (fetch); config (razorpayKeyId/Secret) | user_subscriptions, subscription_plans, payment_history |
| GET | `/history` | Return the user's last 50 payment history records with plan names. | user | — | payment_history, subscription_plans |
| POST | `/webhook` | Razorpay webhook: verify signature, mark payment_history success on `payment.captured` and failed on `payment.failed`. | public | crypto (HMAC-SHA256 webhook signature verify); config (razorpayKeySecret) | payment_history |

### `server/src/routes/wellness.routes.ts` — mount `/api/wellness`

| Method | Path | Purpose | Auth | Engines / Services | Tables |
|--------|------|---------|------|--------------------|--------|
| POST | `/log` | Upsert today's wellness entry (sleep_hours, stress, energy, notes) via ON CONFLICT (user_id, date). | user | — | daily_wellness |
| GET | `/today` | Return today's wellness log if present, else `{logged:false}`. | user | — | daily_wellness |
| GET | `/week` | Return last 7 days of wellness with computed avg sleep, avg stress, days_logged, and sleep_debt. | user | — | daily_wellness |
| GET | `/recovery-factor` | Compute today's training-readiness factor (0.6–1.0) and adjustment advice from sleep/stress/energy. | user | — | daily_wellness |

### `server/src/routes/notifications.routes.ts` — mount `/api/notifications`

| Method | Path | Purpose | Auth | Engines / Services | Tables |
|--------|------|---------|------|--------------------|--------|
| GET | `/` | Paginated notification list (joined with actor user) plus unread_count and has_more flag. | user | — | user_notifications, users |
| GET | `/unread-count` | Generate proactive notifications (AI insights, streak warning, event reminders) then return unread badge count. | user | engine/proactiveCoach (generateInsights) | user_notifications, user_xp, event_rsvps, events |
| POST | `/read-all` | Mark all of the user's unread notifications as read. | user | — | user_notifications |
| POST | `/:id/read` | Mark a single notification (scoped to the user) as read. | user | — | user_notifications |

### `server/src/routes/dashboard.routes.ts` — mount `/api/dashboard`

| Method | Path | Purpose | Auth | Engines / Services | Tables |
|--------|------|---------|------|--------------------|--------|
| GET | `/` | Batched dashboard payload: XP/level progress, computed tier, weekly challenges (auto-generated if missing), lifetime run stats, current transformation-plan week, and profiling-complete status. | user | engine/tierClassifier (classifyTier); engine/challengeGenerator (generateWeeklyChallenges); utils/response (safeJsonParse) | user_xp, users, activities, challenges, transformation_plans, runner_profiles |


## 1G. Admin (Core + Ops)

The admin domain spans ten route files (1 core + 9 ops sub-routers), all mounted under `/api/admin/*` and all requiring `admin` auth. Core admin handles runner/event/session/community management and club stats; nine ops sub-domains cover analytics, feature flags, segments, push notifications, content, audit logging, engineering, moderation, and backups. **Total admin endpoints: 92 (44 core + 48 across the 9 ops sub-routers).**

### Admin Core — `admin.routes.ts` (`/api/admin`)

| Method | Path | Purpose | Engines/Services | Tables |
|--------|------|---------|------------------|--------|
| GET | `/runners` | Paginated/searchable runner directory with XP, current tier, run totals | — | users, user_xp, tier_history, activities |
| GET | `/runners/:id` | Single runner profile with recent runs and tier history | — | users, user_xp, activities, tier_history |
| GET | `/invite-codes` | List all invite codes with creator name and actual usage count | — | invite_codes, users, invite_code_usage |
| POST | `/invite-codes` | Create a new invite code (uppercased, conflict-checked) | — | invite_codes |
| PATCH | `/invite-codes/:id` | Update invite code active flag, max_uses, expiry | — | invite_codes |
| DELETE | `/invite-codes/:id` | Soft-deactivate an invite code (active=0) | — | invite_codes |
| GET | `/invite-codes/:id/usage` | List users who redeemed a given invite code | — | invite_code_usage, users |
| GET | `/events` | Paginated events list with going-RSVP attendee counts | — | events, event_rsvps |
| POST | `/events` | Create an event (admin is creator) | — | events |
| PUT | `/events/:id` | Update event fields (title, schedule, location, status, visibility) | — | events |
| DELETE | `/events/:id` | Cancel an event (status=cancelled) | — | events |
| POST | `/events/:id/go-live` | Set check-in code and flip event status to live | — | events |
| POST | `/events/:id/complete` | Complete event in a transaction: award 100 XP to check-ins, generate podium/distance/participant awards, notify runners | awardXP (local helper) | events, event_checkins, user_xp, xp_transactions, activities, users, event_awards, user_notifications |
| POST | `/events/:id/hosts` | Add a host to an event with a role label (409 on duplicate) | — | event_hosts |
| DELETE | `/events/:id/hosts/:userId` | Remove a host from an event | — | event_hosts |
| GET | `/sessions` | List club sessions with attended-count subquery | — | club_sessions, session_attendance |
| POST | `/sessions` | Create a club session | — | club_sessions |
| PUT | `/sessions/:id` | Update a club session | — | club_sessions |
| DELETE | `/sessions/:id` | Delete a club session | — | club_sessions |
| POST | `/sessions/:id/attendance` | Bulk-mark attendance for a list of user_ids (upsert attended=1) | — | session_attendance |
| GET | `/announcements` | List all announcements with author name, pinned first | — | announcements, users |
| POST | `/announcements` | Create an announcement (admin is author) | — | announcements |
| DELETE | `/announcements/:id` | Delete an announcement | — | announcements |
| PUT | `/runners/:id/reset-password` | Admin resets a runner's password (bcrypt hash, min 6 chars) | bcryptjs | users |
| PUT | `/runners/:id/disable` | Disable a user account (role=disabled; blocks admins) | — | users |
| PUT | `/runners/:id/enable` | Re-enable a user (role back to runner) | — | users |
| PUT | `/runners/:id/xp` | Manually adjust a runner's XP with a logged reason | — | user_xp, xp_transactions |
| PUT | `/runners/:id/tier` | Override a runner's tier by inserting a tier_history row (score 0) | — | tier_history |
| DELETE | `/runners/:id` | Hard-delete a user and associated data (blocks admins) | — | users |
| GET | `/communities` | Paginated communities list with owner name, sorted by member_count | — | communities, users |
| PUT | `/communities/:id` | Update community name/description/category/verified flag | — | communities |
| DELETE | `/communities/:id` | Delete a community | — | communities |
| GET | `/export/runners` | JSON file download of all runners with aggregate stats | — | users, user_xp, tier_history, activities |
| GET | `/export/activities` | JSON file download of latest 1000 activities with runner names | — | activities, users |
| GET | `/health` | System health snapshot: counts, last activity/signup, uptime | — | users, activities |
| GET | `/stats` | Club aggregate stats: runners, runs, distance, sessions, weekly runs, tier breakdown | — | users, activities, club_sessions, tier_history |
| GET | `/streak-health` | Streak overview: active streaks, at-risk runners, streaks lost today | — | user_xp, users, activities, xp_transactions |
| GET | `/analytics` | Dashboard analytics: daily signups, 7/30-day active users, 7-day retention, chat usage | — | users, activities, chat_messages |
| GET | `/download-db` | Disabled for Postgres — returns 403 directing to pg_dump | — | — |
| GET | `/waitlist` | List all waitlist entries newest-first | — | waitlist |
| DELETE | `/waitlist/:id` | Delete a waitlist entry | — | waitlist |
| GET | `/feedback` | List all feedback with submitter name newest-first | — | feedback, users |
| PATCH | `/feedback/:id` | Update feedback status and/or admin_notes (validated status enum) | — | feedback |
| POST | `/send-streak-nudges` | Send ai_insight nudge notifications to runners with 3+ day streaks who haven't run today | — | user_xp, users, activities, user_notifications |

### Admin Analytics — `admin-analytics.routes.ts` (`/api/admin/analytics`)

| Method | Path | Purpose | Tables |
|--------|------|---------|--------|
| GET | `/dashboard` | Live metrics snapshot: DAU, MAU, new users today/week, runs/distance/avg-duration today | activities, users |
| GET | `/metrics` | Last 30 rows from precomputed daily_metrics table | daily_metrics |
| GET | `/events` | Latest 100 analytics_events with user names, optional `?event_type` filter | analytics_events, users |
| POST | `/track` | Insert an admin-triggered analytics event (JSON properties) | analytics_events |
| GET | `/engagement` | P2 engagement metrics: badges, kudos reactions breakdown, top streaks, active communities | user_achievements, kudos, user_xp, users, community_members, activities |

### Admin Feature Flags — `admin-flags.routes.ts` (`/api/admin/flags`)

| Method | Path | Purpose | Engines/Services | Tables |
|--------|------|---------|------------------|--------|
| GET | `/` | List all feature flags with per-flag override count | — | feature_flags, feature_flag_overrides |
| POST | `/` | Create a feature flag (unique key enforced) | — | feature_flags |
| PUT | `/:id` | Update flag enabled state, rollout percentage, target segments | — | feature_flags |
| DELETE | `/:id` | Delete a feature flag | — | feature_flags |
| GET | `/evaluate/:key` | Evaluate a flag for a user (override > global disable > rollout hash bucket > enabled) | inline deterministic hash bucketing | feature_flags, feature_flag_overrides |
| POST | `/:id/overrides` | Upsert a user-specific flag override | — | feature_flag_overrides |
| DELETE | `/:id/overrides/:userId` | Remove a user-specific flag override | — | feature_flag_overrides |

### Admin Segments — `admin-segments.routes.ts` (`/api/admin/segments`)

| Method | Path | Purpose | Engines/Services | Tables |
|--------|------|---------|------------------|--------|
| GET | `/` | List all user segments newest-first | — | segments |
| POST | `/` | Create a segment with JSON criteria rules | — | segments |
| PUT | `/:id` | Update segment name/description/criteria | — | segments |
| DELETE | `/:id` | Delete a segment and its members | — | segment_members, segments |
| POST | `/:id/evaluate` | Re-run segment criteria against all runners, repopulate members, update member_count | buildWhereClause (local dynamic-SQL rule compiler) | segments, users, user_xp, segment_members |
| GET | `/:id/members` | List users belonging to a segment with XP/level | — | segment_members, users, user_xp |

### Admin Notifications — `admin-notifications.routes.ts` (`/api/admin/push`)

| Method | Path | Purpose | Tables |
|--------|------|---------|--------|
| GET | `/` | List all notifications ordered by created_at DESC | notifications |
| POST | `/` | Create a notification (status draft or scheduled based on scheduled_at) | notifications |
| POST | `/:id/send` | Mark a notification as sent and compute recipient sent_count by target_type | notifications, users, segment_members |
| DELETE | `/:id` | Delete a draft notification (rejects if already sent) | notifications |
| GET | `/subscriptions` | Return push subscription counts (total and unique users) | push_subscriptions |

### Admin Content — `admin-content.routes.ts` (`/api/admin/content`)

| Method | Path | Purpose | Tables |
|--------|------|---------|--------|
| GET | `/` | List all content_blocks (joined with segment name) ordered by created_at DESC | content_blocks, segments |
| POST | `/` | Create a content_block (type, title, body, targeting, publish flag) | content_blocks |
| PUT | `/:id` | Update a content_block (COALESCE partial update of all fields) | content_blocks |
| DELETE | `/:id` | Delete a content_block by id | content_blocks |
| GET | `/published` | List currently published content blocks (published=1 and scheduled_at past or null) | content_blocks, segments |
| POST | `/:id/publish` | Set content_block published=1 | content_blocks |
| POST | `/:id/unpublish` | Set content_block published=0 | content_blocks |

### Admin Audit — `admin-audit.routes.ts` (`/api/admin/audit`)

| Method | Path | Purpose | Engines/Services | Tables |
|--------|------|---------|------------------|--------|
| GET | `/` | List last 200 audit log entries (joined with admin name), optional `?action` filter | — | admin_audit_log, users |
| POST | `/` | Record an audit log entry via logAuditAction helper | logAuditAction (exported helper, same file) | admin_audit_log |

### Admin Engineering — `admin-engineering.routes.ts` (`/api/admin/engineering`)

| Method | Path | Purpose | Tables |
|--------|------|---------|--------|
| GET | `/sprints` | List sprint_history entries ordered by sprint_date DESC | sprint_history |
| POST | `/sprints` | Record a sprint history entry (proposed/built/auto_fixed/status) | sprint_history |
| GET | `/git-log` | Return hardcoded placeholder git log (git unavailable on Railway) | — |
| GET | `/backlog` | Return hardcoded static TASKS.md backlog summary | — |

### Admin Moderation — `admin-moderation.routes.ts` (`/api/admin/moderation`)

| Method | Path | Purpose | Engines/Services | Tables |
|--------|------|---------|------------------|--------|
| GET | `/queue` | Combined latest 25 comments + 25 community_posts as a moderation queue (top 50 by recency) | — | comments, community_posts, users |
| POST | `/comments/:id/hide` | Delete a comment by id and log audit action 'hide_comment' | logAuditAction (from admin-audit.routes) | comments, admin_audit_log |
| POST | `/posts/:id/hide` | Delete a community_post by id and log audit action 'hide_post' | logAuditAction (from admin-audit.routes) | community_posts, admin_audit_log |
| GET | `/reports` | Placeholder returning empty array (reports table not yet created) | — | — |
| POST | `/users/:id/warn` | Log a 'warn_user' audit action with reason (no user state change) | logAuditAction (from admin-audit.routes) | users, admin_audit_log |
| POST | `/users/:id/ban` | Log a 'ban_user' audit action (rejects admins; no role change due to CHECK constraint) | logAuditAction (from admin-audit.routes) | users, admin_audit_log |
| GET | `/chat-messages` | List recent 50 community chat messages with author and community names | — | community_chat_messages, users, communities |
| DELETE | `/chat-messages/:id` | Delete a community chat message by id and log 'delete_chat_message' audit action | logAuditAction (from admin-audit.routes) | community_chat_messages, admin_audit_log |

### Admin Backup — `admin-backup.routes.ts` (`/api/admin/backup`)

| Method | Path | Purpose | Engines/Services | Tables |
|--------|------|---------|------------------|--------|
| GET | `/now` | Trigger full backup (runBackup) and stream a single combined CSV download of all exported tables | runBackup (exported helper, same file), fs, path | 35 exported tables (users, activities, user_xp, xp_transactions, achievements, user_achievements, communities, community_members, community_posts, community_chat_messages, events, event_rsvps, event_checkins, club_sessions, session_attendance, challenges, tier_history, announcements, follows, kudos, comments, kendu_balances, kendu_transactions, kendu_ledger, user_goals, daily_wellness, personal_records, ai_profiles, user_notifications, invite_codes, invite_code_usage, user_subscriptions, payment_history, feedback, strava_tokens) |
| GET | `/table/:name` | Download a single whitelisted table as a CSV file (rejects tables not in export list) | tableToCSV (helper, same file) | `:name` (any one of the 35 whitelisted export tables) |
| GET | `/history` | List up to 20 past backup folders with their manifest metadata | fs, path | — |
| GET | `/stats` | Return per-table row counts across all exported tables without running a backup | — | Same 35 exported tables as `/now` |


---

## 2. Engine / Business-Logic Catalogue

All 22 engine modules under `server/src/engine/`.

| Module | Purpose | Key exports | Inputs | Outputs |
|--------|---------|-------------|--------|---------|
| `classification-engine.ts` | Runner Classification Engine V2 — authoritative scoring/normalization mapping a runner to a 1-40 level across 4 tiers (B/I/A/P) via a 6-factor weighted composite (Performance 40%, Volume/Consistency/Recovery 15% each, VO2max 10%, PaceCompliance 5%). Owns safety rails (ACWR, volume spikes, breaks) and advancement/regression rules. Pure TS, self-contained (inlines age-grading + benchmark tables). | `calculateRunnerLevel`, `normalizePerformance`, `normalizeVolume`, `normalizeConsistency`, `normalizeRecovery`, `normalizeVO2max`, `normalizePaceCompliance`, `checkSafetyRails`, `checkAdvancement`, `checkRegression`, `classifyRunner`, `tierDisplayName` | Per-factor FactorScores OR raw runner data: BestTimes (race secs by distance), age, gender, avg weekly km, active/total weeks, RecoveryData (rest/HRV/RPE/sleep), VO2max + measured date, runs w/ prescribed zone + actual pace, PaceZones, hasRaceResult, UserSafetyData (acute/chronic loads, volume, weeks since last run). | LevelResult (tier B/I/A/P, sub-level 1-10, rawScore, status calibrating/provisional/validated), individual 1-40 factor scores, SafetyRailStatus, advancement/regression decisions with human-readable reasons. |
| `tierClassifier.ts` | Legacy/simpler 3-tier classifier (beginner/intermediate/advanced) — distinct from V2. Computes 0-100 weighted score from age-graded performance (35%), VO2max (25%), weekly distance (20%), consistency (20%), with cold-start path (<3 runs) estimating fitness from profile. | `classifyTier(user, runs)` | UserProfile (age, gender, height_cm, weight_kg, fitness_level, running_experience) + RunData[] (distance_meters, moving_time_seconds, start_date). Delegates to ageGrading + vo2max. | TierResult: assigned tier (>=65 advanced, >=35 intermediate, else beginner), composite score, estimated VO2max, age-graded percent, per-component breakdown. |
| `paceCalculator.ts` | Personalized training-pace prescription + pace-progress analysis. Derives easy/tempo/interval/race zones from a tier base pace adjusted for age, BMI, fitness level, then compares actual weighted-avg pace against targets. | `calculateIdealPace`, `analyzeCurrentPace`, `formatPace` | Zones: age, gender, weight_kg, height_cm, fitnessLevel, tier (uses ageGrading.getAgeFactor). Analysis: runs w/ average_pace_per_km + distance_meters + ideal PaceZones. | PaceZones (easy/tempo/interval/race sec/km), IdealPaceResult (distance-weighted current avg pace, improvement needed vs tempo, pace_rating string), pace formatter. |
| `vo2max.ts` | VO2max estimation + categorization. Cardiovascular-fitness math: estimating from race performance (Daniels/Gilbert), from static profile when no runs, categorizing, and producing a confidence interval from recent runs. | `estimateVO2maxFromRace`, `estimateVO2maxFromProfile`, `getVO2maxCategory`, `estimateVO2maxWithConfidence` | Race-based: run distance (m) + time (s). Profile-based: age, gender, fitness level, weight, height. Confidence: array of recent runs. | Scalar VO2max (ml/kg/min) estimate, fitness category label, or ConfidenceInterval (point estimate from best 3 runs, min/max range, high/med/low confidence, data point count). |
| `ageGrading.ts` | Age- and gender-grading primitives. Owns WMA-style age-factor lookup tables (M/F/non-binary by 5-yr bracket) + 5K-normalized world-record refs, used for age-graded performance % and as a shared age-adjustment factor. | `getAgeFactor`, `calculateAgeGradedPercent`, `getAgeGradeDescription` | Performance time (s), distance (m), age, gender (male/female/non-binary). Buckets age into 5-yr brackets, references world-record 5K table. | Age-grade factor, age-graded performance % (normalizes any distance to 5K-equivalent vs WR/age factor), tier description string. Consumed by tierClassifier + paceCalculator. |
| `heartRateZones.ts` | Heart-rate zone engine via Karvonen (HR-reserve) method. Owns 5-zone (Z1-Z5) personalized bpm ranges w/ physiology descriptions, max-HR estimation, per-activity HR analysis, aerobic decoupling (Pa:Hr drift) detection. | `calculateHRZones`, `estimateMaxHR`, `analyzeActivityHR`, `detectAerobicDecoupling` | Max HR + optional resting HR (zones); age + method + optional gender/observed-max (max-HR); per-activity avg/max HR, duration, session type, HRProfile, actual pace; first/second-half avg HR + pace (decoupling). | HRProfile w/ 5 zones (bpm + % ranges + effect/feel text) + threshold HRs; estimated max HR; HRAnalysis (primary/target zone, in-target flag, feedback, 0-100 cardiac efficiency, zone distribution); aerobic-decoupling % w/ assessment + concern flag. |
| `adaptiveEngine.ts` | Adaptive training engine: reacts to actual performance to re-evaluate plans week-over-week. Owns training-load (TSS-lite/ATL/CTL), injury-risk, plan adaptation, VDOT progression, detraining, running-economy. Pure functions, no DB. | `calculateTrainingLoad`, `analyzeWeekPerformance`, `adaptNextWeek`, `trackVDOTProgression`, `detectDetraining`, `calculateRunningEconomy`, `DetrainingStatus`, `RunningEconomy` | In-memory arrays of activities/completed sessions (distance, time, pace, HR, dates, RPE), planned session counts, current week volume, TrainingPaces, LoadMetrics, optional userMaxHR. Imports estimateVDOT/getTrainingPaces. | LoadMetrics (acute/chronic load, TSB, monotony, strain, injury_risk), AdaptationSignal[], WeekAdaptation (adapted volume %, intensity shift, pace adjustments, summary), VDOT trend, DetrainingStatus, RunningEconomy trend. |
| `proactiveCoach.ts` | Rule-based proactive coaching insights/nudges, zero LLM. Owns 7 heuristic rules surfacing warnings, encouragement, tips, milestones from recent activity, streak, pace trends. | `generateInsights`, `Insight` | userId; queries Postgres directly (activities last 14 days, user_xp streak, all-time run count/total distance). | `Promise<Insight[]>` sorted by priority desc. Each Insight = {type: warning/encouragement/tip/milestone, title, body, priority 1-5, optional actionUrl}. Covers overtraining, streak-at-risk, improvement, milestones, consistency, rest-day, pace-variety. |
| `coachingOutputs.ts` | Deterministic structured coaching content (no LLM). Owns weekly summaries, pre-run briefs (w/ India-specific heat/humidity/AQI context), post-run analysis w/ scoring, split/pacing analysis, improvement areas. | `generateWeeklySummary`, `generatePreRunBrief`, `generatePostRunAnalysis`, `WeeklySummary`/`PreRunBrief`/`PostRunAnalysis`/`EnvironmentalContext` | userId (+ activityId for post-run); queries Postgres (activities this/prev week + last 7/30 days, user_xp, xp_transactions, user_achievements, runner_profiles, activity row incl. splits JSON). Env context from current month + optional temp/humidity/aqi. | WeeklySummary (totalKm, runs, avgPace, paceChange, streak, kenduEarned, topAchievement, nextGoal); PreRunBrief (suggested distance/pace, warmup tip, focus, EnvironmentalContext w/ pace-adjustment % + tips); PostRunAnalysis (score 1-100, pace consistency class, split analysis, comparison text, up to 3 improvement areas). |
| `athleteMemory.ts` | Lightweight athlete pattern/profile tracking purely from SQL aggregations over activities (no LLM). Owns derived behavioral patterns: preferred run time, weekly cadence, pace trajectory (linear regression), streak reliability, totals, PBs by race distance. | `getAthleteProfile`, `AthleteProfile` | userId; queries Postgres (all activities, last-30-day activities, user_xp streak). | `Promise<AthleteProfile>`: preferredRunTime, averageWeeklyRuns (last 8 wks), paceTrajectory (improving/stable/declining), streakReliability (high/med/low), totalDistanceKm, longestRun, personalBests[] (overall/5K/10K/HM best pace), weeklyPattern[7] (runs/weekday Mon=0). |
| `ai-profiler.ts` | Onboarding 'Runner DNA' profiler. Owns deterministic athlete-classification turning intake answers into fitness estimate, tier, AI coach persona, pace zones, volume recommendation, personalized copy. Pure functions, no DB. | `generateRunnerDNA`, `ProfilingInput`, `RunnerDNA` | ProfilingInput: age, gender, weight, height, fitness_level, running_experience, injury_history, weekly_km, dream_race, running_why, run_feeling, bad_run_response, preferred_time, training_days, optional recent_5k_time. | RunnerDNA: estimated VO2max, estimated 5K secs, tier, coach_style + ai_coach_name (motivator/analyst/zen/drill_sergeant), personality_tags, pace_zones (M:SS), weekly_volume_km, training_days, strengths, focus_areas, first_week_preview, motivational_message. |
| `kenduEngine.ts` | Full 'Kendu' virtual-economy engine (1 Kendu = 1 km effort). Owns earning (distance, coach multiplier, PB, streak/consistency/event/workout/plan bonuses, daily cap, welcome bonus), spending (community creation, event hosting, RSVP, boosts, gifts, card skins, AI deep-dive, sponsor), peer challenges w/ staking/rake/auto-resolution, leveling, redemptions w/ coupons, community upkeep subscriptions, admin economy stats. IST-aware w/ immutable ledger. | `calculateKenduForRun`, `detectPersonalBest`, `updateKenduStreak`, `checkWeeklyConsistency`, `verifyCoachAssigned`, `awardKenduForEvent/Workout/Plan/Challenge`, `awardWelcomeBonus`, `getKenduBalance`, `calculateLevel`, `canRedeem`, `redeemOffer`, `migrateXpToKendu`, `spendToCreateCommunity/HostEvent/...`, `giftKendu`, `spendForChallenge`/`awardChallengeWinner`, `resolveExpiredChallenges`, `createCommunitySubscription`/`processUpkeepDue`/`checkAllUpkeepDue`, `reactivateCommunity`, `getEconomyStats`/`getEconomyHealth`, `KenduBreakdown`/`KenduEarnResult`/`SpendResult` | userId + action params (km, wasCoachAssigned, isPersonalBest, distance/pace, offerId, stake amounts, gift amount/recipient, communityId, subscriptionId). Reads/writes Postgres heavily: kendu_balances, kendu_transactions, kendu_ledger, kendu_offers/coupon_codes/redemptions, kendu_challenges, kendu_subscriptions, activities, ai_checkins, club_sessions/session_attendance, user_xp. Uses transactional client (db.pool). | KenduEarnResult (points earned, breakdown, new balance, streak days, bonus/capped flags), SpendResult (success, amountSpent, fee, newBalance, error), PB booleans, balance+level+progress, redemption result w/ coupon, challenge resolution summary, upkeep results, admin economy stats/health; side-effect ledger/transaction rows. |
| `trainingPlanGenerator.ts` | Core periodized training-plan engine. Owns VDOT-based fitness estimation, Daniels/Lydiard/80-20 pace zones, multi-phase plan construction (base/build/peak/taper/recovery) w/ progressive overload + deload, race-time prediction, daily readiness scoring. | `estimateVDOT`, `getTrainingPaces`, `calculateWeeklyVolume`, `generateTrainingPlan`, `predictRaceTime`, `calculateReadiness`, `TrainingPaces` | UserProfile (age, gender, experience, fitness level), RunHistory[] (distance, time, pace, HR, date, activity_type), RaceGoal (distance, optional target time/date). Readiness also takes current TrainingWeek. | TrainingPlan (vdot, training_paces, total_weeks, current/target weekly volume, week-by-week TrainingWeek[] w/ sessions/tips). Standalone: TrainingPaces, weekly volume km, predicted race time (s), readiness object (score/label/color/recommendation/coach_tip). |
| `transformationPlan.ts` | Owns runner pace-improvement journey: given current + target pace, projects weeks to transform (tier-dependent rate) and lays out per-week milestones cycling 10 coaching focus areas (base, strength, cadence, tempo, speed, endurance, threshold, race prep, recovery, mental). | `generateTransformationPlan`, `Milestone`, `TransformationResult` | currentPace (sec/km), targetPace (sec/km), currentTier (beginner/intermediate/advanced). | TransformationResult: current/target pace, current tier, next target tier, estimated_weeks (clamped 4-24), Milestone[] (week, interpolated target_pace, focus_area, tips). |
| `progressTracker.ts` | Owns progress-reporting + 'undeniable improvement' analytics. Computes period summaries, prior-period comparisons, PRs, run streaks (1 rest day tolerated), pace improvement velocity via linear regression w/ 5K projection, distance/run/pace milestone tracking. | `generateProgressReport` | RunData[] (distance_meters, moving_time_seconds, average_pace_per_km, start_date) + period (weekly/monthly/all_time). | ProgressReport: summary stats, optional comparison (human-readable msg), personal_records[], streaks (current/longest/active), improvement_velocity (pace/week, projected 5K time), milestones_reached[], next_milestone w/ progress %. |
| `runCascade.ts` | Orchestrates all side effects when a run completes — the gamification/integrity cascade. Owns GPS fraud flagging, streak update, XP award + level-up, Kendu points, PB detection, achievement unlocks, active-goal completion checks, notification creation. Writes to Postgres throughout. | `executeRunCascade` | RunCompletedPayload (userId, activityId, distanceMeters, movingTimeSeconds, pacePerKm, elevationGain). Reads/writes activities, user_xp, xp_transactions, user_goals, user_notifications. Delegates to gpsValidation, kenduEngine, achievementEngine. | CascadeResult: xp (awarded/total/level/leveledUp), kendu (awarded/breakdown/balance/capped/streak), achievements unlocked, notifications created, streak (current/longest/extended), personalBest (isPB/type/previousBest), goals completed, validation (suspicious/flags/confidence). Side effects: DB mutations + notification rows. |
| `autoDetection.ts` | Owns zero-manual-input detection from synced run data: matches activities to planned sessions (confidence scoring by distance/pace/duration/day), auto-completes running/technique/gear challenges, infers runner level/profile + fitness trend, computes XP for a synced activity. | `matchActivityToSession`, `checkChallengeCompletion`, `detectRunnerProfile`, `processNewActivity` | Activity records (distance, time, pace, HR, elevation, date), PlannedSession[] (type, distance, duration, pace, intervals), Challenge[] (category, requirement_type, target_value/unit), arrays of recent activities. | matchActivityToSession -> {matched, confidence, reason}; checkChallengeCompletion -> {completed, reason}; detectRunnerProfile -> estimated_level, weekly volume, avg pace, consistency, longest run, runs/week, speed-work/long-run flags, trend, summary; processNewActivity -> {session_matched, session_match_confidence, challenges_completed[], xp_earned, summary}. |
| `achievementEngine.ts` | Owns achievement-unlock logic: evaluates user run/streak stats against achievement requirement rules and awards newly-earned achievements + XP. | `checkAndUnlockAchievements` | userId + context {totalRuns, totalDistanceKm, currentStreakDays, latestRunDistanceKm, latestPacePerKm}; reads achievements + user_achievements from Postgres. | UnlockedAchievement[] {id, name, icon, xpReward}; side effects: inserts user_achievements (ON CONFLICT DO NOTHING), increments user_xp.total_xp, inserts xp_transactions per award. |
| `challengeGenerator.ts` | Owns weekly-challenge selection: static catalog of templates across 7 categories x 3 tiers, deterministically picks 4 tier-appropriate challenges per user/week (seeded RNG so same user+week always yields same set). | `generateWeeklyChallenges` | userId, tier (beginner/intermediate/advanced), weekStart (date string). Pure — no DB/external I/O; all content in TEMPLATES constant. | Array of 4 challenge objects {category, title, description, target_value?, target_unit?, xp_reward, tier}. Deterministic via seededRandom over userId + weekStart. |
| `personalRecords.ts` | Owns PR computation: derives PRs across standard distances (1K/3K/5K/10K/Half/Marathon w/ tolerance bands + proportional time normalization) + effort PRs (fastest pace, longest run/duration, most elevation), detects new PRs / near-misses per synced activity. | `calculateAllPRs`, `checkForNewPRs`, `getPRSummary` | Activity[] {distance_meters, moving_time_seconds, average_pace_per_km, elevation_gain?, start_date, ...}; for checking, a new Activity + existing PersonalRecord[]. Pure — no DB I/O. | calculateAllPRs -> PersonalRecord[]; checkForNewPRs -> PRCheck {new_prs, near_misses, total_prs} w/ improvement deltas + previous-best; getPRSummary -> {race_prs, effort_prs, total_count, latest_pr, predicted_next?}. Times/paces as display strings (MM:SS / H:MM:SS). |
| `gpsValidation.ts` | Owns GPS fraud/spoofing detection: scores a run for anomaly indicators and flags suspicious activities for admin review (flags only, never blocks the run). | `validateRunData`, `GpsValidationInput`, `GpsValidationResult` | GpsValidationInput {distanceMeters, movingTimeSeconds, pacePerKm, splits? (JSON per-km), elevationGain?}. Pure — no DB I/O. Tolerant split parser. | GpsValidationResult {suspicious, flags[], confidence 0-100}. Checks: impossible/too-slow pace, teleportation (>3x ratio), low pace variance (CoV), impossible elevation/km, impossibly short time. Suspicious when confidence < 60 or >= 2 flags. |
| `eventBus.ts` ⚠️ | **Unwired infra.** Defines a typed EventEmitter intended to decouple run-completion from its cascade — BUT nothing emits/subscribes (repo-wide grep for `eventBus.emit`/`eventBus.on` = 0 hits). `runs.routes.ts:163` calls `executeRunCascade(...)` **directly/synchronously**. In practice the module is used ONLY as the source of the `RunCompletedPayload`/`CascadeResult` **type** definitions. | `eventBus` (singleton, unused at runtime), `RunCompletedPayload`, `CascadeResult` (types) | — (no live publishers/subscribers) | Type defs consumed by runCascade.ts; the singleton bus is dead/aspirational. |

---

## 3. Data Model (73 tables)

The Postgres schema spans 73 tables. They are grouped below by domain. Nearly every table references `users` via a `user_id` foreign key with `ON DELETE CASCADE` unless noted otherwise.

### 3.1 Users / Auth

| Name | Purpose | Key columns | Relates to |
|------|---------|-------------|------------|
| `users` | Core account + runner demographic/profile record | `id` (PK), `email` (unique), `password_hash`, `role`, `gender`, `age`, `height_cm`, `weight_kg`, `fitness_level`, `running_experience`, `invite_code_id` | `invite_codes` (via `invite_code_id`, informal) |
| `strava_tokens` | Per-user Strava OAuth access/refresh tokens | `id` (PK), `user_id` (FK, unique), `strava_athlete_id`, `access_token`, `refresh_token`, `expires_at`, `scope` | `users` (cascade) |
| `user_profiles` | Extended lifestyle/goal/access profile keyed 1:1 to user | `user_id` (PK & FK), `sleep_hours`, `available_days`, `primary_goal`, `target_race`, `diet_type`, `stress_level`, `has_gym_access` | `users` (cascade) |
| `runner_profiles` | AI runner personality/coaching profile (1:1 user) | `id` (PK), `user_id` (FK, unique), `dream_race`, `running_why`, `coach_style`, `estimated_vo2max`, `ai_coach_name`, `profiling_complete` | `users` (cascade) |
| `password_reset_tokens` | One-time password reset tokens with expiry | `id` (PK), `user_id` (FK), `token` (unique), `expires_at`, `created_at` | `users` (cascade) |
| `invite_codes` | Invite/referral codes with usage limits | `id` (PK), `code` (unique), `name`, `max_uses`, `used_count`, `source`, `expires_at`, `created_by` (FK), `active` | `users` (`created_by`), `invite_code_usage` |
| `invite_code_usage` | Records each redemption of an invite code | `id` (PK), `code_id` (FK), `user_id` (FK), `used_at` | `invite_codes`, `users` |

### 3.2 Activities / Runs

| Name | Purpose | Key columns | Relates to |
|------|---------|-------------|------------|
| `activities` | Synced/recorded run activities with metrics | `id` (PK), `user_id` (FK), `strava_activity_id` (unique), `session_id`, `distance_meters`, `moving_time_seconds`, `average_pace_per_km`, `start_date`, `splits`, `average_heartrate` | `users` (cascade), `club_sessions` (`session_id`, informal) |
| `club_sessions` | Scheduled club run sessions with target distance | `id` (PK), `title`, `target_distance_meters`, `session_date`, `location` | `activities`, `session_attendance` |
| `session_attendance` | Tracks user attendance at club sessions | `id` (PK), `user_id` (FK), `session_id` (FK), `activity_id`, `attended`, `unique(user_id, session_id)` | `users`, `club_sessions`, `activities` (informal) |
| `personal_records` | Per-user personal records (PRs) by category | `id` (PK), `user_id` (FK), `category`, `value`, `activity_id`, `achieved_at` | `users` (cascade), `activities` (informal) |

### 3.3 Coaching / AI

| Name | Purpose | Key columns | Relates to |
|------|---------|-------------|------------|
| `tier_history` | Historical AI tier classifications per user | `id` (PK), `user_id` (FK), `tier`, `estimated_vo2max`, `age_graded_percent`, `score`, `calculated_at` | `users` (cascade) |
| `transformation_plans` | Generated week-by-week transformation/training plan per user | `id` (PK), `user_id` (FK), `current_pace_per_km`, `target_pace_per_km`, `current_tier`, `target_tier`, `estimated_weeks`, `plan_data` | `users` (cascade) |
| `chat_messages` | AI coach conversation history (user/assistant turns) | `id` (PK), `user_id` (FK), `role`, `content`, `context`, `created_at` | `users` (cascade) |
| `ai_profiles` | Permanent AI memory of extracted user insights (1:1 user) | `user_id` (PK & FK), `running_profile`, `health_notes`, `diet_preferences`, `personal_context`, `conversation_insights`, `goals` | `users` (cascade) |
| `ai_usage` | AI token usage tracking per user/model for limiting | `id` (PK), `user_id` (FK), `model`, `input_tokens`, `output_tokens`, `purpose`, `created_at` | `users` (cascade) |
| `ai_checkins` | AI check-in responses (pre/post-run, weekly review) | `id` (PK), `user_id` (FK), `type`, `responses`, `ai_summary`, `created_at` | `users` (cascade) |

### 3.4 Gamification / XP

| Name | Purpose | Key columns | Relates to |
|------|---------|-------------|------------|
| `user_xp` | Aggregated XP, level, and streak state per user | `id` (PK), `user_id` (FK, unique), `total_xp`, `current_level`, `current_streak_days`, `longest_streak_days`, `last_activity_date` | `users` (cascade) |
| `xp_transactions` | Append-only log of XP awards with source | `id` (PK), `user_id` (FK), `amount`, `source`, `description`, `created_at` | `users` (cascade) |
| `challenges` | Weekly personalized challenges assigned to a user | `id` (PK), `user_id` (FK), `week_start`, `category`, `title`, `tier`, `xp_reward`, `completed`, `completed_at` | `users` (cascade) |
| `achievements` | Catalog of earnable achievement definitions | `id` (PK), `name` (unique), `icon`, `category`, `requirement_type`, `requirement_value`, `xp_reward` | `user_achievements` |
| `user_achievements` | Join table of which users earned which achievements | `id` (PK), `user_id` (FK), `achievement_id` (FK), `earned_at`, `unique(user_id, achievement_id)` | `users` (cascade), `achievements` |
| `user_skins` | Card skins owned/purchased by a user | `id` (PK), `user_id` (FK), `skin_id`, `purchased_at` | `users` (cascade) |

### 3.5 Goals / Progress

| Name | Purpose | Key columns | Relates to |
|------|---------|-------------|------------|
| `user_goals` | Multiple user goals (race/pace/volume/event) merged into plan | `id` (PK), `user_id` (FK), `type`, `status`, `distance_meters`, `target_time_seconds`, `target_date`, `event_id` (FK), `name` | `users` (cascade), `events` |

### 3.6 Social

| Name | Purpose | Key columns | Relates to |
|------|---------|-------------|------------|
| `follows` | Social follower/following graph edges | `id` (PK), `follower_id` (FK), `following_id` (FK), `unique(follower_id, following_id)` | `users` (`follower_id` cascade), `users` (`following_id` cascade) |
| `kudos` | Reactions (high-fives) on activities | `id` (PK), `user_id` (FK), `activity_id` (FK), `reaction_type`, `unique(user_id, activity_id)` | `users` (cascade), `activities` (cascade) |
| `comments` | User comments on activities | `id` (PK), `user_id` (FK), `activity_id` (FK), `body`, `created_at` | `users` (cascade), `activities` (cascade) |

### 3.7 Communities

| Name | Purpose | Key columns | Relates to |
|------|---------|-------------|------------|
| `communities` | Community/club entities with owner and category | `id` (PK), `owner_id` (FK), `name`, `category`, `is_verified`, `member_count` | `users` (cascade), `community_members` / `community_posts` / `community_polls` / `community_broadcasts` / `community_mutes` / `community_chat_messages` |
| `community_members` | Membership + role of users in communities | `id` (PK), `community_id` (FK), `user_id` (FK), `role`, `joined_at`, `unique(community_id, user_id)` | `communities` (cascade), `users` (cascade) |
| `community_posts` | Posts within a community feed | `id` (PK), `community_id` (FK), `author_id` (FK), `body`, `image_url`, `pinned` | `communities` (cascade), `users` (`author_id` cascade), `community_post_likes` / `community_post_reactions` |
| `community_post_likes` | Likes on community posts | `id` (PK), `post_id` (FK), `user_id` (FK), `unique(post_id, user_id)` | `community_posts` (cascade), `users` (cascade) |
| `community_post_reactions` | Emoji reactions on community posts | `id` (PK), `post_id` (FK), `user_id` (FK), `emoji`, `unique(post_id, user_id, emoji)` | `community_posts` (cascade), `users` (cascade) |
| `community_polls` | Polls posted within a community | `id` (PK), `community_id` (FK), `author_id` (FK), `question`, `options`, `closes_at` | `communities` (cascade), `users` (`author_id` cascade), `community_poll_votes` |
| `community_poll_votes` | User votes on community polls | `id` (PK), `poll_id` (FK), `user_id` (FK), `option_index`, `unique(poll_id, user_id)` | `community_polls` (cascade), `users` (cascade) |
| `community_broadcasts` | One-way owner/admin broadcasts to a community | `id` (PK), `community_id` (FK), `author_id` (FK), `body`, `created_at` | `communities` (cascade), `users` (`author_id` cascade) |
| `community_mutes` | Per-user mute preference for a community | `id` (PK), `community_id` (FK), `user_id` (FK), `muted_at`, `unique(community_id, user_id)` | `communities` (cascade), `users` (cascade) |
| `community_chat_messages` | Real-time community chat messages. **Written ONLY by the WebSocket server** (`websocket.ts:94`, see §1E); the REST route `GET /communities/:id/chat` only reads it — no REST endpoint inserts here. | `id` (PK), `community_id` (FK), `user_id` (FK), `body`, `created_at` | `communities` (cascade), `users` (cascade) |
| `community_requests` | User requests to create a new community (admin review queue) | `id` (PK), `user_id` (FK), `name`, `purpose`, `category`, `leader_name`, `status`, `reviewed_at` | `users` (cascade) |

### 3.8 Events

| Name | Purpose | Key columns | Relates to |
|------|---------|-------------|------------|
| `events` | User-created meetups/group runs with location and status | `id` (PK), `creator_id` (FK), `title`, `event_type`, `date`, `time`, `location_name`, `latitude`, `longitude`, `visibility`, `status`, `check_in_code` | `users` (cascade), `event_rsvps` / `event_comments` / `event_hosts` / `event_awards` / `event_checkins`, `user_goals` |
| `event_rsvps` | User RSVP status (going/maybe/not_going) per event | `id` (PK), `event_id` (FK), `user_id` (FK), `status`, `unique(event_id, user_id)` | `events` (cascade), `users` (cascade) |
| `event_comments` | Comments on events | `id` (PK), `event_id` (FK), `user_id` (FK), `body`, `created_at` | `events` (cascade), `users` (cascade) |
| `event_hosts` | Additional co-hosts assigned to an event | `id` (PK), `event_id` (FK), `user_id` (FK), `role_label`, `unique(event_id, user_id)` | `events` (cascade), `users` (cascade) |
| `event_awards` | Auto-generated awards/rankings on event completion | `id` (PK), `event_id` (FK), `user_id` (FK), `award_type`, `award_title`, `rank_position`, `stat_value` | `events` (cascade), `users` (cascade) |
| `event_checkins` | User check-ins at an event | `id` (PK), `event_id` (FK), `user_id` (FK), `checked_in_at`, `unique(event_id, user_id)` | `events` (cascade), `users` (cascade) |

### 3.9 Wellness / HR

| Name | Purpose | Key columns | Relates to |
|------|---------|-------------|------------|
| `daily_wellness` | Daily sleep/stress/energy log for adaptive engine | `id` (PK), `user_id` (FK), `date`, `sleep_hours`, `stress_level`, `energy_level`, `notes`, `unique(user_id, date)` | `users` (cascade) |
| `lt_tests` | Lactate threshold test results per user | `id` (PK), `user_id` (FK), `test_date`, `avg_pace_per_km`, `avg_heartrate`, `duration_seconds` | `users` (cascade) |
| `hrv_readings` | HRV readings (RMSSD/SDNN) manual or wearable-synced | `id` (PK), `user_id` (FK), `date`, `rmssd`, `sdnn`, `source`, `unique(user_id, date)` | `users` (cascade) |

### 3.10 Kendu Economy

| Name | Purpose | Key columns | Relates to |
|------|---------|-------------|------------|
| `kendu_balances` | Kendu economy spendable/lifetime balance per user (1:1) | `id` (PK), `user_id` (FK, unique), `spendable_balance`, `lifetime_earned`, `current_streak_days`, `last_run_date` | `users` (cascade) |
| `kendu_transactions` | Kendu economy transaction history | `id` (PK), `user_id` (FK), `amount`, `source`, `description`, `metadata` | `users` (cascade) |
| `kendu_offers` | Kendu rewards-store offers/redeemable items | `id` (PK), `name`, `cost`, `category`, `active`, `max_redemptions` | `kendu_redemptions`, `kendu_coupon_codes` |
| `kendu_redemptions` | Records of users redeeming Kendu offers | `id` (PK), `user_id` (FK), `offer_id` (FK), `coupon_code`, `redeemed_at` | `users` (cascade), `kendu_offers` |
| `kendu_coupon_codes` | Pool of coupon codes tied to offers, single-use | `id` (PK), `offer_id` (FK), `code`, `is_used`, `used_by_user_id` (FK), `used_at` | `kendu_offers`, `users` (`used_by_user_id`) |
| `kendu_ledger` | Immutable credit/debit audit ledger with running balance | `id` (PK), `user_id` (FK), `amount`, `type`, `source`, `balance_after`, `metadata` | `users` (cascade) |
| `kendu_challenges` | Head-to-head wager challenges between two users | `id` (PK), `challenger_id` (FK), `opponent_id` (FK), `stake_amount`, `metric`, `status`, `winner_id` (FK), `deadline` | `users` (`challenger_id`), `users` (`opponent_id`), `users` (`winner_id`) |
| `kendu_subscriptions` | Recurring Kendu-coin subscriptions (e.g. community upkeep) | `id` (PK), `user_id` (FK), `entity_type`, `entity_id`, `amount`, `is_active`, `next_due_at` | `users` (cascade), polymorphic `entity_type`/`entity_id` (informal) |

### 3.11 Subscription / Payments

| Name | Purpose | Key columns | Relates to |
|------|---------|-------------|------------|
| `subscription_plans` | Catalog of paid subscription plan definitions (INR) | `id` (PK), `key` (unique), `name`, `price_inr`, `duration_days`, `features`, `razorpay_plan_id`, `active` | `user_subscriptions` (`plan_key`), `payment_history` (`plan_key`) |
| `user_subscriptions` | Active/expired subscription records per user | `id` (PK), `user_id` (FK), `plan_key`, `status`, `started_at`, `expires_at`, `razorpay_subscription_id`, `auto_renew` | `users` (cascade), `subscription_plans` (informal) |
| `payment_history` | Razorpay payment/order transaction records | `id` (PK), `user_id` (FK), `plan_key`, `amount_inr`, `status`, `razorpay_order_id`, `razorpay_payment_id` | `users` (cascade), `subscription_plans` (informal) |

### 3.12 Notifications

| Name | Purpose | Key columns | Relates to |
|------|---------|-------------|------------|
| `push_subscriptions` | Web-push subscription endpoints per user | `id` (PK), `user_id` (FK), `endpoint`, `p256dh`, `auth` | `users` (cascade) |
| `notifications` | Admin broadcast/scheduled push notification campaigns | `id` (PK), `title`, `body`, `target_type`, `target_id`, `scheduled_at`, `sent_at`, `status`, `sent_count` | `segments` / `users` (via `target_type`+`target_id`, informal) |
| `user_notifications` | In-app notification inbox per user | `id` (PK), `user_id` (FK), `type`, `title`, `body`, `actor_id` (FK), `target_type`, `target_id`, `read` | `users` (cascade), `users` (`actor_id` SET NULL) |

### 3.13 Admin / Flags / Segments / Analytics

| Name | Purpose | Key columns | Relates to |
|------|---------|-------------|------------|
| `announcements` | Admin-authored announcements to the club | `id` (PK), `admin_id` (FK), `title`, `body`, `pinned`, `created_at` | `users` (`admin_id`) |
| `analytics_events` | Raw product analytics event stream | `id` (PK), `user_id` (FK nullable), `event_type`, `event_name`, `properties`, `session_id`, `created_at` | `users` (`user_id` SET NULL) |
| `daily_metrics` | Daily rolled-up KPI snapshot (DAU, retention, volume) | `id` (PK), `date` (unique), `dau`, `new_users`, `active_runners`, `total_distance_meters`, `retention_d1/d7/d30` | — |
| `feature_flags` | Feature flag definitions with rollout config | `id` (PK), `key` (unique), `name`, `enabled`, `rollout_percentage`, `target_segments` | `feature_flag_overrides` |
| `feature_flag_overrides` | Per-user overrides of a feature flag | `id` (PK), `flag_id` (FK), `user_id` (FK), `enabled`, `unique(flag_id, user_id)` | `feature_flags` (cascade), `users` (cascade) |
| `segments` | User segment definitions with criteria | `id` (PK), `name`, `criteria`, `auto_refresh`, `member_count` | `segment_members`, `content_blocks` (`target_segment_id`) |
| `segment_members` | Materialized membership of users in segments | `id` (PK), `segment_id` (FK), `user_id` (FK), `added_at`, `unique(segment_id, user_id)` | `segments` (cascade), `users` (cascade) |
| `content_blocks` | CMS content (tips/articles/quotes/coaching messages) | `id` (PK), `type`, `title`, `body`, `target_tier`, `target_segment_id` (FK), `published`, `scheduled_at` | `segments` (`target_segment_id` SET NULL) |
| `admin_audit_log` | Audit trail of admin actions | `id` (PK), `admin_id` (FK), `action`, `target_type`, `target_id`, `details`, `created_at` | `users` (`admin_id`) |
| `sprint_history` | Engineering hub log of proposed/built/auto-fixed sprints | `id` (PK), `sprint_date`, `proposed`, `built`, `auto_fixed`, `status` | — |

### 3.14 Misc

| Name | Purpose | Key columns | Relates to |
|------|---------|-------------|------------|
| `waitlist` | Pre-launch waitlist signups (email/phone/name) | `id` (PK), `email`, `phone`, `name`, `created_at` | — |
| `feedback` | User-submitted feedback (bug/idea/complaint/praise) | `id` (PK), `user_id` (FK nullable), `type`, `message`, `page`, `status`, `admin_notes` | `users` (`user_id` SET NULL) |

---

## 4. Frontend Page Inventory (35 pages)

> Legend: 🎯 = redesign target · ⚠️ = DEAD / unrouted (legacy code, unreachable via router)

### Auth & Landing

| File | Route | Purpose | API calls | Navigates to | States (empty/loading/error) |
|------|-------|---------|-----------|--------------|------------------------------|
| `HomePage.tsx` | `/` (catch-all `*` redirects here; `PublicRoute` → /admin or /dashboard if logged in) | Unauthenticated landing/auth: 2s splash, auto-rotating feature carousel, Google + email login | `POST /auth/login`, `POST /auth/google` | `/profiling` (Google new user), `/dashboard` (existing), `/register`, `/forgot-password` | 2s splash gate; "Logging in..." on submit; red login/google error text; carousel auto-advances 3.5s; all content hardcoded (no fetch states) |
| `LandingPage.tsx` | `/join` AND `/founding` (NOT route-guarded — public even when logged in) | Founding-member waitlist marketing funnel; lead-capture form, perks, event details, spots counter | **NONE** — submit SIMULATED via 1200ms setTimeout; `spotsRemaining` hardcoded 50 | `/register` (success "Create Account →") | Client-side per-field validation (red text); "Registering..." spinner; success card swap; static 10-segment spots bar; no network states |
| `RegisterPage.tsx` | `/register` (`PublicRoute` → away if logged in) | Thin wrapper for `RegistrationFlow`: 2-step email signup (creds + strength meter; optional photo) + Google signup | `POST /auth/register`, `POST /auth/google` (NOTE: selected photo File captured but NOT uploaded) | `/profiling` (via `window.location.href` on email/Google success); Back decrements step | Live email/password-strength/match validation; Continue disabled until `canProceed()`; "Creating account..."; red error text; photo step skippable |
| `ForgotPasswordPage.tsx` | `/forgot-password` (lazy; NOT route-guarded — public) | Password-reset request: enter email, privacy-safe messaging | `POST /auth/forgot-password` | `/` ("Back to login" Link) | Submit disabled when `!email \|\| loading`; "Sending..."; success swaps to "Check your email" view; red error text; email required + autoFocus; no mount fetch |
| `ResetPasswordPage.tsx` | `/reset-password/:token` (lazy; NOT route-guarded; reads `:token`) | Set new password from emailed link | `POST /auth/reset-password` (body `{token, password}`) | `/` (success "Go to login") | Client-side password-match check; submit disabled until both + not loading; "Updating..."; success "Password updated" view; red error (expired-link fallback); no token pre-validation |

### Authenticated Home

| File | Route | Purpose | API calls | Navigates to | States (empty/loading/error) |
|------|-------|---------|-----------|--------------|------------------------------|
| `DashboardPage.tsx` | `/dashboard` (`ProtectedRoute` → / if no user) | Thin wrapper `<AppShell><Dashboard/></AppShell>`; tier/level/XP, onboarding checklist OR stats, today's session, pace trail, recent runs, athlete card, challenges | `GET /dashboard` (batched: xp/tier/challenges/runStats/profilingStatus), `GET /notifications/unread-count` (via AppShell); children fetch own | `/profile` (avatar + photo step), `/notifications` (bell), `/profiling`, `/run/track`, `/challenges` ("See all"), BottomNav tabs | New-user: onboarding checklist + locked Coach card. Active: `DashboardSkeleton`. Challenges only if `length>0`; best pace "—" when none; level-up confetti/toast/sound; errors via global ErrorBoundary |

### Coaching & Training

| File | Route | Purpose | API calls | Navigates to | States (empty/loading/error) |
|------|-------|---------|-----------|--------------|------------------------------|
| 🎯 `CoachPage.tsx` | `/coach` (protected, lazy). Redirect target for `/coaching`, `/training`, `/train`, `/chat` | Unified AI Coach hub: 5 scrollable sub-tabs (Chat, Plan, Insights, Zones, Records). Consolidated the legacy standalone coaching pages | None directly — delegated to tabs: ChatTab (none, static), TrainTab (`GET /training/plan`,`/training/week`,`/goals`,`/insights/pre-run`), AIAnalyticsTab (`GET /coach/insights`), embedded HRZonesPage + RecordsPage | None from shell. Via TrainTab: `/set-goal`, `/plan`, `/run/track`. Accepts `location.state.tab` to preselect | zones/records tabs Suspense pulse skeleton; default tab "chat" unless state override; empty/error live in child tabs |
| ⚠️ `CoachingPage.tsx` | NOT ROUTED — `/coaching` → `<Navigate to="/coach">`. Dead/legacy (only AIProfilePage's "Start Coaching" hits `/coaching` → redirects) | Legacy "Transformation journey": current→target pace, milestone timeline, VO2max, pace zones. Superseded by CoachPage | Via `CoachingPanel`: `GET /coaching/tier`,`/coaching/ideal-pace`,`/coaching/transformation` | None (no navigate/links) | No loading/error UI; sections render only when query data truthy; header with empty space while pending |
| ⚠️ `ChatPage.tsx` | NOT ROUTED — `/chat` → `<Navigate to="/coach">`; not imported into App.tsx. Dead/legacy (full chat that ChatTab only stubs "Coming Soon") | Full conversational AI Coach chat: message thread, quick-prompt chips, typing indicator, Kendu-spend "Deep Dive" | `GET /chat/history`, `GET /chat/suggestions`, `GET /kendu/balance`, `POST /chat/message`, `POST /kendu/spend/ai-deep-dive` (30 Kendu) | `/dashboard` (plain `<a>` back arrow); Deep Dive opens modal | Empty: hero + quick-prompt grid (server or 4 fallback). Typing 3-dot indicator; input disabled during send; auto-scroll; no error UI |
| `PlanPage.tsx` | `/plan` (protected, lazy). Reached from CoachPage TrainTab "See full plan →" | Multi-week training plan as phase-colored timeline (Base/Build/Peak/Taper); tappable week cards expand to daily sessions; race-day node + predicted finish | `GET /training/plan`, `GET /goals` (fallback `{active:[]}`) | `/coach` with `{tab:'plan'}` (Back to Coach), `/set-goal` (no-plan empty), in-page expand week | Loading: 3-block pulse skeleton. No-plan: 🎯 "No plan yet" + Set Goal; no dedicated error |
| ⚠️ `TrainingPage.tsx` | NOT ROUTED — `/training` → `<Navigate to="/coach">`; never imported. Legacy "this week" view | Current-week dashboard: inline Set Goal form, 5K prediction (VDOT), readiness dot, session list w/ "Done ✓", phase tips | `GET /training/week`,`/training/predict?distance=5000`,`/training/readiness`, `POST /training/plan`, `POST /training/complete-session` | No route nav — all in-page (toggle form, generate, complete) | "Loading plan..."; no-plan 📋 prompt; "Generating..." / disabled; complete disabled while pending; prediction hidden if confidence "low"; no error UI |
| ⚠️ `TrainPage.tsx` | NOT ROUTED — lazy-imported but NO `<Route>`; `/train` → `<Navigate to="/coach">`. Unreachable (dead/legacy "gamified path") | Duolingo-style winding SVG road of workout nodes by biome; coach persona message; consistency projection; bottom-sheet workout detail modal | `GET /profiling/dna` (.catch null), `GET /adaptive/summary` (.catch null, unused), `GET /training/plan` (.catch null → sample path) | No route nav — modal CTA only closes modal (does NOT navigate) | No loading/error UI; all queries .catch null; falls back to `generateSamplePath`; coach defaults "The Energizer"; future nodes 0.5 opacity |
| `AIProfilePage.tsx` | `/ai-profile` (protected, lazy) | "What Your AI Coach Knows" — viewable/editable memory profile: runner summary, editable lists (health/goals/diet/context), AI insights, usage stats | `GET /ai/profile` (mount), `PATCH /ai/profile {field,value}` (optimistic, revert via refetch) | `/coaching` (empty-state "Start Coaching" via `window.location.href` → redirects /coach) | Loading: pulse skeleton. Error: 😵 full-screen + Try Again. Empty: 🧠 "No AI Profile Yet". Per-section empties; optimistic save w/ revert |
| `AIProfilingPage.tsx` | `/profiling` (protected, lazy) | First-run onboarding wizard (8 steps 0–7); POSTs to generate "Running DNA"; then DNAReveal (coach persona, VO2max, tier, zones, tags, Week-1 preview) | `POST /profiling/generate` (then 2.5s delay → DNAReveal) | `/run/track` (Step 0 GPS link), `/set-goal` (DNAReveal CTA); in-wizard Continue/Back/Skip | Analyzing full-screen ring spinner ~2.5s; Continue gated by `canProceed()`; DNAReveal "--" for missing fields, coach defaults "The Scientist"; NO POST error UI (analyzing persists on failure) |

### Runs & Records

| File | Route | Purpose | API calls | Navigates to | States (empty/loading/error) |
|------|-------|---------|-----------|--------------|------------------------------|
| 🎯 `RunTrackerPage.tsx` | `/run/track` | Live GPS run tracker (route/distance/pace/elevation/splits via Geolocation); RPE rating; post-run analysis card + gamification cascade. NOTE: score/tags/commentary computed CLIENT-SIDE; server only supplies cascade. ProgressRing goal hardcoded 5000m; ZoneBar 375-405 | `GET /api/training/paces` (silent fallback), `POST /api/runs/log` (returns cascade xp/kendu/streak/PB/achievements) | `/share` (Share Card), `/dashboard` (Back, state `{fromRun:true}`) | IDLE "Locating you..." spinner; friendly GPS errors (red banner/yellow toast); Save disabled while saving or <10m, "Saving..."; POST fail → alert + revert; state machine IDLE→RUNNING→PAUSED→FINISHED→ANALYSIS |
| `RunHistoryPage.tsx` | `/runs` | Lists last 30 runs + summary stats (total runs/km, best pace). Cards display-only, NOT clickable. bestPace client-side `Math.min` | `GET /runs?limit=30` (reads `data.runs`) | (none) | Loading: 4 pulse rows. Empty: 🏃 "No runs yet". No explicit error (falls back to [] → empty). Summary row only when `totalRuns>0` |
| `RecordsPage.tsx` | `/records` | Personal records: race-distance PRs (1K–Marathon), effort records, PR timeline. Optional `{embedded}` prop drops AppShell. Display-only | `GET /records` (total_count, race_prs, effort_prs), `GET /records/timeline` (.catch null) | (none) | Loading: 4 pulse rows. Empty: 🏆 tile. Each section renders only if array length; timeline fail → null; "New" badge <14 days |
| `HRZonesPage.tsx` | `/heart-rate` | Personalized HR zones Z1–Z5, cardiac metrics (Max HR, HR Reserve, LTHR), source indicator, efficiency trend. Optional `{embedded}`. Display-only | `GET /heartrate/zones`, `GET /heartrate/trends` (.catch null) | (none) | Loading: 5 pulse rows. No empty state (sections gate on truthiness → header only); source dot green/amber; efficiency green/red, hidden if 0; trends fail → null |
| `ProgressPage.tsx` | `/progress` | Two-tab growth dashboard: "Stats" (pace improvement, line chart, PRs, milestone bar) + "Journey" (milestone timeline, lazy-enabled). Display-only | `GET /progress/improvement`, `GET /progress/weekly`, `GET /progress/journey` (enabled only on journey tab, .catch null) | (none) | Top loading: full-page pulse. Journey empty: 🗺️. Stats empty: 📈; sub-sections gate on data; chart needs `trend.length>2`; no error UI |

### Goals & Sharing

| File | Route | Purpose | API calls | Navigates to | States (empty/loading/error) |
|------|-------|---------|-----------|--------------|------------------------------|
| `SetGoalPage.tsx` | `/set-goal` | 4-step wizard (type → config → time/timeline → success) to create goal (race/pace/volume) + trigger AI plan. Two POSTs chained in one mutation | `POST /goals`, `POST /goals/generate-plan` | `/dashboard` (Skip / Go to Dashboard), `/coach` (Step 3 "View My Plan" primary CTA) | No data-loading (create flow). "Generating your plan..." disabled; Step 1 Continue gated; error → `setGenerating(false)` + alert; success step 3 🎯 spring |
| `SharePage.tsx` | `/share` | Run-card sharing studio: pick run, choose 1 of 9 9:16 templates (3 premium Kendu-locked), optional bg photo, download/share JPEG. Locked → KenduSpendConfirmModal (40 Kendu). Defensive on response shape | `GET /runs?limit=10`, `GET /gamification/xp`, `GET /coaching/tier`, `GET /kendu/balance`, `GET /kendu/skins` (.catch []), `POST /kendu/spend/card-skin` | (none) | No-run empty: 🏆 "Complete a run first". Auto-selects recent run; Download disabled while downloading, "Saving..."; image <5MB validation; toJpeg fail → console/handleDownload; locked 🔒 → modal; Web Share API fallback |

### Social & Communities

| File | Route | Purpose | API calls | Navigates to | States (empty/loading/error) |
|------|-------|---------|-----------|--------------|------------------------------|
| `SocialPage.tsx` | `/social` (ProtectedRoute, lazy). Redirect target of `/feed` → `/social` | Social hub shell: 2 sub-tabs (Feed/Communities) via local state; no fetch/nav of its own — delegates to FeedTab + CommunitiesTab. Default "feed". This (NOT FeedPage) renders `/social` | (none) | None directly. Children: FeedTab → `/user/:user_id`; CommunitiesTab → `/communities/:id` | None of its own. FeedTab: 3 pulse cards, 👟 "No activity yet", swallows errors→empty. CommunitiesTab: 3 skeletons, 👥 "No communities yet", catches→empty |
| ⚠️ `FeedPage.tsx` | NOT ROUTED — no `<Route>` references it; `/feed` → `<Navigate to="/social">` (renders SocialPage's social/FeedTab, not this). Dead/legacy | Standalone "Club Feed": run cards w/ stats, emoji reactions (kudos + picker + floating-emoji), inline comments | `GET /social/feed`, `POST /social/kudos/:activityId`, `DELETE /social/kudos/:activityId`, `POST /social/comments/:activityId` | None (avatars/names NOT clickable here, unlike social/FeedTab) | Loading: 3 pulse cards. Empty: 👥 "Follow club members". End: "You're all caught up". No isError handling → falls to empty |
| 🎯 `CommunitiesPage.tsx` | `/communities` (ProtectedRoute, lazy) | Community discovery/directory: browse by category, "Your communities" horizontal strip, create/request. Category filter drives fetch | `GET /communities?category=` ('all'→undefined), `GET /communities/my` | `/communities/create` ("+ Create"), `/communities/:id` (Discover card), `/communities/:id` ("Your communities" pill) | Loading: 3 pulse cards. Empty: 🏘️. "Your communities" only when items; Discover heading whenever not loading; no error state |
| `CommunityDetailPage.tsx` | `/communities/:id` (ProtectedRoute, lazy; reads `:id`; defined AFTER /create so "create" matches literally) | Full community workspace, 5 in-page tabs: Feed (like/react/Kendu Boost-pin), Chat (WebSocket, members only), Leaderboard (digest/Sponsor Board), Members, Info (mute/leave/Polls/Broadcast). Kendu economy | `GET/POST/DELETE` across `/communities/:id` (members, join/leave, posts, like, react, mute, polls, broadcasts, chat, leaderboard, digest), `GET /kendu/balance`, `POST /kendu/spend/boost-post` (10), `POST /kendu/spend/sponsor` (500), **WebSocket** `/ws?token=&community=` | `/communities` (back / not-found), `/user/:user_id` (Members rows) | Page loading: full pulse skeleton. Not-found: 🤷. Feed empty: 💬. Chat: 🔒 lock for non-members, ● Live/○ Connecting/red "Connection lost", input disabled until connected. Leaderboard: 🏆 empty. Polls silent empty; no global error toast |
| `CreateCommunityPage.tsx` | `/communities/create` (ProtectedRoute, lazy; listed before /:id) | Community REQUEST form (admin review, not instant): name, purpose, category, leader, contact + guidelines | `POST /communities/request` (success → submitted; error → message) | `/communities` ("Back to Communities" on success) | No data-fetch. "Submitting..." disabled; success ✓ "Request Submitted!"; inline red error; submit gated by min lengths |

### Events

| File | Route | Purpose | API calls | Navigates to | States (empty/loading/error) |
|------|-------|---------|-----------|--------------|------------------------------|
| 🎯 `EventsPage.tsx` | `/events` (ProtectedRoute, lazy) | Events directory: type filters + List/Map toggle; next event as "Featured" hero (countdown + attendees); rest as EventCards. Social & Health&Fitness filters disabled ("Soon") | `GET /events?type=` ('all'→undefined) | `/events/:id` (Featured hero), `/events/:id` (EventCard), `/events/:id` (map marker via onEventClick) | Loading (list only): 3 pulse cards. Empty (list): 📅. Map mode no skeleton/empty. Disabled filters greyed "Soon"; no error UI |
| `EventDetailPage.tsx` | `/events/:id` (ProtectedRoute, lazy; reads `:id`) | Single-event detail + lifecycle: date/time/location (Maps link), hosts, attendees, RSVP (optimistic); live → check-in code; completed → results/awards + IG share-card + recap leaderboard; comments thread | `GET /events/:id`, `GET /events/:id/comments`, `POST/DELETE /events/:id/rsvp` (optimistic), `GET /events/:id/my-awards` (completed only), `POST /events/:id/checkin`, `POST /events/:id/comments`, `GET /events/:id/recap` (.catch null) | `/events` (back / not-found); External: `maps.google.com` (new tab) | Loading: pulse skeleton. Not-found: 🤷. Check-in idle/success/error inline; RSVP optimistic w/ rollback; results/awards conditional; EventRecap null when no stats; comments only if length>0 |

### Gamification & Economy

| File | Route | Purpose | API calls | Navigates to | States (empty/loading/error) |
|------|-------|---------|-----------|--------------|------------------------------|
| `ChallengesPage.tsx` | `/challenges` | 1v1 head-to-head Kendu wagering (5–50) on a metric by deadline; list w/ accept/decline pending; create via modal | `GET /kendu/challenges`, `GET /kendu/balance`, `POST /kendu/challenge/accept`, `POST /kendu/challenge/decline`, `POST /kendu/spend/challenge` | No route nav — all in-page mutations / CreateChallengeModal overlay; opponent by numeric user ID | Loading: 3 pulse cards. Empty: ⚔️. NO top-level list error (only global toast). Modal inline error (validation + onError); accept/decline disable while pending; winner banner on completed |
| `RewardsPage.tsx` | `/rewards` | "Kendu Store" spend hub: 3 tabs — Rewards (brand offers), Spend (in-app actions), History (txn log) + balance/level/streak banner | `GET /kendu/balance`, `GET /kendu/offers` (marketplace tab only, optional `?eventId=`), `POST /kendu/redeem`; KenduHistory child fetches own | `navigate(-1)` (back), `/communities/create` (200), `/events` (Host 75 / Priority RSVP 15), `/challenges` (5–50); `route:null` actions disabled; offer → RedeemModal | Marketplace loading: 3 pulse cards. Empty: 🏪. Balance banner only when truthy; Spend tab always static list (greyed cost but only route:null disabled); handleRedeem swallows errors; no page error state |

### Profile & Account

| File | Route | Purpose | API calls | Navigates to | States (empty/loading/error) |
|------|-------|---------|-----------|--------------|------------------------------|
| 🎯 `ProfilePage.tsx` | `/profile` | Own profile + settings hub: avatar (tap-upload), tier/level/city/member-since, Running DNA card, Kendu balance, count-up stats grid, PR board, achievements, communities, Settings (coach picker, change pw, logout) | `GET /profile/{user.id}`, `GET /profiling/dna` (×2, .catch null), `GET /gamification/xp`, `GET /records` (.catch null), `GET /gamification/achievements` (.catch []), `GET /runs/stats` (.catch null), `GET /kendu/balance`, `GET /gamification/badge-collection`, `PUT /profiling/coach`, `PUT /auth/change-password`, `PATCH /profile/photo` | `/rewards` (History →), `/communities/{id}` (chips), `/profiling` (Update AI Profile), `/notifications`, `/subscription`, `logout()` | Loading: full skeleton. Avatar: alert if >2MB / upload fail (window.alert). Secondary cards conditionally omitted when null/empty; PR "--:--"; change-pw inline red/green text, Update gated; no top-level error (global ErrorBoundary) |
| `UserProfilePage.tsx` | `/user/:id` | Public profile of ANOTHER runner: avatar/tier/level/streak, follow/unfollow + Gift Kendu (hidden on own), stats, achievements, communities. Gift charges amount + 15% burned fee | `GET /profile/{id}`, `POST/DELETE /social/follow/{id}`, `GET /kendu/balance` (modal only), `POST /kendu/spend/gift` | `navigate(-1)` (back / not-found "Go back"), `/communities/{c.id}` (chips); Follow in-page; Gift opens modal. Target of NotificationsPage/feed/leaderboards | Loading: pulse skeleton. Not-found: 🤷 "User not found". Own-profile guard hides follow/gift; sections omitted when empty; Follow disabled while pending; GiftModal inline error, Send disabled if !canAfford, success 🎁 1.5s auto-close |
| `NotificationsPage.tsx` | `/notifications` | Activity feed (kudos/comment/follow/event/community/achievement/level-up/XP) w/ actor avatar/icon, timestamp, unread dot; Mark all read; tap → mark read + navigate to target | `GET /notifications` ({notifications, unread_count}), `POST /notifications/read-all`, `POST /notifications/{id}/read` (fire-and-forget) | `/feed` (activity → redirects /social), `/events/{id}`, `/communities/{id}`, `/user/{id}`; unrecognized target → no nav (still marks read) | Loading: 5 pulse rows. Empty: 🔔 "No notifications yet". "<n> new" + Mark-all only when `unread_count>0`; read items opacity-60; no explicit error UI |
| `SubscriptionPage.tsx` | `/subscription` | Subscription/paywall: plans (free/base/pro) w/ INR price + features, current plan + days remaining/auto-renew, upgrade via Razorpay, cancel | `GET /subscription/plans`, `GET /subscription/status`, `POST /subscription/create-order`, `POST /subscription/verify`, `POST /subscription/cancel` | `/dashboard` (post-payment redirect only — no back button/other links); Subscribe → Razorpay overlay; Cancel in-page | Loading: 3 pulse cards. Current-plan card only if `plan_key!=='free'`, Cancel only if auto_renew. Inline red error (order/verify/gateway/payment-failed). NOTE: dead-code `pro` border branch; no empty state for missing plans |

### Admin

| File | Route | Purpose | API calls | Navigates to | States (empty/loading/error) |
|------|-------|---------|-----------|--------------|------------------------------|
| `AdminPage.tsx` | `/admin` (`AdminRoute` — requires `role==='admin'`; non-admin → /dashboard, unauth → /) | Single-page admin console: 15-tab control surface (runners, events, communities, sessions, announcements, analytics, flags, segments, push, content CMS, audit, engineering sprints, moderation, backups). All nav is internal tab state — NO sub-routing | `GET /admin/stats` + per-tab: runners/events/communities/sessions/announcements/streak-health/analytics(dashboard/metrics/events/engagement)/flags/segments/push/content/audit/engineering/moderation/backup; plus create/delete/toggle/go-live/complete/approve/reject/send/evaluate POSTs/PUTs; `GET /admin/backup/now` (blob CSV download) | No route nav (no useNavigate/Link). All expand = internal `setTab` (15 tabs) + inline create forms / Go-Live code row. logout → guards redirect / | Loading: per-tab centered "Loading..."; App.tsx LazyLoad Suspense skeleton; AdminRoute full-screen ⚡ while auth loads. Empty: ModerationTab explicit "Queue is empty"; most tabs show count line + render no rows. Errors minimal: BackupTab "Download failed", CommunitiesTab approve error; streak-health/engagement swallow .catch null; other mutations only "...", failures via global ErrorToast |

---

## 5. Component Library Map

React components live under `client/src/components/`, organized into 17 feature directories, **plus one root-level component**: `components/FeedbackButton.tsx` ⚠️ — a global feedback FAB that posts to `/api/feedback`, but it is **never imported or rendered anywhere** in `client/src` (dead/unmounted; see §9). The `dashboard` group is the largest and most central; `gamification` is currently empty (its UI lives in `dashboard`).

> ⚠️ **Dead/unmounted UI within these dirs (repo-verified, zero consumers):** `chat/ChatFAB.tsx` (the chat it opens is itself a stubbed "Coming Soon" tab); and **9 of the 15 `dashboard` widgets are never imported by `Dashboard.tsx`** — live Home renders only `ChallengeList`, `TodaySession`, `RecentRuns`, `PaceDotTrail`, `AthleteCard`, `ProgressPill`. The other 9 (`UpcomingEvents`, `CommunityActivity`, `CoachCard`, `PRBanner`, `LevelCard`, `AchievementProgress`, `ReadinessCard`, `TrainingLoadRing`, `PaceChart`) are built but unwired.

| Dir | Purpose | Notable components |
|-----|---------|--------------------|
| `ai` | AI-generated insight surfaces — renders model-produced analytics/observations about the runner. | `AIInsights.tsx` |
| `auth` | Authentication UI controls. Currently just the Google OAuth sign-in button. | `GoogleSignInButton.tsx` |
| `celebrations` | Celebration/reward visual effects (e.g. confetti burst on achievements, PRs, level-ups). | `Confetti.tsx` |
| `chat` | Chat entry point — a floating action button to open the AI coach chat from anywhere. | `ChatFAB.tsx` |
| `coach` | Tabbed AI coach interface: conversational chat, training plan view, and AI analytics breakdown. | `AIAnalyticsTab.tsx`, `ChatTab.tsx`, `TrainTab.tsx` |
| `coaching` | Coaching panel container — surfaces coaching guidance/content as a panel (distinct from the tabbed coach UI). | `CoachingPanel.tsx` |
| `communities` | Community-related presentational pieces. `CommunityCard` renders a single community summary card. | `CommunityCard.tsx` |
| `dashboard` | The main home dashboard and all of its widget cards — athlete summary, readiness, training load, pace charts/trail, PR banner, level, achievements, challenges, coach card, today's session, recent runs, upcoming events, and community activity. Largest/most central component group. | `Dashboard.tsx`, `AthleteCard.tsx`, `ReadinessCard.tsx`, `TrainingLoadRing.tsx`, `PaceChart.tsx`, `PaceDotTrail.tsx`, `PRBanner.tsx`, `LevelCard.tsx`, `AchievementProgress.tsx`, `ChallengeList.tsx`, `CoachCard.tsx`, `TodaySession.tsx`, `RecentRuns.tsx`, `UpcomingEvents.tsx`, `CommunityActivity.tsx`, `ProgressPill.tsx` |
| `events` | Club event/run-session UI: event cards, a map view of event locations, registration modal, and attendee avatar stacks. | `EventCard.tsx`, `EventMapView.tsx`, `RegistrationModal.tsx`, `AttendeeAvatars.tsx` |
| `gamification` | Intended home for gamification components (XP/leveling/etc.) but currently **EMPTY** — gamification UI lives in `dashboard` (`LevelCard`, `AchievementProgress`) instead. | _(none)_ |
| `kendu` | Kendu points/rewards currency feature: balance widget, transaction history, leaderboard, redeemable offers, redeem + spend-confirm modals, and a post-run points-earned modal. | `KenduWidget.tsx`, `KenduHistory.tsx`, `KenduLeaderboard.tsx`, `OfferCard.tsx`, `RedeemModal.tsx`, `KenduSpendConfirmModal.tsx`, `PostRunKenduModal.tsx` |
| `layout` | App-level chrome: the AppShell wrapper and the mobile bottom navigation bar. | `AppShell.tsx`, `BottomNav.tsx` |
| `registration` | Runner onboarding/registration — the multi-step registration flow (tap grids, sliders, minimal typing). | `RegistrationFlow.tsx` |
| `run` | Run-detail data visualizations: per-split charts, heart-rate/pace zone split chart and bar, and a progress ring. | `SplitChart.tsx`, `ZoneSplitChart.tsx`, `ZoneBar.tsx`, `ProgressRing.tsx` |
| `share` | Shareable run cards (Instagram-story-sized) and the route shape/path renderer drawn on them. | `RunShareCard.tsx`, `RouteShape.tsx` |
| `social` | Social feed feature: activity feed tab, individual run cards in the feed, communities tab, and a runner profile popup (note: a `RunnerCardPopup` also exists in `ui`). | `FeedTab.tsx`, `RunCard.tsx`, `CommunitiesTab.tsx`, `RunnerCardPopup.tsx` |
| `ui` | Shared design-system primitives and cross-cutting UI: buttons, sliders, tap grids, progress bar, skeleton loaders, page transitions, error handling (boundary, toast, query error, AI error message strings), upgrade/paywall prompt, and a runner card popup. | `Button.tsx`, `Slider.tsx`, `TapGrid.tsx`, `ProgressBar.tsx`, `Skeleton.tsx`, `PageTransition.tsx`, `ErrorBoundary.tsx`, `ErrorToast.tsx`, `QueryError.tsx`, `AIErrorMessages.ts`, `UpgradePrompt.tsx`, `RunnerCardPopup.tsx` |

---

# 6. Feature → Page → Endpoint → Engine → Table map

The core cross-reference. Each row is a user-facing feature traced across all layers.
This is the table the audit verifies against the repo.

| # | Feature | Primary page(s) | Key endpoints | Engine(s) | Core tables |
|---|---------|-----------------|---------------|-----------|-------------|
| 1 | **Sign up / log in** (email, phone, Google, invite) | HomePage, RegisterPage | `/auth/register`,`/auth/login`,`/auth/google`,`/invite/validate` | kenduEngine (welcome bonus) | users, user_xp, invite_codes, invite_code_usage |
| 2 | **Password reset** | ForgotPasswordPage, ResetPasswordPage | `/auth/forgot-password`,`/auth/reset-password`,`/auth/change-password` | — (email.service) | password_reset_tokens, users |
| 3 | **Onboarding / Running-DNA** | AIProfilingPage | `/onboarding/*`,`/profiling/generate`,`/profiling/dna` | ai-profiler, autoDetection | user_profiles, ai_profiles, runner_profiles, activities |
| 4 | **Live run tracking + log** | RunTrackerPage 🎯 | `/training/paces`,`/runs/log` ⚠️ | runCascade → gpsValidation, kenduEngine, achievementEngine | activities, user_xp, xp_transactions, user_goals, user_notifications |
| | ⚠️ **BUG:** `POST /runs/log` calls `executeRunCascade(...)` **without `await`** (`runs.routes.ts:163`); the async result serializes as `{}`, so the xp/kendu/streak/PB/achievements payload RunTrackerPage expects is **not actually returned**. See §9. | | | | |
| 5 | **Run history & stats** | RunHistoryPage, DashboardPage | `/runs`,`/runs/stats`,`/runs/weekly-summary`,`/runs/trends`,`/runs/chart-data` | — | activities |
| 6 | **Personal records** | RecordsPage (+ embedded in CoachPage) | `/records`,`/records/timeline` (`/records/check/:id` = backend-only, no client consumer) | personalRecords | activities, personal_records |
| 7 | **Heart-rate zones & analysis** | HRZonesPage (+ embedded in CoachPage) | `/heartrate/zones`,`/heartrate/trends` (`/heartrate/analysis/:id` = backend-only, no consumer) | heartRateZones | users, activities (`hrv_readings`/`lt_tests` are backend-only — not surfaced here; see §9) |
| 8 | **AI Coach hub** (chat, plan, insights, zones, records) | CoachPage 🎯 | `/training/*`,`/coach/insights`,`/insights/pre-run` | adaptiveEngine, coachingOutputs, proactiveCoach, trainingPlanGenerator | transformation_plans, activities, user_xp |
| 9 | **Conversational AI chat** (full) | ⚠️ ChatPage (stubbed in CoachPage) | `/chat/history`,`/chat/suggestions`,`/chat/message`,`/kendu/spend/ai-deep-dive` | ai.service (Sonnet/rule-based), trainingPlanGenerator, adaptiveEngine | chat_messages, ai_usage, kendu_balances |
| 10 | **Training plan (timeline)** | PlanPage | `/training/plan`,`/training/week`,`/goals` | trainingPlanGenerator | transformation_plans, user_goals |
| 11 | **Goals + AI plan gen** | SetGoalPage | `/goals`,`/goals/generate-plan` | trainingPlanGenerator | user_goals, transformation_plans |
| 12 | **AI memory profile** | AIProfilePage | `/ai/profile` (GET/PATCH) | ai.service (getAIProfile / updateAIProfile) | ai_profiles, runner_profiles, ai_usage |
| 13 | **Progress analytics** | ProgressPage | `/progress/improvement`,`/progress/weekly`,`/progress/journey` | progressTracker | activities, tier_history, user_achievements, achievements |
| 14 | **Adaptive training signals** | (CoachPage / backend) | `/adaptive/*` | adaptiveEngine | activities, transformation_plans |
| 15a | **Tier classification (legacy 3-tier)** | DashboardPage, ProfilePage | `/coaching/tier`,`/gamification/xp` | tierClassifier, vo2max, ageGrading, paceCalculator | user_xp, tier_history, runner_profiles |
| 15b | **Classification V2 (1–40 composite)** | (onboarding / backend) | `/profiling/classification` | classification-engine | runner_profiles, tier_history, activities |
| | (athleteMemory engine surfaces via row 8 / `/insights/athlete-profile`, not rows 9/12) | | | | |
| 16 | **XP, levels, achievements** | DashboardPage, ProfilePage | `/gamification/xp`,`/gamification/achievements`,`/gamification/badge-collection` | — (achievements read-only here; **unlocked via `runCascade` → `achievementEngine`, see row 4**) | user_xp, xp_transactions, achievements, user_achievements |
| 17 | **Weekly challenges** | DashboardPage (`ChallengeList`) | `/coaching/challenges`, `/coaching/challenges/:id/complete` | challengeGenerator | challenges, user_achievements |
| 18 | **Kendu economy** (earn/spend/balance) | RewardsPage, ProfilePage, many | `/kendu/balance`,`/kendu/offers`,`/kendu/redeem`,`/kendu/spend/*`,`/kendu/skins` | kenduEngine | kendu_balances, kendu_transactions, kendu_ledger, kendu_offers, kendu_redemptions, kendu_coupon_codes |
| 19 | **1v1 Kendu challenges** | ChallengesPage | `/kendu/challenges`,`/kendu/challenge/accept\|decline`,`/kendu/spend/challenge` | kenduEngine | kendu_challenges, kendu_balances |
| 20 | **Run-card sharing** | SharePage | `/runs`,`/kendu/skins`,`/kendu/spend/card-skin` | kenduEngine | activities, user_skins, kendu_balances |
| 21 | **Social feed + kudos/comments** | SocialPage (FeedTab), ⚠️ FeedPage | `/social/feed`,`/social/kudos/:id`,`/social/comments/:id`,`/social/follow/:id` | — | activities, kudos, comments, follows |
| 22 | **Follow / public profile / gift** | UserProfilePage | `/profile/:id`,`/social/follow/:id`,`/kendu/spend/gift` | kenduEngine | users, follows, kendu_balances |
| 23 | **Communities directory** | CommunitiesPage 🎯 | `/communities`,`/communities/my`,`/communities/request` | — | communities, community_members, community_requests |
| 24 | **Community workspace** (feed/chat/leaderboard/members/info/polls/broadcast) | CommunityDetailPage | `/communities/*` (28 in the router total; 20 are `:id`-scoped, the rest are dir-level `/`,`/my`,`/discover`,`/request` shared with rows 23/25), WebSocket `/ws` (chat persist+broadcast — **sole writer of `community_chat_messages`**, see §1E), `/kendu/spend/boost-post`,`/kendu/spend/sponsor` | kenduEngine, websocket.ts (chat) | community_posts, community_chat_messages, community_polls, community_poll_votes, community_broadcasts, community_post_likes, community_post_reactions, community_mutes, community_members |
| 25 | **Create community (request)** | CreateCommunityPage | `/communities/request` | kenduEngine (creation cost) | community_requests, communities |
| 26 | **Events directory** | EventsPage 🎯 | `/events?type=` | — | events, event_rsvps |
| 27 | **Event detail + RSVP/check-in/awards/recap** | EventDetailPage | `/events/:id`,`/events/:id/rsvp\|checkin\|comments\|my-awards\|recap` | kenduEngine (event award) | events, event_rsvps, event_checkins, event_comments, event_hosts, event_awards |
| 28 | **Notifications** | NotificationsPage (+ AppShell bell) | `/notifications`,`/notifications/read-all`,`/notifications/:id/read`,`/notifications/unread-count`; real-time push over WebSocket `/ws` (`pushToUser`, see §1E) | websocket.ts (`pushToUser`) | notifications, user_notifications, `push_subscriptions` (⚠️ reserved/unwired — never written; live push path is the WebSocket `pushToUser` channel, §1E) |
| 29 | **Profile + settings** | ProfilePage 🎯 | `/profile/:id`,`/profiling/dna`,`/profiling/coach`,`/profile/photo`,`/auth/change-password` | ai-profiler | users, runner_profiles, ai_profiles |
| 30 | **Subscription / paywall** | SubscriptionPage | `/subscription/plans\|status\|create-order\|verify\|cancel` | — (Razorpay) | subscription_plans, user_subscriptions, payment_history, kendu_subscriptions |
| 31 | **Wellness / daily metrics** | (no dedicated page — see §9) | `/wellness/*` | — | daily_wellness, daily_metrics, hrv_readings |
| 32 | **Dashboard batch** | DashboardPage | `/dashboard` (batched), `/coach/insights` | `tierClassifier, challengeGenerator` (/dashboard); `adaptiveEngine, tierClassifier, trainingPlanGenerator, personalRecords` (/coach/insights leg) — _proactiveCoach/coachingOutputs belong to row 8, not here_ | (aggregates many) |
| 33 | **Feedback** | ⚠️ (none — `FeedbackButton.tsx` built but never mounted; see §9) | `/feedback` | — | feedback |
| 34 | **Admin console** (15 tabs) | AdminPage | `/admin/*` + 9 admin sub-routers (**92 admin endpoints total: 44 core + 48 sub**) | kenduEngine (economy stats) | admin_audit_log, feature_flags, feature_flag_overrides, segments, segment_members, announcements, content_blocks, analytics_events, club_sessions, session_attendance |

> **Engines not surfaced by a feature row:** `eventBus` (infra: decouples run-completion
> cascade), `autoDetection` (onboarding + planned Strava sync), `gpsValidation` (inside cascade).
> ⚠️ `transformationPlan` (`generateTransformationPlan`) is **reachable only via dead UI** —
> its sole consumer is `/coaching/transformation` → `CoachingPanel` → the dead/unrouted
> **CoachingPage** (§4, §8.2). `training.routes.ts`/PlanPage use only `trainingPlanGenerator`.
>
> **Dead imports (imported, never invoked):** `chat.routes.ts` imports `calculateHRZones` +
> `estimateMaxHR` (engine/heartRateZones) and `extractAndStoreInsights` (ai.service) at the
> top of the file but **calls none of them** (each token appears exactly once, on its import
> line). `buildRunnerContext` uses only `estimateVDOT`/`getTrainingPaces`/`calculateReadiness`
> + `calculateTrainingLoad`. (The §1C chat row already lists the correct engine set.)

---

# 7. Redirection & Navigation Map

## 7.1 Route guards
- **Public:** `/` (HomePage), `/register`, `/forgot-password`, `/reset-password/:token`, `/join`, `/founding`.
- **PublicRoute** (redirects logged-in users → `/admin` or `/dashboard`): `/`, `/register`.
- **ProtectedRoute** (→ `/` if no user): everything else.
- **AdminRoute** (requires `role==='admin'`): `/admin`.

## 7.2 Legacy → canonical redirects (`<Navigate replace>`)
| Legacy path | Redirects to | Backing dead page |
|---|---|---|
| `/coaching` | `/coach` | ⚠️ CoachingPage |
| `/training` | `/coach` | ⚠️ TrainingPage |
| `/train` | `/coach` | ⚠️ TrainPage |
| `/chat` | `/coach` | ⚠️ ChatPage |
| `/feed` | `/social` | ⚠️ FeedPage |
| `*` (catch-all) | `/` | — |

## 7.3 Dynamic (parameterized) routes
`/run/track` · `/events/:id` · `/communities/:id` · `/communities/create` (declared before `:id`) · `/user/:id` · `/reset-password/:token`.

## 7.4 "Expand on click" graph (which surface opens which page)

**Global navigation — `layout/BottomNav.tsx`** (present on authenticated AppShell pages **except where `hideNav` is set** — AppShell renders it only when `!hideNav` (`AppShell.tsx:80`): **SetGoalPage** hides it always (`SetGoalPage.tsx:79`) and **RunTrackerPage** hides it while `RUNNING`/`PAUSED` (`RunTrackerPage.tsx:511`) **and during the `ANALYSIS` post-run card** (unconditional `hideNav` early-return, `RunTrackerPage.tsx:357`) — shown in `IDLE`/`FINISHED`; the 5-tab table is verified at `BottomNav.tsx:14-44`):

| Tab (label) | Route | Page |
|---|---|---|
| Home | `/dashboard` | DashboardPage |
| Coach | `/coach` | CoachPage 🎯 |
| **Run** (center FAB) | `/run/track` | RunTrackerPage 🎯 |
| Social | `/social` | SocialPage (Feed + Communities sub-tabs) |
| Events | `/events` | EventsPage 🎯 |

> Note: the 4th tab is **Social**, not a standalone "Community" tab — Communities is a
> sub-tab inside SocialPage **and** has its own `/communities` route reached elsewhere.
> (The locked UI-UX-V1 nav labels this region "Community"; the code routes it to `/social`.
> Reconcile during redesign — see §11.)

Per-page click-through targets:
- **DashboardPage** → avatar/photo→`/profile` · bell→`/notifications` · onboarding-checklist rows→`/profile`,`/profiling`,`/run/track` (Log-first-run, **new users only**) · "See all" challenges→`/challenges` · + global BottomNav (above). (Note: the Today's Session card is **display-only — not tappable**; `TodaySession.tsx` has no nav.)
- **CoachPage** (TrainTab) → `/set-goal` · `/plan` (See full plan) · `/run/track`. Accepts `location.state.tab`.
- **PlanPage** → `/coach{tab:'plan'}` (back) · `/set-goal` (empty) · in-page week expand.
- **RunTrackerPage** → `/share` (Share Card) · `/dashboard{fromRun:true}` (back).
- **SetGoalPage** → `/dashboard` (skip) · `/coach` (View My Plan).
- **SocialPage** (FeedTab) → `/user/:id`; (CommunitiesTab) → `/communities/:id`.
- **CommunitiesPage** → `/communities/create` · `/communities/:id` (discover + your-communities).
- **CommunityDetailPage** → `/communities` (back) · `/user/:id` (members).
- **EventsPage** → `/events/:id` (featured hero + cards + map markers).
- **EventDetailPage** → `/events` (back) · external `maps.google.com`.
- **RewardsPage** → `navigate(-1)` · `/communities/create` · `/events` · `/challenges` · RedeemModal.
- **ProfilePage** → `/rewards` · `/communities/:id` · `/profiling` · `/notifications` · `/subscription` · logout.
- **UserProfilePage** → `navigate(-1)` · `/communities/:id` · GiftModal.
- **NotificationsPage** → `/feed`(→/social) · `/events/:id` · `/communities/:id` · `/user/:id`.
- **SubscriptionPage** → `/dashboard` (post-payment) · Razorpay overlay.
- **AdminPage** → no route nav; 15 internal tabs via `setTab`.

---

# 8. Page Catalogue — Have vs. Need

## 8.1 Pages that EXIST and are reachable (30)
HomePage, LandingPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage, DashboardPage,
CoachPage 🎯, PlanPage, AIProfilePage, AIProfilingPage, RunTrackerPage 🎯, RunHistoryPage,
RecordsPage, HRZonesPage, ProgressPage, SetGoalPage, SharePage, SocialPage, CommunitiesPage 🎯,
CommunityDetailPage, CreateCommunityPage, EventsPage 🎯, EventDetailPage, ChallengesPage,
RewardsPage, ProfilePage 🎯, UserProfilePage, NotificationsPage, SubscriptionPage, AdminPage.

## 8.2 Pages & UI that exist but are DEAD / unrouted — see §9
- **Pages (5):** ⚠️ CoachingPage, ChatPage, TrainingPage, TrainPage, FeedPage (legacy;
  superseded by consolidated CoachPage / SocialPage).
- **Components built but never mounted:** ⚠️ `FeedbackButton.tsx` (global feedback FAB →
  `/feedback`, zero consumers) · `chat/ChatFAB.tsx` · **9 dashboard widgets** not imported
  by `Dashboard.tsx` (UpcomingEvents, CommunityActivity, CoachCard, PRBanner, LevelCard,
  AchievementProgress, ReadinessCard, TrainingLoadRing, PaceChart).

## 8.3 Detail/expand pages — do their click targets resolve?
- ✅ All `navigatesTo` targets in §7.4 resolve to a real route.
- ⚠️ `RunHistoryPage` run cards are **display-only — NOT clickable** → there is **no
  single-run detail page**. A `GET /runs/:id` endpoint exists but no page consumes it.
  **Candidate missing page: RunDetailPage.**
- ⚠️ `social/FeedTab` activity cards link to `/user/:id` but **not** to a run-detail view.

## 8.4 Pages that arguably SHOULD exist but don't (candidates)
| Candidate | Why | Evidence |
|---|---|---|
| **RunDetailPage** (`/runs/:id`) | `GET /runs/:id` returns full splits/latlng but nothing renders it | runs.routes.ts |
| **Wellness / Check-in page** | `/wellness/*` + daily_wellness/daily_metrics/hrv_readings/ai_checkins tables exist, no UI | wellness.routes.ts, schema |
| **Full AI Chat (routed)** | ChatPage is fully built but unreachable; CoachPage only stubs "Coming Soon" | ChatPage.tsx ⚠️ |
| **Global leaderboard / club standings** | Per-community leaderboards exist; no app-wide leaderboard page | communities.routes.ts |
| **Segment-targeted content surface** | segments/segment_members + admin segments exist; no user-facing targeting UI | admin-segments.routes.ts |

---

# 9. Missing / Incomplete Features (evidence-based)

| # | Finding | Type | Evidence |
|---|---------|------|----------|
| 1 | **5 dead pages** present but unrouted (CoachingPage, ChatPage, TrainingPage, TrainPage, FeedPage) | Dead code | App.tsx redirects; no `<Route>` |
| 2 | **Full AI chat not wired** — ChatPage complete (Deep Dive, Kendu spend) but CoachPage ChatTab is a "Coming Soon" stub | Incomplete flow | CoachPage.tsx, ChatPage.tsx |
| 3 | **No single-run detail page** despite `GET /runs/:id` + RunHistory cards being non-clickable | Backend w/o frontend | runs.routes.ts, RunHistoryPage.tsx |
| 4 | **Wellness, HRV & LT-test APIs have no UI** — `/wellness/*` (daily_wellness/daily_metrics/ai_checkins), `/heartrate/hrv` + `/hrv/trend` (hrv_readings), `/training/lt-test` (lt_tests) all have endpoints + tables but **no page consumes them** | Backend w/o frontend | wellness.routes.ts, heartrate.routes.ts, training.routes.ts |
| 5 | **Run score/tags/commentary computed CLIENT-SIDE** in RunTrackerPage; server only returns the cascade | Architecture risk | RunTrackerPage.tsx |
| 5b | 🐞 **`POST /runs/log` does not return the cascade** — `executeRunCascade(...)` is called **without `await`** (`runs.routes.ts:163`) while being `async`; the pending promise serializes as `{}`. So xp/kendu/streak/PB/achievements documented in §4 + §6 row 4 are **not** delivered to the client. Real bug — recommend `await`. | **CODE BUG** | runs.routes.ts:163, runCascade.ts:36 |
| 6 | **Hardcoded values** — RunTracker goal 5000m, ZoneBar 375-405; LandingPage spots=50 & submit simulated (no API) | Stub/placeholder | RunTrackerPage.tsx, LandingPage.tsx |
| 7 | **Photo on register captured but never uploaded** | Incomplete flow | RegisterPage.tsx |
| 8 | **Many pages swallow errors → empty state** (FeedTab, CommunitiesTab, several admin tabs `.catch(null)`) — no error UI | UX gap | §4 state notes |
| 9 | **SubscriptionPage dead-code** `pro` border branch; no empty state for missing plans | Minor dead code | SubscriptionPage.tsx |
| 10 | **TrainPage gamified "road map"** fully built but unreachable — a whole UX direction parked | Parked feature | TrainPage.tsx ⚠️ |
| 11 | **Feedback form built but never mounted** — `FeedbackButton.tsx` posts to `/feedback` but is imported/rendered nowhere | Dead UI | components/FeedbackButton.tsx |
| 12 | **No discovery / follow-list surface** — the follow ACTION works (`UserProfilePage` wires POST/DELETE `/social/follow/:id`, reached via CommunityDetailPage member rows + NotificationsPage). But `/social/discover`, `/social/following`, `/social/followers` (GET lists) have **no page consuming them** → no suggestion/discovery surface and no following/followers list, so cold-start feed population is hard and FeedTab is easily empty. | Backend w/o frontend (social loop has no discovery) | social.routes.ts, UserProfilePage.tsx:29-30, SocialPage FeedTab |
| 13 | **Announcements have no member surface** — admin can CRUD `announcements` but no runner-facing page renders them; same for `club_sessions`/`session_attendance` (admin-only) | Backend w/o frontend | admin.routes.ts, AdminPage |
| 14 | **9 dashboard widgets + ChatFAB built but unwired** — `Dashboard.tsx` imports only 6 of 15 widgets; ChatFAB never mounted (and the chat it would open is stubbed) | Dead UI | components/dashboard/*, chat/ChatFAB.tsx |
| 15 | **Strava integration unbuilt** — a headline feature in CLAUDE.md, but only the `strava_tokens` table + `activities.strava_activity_id` column exist. **No OAuth route, no webhook handler, no sync job, no connect UI**, zero `strava.com` calls (grep `strava` in `client/src` = 0; no strava router mounted in `index.ts`). A `strava_sync` feature flag is even seeded **ENABLED** (`migrate.ts:203`, `db.ts:205`) for the absent feature. | Missing feature (schema-only) | schema.pg.sql, server/src/routes/ (no strava.routes.ts), index.ts |
| 16 | **Web Push schema-only / NOT wired** — `push_subscriptions` (`schema.pg.sql:330`) is **never written**; no `web-push`/VAPID library, no service-worker push registration, no `sendNotification`. Admin `push/:id/send` (`admin-notifications.routes.ts:59-67`) only counts recipients + `UPDATE notifications SET status='sent'` — delivers nothing. The live in-app push path is the WebSocket `pushToUser` channel (§1E), not web-push. | Missing feature (schema-only) | admin-notifications.routes.ts, schema.pg.sql, websocket.ts |

### 9.1 Orphan endpoints — exist in backend, zero client consumers (repo-verified)
**Hard orphans (no `api.*` call anywhere in `client/src`):**
`/events/nearby` · `/insights/athlete-profile` · `/insights/weekly-summary` ·
`/insights/post-run/:id` · `/heartrate/analysis/:id` · `/records/check/:id` ·
`/ai/usage` · `/ai/evaluate` · `/gamification/friend-streaks` · `GET /events/:id/checkins`
(list).

**Runtime-orphaned (a consumer exists in code, but its ONLY consumer is dead/unmounted UI, so
it never renders):**
`/ai/status` + `/ai/daily-insight` — consumed only by `CoachCard.tsx` (one of the 9 unmounted
dashboard widgets, §9 #14). `/training/readiness` — only `ReadinessCard.tsx` (unmounted widget)
+ the dead `TrainingPage`. `/training/predict` + `/training/complete-session` — only the dead
`TrainingPage` (§9 #1). `/adaptive/summary` — only the dead `TrainPage.tsx` (§4: `.catch null,
unused`); other `/adaptive/*` endpoints have no direct client consumer and surface only via the
batched `/coach/insights`. So the AI daily-insight / onboarding-AI-status surface and training
readiness/predict/complete-session/adaptive-summary are reachable in code but never reach a user.

(All are live, tested endpoints — candidates either for a new surface or for deprecation.)

> These are candidates for the external audit to confirm/reject; each cites a file.

---

# 10. Dependencies

## 10.1 External services
- ⚠️ **Strava** — **schema-only / NOT wired.** The schema reserves `strava_tokens` +
  `activities.strava_activity_id`, but there is **no OAuth route, no webhook handler, no sync
  job, no connect UI, and zero calls to strava.com** anywhere in `server/src` or `client/src`
  (`strava_tokens` is never read/written except (a) as one name in the generic all-tables backup
  whitelist, `admin-backup.routes.ts:21`, and (b) a `strava_sync` feature flag seeded **ENABLED**
  at `migrate.ts:203` + `db.ts:205` — so the admin Feature Flags tab shows "Strava Sync — enabled"
  for an integration that does not exist). Despite "Strava auto-sync" being a headline feature
  in CLAUDE.md, it is effectively unbuilt. Treat as a **planned integration**, not a live
  dependency. (See §9 #15.)
- **Google OAuth** — ID-token sign-in (google-auth.routes.ts, config.google.clientId).
- **Email service** — password reset (services/email.service).
- **AI / LLM provider** — chat + insights (ai.routes.ts, ai_usage table).
- **Razorpay** — subscription payments (subscription.routes.ts).
- ⚠️ **Web Push** — **schema-only / NOT wired** (same state as Strava). `push_subscriptions`
  exists but is **never written**; no `web-push`/VAPID library, no service-worker push
  registration, no `sendNotification`. Admin `push/:id/send` only counts recipients +
  `UPDATE notifications SET status='sent'` — delivers nothing. **Live notification delivery is
  the WebSocket `pushToUser` channel (§1E), a separate mechanism.** (See §9 #16.)
- **Geolocation API** — live run tracking (RunTrackerPage).

## 10.2 Key internal dependency chains
- **Run completion cascade:** `POST /runs/log` → `runCascade.executeRunCascade` (called
  **directly/synchronously** at `runs.routes.ts:163`) → `gpsValidation` (fraud flags) +
  `kenduEngine` (points/streak/PB bonuses) + `achievementEngine` (unlocks) + goal checks +
  notification rows. ⚠️ `eventBus` exists as an intended decoupling layer but is **unwired**
  (no emit/on); and the cascade call is **not awaited** (see §9), so its result is not
  returned to the client.
- **Classification:** `classification-engine` (V2, 1-40) consumes `vo2max`, `ageGrading`,
  `paceCalculator`, `heartRateZones`; legacy `tierClassifier` is the simpler 3-tier path.
- **Plan generation:** `SetGoalPage` → `/goals/generate-plan` → `trainingPlanGenerator`
  (VDOT, periodization; `goals.routes.ts:151` calls only `generateTrainingPlan`) →
  transformation_plans. (The `transformationPlan` engine is **not** in this chain — its only
  live consumer is the dead-page path `/coaching/transformation` → CoachingPanel → CoachingPage; see §6 note.)
- **Coaching content:** `coachingOutputs` + `proactiveCoach` + `athleteMemory` feed
  CoachPage / dashboard insights (deterministic, no LLM) vs `ai.routes` (LLM chat).
- **Kendu economy** touches nearly every feature (earn on run, spend on community/event/
  boost/gift/skin/challenge/deep-dive); immutable ledger + IST-aware caps.

## 10.3 Background jobs / scheduler — `server/src/scheduler/index.ts`

A timer-based scheduler started in production (`startScheduler()` at `index.ts:182`; a 60s
tick fires due jobs, first run delayed 10s). **No endpoint and no UI** — these are
time-driven table mutations the rest of the map otherwise omits:

| Job | Interval | Mutates | Notes / cross-dependency |
|---|---|---|---|
| `challenge-expiry` | 1 h | `challenges.completed = -1` for weeks past `week_start + 7d` | marks overdue challenges expired |
| `auto-backup` | 24 h | writes CSV backup files (`/data/backups/`) | shares `runBackup()` with `admin-backup.routes` (§1G `/now`) |
| `streak-decay` | 6 h | `user_xp.current_streak_days = 0` for users inactive > 1 day | ⚠️ independently zeroes the **same streak state `runCascade` computes** (§2 runCascade) |
| `subscription-expiry` | 1 h | `user_subscriptions.status = 'expired'` past `expires_at` | ⚠️ changes the **paywall state** `/ai/status` + chat-gating (`chat.routes` Sonnet vs rule-based) read |

---

# 11. Open Questions for Ishan

1. **Dead pages — delete or revive?** ChatPage (full AI chat) and TrainPage (gamified
   road map) are complete but unrouted. Revive into CoachPage, or remove? (Affects whether
   the AI Coach redesign includes a full chat thread and/or a gamified path view.)
2. **RunDetailPage** — do you want a dedicated single-run detail screen (`/runs/:id`),
   making RunHistory cards tappable? It is the most obvious missing page.
3. **Wellness** — there is a whole wellness/HRV/daily-metrics backend with no UI. In scope
   for V1, or parked?
4. **AI Coach scope** — which sub-tabs are V1: Chat, Plan, Insights, Zones, Records? Is
   Chat a real thread (revive ChatPage) or stays stubbed?
5. **Run page** — `/run/track` is the live tracker. Is the "Run" redesign the *tracker*,
   or a pre-run "start" screen that leads into it? (Nav FAB = Run.)
6. **Events/Communities depth** — redesign just the directory pages, or also the detail
   pages (EventDetailPage, CommunityDetailPage are large and feature-rich)?
7. **Profile** — own ProfilePage only, or also UserProfilePage (public profile)?
8. **Social discovery missing (round-1 finding)** — following someone WORKS from their
   profile (UserProfilePage, reached via community members + notifications), but there's no
   discovery/suggestion surface (`/social/discover`) and no following/followers list page
   (those GET endpoints have no UI), so cold-start feed population is hard. Does the redesign
   need a dedicated discovery/follow surface for Social to populate reliably?
9. **Nav label: "Community" vs "Social"** — the locked UI-UX-V1 nav labels the 4th tab
   "Community", but the code routes it to `/social` (Feed + Communities sub-tabs). Which
   wins for the redesign — rename the tab to "Social", or re-point it to `/communities`?
10. **Run-log cascade bug (round-1 finding)** — `POST /runs/log` doesn't `await` the
    cascade, so the gamification payload never reaches the client. Fix in code now, or log
    as a known issue for the audit? (Affects the Run redesign's post-run reward moment.)
11. **Feedback FAB** — `FeedbackButton` is built but unmounted. Mount it globally in V1, or
    drop it?
12. **Kendu economy IA — Rewards & Challenges placement (round-5 finding).** The Kendu virtual
    economy is a stated monetization/retention pillar (founder vision: freemium ₹19/₹99 +
    Kendu; §10.2: "touches nearly every feature"), yet its two user-facing surfaces are buried:
    **RewardsPage** (`/rewards`, the "Kendu Store") is reached only from a single "History →"
    link on ProfilePage, and **ChallengesPage** (`/challenges`, 1v1 wagering) from two buried
    Kendu surfaces — a Dashboard "See all" and the RewardsPage "Spend" grid (per §7.4). Neither
    has a bottom-nav home; neither is among the 5 🎯 redesign targets — but the redesign reworks
    the exact pages (Profile 🎯, Dashboard) that host those entry points. **Decision:** does the
    redesign give Kendu/Rewards/Challenges a first-class surface (a nav slot, a Profile/Dashboard
    module, or a merged "Kendu hub"), and are RewardsPage/ChallengesPage in or out of V1 redesign
    scope?
13. **Subscription / paywall scope.** SubscriptionPage (`/subscription`, Razorpay freemium
    paywall) is reached only from ProfilePage (a 🎯 target) and is central to the business model.
    Is the upgrade/paywall surface in V1 redesign scope and how does it integrate with the
    redesigned Profile — or explicitly out of scope (alongside AdminPage)?

> **Scope note for the audit:** unless decided otherwise, **AdminPage** (15-tab console) and the
> auth/landing pages (HomePage, LandingPage, Register, Forgot/Reset) are treated as **out of V1
> redesign scope** — V1 redesigns the 5 🎯 targets + Home (already done). Q12/Q13 decide whether
> the Kendu/subscription surfaces join that set.

---

# 12. V1 Redesign Scope — Ishan's decisions (2026-06-25, post-seal)

The §11 questions, resolved. **This is the locked scope for the page-redesign phase.**

| # | Decision | Resolution |
|---|----------|------------|
| Pages | The redesign set | **7 pages**: Coach 🎯, Run (start + tracker) 🎯, Events (directory + detail) 🎯, Communities (directory + detail) 🎯, Profile (own + public) 🎯 — plus Home (done). |
| Q4 | AI Coach chat | **Revive the full chat** — wire the built-but-unrouted `ChatPage` (thread, quick-prompts, Kendu Deep Dive) into the Coach Chat tab. |
| Coach tabs | Sub-tab set | Chat · Plan · Insights · Zones · Records · **+ new "Readiness" tab** (see Wellness below). |
| Q3/Q2(run) | Run page | **Both**: a pre-run "start/ready" screen (today's session, readiness, GPS check) **→** the live tracker states (idle/running/paused/finished/analysis) + post-run reward card. **Plus build `RunDetailPage` (`/runs/:id`)** and make RunHistory cards tappable. |
| Q6 | Events & Communities | **Directories + detail pages** both redesigned (EventDetailPage, CommunityDetailPage). |
| Q7 | Profile | **Both** ProfilePage (own) + UserProfilePage (public). |
| Q9 | 4th nav tab | **"Social" → `/social`** (hub: Feed + Communities sub-tabs). Reconciles the locked nav label with the code; UI-UX-V1 nav region renamed Community→Social. |
| Q8 | Social discovery | **In scope** — build a discover/suggested-runners + followers/following surface into the Social redesign so the feed can populate. |
| Q3 (wellness) | Wellness/HRV/recovery | **New "Readiness" sub-tab inside Coach** — HRV, sleep, resting HR, daily check-ins (recovery state), kept distinct from Zones (training intensity) and Insights (AI observations). Activates the dormant `/wellness/*`, `hrv_readings`, `daily_*`, `ai_checkins` backend. |
| Q12 | Kendu (Rewards/Challenges) | **Redesign in place** — restyle RewardsPage + ChallengesPage to V1, keep current entry points (no new nav home in V1). |
| Q13 | Subscription | Treated **out of V1 redesign scope** (alongside Admin + auth/landing) unless raised later. |
| Q10 | Run-log cascade bug | **Log for audit only** — documented in §9 #5b; not fixed in code as part of the redesign. |
| Dead code | Cleanup approach | **Decide per-page during redesign.** Category A (superseded: CoachingPage, TrainingPage, FeedPage — replacements live) is safe to delete later; Category B (built-but-unwired: TrainPage gamified road-map, FeedbackButton, ChatFAB, 9 dashboard widgets) is a **parts bin** to pull from — flag each when redesigning the related page. No bulk deletion during redesign. |

> **Out of V1 redesign scope:** AdminPage (15-tab console), auth/landing (HomePage,
> LandingPage, Register, Forgot/Reset), SubscriptionPage. Documented in the map; not restyled.

---

## Coverage self-check
Documented: **39/39** route files · **282/282** endpoints · **22/22** engines ·
**73/73** tables · **35/35** pages · **17/17** component dirs.
(Counts verified at source via grep against the inventory output, not agent self-reports.)
