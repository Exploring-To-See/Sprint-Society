# Community — Feature & UX Teardown

> Council member: **Community tab**. Today this is "Social" (`pages/SocialPage.tsx`) with
> sub-tabs Feed + Communities; post-redesign it becomes the **Community** tab in the locked
> 5-tab nav (Home · AI-Coach · Run · **Community** · Events). Benchmarked against **Strava**
> (activity feed, kudos, comments, clubs, segments) and **Nike Run Club** (challenges, friends,
> leaderboards). All cites are `file:line` against real code read in full.

---

## A. Cluster IA recommendation

### What this tab should be
The Community tab is the club's **living social layer**: proof that other humans are running,
reacting, and competing alongside you. North-star contribution: *"give the club a living
community."* Right now it is two thin, disconnected lists (a follow-feed and a community
directory) stapled under a segmented control (`SocialPage.tsx:14-34`). It does not feel alive —
no presence, no "who's running now," no comments surfaced, no challenges, and (see §B) the feed
is wired to the **wrong response key** so in practice it renders empty for everyone.

There are **two parallel, competing implementations** of the same concept:
- `SocialPage` → `CommunitiesTab` (sub-tab, route `/social`, `App.tsx:137`)
- `CommunitiesPage` (standalone, route `/communities`, `App.tsx:152`)

Both query `['communities']`/`/communities`, both render community lists, both navigate to
`/communities/:id`. `CommunitiesPage` is the richer one (category filters, horizontal "your
communities" rail, create button, staggered motion — `CommunitiesPage.tsx:60-138`); the sub-tab
version is a stripped fake-search clone (`CommunitiesTab.tsx:22-78`). **Pick one.** This is a
duplicated-IA smell (violates Nielsen *Consistency & standards*).

### Proposed post-redesign IA for the Community tab
Make `/community` a single screen with **three sub-views** (segmented control, the pattern that
already exists at `SocialPage.tsx:14-34` and `CommunityDetailPage.tsx:141-153`):

1. **Feed** — club-wide activity (runs, kudos, comments, achievements, PRs), not just
   people-you-follow. Today's feed is follow-gated (`social.routes.ts:21-43`) which guarantees
   emptiness for new users (cold-start problem). Default the feed to *club + followed* so it's
   never blank.
2. **Communities** — the directory (fold `CommunitiesPage` here; kill the duplicate
   `CommunitiesTab`). Category chips + "your communities" rail + Create.
3. **Leaderboard / Challenges** — a club-wide ranking and active challenges. Today leaderboards
   only exist *inside* a single community (`CommunityDetailPage.tsx:658-780`) and there are **no
   challenges at all** — a glaring gap vs Nike Run Club. Promote this to a tab-level view.

### Features that should MOVE in or out
- **OUT → Events tab:** Community currently has no events, but club "sessions/runs" energy
  belongs in the new **Events** tab. Community = ambient social proof + chat + ranking; Events =
  scheduled, RSVP-able real-world runs. Cross-link: a community detail page should show "Upcoming
  events from this community," and an event should link back to its host community.
- **OUT → Home / Profile:** `RunnerCardPopup` (`social/RunnerCardPopup.tsx`) and the Kendu
  economy surfaces (Gift, Boost, Sponsor — `UserProfilePage.tsx:120-126`,
  `CommunityDetailPage.tsx:229-236,689-708`) are bolted onto social screens but are really
  a wallet/profile concern. Keep the *entry points* in Community, but the economy logic is a
  cross-cutting system, not a Community feature.
- **IN:** Challenges (new), club-wide leaderboard (promote from per-community), and a
  **presence/"running now"** strip (new) — the single biggest "alive" lever.
- **RECONCILE:** `CreateCommunityPage` submits a **review request** to `/communities/request`
  (`CreateCommunityPage.tsx:34`) — i.e. communities are admin-curated — yet `CommunitiesTab`
  and `CommunityDetailPage` present instant **Join** buttons and self-serve posting. Decide:
  curated or self-serve. The current mixed model is confusing (see §B Create).

---

## B. Screen-by-screen teardown

### Social shell + sub-tabs (`/social` · `pages/SocialPage.tsx`)
- **Purpose:** Container that toggles between Feed and Communities sub-tabs.
- **Features & data:** Pure UI; no data. Two segmented buttons, `useState<'feed'|'communities'>`
  defaulting to `feed` (`SocialPage.tsx:9`), rendering `<FeedTab/>` or `<CommunitiesTab/>`
  (`SocialPage.tsx:33-34`).
- **States:** None — no loading/empty/error at this level; deferred to children.
- **Interactions & nav:** Tab toggle only. Wrapped in `AppShell` (top bar + bottom nav).
- **UX problems:**
  - **P1 (Consistency & standards):** Sub-tab state is local `useState`, not in the URL. You
    cannot deep-link to Communities, and a back gesture won't restore the sub-tab. Strava/NRC
    keep feed vs clubs URL-addressable.
  - **P2 (Aesthetic/minimalist):** 11px bold sub-tab labels (`SocialPage.tsx:17,25`) are tiny;
    active pill is fine but there's no icon/affordance.
  - **P1 (Match to redesign):** This whole `/social` shell is redundant with `/communities`.
    Post-redesign there should be ONE Community route.
- **Redesign opportunities:** Replace with a 3-view segmented control (Feed · Communities ·
  Leaderboard), URL-synced (`?view=feed`). Add a top-right "+" that contextually creates a post
  or requests a community depending on the active view.

---

### Feed sub-tab (`social/FeedTab.tsx`)
- **Purpose:** Show runs from people you follow (+ self) with emoji reactions.
- **Features & data:**
  - Query `['social-feed']` → `GET /social/feed` (`FeedTab.tsx:12-15`).
  - Per item: avatar/initial (`activity.profile_image_url`/`user_name`, `FeedTab.tsx:50-56`),
    name + `time_ago` (`:59-60`), streak badge if `streak_days >= 7` (`:62-64`), optional
    `caption` (`:68-69`), run stats `distance_km`/`pace_formatted`/`duration_formatted`
    (`:73-77`), a 5-emoji reaction row `['🙌','🔥','💪','⚡','🫡']` (`:6,80-89`), and a raw
    `kudos_count` number (`:90-92`).
  - Kudos mutation `POST /social/kudos/:activityId` with `{reaction_type}` (`FeedTab.tsx:17-21`).
- **States:**
  - Loading: 3 skeleton blocks (`FeedTab.tsx:25-31`). OK.
  - Empty: 👟 "No activity yet / Follow runners…" (`FeedTab.tsx:33-41`). Present but a dead end —
    no "Discover runners" CTA despite `/social/discover` existing (`social.routes.ts:202`).
  - Error: **MISSING.** `queryFn` swallows errors with `.catch(() => ({activities:[]}))`
    (`FeedTab.tsx:14`), so a 503 from the `social_feed` feature flag (`social.routes.ts:12-14`)
    silently renders the empty state. Violates *Help users recognize/recover from errors*.
- **Interactions & nav:** Avatar tap → `/user/:id` (`FeedTab.tsx:49`). Reaction tap → mutate +
  invalidate. No tap target on the card body, no comments, no detail view.
- **UX problems:**
  - **P0 (DATA CONTRACT BUG — feed is empty in production):** Client reads
    `feed?.activities` (`FeedTab.tsx:23`) but the backend returns `{ feed: [...] }`
    (`social.routes.ts:48`). The key is `feed`, not `activities`. Result: `activities` is always
    `undefined → []`, so **the empty state shows even when there is data.** This is the single
    most important finding for this tab.
  - **P0 (Reaction round-trips broken):** Client sends the literal emoji as `reaction_type`
    (`FeedTab.tsx:84`, e.g. `'🙌'`), but the backend stores it raw and only maps the canonical
    keys `high_five/fire/impressive/respect/lets_go` back to emoji (`social.routes.ts:45,61`).
    The client's emoji set `['🙌','🔥','💪','⚡','🫡']` also doesn't match the backend's
    `🙌🔥💪🫡⚡`. Reaction type never round-trips; `user_reaction_emoji`/active-state can't render.
  - **P0 (Field mismatch):** Client expects `time_ago`, `streak_days`, `caption`
    (`FeedTab.tsx:60,62,68`); backend `/feed` returns none of them (`social.routes.ts:48-55`).
    So timestamps fall back to "recently", streaks never show, captions never render.
  - **P1 (No comments — feed feels dead):** Backend has full comments support
    (`social.routes.ts:104-143`) but the Feed shows neither comment counts nor any way to
    comment. Strava's feed is *driven* by kudos **and** comments; ours surfaces neither well.
    Violates *Visibility of system status* (social proof is invisible).
  - **P1 (No optimistic UI):** Reaction mutation just invalidates on success (`FeedTab.tsx:20`);
    no optimistic toggle, no "you reacted" state, no de-dupe — and the backend 409s on a repeat
    reaction (`social.routes.ts:88-90`) with no client handling, so a double-tap silently fails.
  - **P1 (Cold-start emptiness):** Feed is follow-only (`social.routes.ts:21-26`). A new runner
    follows nobody → permanently empty feed. Kills the "alive" feeling on day one.
  - **P2 (Touch targets):** Reaction emojis at `text-[15px] opacity-50` (`FeedTab.tsx:85`) are
    small and low-contrast; below the 44px tap-target guideline (WCAG 2.5.5).
- **Redesign opportunities (Strava/NRC-informed):**
  - Fix the contract (`feed`/`reaction_type`/fields) — this alone takes the feed from "empty"
    to "functional."
  - Make the card the unit: tappable → activity detail with full reaction list + comment thread.
    Surface `comments_count` and the first 1–2 comments inline (Strava pattern).
  - Add **kudos faces** (overlapping avatars of who reacted) — concrete social proof.
  - Add achievement/PR cards and **"X just finished a run"** presence so the feed has rhythm
    even with few follows. Default to club-wide for new users.
  - Single primary reaction (kudos) + a long-press reaction picker (NRC/Strava), instead of 5
    always-visible emojis competing for attention.

---

### Communities sub-tab (`social/CommunitiesTab.tsx`)
- **Purpose:** Show "My Communities" + "Discover" lists.
- **Features & data:** Query `['communities']` → `GET /communities`
  (`CommunitiesTab.tsx:8-11`). Splits into `joined`/`discover` with brittle fallbacks
  (`CommunitiesTab.tsx:13-14`). Each joined row: emoji tile, name, `member_count`, unread dot if
  `unread_posts > 0` (`:38-47`). Discover rows add a "Join" button that just navigates to detail
  (`:68-73`) — it does **not** join.
- **States:** Loading skeleton (`:16-17`). Combined empty 👥 (`:80-86`). No error state (same
  swallow pattern, `:10`).
- **Interactions & nav:** Row tap → `/communities/:id`. The "🔍 Search communities…" box
  (`:22-25`) is a **fake static div** — not an input, does nothing. *Deceptive affordance*
  (violates *Match between system and real world* / honesty).
- **UX problems:**
  - **P0 (Duplicate screen):** Strictly worse clone of `CommunitiesPage`. Should be deleted in
    favor of folding `CommunitiesPage` into the Community tab.
  - **P1 (Fake search):** Looks interactive, isn't (`:22-25`).
  - **P1 (Mislabeled "Join"):** Button says "Join" but only navigates (`:68-73`); the real join
    is `POST /communities/:id/join` in detail (`CommunityDetailPage.tsx:34-40`). Violates *Match
    between system and real world*.
  - **P2:** Discover hard-capped at 5 (`:59`) with no "see all".
- **Redesign opportunities:** Delete; reuse `CommunityCard` + `CommunitiesPage`'s category
  filters and "your communities" rail. Make search real (client filter at minimum).

---

### Communities directory (`/communities` · `pages/CommunitiesPage.tsx`)
- **Purpose:** Browse/filter communities, jump into yours, request a new one.
- **Features & data:**
  - `['communities', activeCategory]` → `GET /communities?category=` (`CommunitiesPage.tsx:32-37`).
  - `['my-communities']` → `GET /communities/my` (`:39-42`), rendered as a horizontal pill rail
    (`:60-79`).
  - Category chips `All/Run Clubs/Training/Nutrition/Wellness/Social` (`:19-26,82-96`).
  - List of `CommunityCard` (`:134-138`). "+ Create" → `/communities/create` (`:52-57`).
- **States:** Loading skeleton cards (`:99-114`), empty 🏘️ "coming soon" (`:117-126`). No error
  state (query has no `.catch`, but no `isError` UI either → infinite skeleton on failure).
- **Interactions & nav:** Card/pill tap → detail; chip → refetch; create button → request form.
- **UX problems:**
  - **P1 (No error state):** On fetch failure, skeletons never resolve (Nielsen *Visibility of
    system status*).
  - **P2 (Empty copy passive):** "They're coming — watch this space" (`:122-124`) gives the user
    nothing to do. Offer "Request a community" CTA here.
  - **P2 (Category drift):** Chips here omit `brand`/`custom` that exist in `CommunityCard`
    styles (`CommunityCard.tsx:6-8`) and the create form (`CreateCommunityPage.tsx:13-21`) —
    inconsistent taxonomy.
- **Redesign opportunities:** Add member/activity counts and an "active now" signal per card to
  convey life. Surface "trending this week." Merge into the Community tab as the Communities view.

---

### Community detail (`/communities/:id` · `pages/CommunityDetailPage.tsx`)
This is the richest, most "alive" screen in the cluster — and where the real product is.
- **Purpose:** A single community's home: feed, chat, ranking, members, info, with posting.
- **Features & data:**
  - `['community', id]` → `GET /communities/:id` (incl. `recent_posts`, `is_member`,
    `user_role`, `member_count`) (`CommunityDetailPage.tsx:22-26`).
  - `['community-members', id]` → `GET /communities/:id/members` (`:28-32`).
  - Mutations: join/leave (`:34-48`), post (`:50-57`), like (`:59-62`), per-post emoji react
    inline (`:223`), boost via Kendu (`:69-76`).
  - 5 sub-views via local `View` state: **feed / chat / leaderboard("Ranking") / members / info**
    (`:10,141-153`).
  - **Feed view:** pinned posts (amber, `:162-168`), post list with author row, body, optional
    image, like + 3 emoji reactions (`🔥💪👏`, `:220-228`), owner-only **🚀 Boost**
    (`:229-236`). Fixed bottom compose bar (`:340-362`).
  - **Chat view (`CommunityChat`, `:488-656`):** WebSocket when `WS_ENABLED`, REST polling
    fallback otherwise (`:501-505`, gated by `backend.ts`). Live/Connecting/"Connection lost,
    tap to retry" status (`:594-608`), message list, send input. Member-gated (`:246-255`).
  - **Leaderboard (`CommunityLeaderboard`, `:658-780`):** weekly digest (active/runs/km +
    top runner, `:711-734`), my-rank line (`:737-739`), ranked rows with 🥇🥈🥉, avatar,
    runs, km, streak (`:741-770`), **Sponsor Board (500 K)** Kendu CTA (`:689-708`).
  - **Members (`:261-289`):** list → `/user/:id`, role badge for non-members.
  - **Info (`:291-335`):** about, owner, mute, leave (member-only), **PollsSection**
    (`:406-481`), **BroadcastSection** (admin-only, `:378-404`).
- **States:** Loading skeleton (`:78-95`), not-found 🤷 (`:97-107`), per-view empties
  (feed 💬 `:171-177`, chat 💬 `:611-616`, leaderboard 🏆 `:772-777`). Strong coverage.
  Missing: post/like mutation error states (failures are silent — `:50-62`), and the inline
  emoji react fires a fire-and-forget `api.post(...).then(invalidate)` with **no error handling**
  (`:223`).
- **Interactions & nav:** Back → `/communities` (`:114`), 5-tab view switch, join/leave, compose
  (Enter or send button, `:347,352`), like/react, boost (Kendu modal `:364-373`), poll vote,
  broadcast, member → profile.
- **UX problems:**
  - **P1 (Too many sub-views, weak hierarchy):** 5 equal-weight text tabs at 11px
    (`:142-152`) — Feed/Chat/Ranking/Members/Info. Feed vs Chat is a confusing split (both are
    "talk to the community"). Strava clubs collapse to a feed + leaderboard; consider Feed
    (posts+chat merged or chat as a sheet) · Ranking · About.
  - **P1 (Compose bar collision):** Fixed compose sits at `bottom-16` (`:341`) to clear the
    global bottom nav, but this screen renders **outside** `AppShell` (no `AppShell` wrapper,
    `:109-110`) — so the global bottom nav may not even be present, leaving an awkward gap or
    overlap. Layout inconsistency vs every other screen.
  - **P1 (Economy noise):** Boost (`:229-236`), Sponsor Board "500 K" (`:689-697`), and Gift
    (on profile) inject monetization into a thin social surface. With near-empty feeds, asking
    users to spend to pin/sponsor is premature (*Aesthetic & minimalist design*).
  - **P2 (Reaction inconsistency):** Post likes use ❤️ + `🔥💪👏` (`:218-228`); the global feed
    uses `🙌🔥💪⚡🫡` (`FeedTab.tsx:6`); the backend social feed uses yet another set
    (`social.routes.ts:45`). Three different reaction vocabularies across one cluster.
  - **P2 (Chat "Live" lies in polling mode):** When `WS_ENABLED` is false it always shows green
    "● Live" (`:596-598`) even though it's 5s polling — overstates real-timeness.
  - **P2 (Members list unbounded, no search):** Could be long; no search/sort (`:264-287`).
- **Redesign opportunities:**
  - Merge Feed+Chat or demote chat to a slide-up sheet; lead with the feed + a presence header
    ("12 members ran this week").
  - Pull the leaderboard's **weekly digest** (`:711-734`) up as a hero banner on the feed — it's
    the best "alive" artifact in the whole cluster and it's buried under a tab.
  - Add **challenges** (NRC): a community can run a weekly distance/streak challenge that feeds
    the leaderboard. This is the missing engagement loop.
  - Cross-link **Events**: "Upcoming runs" section sourced from the new Events tab.
  - Standardize one reaction vocabulary across feed, posts, and chat.

---

### Create / Request community (`/communities/create` · `pages/CreateCommunityPage.tsx`)
- **Purpose:** Submit a request to start a community (curated, not instant).
- **Features & data:** Controlled form — name, purpose, category grid (7 options incl.
  brand/custom, `:13-21,103-119`), leader name, contact. `POST /communities/request`
  (`:34`). Validation `canSubmit` requires name≥3, purpose≥10, leader≥2, contact≥5 (`:39`).
  Success screen (`:41-63`), inline error (`:158`).
- **States:** Submitting label (`:166`), success view (`:41-63`), error line (`:158`). No
  field-level validation messaging (button just stays disabled — *no feedback on why*).
- **Interactions & nav:** Submit → success → "Back to Communities" (`:53-58`).
- **UX problems:**
  - **P1 (Model mismatch):** This is a *request/review* flow ("We'll review… get back to you",
    `:50-52`), but the rest of the cluster implies instant self-serve join/create
    (`CommunitiesTab.tsx:68`, `CommunityDetailPage.tsx:34-40`). Users will be confused that
    "Create" actually means "apply." Decide the model.
  - **P2 (Counter mismatch):** Purpose shows `{length}/200` (`:97`) but validation only needs 10
    and there's no enforced max — the counter implies a 200 limit that isn't enforced.
  - **P2 (Disabled-button dead-end):** With invalid input the CTA is just `opacity-30` (`:164`)
    and silent; no hint about which field is short. Violates *Help users recognize errors*.
  - **P2 (Contact type):** Free-text "phone or email" (`:135-142`) — no format validation.
- **Redesign opportunities:** If staying curated, rename to "Request a Community" everywhere and
  remove instant-Join affordances. Add inline validation + character counters that match the
  rules. Pre-fill leader name from the signed-in user.

---

### User profile (`/user/:id` · `pages/UserProfilePage.tsx`)
- **Purpose:** Public runner profile reached from feed/members/leaderboard.
- **Features & data:** `['user-profile', id]` → `GET /profile/:id` (`:22-26`). Header
  avatar/name, tier badge, level, streak (`:82-104`). Follow/unfollow `POST|DELETE
  /social/follow/:id` (`:28-32,109-119`). **Gift Kendu** button → modal (`:120-126,200-322`).
  Stats row: runs / km / followers / following (`:130-147`). Achievement chips (`:150-162`),
  community chips (`:165-180`), member-since (`:183-185`).
- **States:** Loading skeleton (`:34-53`), not-found 🤷 (`:55-65`). Follow mutation has no
  optimistic/error UI (`:28-32`). Gift modal has success + error (`:220,244-248,301`).
- **Interactions & nav:** Back `navigate(-1)` (`:61,74`); follow toggle; community chip →
  `/communities/:id` (`:172`); gift modal.
- **UX problems:**
  - **P1 (No activity on a "profile"):** No run history, no recent activity, no best pace, no
    charts — it's a stat strip. `best_pace` is even hardcoded `null` in the popup
    (`RunnerCardPopup.tsx:38`). A Strava/NRC profile leads with recent runs and trends.
  - **P1 (Follow not optimistic):** Toggling waits for refetch (`:31`); feels laggy, no error
    recovery.
  - **P2 (Gift fee surprise):** 15% fee "burned" (`:223,287-290`) is shown only inside the modal;
    fine, but the economy again dominates a social screen.
  - **P2 (No self-profile route here):** `isOwnProfile` hides actions (`:67,107`) but there's no
    Edit affordance; the real profile lives elsewhere (top-bar avatar per brief).
- **Redesign opportunities:** Lead with recent runs + a pace/volume trend; add kudos-given/PRs.
  Make follow optimistic. Consider mutual-follow ("Friends") to power an NRC-style friends list.

---

### RunnerCardPopup (`social/RunnerCardPopup.tsx`) — mini profile modal
- **Purpose:** Lightweight tap-preview of a runner (tiered gradient card) before full profile.
- **Features & data:** `['runner-card', userId]` → `GET /profile/:id` (`:26-30`). Tier gradient
  + border (`:6-16,61`), avatar/name/tier/level (`:64-85`), 3-stat grid km/pace/streak
  (`:88-101`), top badge (`:104-109`), "View Full Profile" → `/user/:id` (`:112-117`).
- **States:** Loading spinner card while `profile` is null (`:120-124`). No error state (query
  has no catch; a failure leaves a perpetual spinner).
- **Interactions & nav:** Backdrop tap closes (`:50`); CTA → full profile.
- **UX problems:**
  - **P1 (Appears unused / orphaned):** `RunnerCardPopup` isn't imported anywhere in the feed or
    member lists I traced (feed avatars go straight to `/user/:id`, `FeedTab.tsx:49`). There are
    **two** RunnerCardPopups (`social/` and `ui/`) — likely dead/duplicated code.
  - **P2 (`best_pace` always `--`):** Hardcoded `null` (`:38,94`) — a stat slot that never fills.
- **Redesign opportunities:** If kept, wire it to feed/leaderboard/member taps as a fast preview
  (good pattern), fix `best_pace`, add error state, and dedupe with `ui/RunnerCardPopup`.

---

### RunCard (`social/RunCard.tsx`) — shareable run card
- **Purpose:** Instagram-story-sized (9:16) shareable image of a run.
- **Features & data:** Props-driven (`run`, `userName`, `streak`, `tier`, `improvement`,
  `:7-20`). Renders branded card with route placeholder, distance/time/pace, streak/tier/
  improvement badges (`:55-136`). `html-to-image` → download/share via Web Share API
  (`:26-53`).
- **States:** `downloading` label (`:140-141`). Share falls back to download on failure
  (`:51-52`). No error toast surfaced to the user.
- **Interactions & nav:** Download / Share buttons (`:139-146`). Used by `SharePage`, not the
  Community feed (Grep: only `SharePage.tsx` imports it).
- **UX problems:**
  - **P1 (Fake route line):** The "map" is a hardcoded decorative SVG path (`:75-84`) regardless
    of the real `map_polyline`. It implies a real route but isn't — *honesty / match to reality*.
  - **P2 (Brand drift):** Uses `#39FF14` neon green and `#0A0A0F` (`:30,61,79`) which don't match
    the design tokens in the brief (accent `#F97316`, green `#10B981`, bg `#09090B`). Off-system.
  - **P2 (Not in the social loop):** Sharing a run card is a powerful growth/social-proof moment
    but it lives on `SharePage`, disconnected from Feed. A finished run should offer "Share card"
    *and* "Post to club."
- **Redesign opportunities:** Render the **real** polyline; align to tokens; surface the share
  card right after a run and inside the feed (Strava's shareable activity is core to its loop).

---

### CommunityCard (`communities/CommunityCard.tsx`) — list row
- **Purpose:** Reusable community row for directories.
- **Features & data:** Category style map (icon/color/bg, `:1-9`), avatar or category icon
  (`:26-32`), name + verified check (`:37-43`), description/line-clamp (`:45`),
  member_count + "Joined" (`:46-53`).
- **States:** None (presentational). Relies on `community.category` existing — `:45` does
  `community.category.replace(...)` which throws if category is null.
- **UX problems:**
  - **P2 (No activity signal):** Member count only; no "active this week"/last-post time, so
    cards feel static (the same emptiness problem at list level).
  - **P2 (Null-category crash risk):** `:45` assumes `category` is defined.
- **Redesign opportunities:** Add live signals (active members, last post, "trending"). This is
  the right standard row — adopt it everywhere and delete the bespoke rows in `CommunitiesTab`.

---

## C. Reusable components inventory

Standardize these into the design system:

1. **Segmented sub-tab control** — appears thrice with different styles
   (`SocialPage.tsx:14-34`, `CommunityDetailPage.tsx:141-153`, `CommunitiesPage` chips
   `:82-96`). One `<SegmentedTabs urlKey="view">` component, URL-synced.
2. **CommunityCard / list row** (`communities/CommunityCard.tsx`) — the canonical community row;
   replace the ad-hoc rows in `CommunitiesTab.tsx:32-77`.
3. **RunnerCardPopup** (`social/RunnerCardPopup.tsx`) — tier-gradient mini-profile; dedupe with
   `ui/RunnerCardPopup` and standardize tap-preview behavior.
4. **Reaction bar** — currently three incompatible vocabularies (`FeedTab.tsx:6`,
   `CommunityDetailPage.tsx:220`, `social.routes.ts:45`). One `<ReactionBar>` with a single
   canonical reaction set and optimistic toggle.
5. **Leaderboard row** (`CommunityDetailPage.tsx:743-770`) — medal/avatar/stat row; reuse for the
   promoted club-wide leaderboard.
6. **Weekly digest card** (`CommunityDetailPage.tsx:711-734`) — active/runs/km + top runner; the
   best "alive" artifact; promote and reuse.
7. **Avatar+initial fallback** — repeated inline ~6 times (e.g. `FeedTab.tsx:50-56`,
   `CommunityDetailPage.tsx:188-194,270-275,752-759`, `UserProfilePage.tsx:83-88`). One
   `<Avatar>` component.
8. **Empty-state block** (emoji + title + subtitle) — repeated everywhere
   (`FeedTab.tsx:33-41`, `CommunitiesTab.tsx:80-86`, `CommunitiesPage.tsx:117-126`,
   `CommunityDetailPage.tsx:171-177,772-777`). One `<EmptyState>` with an action slot.
9. **RunCard** (`social/RunCard.tsx`) — shareable card; bring on-token, render real route, reuse
   from the feed.
10. **Kendu spend modal** (`KenduSpendConfirmModal`, `GiftKenduModal`) — already partly shared;
    consolidate Gift/Boost/Sponsor into one confirm component.

---

## D. Top 5 highest-impact changes for this tab

1. **Fix the feed data contract so the feed actually shows runs.**
   `FeedTab` reads `feed?.activities` but the API returns `{ feed: [...] }`
   (`FeedTab.tsx:23` vs `social.routes.ts:48`); reaction types and fields
   (`time_ago/streak_days/caption`) also don't match. *Benefit: the core Community surface goes
   from permanently empty to functional — the prerequisite for everything else.*

2. **Make the feed feel alive: club-wide default + comments + kudos faces + presence.**
   Default to club+followed (kills cold-start, `social.routes.ts:21-26`), surface
   `comments_count` and inline comments (backend exists, `social.routes.ts:104-143`), show who
   reacted, and add a "running this week / just finished" strip. *Benefit: turns a dead list into
   the social proof that makes the club feel populated (Strava's core loop).*

3. **Collapse the duplicate Communities IA into one Community tab with 3 views.**
   Delete `CommunitiesTab` (incl. fake search and fake "Join", `CommunitiesTab.tsx:22-25,68-73`),
   fold `CommunitiesPage` in, and add a tab-level Leaderboard/Challenges view (promote the
   buried per-community leaderboard + weekly digest, `CommunityDetailPage.tsx:658-780`).
   *Benefit: one coherent, consistent tab; removes confusing duplicate routes.*

4. **Add challenges + a club-wide leaderboard (the missing engagement loop).**
   No challenges exist anywhere today; leaderboards are trapped inside single communities.
   Introduce weekly distance/streak challenges feeding a club ranking. *Benefit: the recurring
   reason to come back that NRC built its retention on.*

5. **Tame the economy and add error/optimistic states across the cluster.**
   Demote Boost/Sponsor/Gift (`CommunityDetailPage.tsx:229-236,689-708`,
   `UserProfilePage.tsx:120-126`) until the social surface is alive; add real error states (feed
   swallows errors, `FeedTab.tsx:14`; communities/profile have none) and optimistic follow/react.
   *Benefit: a trustworthy, responsive social layer instead of a monetization-first empty one.*

---

### Cross-cutting note: Community ↔ Events
Events is now its own tab, so Community should stop trying to be the place for scheduled runs.
Community = ambient social proof (feed, chat, ranking, challenges); Events = RSVP-able sessions.
The link is bidirectional: a community detail should show its **upcoming events**, and an event
should credit its **host community**. Neither relationship exists in code today.
