# design: finish the ss-base redesign (all remaining pages)

Completes the Design V1 (ss-base) rollout across the entire app — 28 commits, one per page/area, every hook preserved.

## Pages by tier

**Tier 1 — shell migrations** (already on kit surfaces, moved onto `SSScreen`):
Progress, Run History, Subscription, Social+Feed, Events

**Tier 2 — full rebuilds on ss-base:**
Dashboard, RunTracker, Communities, CommunityDetail, CreateCommunity, EventDetail, UserProfile, Challenges, Rewards, Notifications, Share (card artwork untouched), AIProfiling (8-step wizard), AIProfile, SetGoal, Profile, Auth (HomePage splash/landing/login, Register, Forgot/Reset password)

**Admin:** full 15-tab portal rebuilt (shell + overview + runners/events/communities/sessions/posts/analytics/flags/segments/push/content/audit/engineering/moderation/backup)

## Design gates (hold app-wide)
- 0 emoji in code (ss icon set only; emoji as server data still renders)
- Liquid-glass tiles + tokens only — no zinc classes, no `className="card"`, no off-palette hex (killed the `#c8ff00` admin chart)
- Violet = AI signal only; SSSeg for all sub-tabs; JetBrains Mono tabular metrics

## Bugs found & fixed during live click-through (real backend)
- Nested `AnimatePresence mode="wait"` under the route-level one stalls entering children at opacity 0 → de-wrapped (HomePage carousel, SetGoal, RunTracker, CommunityDetail)
- Range sliders had invisible rails (global CSS blanks native tracks) → drawn recess rail + accent fill (AIProfiling, Challenges)
- `.ss-btn{flex:1}` ballooned CTAs in column layouts → `flex:none`
- No scroll reset on route change → added in `AppRoutes`
- Admin Backup total-rows concatenated pg string counts → `Number()` coercion
- Notifications "Mark all read" was violet (AI-only color) → accent

## Verified
- `tsc -b` + `vite build` green on every commit
- Live click-through as a real runner (register → profiling wizard → DNA reveal → goal + AI plan generation → every page) and as admin (all tabs) — console clean throughout
- 22-agent adversarial review of the full `main...HEAD` diff (hook preservation ×4 groups, design gates, correctness, a11y/375px, build integrity → per-finding refuters): 14 findings raised, 13 refuted as pre-existing on main, 1 confirmed + 2 hygiene items fixed in the final commit (FeedPage emoji escape, HomePage decorative violet, ProfilePage avatar-refresh invalidation key)

## Notes / out of scope
- LandingPage (`/join`, `/founding`) deliberately skipped (out of preview scope)
- Server untouched. Two server-side issues found while testing are flagged as separate tasks: `/api/auth/me` sits behind the brute-force auth limiter (users get logged out after ~6 quick page loads), and `components/ai/AIInsights.tsx` is dead code
- DB local-only migration patch (feature_flags.enabled bool) applied locally, NOT committed per brief

🤖 Generated with [Claude Code](https://claude.com/claude-code)
