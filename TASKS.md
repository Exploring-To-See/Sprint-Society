# Sprint Society — Task Backlog

> Managed by `/kendu-ishu`. Priority order (top = next).
> Last updated: 2026-05-28

---

## In Progress

- [x] SS-060: Audit Fix Phase 1 — Event Cascade Engine (backend harmony)
  - [x] Event bus + typed cascade system
  - [x] Achievement auto-check engine (21 achievements auto-triggered)
  - [x] Run cascade handler (XP + Kendu + achievements + notifications + streak + PB)
  - [x] Unified streak (user_xp is source of truth)
  - [x] Auto-notifications on run events
  - [x] Frontend shows full cascade rewards on run completion
  - [x] Removed duplicate /kendu/earn call from frontend

- [x] SS-061: Audit Fix Phase 2 — Navigation Simplification
  - [x] Removed floating Run FAB (was redundant)
  - [x] Removed FeedbackButton from AppShell
  - [x] New bottom nav: Home | Events | RUN (center, primary) | Society | Profile
  - [x] Header simplified: Sprint Society logo + notification bell
  - [x] Kendu balance moved to dashboard card (was hidden in header)
  - [x] /training merged into /train (no duplicate routes)
  - [x] Removed duplicate notification bell from dashboard

- [x] SS-062: Audit Fix Phase 3 — Smart Guidance
  - [x] SmartGuidance component: contextual advice based on streak, recency, achievements
  - [x] Streak-at-risk warnings
  - [x] Achievement proximity nudges
  - [x] Challenge reminders

- [ ] Deploy & test all phases live

---

## Completed (This Sprint — 2026-05-24)

- [x] SS-010: Analytics Dashboard (backend + 8 admin tabs in frontend)
- [x] SS-011: Feature Flags (CRUD + evaluate + rollout %)
- [x] SS-012: User Segmentation (JSON rules engine + evaluate)
- [x] SS-013: Push Notifications (admin CRUD + send management)
- [x] SS-014: Content CMS (blocks + publish/schedule workflow)
- [x] SS-015: Engineering Hub (sprint history + backlog view)
- [x] SS-016: Admin Audit Log (action tracking + helper export)
- [x] SS-017: Moderation Tools (queue + hide + warn/ban)
- [x] SS-020: ChallengeList null check on empty array
- [x] SS-021: PaceChart unused import cleanup
- [x] SS-022: Social feed pagination indicator
- [x] SS-023: Readiness cross-training support (0.5x multiplier)
- [x] SS-024: Chat rate limiting (20 msg/min)
- [x] SS-025: Railway deployment (RESOLVED — app is live)
- [x] SS-026: Landing page fix (logo top, no text overlap, login visible)

---

## Backlog — Not Started

### Deployment / Infra
- [ ] SS-030: Set ANTHROPIC_API_KEY on Railway (enables AI chat)
- [ ] SS-031: Set RAZORPAY keys on Railway (enables payments)
- [ ] SS-032: PostgreSQL migration (DEFERRED — only after 100 users)

### Completed (2026-05-25)
- [x] SS-050: Built-in GPS run tracker (/run/track — replaces Strava dependency)
- [x] SS-051: Removed Strava entirely (service, routes, config, UI, env vars)
- [x] SS-052: Manual run logging endpoint (POST /api/runs/log + XP + streak)

### Subscription Tier Alignment
- [x] SS-033: Update pricing to ₹9 Base (Haiku) / ₹99 Pro (Sonnet) — ₹199 + nutrition dropped

### AI Features (v1.2 scope — needs ANTHROPIC_API_KEY on Railway)
- [ ] SS-034: Background Haiku evaluation on Strava sync (auto-adjust training plan)
- [ ] SS-035: Weekly AI Summary card generation (Sunday)

### AI Features (v1.3 scope — ONLY after 50 real users + AI usage validated)
- [ ] SS-036: "My AI Profile" page (user-visible, editable)
- [ ] SS-037: AI memory extraction improvement
- [ ] SS-038: Pre-run / post-run check-in rituals (MCQ + free-text)

### Future (only after validation with real users)
- [ ] SS-040: Waitlist page (email collection, position display)
- [ ] SS-041: Push notification service worker (actual Web Push delivery)
- [ ] SS-042: Admin multi-page layout with sidebar nav
- [ ] SS-043: Email campaigns (Resend integration)
- [ ] SS-044: Apple Health / Google Fit integration
- [ ] SS-045: Built-in GPS (reduce Strava dependency)

---

## Previously Completed

- [x] SS-001: Adaptive training engine (ATL/CTL/TSB)
- [x] SS-002: Heart rate zone engine (Karvonen 5-zone)
- [x] SS-003: Personal records (all distances + auto-detect)
- [x] SS-004: Social layer (follows, kudos, comments, feed)
- [x] SS-005: AI chat coaching (rule-based + Sonnet)
- [x] SS-006: Dashboard UI overhaul (spring physics, skeletons)
- [x] SS-007: /sprint-engine + memory system foundation
- [x] SS-008: Events + Communities (RSVP, check-in, WhatsApp-style)
- [x] SS-009: V2 Classification Engine (5-factor weighted scoring)

---

## Conventions

- Task IDs: `SS-###`
- `/kendu-ishu` auto-fixes bugs, asks before new features
- Tasks are updated BEFORE implementation begins (not after)
