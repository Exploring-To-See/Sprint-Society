# Sprint Society — Task Backlog

> Managed by `/sprint-engine`. Priority order (top = next).
> Last updated: 2026-05-22

---

## In Progress

(none — run `/sprint-engine` to start next sprint)

---

## Priority 1: Admin Backend (Revenue/Retention Impact)

### SS-010: Analytics Dashboard
- [ ] Add `analytics_events` + `daily_metrics` tables to schema
- [ ] Create `server/src/engine/analyticsAggregator.ts`
- [ ] Create `server/src/routes/admin-analytics.routes.ts`
- [ ] Create `client/src/pages/admin/AdminLayout.tsx` (sidebar shell)
- [ ] Create `client/src/pages/admin/AdminDashboard.tsx` (Recharts)
- [ ] Add event tracking middleware
- [ ] Create `client/src/lib/analytics.ts` (frontend tracker)

### SS-011: Feature Flags
- [ ] Add `feature_flags` + `feature_flag_overrides` tables
- [ ] Create `server/src/routes/admin-flags.routes.ts`
- [ ] Create `client/src/hooks/useFeatureFlag.ts`
- [ ] Create `client/src/pages/admin/AdminFlags.tsx`
- [ ] Wrap one existing feature behind a flag (proof-of-concept)

### SS-012: User Segmentation
- [ ] Add `segments` + `segment_members` tables
- [ ] Create `server/src/engine/segmentEvaluator.ts` (JSON rules → SQL)
- [ ] Create `server/src/routes/admin-segments.routes.ts`
- [ ] Create `client/src/pages/admin/AdminSegments.tsx`

---

## Priority 2: Engagement & Retention

### SS-013: Push Notifications
- [ ] Add `push_subscriptions` + `notifications` tables
- [ ] Generate VAPID keys
- [ ] Create service worker for push
- [ ] Create `server/src/routes/admin-notifications.routes.ts`
- [ ] Create `client/src/pages/admin/AdminNotifications.tsx`
- [ ] Types: run reminder, challenge nudge, session alert, PR celebration

### SS-014: Content CMS
- [ ] Add `content_blocks` table
- [ ] Create `server/src/routes/admin-content.routes.ts`
- [ ] Create `client/src/pages/admin/AdminContent.tsx`
- [ ] Display coaching tips on runner dashboard

---

## Priority 3: Polish & Scale

### SS-015: Engineering Hub (Admin Panel Tab)
- [ ] Add `sprint_history` table to DB
- [ ] Create admin tab: sprint history, backlog, autonomy level
- [ ] Show recent agent work (from git log)

### SS-016: Admin Audit Log
- [ ] Add `admin_audit_log` table
- [ ] Auto-log all admin actions
- [ ] Create `client/src/pages/admin/AdminAuditLog.tsx`

### SS-017: Moderation Tools
- [ ] Comment moderation queue
- [ ] User reporting/flagging
- [ ] Auto-hide system

---

## Bugs & Improvements (auto-fix eligible by /sprint-engine)

- [ ] SS-020: ChallengeList null check on empty array first load
- [ ] SS-021: PaceChart unused import when data empty
- [ ] SS-022: Social feed pagination indicator missing
- [ ] SS-023: Readiness doesn't account for cross-training activities
- [ ] SS-024: Chat /message endpoint needs rate limiting
- [ ] SS-025: Fix Railway deployment (nixpacks build conflict)

---

## Completed

- [x] SS-001: Adaptive training engine (ATL/CTL/TSB, plan adaptation)
- [x] SS-002: Heart rate zone engine (Karvonen 5-zone)
- [x] SS-003: Personal records (all distances + auto-detect)
- [x] SS-004: Social layer (follows, kudos, comments, feed)
- [x] SS-005: AI chat coaching (rule-based, context-aware)
- [x] SS-006: Dashboard UI overhaul (spring physics, skeletons, celebrations)
- [x] SS-007: /sprint-engine command + memory system foundation

---

## Conventions

- Task IDs: `SS-###`
- Priority: P1 = highest ROI, P2 = engagement, P3 = scale
- `/sprint-engine` auto-fixes items in "Bugs & Improvements"
- `/sprint-engine` proposes before building P1-P3 features
