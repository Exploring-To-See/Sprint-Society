# Profile & Account — Feature & UX Teardown

> Council member: **Profile & Account** — the top-bar destinations (avatar → Profile, bell →
> Notifications), the account/economy screens (Subscription, Rewards/Kendu Store), plus the
> Kendu coin economy and the LOCKED top-bar + bottom-nav chrome.
> Scope read in full: `ProfilePage`, `NotificationsPage`, `SubscriptionPage`, `RewardsPage`,
> `AppShell`, `BottomNav`, and all `kendu/*` + `UpgradePrompt` components, with backend traces into
> `kendu.routes.ts`, `kenduEngine.ts`, `subscription.routes.ts`, and the plan seeds.

---

## A. Cluster IA recommendation

**What these surfaces are post-redesign.** None of these are tabs in the LOCKED 5-tab nav
(Home · AI-Coach · Run · Community · Events). They are **top-bar destinations + deep screens**:

- **Profile** (top-left avatar) = the runner's *identity + proof of progress* page. This is the
  Strava/Whoop "you" screen: athlete card, lifetime stats, PRs, badges, communities, and the
  doorway into account settings. Today it is overloaded — it mixes a genuine profile (identity,
  stats, PRs, achievements) with a full **Settings menu** (coach picker, password, logout,
  links to Notifications/Subscription) and an **inline Kendu balance card**. Split it:
  - **Profile (view)** — identity, Athlete/DNA card, stats, PRs, badges, communities. Shareable.
  - **Settings (separate route, gear icon top-right of Profile)** — account, coach, security,
    subscription link, notifications prefs, logout. Right now Settings is just a stack of list
    rows at the bottom of the scroll (`ProfilePage.tsx:354-546`); it deserves its own screen so
    Profile reads as a *flex page*, not a control panel.

- **Notifications** (top-right bell) = the activity inbox. Keep as a top-bar screen. Needs
  grouping + filtering (see B).

- **Subscription** (`/subscription`) = the paywall. Reachable from Settings, from `UpgradePrompt`
  cards scattered in gated features, and from the Kendu "actions" tab. Keep as a deep screen.

- **Rewards / Kendu Store** (`/rewards`) = the coin economy hub (earn history, spend actions,
  brand marketplace). Today it's reachable only via the small "History →" link on the Profile
  Kendu card (`ProfilePage.tsx:121`) and the orphaned `KenduWidget`. **The economy is effectively
  buried.** Give Kendu a persistent, visible home — a coin chip in the top bar (next to the bell)
  that shows balance and routes to `/rewards`, mirroring how games surface currency.

**Features that should MOVE:**
- **Kendu balance** currently lives inline on Profile (`KenduBalanceCard`, `ProfilePage.tsx:107-133`).
  It should be promoted to a **top-bar coin chip** (always visible) and the full economy stays on
  `/rewards`. Don't make Profile the only ambient surface for currency.
- **Coach picker** (`SettingsSection`, `ProfilePage.tsx:400-448`) is a meaningful identity choice
  buried in settings. It belongs partly on Profile (the chosen coach is shown on the DNA card,
  `ProfilePage.tsx:208-213`) and the *picker* in Settings — fine, but surface it during onboarding too.
- **"Update AI Profile"** CTA (`ProfilePage.tsx:727-748`) routes to `/profiling`. Keep on Profile but
  it competes visually with Settings rows — it's a big gradient button mid-scroll.

**Dead/orphaned UI to resolve (P0 housekeeping):** `KenduWidget`, `KenduLeaderboard`, and
`PostRunKenduModal` are **defined but never imported anywhere** (verified: `KenduWidget` and
`KenduLeaderboard` appear only in their own files; `PostRunKenduModal` likewise). That means:
- The **post-run Kendu reward celebration never fires** — the single biggest "earn" dopamine moment
  in the economy is built (`PostRunKenduModal.tsx`) but not wired to the run-completion flow. Earning
  happens silently server-side via `runCascade` (per `kendu.routes.ts:36` comment) with no client feedback.
- The **Kendu leaderboard** (a social hook the backend fully supports at `/kendu/leaderboard`,
  `kendu.routes.ts:181-217`) is never shown.
- The compact `KenduWidget` (balance + level progress + streak + subscription due) is never mounted,
  so the richer balance presentation is wasted while Profile uses the thinner `KenduBalanceCard`.

---

## B. Screen-by-screen teardown

### Profile (`/profile` / `client/src/pages/ProfilePage.tsx`)

- **Purpose:** the runner's identity + proof-of-progress page, plus (currently) account settings.

- **Features & data:**
  - **Header** (`:627-692`): avatar (tap-to-upload via hidden file input, `:630-647`), name
    (`profile.name || user.name`), tier badge + level (`L{currentLevel}`), city, "Since {month year}".
    - Data: `GET /profile/:userId` (`:556-560`), `GET /gamification/xp` (`:569-572`),
      `GET /profiling/dna` (`:563-566`).
    - Photo upload: `PATCH /profile/photo` with a base64 data URL, 2MB client cap (`:637-646`).
  - **Running DNA / Athlete Card** (`RunningDNACard`, `:135-217`): tier-gradient card with VO2max
    (`dna.estimated_vo2max`), 4 pace zones (easy/tempo/interval/race, `:177-187`), up to 5
    personality tags (`:194-205`), and the assigned AI coach name (`:208-213`).
  - **Kendu balance card** (`KenduBalanceCard`, `:107-133`): `GET /kendu/balance` →
    `spendable_balance`, `lifetime_earned`; "Spent" is *derived client-side* as
    `lifetime_earned - spendable_balance` (`:128`) — **wrong** (ignores any non-spend deltas like
    challenge stakes refunded, gifts received). "History →" routes to `/rewards`.
  - **Stats grid** (`:703-721`): 6 count-up stats — Total KM, Level, Streak, Avg Pace, Consistency,
    Best Streak. Sources blended from `GET /runs/stats` (`:587-590`) with fallbacks to the profile
    payload (`:615-617`). `CountUpStat` animates via `useCountUp` (`:48-75`).
  - **Personal Records** (`PRBoard`, `:219-262`): 5K/10K/Half/Marathon from `GET /records`
    (`race_prs`), with improvement % chip when present.
  - **Update AI Profile** CTA (`:727-748`) → `/profiling`.
  - **Badge Collection** (`AchievementShowcase`, `:264-329`): `GET /gamification/badge-collection`,
    category tabs, 4-col grid, RARE flag, "{rarity_percent}% have this" rarity line, summary
    "earned/total (percent%)".
  - **Communities** (`CommunitiesList`, `:331-352`): chips from `profile.communities`.
  - **Settings** (`SettingsSection`, `:354-546`): coach picker (`PUT /profiling/coach`), link to
    Notifications, link to Subscription, change password (`PUT /auth/change-password`), logout.

- **States:**
  - **Loading:** good — a tailored skeleton (avatar + bars + cards, `:594-611`).
  - **Empty:** mostly handled by conditional render — DNA card hidden if no dna, PR rows show
    `--:--`/"No data" (`:240-256`), Kendu card returns `null` if no balance (`:114`), badge section
    returns `null` if nothing (`:271`). **No first-run/empty-state messaging** — a brand-new runner
    with zero data sees a near-blank profile (no "Log your first run to fill this in" nudge).
    Violates *Recognition rather than recall* / empty-state best practice.
  - **Error:** **MISSING.** Every secondary query swallows errors with `.catch(() => null/[])`
    (`:565, 577, 583, 589`). A failed `/profile/:id` (the one query *without* a catch, `:558`) would
    leave the page stuck in loading or blank with no retry. No error UI anywhere. Violates
    *Help users recognize/recover from errors* + the project's own Quality Gate ("Error states:
    user-friendly messages, never raw errors").
  - **Edge:** avatar upload sends a **full base64 data URL in a JSON PATCH** (`:641`) — heavy
    payload, no compression, only an `alert()` on failure (`:643`) — not the app's toast pattern.
    Password change uses raw `alert()`-free inline messages but the photo flow uses `alert()`
    (`:637, 643`), inconsistent.

- **Interactions & nav:** avatar tap → file picker; "History →" → `/rewards`; "Update AI Profile" →
  `/profiling`; community chip → `/communities/:id`; Settings rows → `/notifications`,
  `/subscription`, inline password form, `logout()`.

- **UX problems:**
  - **P0 — Profile is a control panel, not an identity page.** Half the scroll is Settings
    (`:354-546`). Strava/Whoop keep identity and settings separate; settings live behind a gear.
    *Aesthetic & minimalist design.*
  - **P0 — No error handling on any data fetch.** Silent `null` everywhere; the primary profile
    query has no catch at all (`:558`). *Error recovery; project Quality Gate.*
  - **P1 — "Spent" stat is computed wrong** (`:128`) — `lifetime_earned - spendable_balance` is not
    spend; it's net-of-balance. Misleads on economy. *Match between system and real state.*
  - **P1 — No empty/first-run state.** Zero-data profile looks broken. *Empty-state heuristic.*
  - **P1 — Inconsistent feedback patterns** (`alert()` for photo vs inline text for password vs
    nothing for coach errors — `coachMutation` has no `onError`, `:371-377`). *Consistency.*
  - **P2 — Tier color semantics clash.** "Advanced" = gold, "Intermediate" = accent/blue,
    "Beginner" = green (`:23-45`). Green-for-beginner reads as "go/best" in most color languages;
    gold-for-top is fine but the middle blue is arbitrary. *Consistency & standards.*
  - **P2 — Coach picker shows the same 🧠 emoji for all four coaches** (`:438`) — no visual
    differentiation despite distinct personalities. *Recognition.*
  - **P2 — Badge rarity text "{rarity_percent}% have this" at `text-[6px]`** (`:322`) is effectively
    unreadable on a 375px screen. *Accessibility / legibility (WCAG).*

- **Redesign opportunities:**
  - Lead with a **Whoop-style hero**: avatar + tier ring + the single most motivating number
    (VO2max or current streak) above the fold, then a horizontally-scrolling stat strip.
  - Make the Athlete/DNA card the **shareable artifact** (Strava run-card energy) — it already has
    tier gradients and pace zones; add a share button that hands off to the existing card pipeline.
  - **Achievements as a story**, not a 4×N grid of `text-[7px]` labels — Strava/NRC show recent +
    rarest + next-to-unlock with progress. Surface "next badge: 2 runs away."
  - **Gear/Equipment** (Strava-style shoes mileage) is entirely absent — a natural identity + future
    affiliate hook for a run club.
  - Move Settings to its own route; replace the in-scroll stack with a single gear in Profile's
    top-right.

---

### Notifications (`/notifications` / `client/src/pages/NotificationsPage.tsx`)

- **Purpose:** the activity inbox (kudos, comments, follows, event/community, gamification).

- **Features & data:**
  - List from `GET /notifications` → `{ notifications[], unread_count }` (`:44-47`).
  - Header shows "{unread_count} new" + "Mark all read" (`POST /notifications/read-all`, `:49-55`).
  - Each row: actor image or type emoji (`NOTIFICATION_ICONS`, `:17-21`), title, optional body
    (truncated), relative time (`formatTimeAgo`, `:23-30`), unread dot.
  - Tap marks read (`POST /notifications/:id/read`) and routes via `getNotificationLink` to
    `/feed`, `/events/:id`, `/communities/:id`, or `/user/:id` (`:32-38, 108-114`).
  - Unread badge in the top bar is driven separately by `GET /notifications/unread-count`
    (`AppShell.tsx:20-28`), polled every 5 min on Vercel or pushed via WS (`useNotificationSocket`).

- **States:**
  - **Loading:** good skeleton list (`:78-90`).
  - **Empty:** good — bell glyph + "No notifications yet" (`:93-100`).
  - **Error:** **MISSING** — `useQuery` has no error branch; a failed fetch renders nothing below
    the header (looks like empty). *Error recovery.*
  - **Edge:** read state is **optimistically stale** — tapping fires `POST /:id/read` but doesn't
    await; it invalidates immediately (`:110-112`). Generally fine. No pagination/infinite scroll —
    the endpoint returns a flat list, so a heavy user gets an unbounded DOM.

- **Interactions & nav:** tap row → mark read + navigate; "Mark all read"; that's it.

- **UX problems:**
  - **P1 — No grouping.** Best-in-class inboxes group by Today / This week / Earlier and collapse
    "X and 4 others liked your run." Here it's a flat reverse-chron stream. *Recognition; reduce
    memory load.*
  - **P1 — No filtering / segmentation** (Social vs Gamification vs Events). For a club app the bell
    will mix kudos with XP/level-up spam. *Flexibility & efficiency.*
  - **P1 — No error state.** *Error recovery.*
  - **P2 — Read rows are only `opacity-60`** (`:117`) — low contrast, can dip below WCAG for the
    timestamp `text-zinc-700` (`:132`). *Accessibility.*
  - **P2 — Not actionable inline.** A follow notification can't be followed-back; an event reminder
    can't RSVP from the row. Strava/NRC put the primary action in the row. *Efficiency.*
  - **P2 — `getNotificationLink` returns `null`** for gamification types (achievement/level_up/xp),
    so those rows are dead-ends (tap only marks read). *Match between system and goals.*

- **Redesign opportunities:**
  - Sectioned, collapsible groups + a filter chip row (All · Social · Achievements · Events).
  - Inline actions (Follow back, RSVP, View run) à la Strava.
  - Aggregate bursts ("Aisha + 6 others kudos'd your 10K").
  - Route gamification notifications somewhere meaningful (Profile badges / XP screen).

---

### Subscription (`/subscription` / `client/src/pages/SubscriptionPage.tsx`)

- **Purpose:** the paywall — show plans, run Razorpay checkout, manage current plan.

- **Features & data:**
  - `GET /subscription/plans` (`:26-29`) and `GET /subscription/status` (`:31-34`).
  - Current-plan banner with days_remaining + auto-renew + inline Cancel
    (`POST /subscription/cancel`, `:101-120`).
  - Plan cards: icon/gradient by key (`PLAN_STYLES`, `:14-18`), price `₹{price_inr}/mo`, feature
    checklist, action button (Current / Get {plan}). Razorpay handled client-side via
    `window.Razorpay` (`:43-78`), order from `POST /subscription/create-order`, verified by
    `POST /subscription/verify` then redirect to `/dashboard`.
  - Footer: "Secure payments via Razorpay · Cancel anytime · No hidden fees."

- **States:**
  - **Loading:** skeleton cards (`:123-126`).
  - **Error:** inline red text for create-order/verify/gateway-not-loaded failures (`:208-211`,
    plus `:59-61, 67-71, 74-77`). Reasonable, though it's a single shared `error` string at the
    bottom — far from the button that failed.
  - **Empty:** if `/plans` returns nothing, the plans block silently renders nothing. **No empty
    state.**
  - **Edge:** Razorpay-not-loaded is handled (`:67-71`). `cancelMutation` has **no error handler**
    (`:86-89`) — a failed cancel looks like nothing happened. Verify-failure asks the user to
    "Contact support" with no channel (`:59`).

- **Interactions & nav:** Get plan → Razorpay modal → verify → `/dashboard`; Cancel → mutate.

- **UX problems / correctness:**
  - **P0 — Pricing is inconsistent across the product.** Brief states the ladder is **₹9 → ₹19 →
    ₹49**. Reality: the DB seeds **only two paid tiers, Base ₹9 and Pro ₹99**
    (`server/src/seed.ts:233-238`, `migrate.ts:143-149`). And `UpgradePrompt` hardcodes "Upgrade to
    Pro · ₹99/mo" (`UpgradePrompt.tsx:28`). So three sources disagree: brief (₹9/19/49), seed
    (₹9/99), and the gated-feature prompt (₹9/₹99). This must be reconciled before any paywall
    redesign. *Consistency & standards; match between system and reality.*
  - **P1 — Dead conditional / copy-paste bug** in the card border logic: `plan.key === 'pro' ? … :
    plan.key === 'pro' ? …` (`:140-144`) — the second branch is unreachable; the accent-vs-gold
    intent is broken. Same dead `<>…</>` fragment around price (`:162-167`).
  - **P1 — Cancel has no confirmation and no error handling** (`:111-118, 86-89`). One mis-tap kills
    auto-renew silently. *Error prevention.*
  - **P1 — No annual option, no savings framing, no "most popular" anchor** beyond a thin gold top
    border on Pro (`:147-149`). Clean paywalls anchor with a recommended tier + savings.
  - **P2 — Error text is one shared string at the page bottom** (`:209`), detached from the action.
    *Visibility of system status / proximity.*
  - **P2 — "Upgrade Your Run" + generic checklist** is undifferentiated; the value of each tier
    (AI chat coach, adaptive engine) is buried as plain checklist rows. *Aesthetic/clarity.*
  - **P2 — `prefill: {}`** (`:63`) — no name/email/contact passed to Razorpay, so the user re-types
    contact info every checkout. *Efficiency.*

- **Redesign opportunities:**
  - Single source of truth for prices (read from `/plans` everywhere, kill the hardcoded `₹99` in
    `UpgradePrompt`). Decide 2-tier vs 3-tier and align brief/seed.
  - Feature **comparison matrix** (free vs base vs pro) instead of three separate checklists.
  - Recommended-tier highlight, monthly/annual toggle with savings, and a confirm dialog on Cancel.
  - Move the failed-payment error next to the pressed button; give "Contact support" a real link.

---

### Rewards / Kendu Store (`/rewards` / `client/src/pages/RewardsPage.tsx`)

- **Purpose:** the Kendu economy hub — balance, brand marketplace, in-app spend actions, history.

- **Features & data:**
  - **Balance banner** (`:64-84`): `GET /kendu/balance` → `spendable_balance`, `current_level`,
    `current_streak_days`.
  - **3 tabs** (`:87-101`): **Rewards** (marketplace), **Spend** (actions), **History**.
  - **Marketplace:** `GET /kendu/offers` (optionally `?eventId=`) → `OfferCard` grid (`:107-134`).
  - **Spend actions:** a hardcoded `SPEND_ACTIONS` array of 9 in-app sinks (`:13-23`): Create
    Community (200), Host Event (75), 1v1 Challenge (5-50), Premium Card Skin (40), AI Deep Dive
    (30), Boost Post (10), Priority RSVP (15), Group Challenge (50), Sponsor Leaderboard (500).
  - **History:** `KenduHistory` → `GET /kendu/history` (paginated, `:106-131` in route).
  - **Redeem flow:** `OfferCard` → `RedeemModal` → `POST /kendu/redeem` → coupon code (`:43-52, 171-176`).

- **States:**
  - **Loading:** marketplace skeletons (`:109-114`); history skeletons (`KenduHistory.tsx:23-31`).
  - **Empty:** marketplace empty ("No brand offers yet… Decathlon, Red Bull coming soon", `:127-131`);
    history empty ("No transactions yet. Go for a run!", `KenduHistory.tsx:33-39`). Good.
  - **Error:** `handleRedeem` swallows the error and returns `null` (`:49-51`); `RedeemModal` then
    shows a generic "Redemption failed" (`RedeemModal.tsx:29-30`) — but the **real backend error**
    (insufficient balance, out of stock, already redeemed; `kendu.routes.ts:174-176`) is lost. The
    balance query (`:32-35`) has **no error/empty handling** — if it fails the banner just vanishes.
  - **Edge:** **Spend actions are decorative.** Each button only `navigate(action.route)` (`:148`);
    several routes are `null` (card-skin, ai-dive, boost, group-challenge, sponsor) so those buttons
    are simply **disabled and do nothing** (`:149`). The card shows a cost and an affordability color
    (`:140-141, 158`) but **never actually spends** — the real spend endpoints
    (`/kendu/spend/*`, `kendu.routes.ts:412-599`) and the `KenduSpendConfirmModal` are not invoked
    from here. So the "Spend" tab is a menu that can't transact.

- **Interactions & nav:** tab switch; offer → RedeemModal → confirm → coupon (tap-to-copy); spend
  action → navigate (or no-op); back arrow (`:59`).

- **UX problems:**
  - **P0 — The "Spend" tab can't spend.** It lists 9 priced actions but routes-or-nothing; 5 of 9
    are dead buttons (`route: null`). The actual spend machinery exists server-side and in
    `KenduSpendConfirmModal` but isn't wired here. *Match between system and the world; the screen
    promises an action it can't perform.*
  - **P0 — Economy is buried & invisible.** `/rewards` is reachable only via a tiny "History →"
    text link on Profile (`ProfilePage.tsx:121`); the `KenduWidget` meant to advertise it is never
    mounted; the post-run earn modal never fires. Users can earn Kendu and never know it exists.
    *Visibility of system status.*
  - **P1 — Redeem errors are flattened** to a single generic string (`RedeemModal.tsx:29`) — the
    user can't tell "you're 40 short" from "out of stock." The backend already distinguishes these.
    *Help users recognize/recover from errors.*
  - **P1 — Two visual languages for the same currency.** `/rewards` uses 🔥 + orange and calls
    balance "Spendable Balance"; Profile's `KenduBalanceCard` drops the flame, uses accent, and
    splits Earned/Spent. *Consistency.*
  - **P2 — Hardcoded marketing copy** ("Decathlon, Red Bull coming soon", `:130`) ships an empty
    promise into production. *Honesty / aesthetic.*
  - **P2 — `RewardsPage` renders its own back arrow + title inside `AppShell`** (`:58-61`) which
    already provides a top bar — double chrome. *Consistency.*

- **Redesign opportunities:**
  - Wire the Spend tab to `KenduSpendConfirmModal` + the real `/kendu/spend/*` endpoints; show
    confirm → deduct → success. Disable (not just dim) only the genuinely unbuilt sinks, or remove them.
  - Surface a **top-bar coin chip** (balance + flame) on every screen → `/rewards`.
  - Fire `PostRunKenduModal` on run completion (it's fully built) — this is the core earn loop.
  - Show the `KenduLeaderboard` (built, unused) on the Rewards/Community surface for social pull.
  - Map specific redeem errors to specific messages.

---

### Top bar (`client/src/components/layout/AppShell.tsx`)

- **Purpose:** persistent chrome — avatar→Profile (left), wordmark, bell→Notifications (right).
- **Features & data:** avatar or initials (`:45-51`), "Sprint Society" wordmark, bell with unread
  badge from `GET /notifications/unread-count` (`:20-28`), WS-or-poll cadence
  (`useNotificationSocket`). Safe-area padding handled (`:38, 76`). Hidden for admins (`:37`).
- **States:** badge caps at "9+" (`:69`). No loading/error state for unread count (fine — silent).
- **UX problems:**
  - **P1 — The avatar is the *only* tap target for Profile** and it doubles as the wordmark button
    (`:40-55`) — the entire left cluster navigates to Profile, which is fine, but there's **no
    settings affordance** anywhere in the bar.
  - **P1 — No home for the Kendu coin.** With a 5-tab nav that has no economy tab, the top bar is the
    only place a currency chip can live; it's currently absent. *Visibility.*
  - **P2 — Wordmark steals the center** that a Whoop/Garmin app would use for context (current
    screen title or date). *Aesthetic & minimalist design.*

- **Redesign opportunities:** add a coin chip (left of bell) and a context title in the center; keep
  avatar→Profile, bell→Notifications. Consider a long-press or a gear on Profile for Settings.

---

### Bottom nav (`client/src/components/layout/BottomNav.tsx`) — the LOCKED target

- **Purpose:** primary tab navigation with a center Run FAB.
- **Current state vs target:** ships **4 destinations** — Home (`/dashboard`), Run (center FAB →
  `/run/track`), AI Coach (`/coach`), Social (`/social`). The LOCKED target is **5**:
  Home · AI-Coach · Run (center) · Community · Events. So this component must: rename **Social →
  Community**, and **add Events** as a 5th tab. *(Out of my cluster to redesign, but it's the
  chrome these screens live in.)*
- **Ergonomics assessment:**
  - **Good:** center Run FAB is a clear primary action (`:18-32`); `layoutId` sliding active
    indicator (`:49-54`); active fill states on icons; `aria-label`s present; safe-area bottom pad
    (`:13`).
  - **P1 — Five tabs + a raised center FAB on a 375px screen is tight.** With Home · AI-Coach ·
    [Run] · Community · Events, label text at `text-[11px]` (`:57`) and `px-3` padding (`:48`) will
    crowd; "AI Coach" + "Community" are long labels. Plan for icon-forward, possibly shorter labels
    ("Coach", "Club", "Events"). *Aesthetic & minimalist; touch-target sizing (WCAG 44px).*
  - **P1 — Active detection is path-prefix based** (`:8-9`); when Events is added, ensure
    `/events/*` maps to the Events tab and `/communities/*` to Community (currently Social claims
    both `/social` and `/communities`, `:38-40`). *Consistency.*
  - **P2 — The Run FAB always routes to `/run/track`** regardless of an in-progress run; no
    "resume" affordance. *Match between system and state.* (Adjacent cluster.)

---

## C. Reusable components inventory

Components in this cluster worth promoting into the design system:

- **CountUpStat / `useCountUp`** (`ProfilePage.tsx:48-105`) — animated tabular stat; reusable across
  Profile, Rewards, Dashboard. Standardize as `<Stat value unit label accent/>`.
- **Athlete/DNA card** (`RunningDNACard`, `ProfilePage.tsx:135-217`) — the signature identity card;
  candidate for the shareable run-card system. Standardize tier gradient + pace-zone mini-grid.
- **List-row button pattern** (icon tile + label + chevron) repeated 5× in `SettingsSection`
  (`:401-543`) and again in Rewards spend actions — extract a single `<SettingRow>` / `<ActionRow>`.
- **Skeleton** (`ProfilePage.tsx:88-90`) — promote to a shared primitive; today each page hand-rolls
  its own skeleton markup (Profile, Notifications, Subscription, Rewards, KenduHistory all differ).
- **Kendu currency primitives** — the 🔥+orange balance display, the level-progress bar
  (`KenduWidget.tsx:54-67`), and the `KenduBalanceCard` are three competing renderings of one thing.
  Consolidate into one `<KenduBalance variant="chip|card|banner">` + one `<KenduCoin amount/>`.
- **Modal scaffold** — `RedeemModal`, `PostRunKenduModal`, `KenduSpendConfirmModal` all reimplement
  the same backdrop + spring-scale + stopPropagation shell. Extract `<Sheet/>` / `<Modal/>`.
- **Empty-state block** (bell glyph + caption in Notifications `:93-100`; emoji + caption in Rewards
  `:127-131`) — extract `<EmptyState icon title subtitle/>`.
- **PRBoard tile** (`ProfilePage.tsx:233-258`) and **BadgeTile** (`:307-325`) — grid tiles reusable
  on a future achievements screen.
- **UpgradePrompt** (`ui/UpgradePrompt.tsx`) — already a shared gate card; fix its hardcoded price
  and make it read live plan data.

---

## D. Top 5 highest-impact changes for this tab

1. **Wire the Kendu earn → see → spend loop end-to-end.** Fire the built-but-orphaned
   `PostRunKenduModal` on run completion, mount the `KenduWidget`/coin chip so balance is always
   visible, and connect the Rewards "Spend" tab to `KenduSpendConfirmModal` + the real
   `/kendu/spend/*` endpoints. **Benefit:** the entire economy becomes real and felt instead of an
   invisible server-side ledger — the single biggest motivation lever currently dark.

2. **Reconcile pricing to one source of truth.** Decide the tier ladder (brief says ₹9/19/49; DB
   seeds ₹9/₹99; `UpgradePrompt` hardcodes ₹99) and make every surface read `/subscription/plans`.
   **Benefit:** removes a trust-destroying inconsistency on the paywall and prevents charging the
   wrong amount.

3. **Split Profile from Settings + add error/empty states.** Move the Settings stack to its own
   route behind a gear; give Profile a real first-run state and actual error UI on its fetches
   (today every query silently swallows errors). **Benefit:** Profile becomes a proud Strava/Whoop-
   style identity page, and the app stops failing silently.

4. **Upgrade Notifications to a real inbox.** Add Today/Earlier grouping, filter chips
   (Social·Achievements·Events), inline actions (Follow back, RSVP), and route gamification rows
   somewhere. **Benefit:** the bell becomes a re-engagement engine instead of a flat, dead-end stream.

5. **Promote a persistent Kendu coin chip into the top bar.** With no economy tab in the LOCKED
   5-tab nav, the top bar is the only ambient home for currency; surface balance + flame there →
   `/rewards`, and consolidate the three competing balance renderings into one component.
   **Benefit:** makes the coin economy discoverable and consistent on every screen.
