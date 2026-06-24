# Events — Feature & UX Teardown

> Council member: **EVENTS tab**. Cluster files read in full:
> `client/src/pages/EventsPage.tsx`, `client/src/pages/EventDetailPage.tsx`,
> `client/src/components/events/EventCard.tsx`, `AttendeeAvatars.tsx`,
> `EventMapView.tsx`, `RegistrationModal.tsx`. Data traced to
> `server/src/routes/events.routes.ts` and `server/src/routes/admin.routes.ts`.
>
> **Headline:** Events is being promoted from a buried route into a full bottom-nav tab,
> but today it is a single flat list page with a featured hero. It is *thin* — and worse,
> three already-built backend capabilities (`/events/nearby`, `/events/my`, a paid
> `RegistrationModal`) are **wired in the API/components but never reached from the UI**.
> The tab has real estate to fill; the backend has more than the screen exposes.

---

## A. Cluster IA recommendation

**What this tab should be:** the club's living calendar + the on-the-day experience
(discover → RSVP → remind → check-in → recap). Right now it is only "discover (list)" plus
a detail page that quietly also does check-in and recap. With full tab real estate, it should
become a 3-sub-tab structure:

1. **Upcoming** (default) — chronological list with a "Featured/Next" hero, date-grouped
   sections (This week / Next week / Later), and the existing type filters made real.
2. **Nearby / Map** — promote the map from a toggle into its own sub-tab, and finally wire the
   already-built `/events/nearby` haversine endpoint (`events.routes.ts:98-134`) which the
   client never calls. Add a "use my location" radius control.
3. **Mine** — the user's RSVPs + a "Going / Past" split. The `/events/my` endpoint already
   exists (`events.routes.ts:137-150`) and is **completely unused by the client**. This is the
   single fastest win to fill the tab: a personal agenda the user returns to.

A persistent top sub-segment (Upcoming · Nearby · Mine) replaces today's single `viewMode`
list/map toggle button (`EventsPage.tsx:47-62`), which is a hidden one-shot toggle that does
not communicate that a map even exists (Nielsen: *visibility of system status* + *recognition
over recall*).

**Features that should MOVE IN:**
- **"Host Event" / "Priority RSVP"** — `RewardsPage.tsx:15` sells "Host Event" for 75 Kendu and
  "Priority RSVP" for 15 Kendu, both routing to `/events`, but **no user-facing create-event or
  priority-RSVP flow exists** anywhere. Events can only be created via the admin panel
  (`admin.routes.ts:162`). Either build a create-event entry point in this tab or the Rewards
  promise is dead. This is a broken loop that lands the user on a list with no create affordance.
- **Check-in** is currently buried inside the detail page (`EventDetailPage.tsx:293-338`). On the
  day of an event it should surface to the top of the tab (a "Happening now — check in" banner),
  not require the user to remember which event and navigate into it.

**Features that should MOVE OUT / clarify:**
- **Post-event share card** (`EventDetailPage.tsx:393-411`) overlaps the brand/sharing suite —
  keep the trigger here but standardize the card with the Community/run-card system rather than a
  bespoke `generateShareCard` call.
- **Discussion/comments** (`EventDetailPage.tsx:418-467`) is fine to keep on detail, but it is the
  only social surface and competes with Community; ensure it doesn't duplicate a feed.

---

## B. Screen-by-screen teardown

### Events list (`/events` → `EventsPage.tsx`)

- **Purpose:** discover upcoming club events and jump into one.
- **Features & data:**
  - Header "Events / Meet up, run together, vibe" (`EventsPage.tsx:44-45`).
  - List/Map toggle button (`:47-62`) flipping local `viewMode` state (`:30`).
  - Filter pills from a hardcoded `FILTERS` array (`:20-25`): only `all` and `group_run` are
    `active: true`; `social` and `health_fitness` render as disabled "Soon" chips (`:80-82`).
  - Data: `useQuery(['events', activeFilter])` → `GET /events?type=` (`:32-37`), served by
    `events.routes.ts:17-95`. Each event carries `attendee_count`, `maybe_count`, `user_rsvp`,
    `is_full`, `friends_going`, `friends_going_count` (`events.routes.ts:81-94`).
  - Featured hero = `data.events[0]` (`:129-151`): countdown badge, title, location,
    inline `AttendeeAvatars`, "N spots left".
  - Remaining events via `data.events.slice(1)` rendered as `EventCard` (`:154-158`).
  - Map view renders `EventMapView` with all events (`:88-92`).
- **States:**
  - Loading: 3 skeleton cards (`:95-114`). Good.
  - Empty: 📅 + "No events coming up yet…" (`:117-126`). Only covers the *list* view; map view has
    its own empty state inside the component.
  - **Error: MISSING.** `useQuery` destructures only `data, isLoading` (`:32`) — no `isError`. A
    failed `/events` request renders the **empty state as if there are simply no events**, which is
    a lie to the user (Nielsen: *help users recognize/diagnose errors*; *visibility of system
    status*). P0.
  - **Edge case — date math is local-timezone fragile:** `new Date(date + 'T' + (time||'00:00'))`
    (`:165`) and identical logic in `EventCard.tsx:10`/`EventDetailPage.tsx:23` parse server
    `date`/`time` as **device-local** time. An event stored as 6:00 will display differently per
    user timezone with no tz handling. P1.
  - **Edge case — "Featured" is just the soonest event**, including events happening in 5 minutes or
    a `live` event; there is no editorial "featured" concept. Mislabeled.
- **Interactions & nav:** tap hero / card → `navigate('/events/:id')`; tap marker popup →
  same; toggle list/map. No pull-to-refresh, no pagination UI (backend supports
  `page`/`has_more` at `events.routes.ts:92-94` but the client requests page 1 only and never
  paginates).
- **UX problems:**
  - **P0 — No error state.** (see above) Failures masquerade as empty.
  - **P0 — Tab will feel empty/thin as a top-level destination.** A single flat list with no
    sub-structure, no "my events", no nearby, no date grouping. Competitors (Meetup, Eventbrite,
    Strava Club events) all open on a structured calendar/agenda, not one list. *Aesthetic/minimal
    but information-poor.*
  - **P1 — Dead "Soon" filters.** Two of four filter pills are permanently disabled stubs
    (`:80-82`). Shipping visible non-functional controls erodes trust (Nielsen: *match between
    system and real world* / avoid false affordances). Also the filter `keys`
    (`social`, `health_fitness`) don't even match the DB `event_type` values used elsewhere
    (`group_run`, `coffee_meetup`, `workout`, `social`, `custom` — see `EventCard.tsx:1-7`), so
    `health_fitness` could never match a real event anyway.
  - **P1 — Map is a hidden toggle.** No label/onboarding that a map exists; discoverability poor.
  - **P1 — Hardcoded city.** Map centers on Mumbai `[19.076, 72.8777]` (`EventMapView.tsx:23`) with
    no geolocation; for any other city the map opens on the wrong continent before fitting bounds.
  - **P2 — Two divergent `AttendeeAvatars`.** `EventsPage.tsx` defines its own inline
    `AttendeeAvatars` (`:177-206`) while a separate component exists at
    `components/events/AttendeeAvatars.tsx` with a *different* prop shape (`totalCount` vs `count`,
    `user_id` required). Duplicate, drifting components. Standardize.
  - **P2 — "spots left" can mislead.** Hero shows spots left only when `max_attendees` set
    (`:143-147`); cards show it only when not full (`EventCard.tsx:95`). Inconsistent presence.
- **Redesign opportunities:**
  - Date-grouped agenda ("Today / This week / Next week") like Meetup & Strava Club events.
  - Promote **Nearby** (wire `/events/nearby`) and **Mine** (wire `/events/my`) into sub-tabs —
    both endpoints already exist and ship zero UI today.
  - A "Happening now" / live strip at top when any event `status === 'live'`, deep-linking to
    check-in (NRC-style guided-run urgency).
  - Real type filters keyed to actual `event_type` values, with counts.
  - Pull-to-refresh + infinite scroll using the existing pagination contract.

---

### Event detail (`/events/:id` → `EventDetailPage.tsx`)

- **Purpose:** everything about one event + RSVP, check-in, recap, discussion.
- **Features & data:**
  - Gradient header with type icon/label (`:153-163`), color map `EVENT_COLORS` (`:10-16`).
  - When/where: `formatEventDateTime(date,time,duration_minutes)` (`:22-30`, rendered `:176-178`);
    location links to Google Maps via `latitude/longitude` or name (`:190-197`).
  - Description (`:203-205`).
  - **Hosts** with `role_label` (`:208-229`) from `event_hosts` (`events.routes.ts:176-181`).
  - **Attendees** — "Who's going · N going · M maybe" (`:232-235`) + up to 12 name chips
    (`:236-251`) from `event.attendees` (`events.routes.ts:167-174`, capped 50).
  - **RSVP** going/maybe with optimistic update (`:53-72`, buttons `:255-289`), cancel (`:74-80`).
    Backend awards **15 XP on first 'going'** and notifies the creator (`events.routes.ts:220-224`).
  - **Check-in** when `status === 'live'`: organizer code input (`:293-338`); backend validates
    `check_in_code`, awards **50 + 10 XP and Kendu** (`events.routes.ts:286-316`).
  - **Post-event results**: `my-awards` query enabled only when completed (`:82-86`); shows awards,
    distance/pace/time, and a **"Share to Instagram Story"** button calling `generateShareCard`
    (`:393-411`). Activity is matched by *same-date* run (`events.routes.ts:277-281`).
  - **EventRecap** leaderboard (`:473-526`) from `/events/:id/recap` (`events.routes.ts:332-385`).
  - **Comments** list + composer (`:418-467`), `Enter` to post (`:455-457`), 500-char cap.
- **States:**
  - Loading skeleton (`:109-120`). Good.
  - **Not-found** state 🤷 + "Back to events" (`:122-134`). Good — better than the list page.
  - **Error (non-404): MISSING.** Only `isLoading`/`event` are read (`:41`); a network error leaves
    `event` undefined and renders the "Event not found" screen, mislabeling a transient failure as a
    missing event. P1.
  - **Comments empty: MISSING.** When `comments` is empty there's no "Be the first to comment"
    prompt — just a bare composer. P2 (*empty-state guidance*).
  - **RSVP error: weak.** `rsvpMutation.onError` rolls back the optimistic count (`:65-67`) but shows
    **no toast/message** — e.g. a 409 "Event is full" (`events.routes.ts:207`) silently reverts the
    button with no explanation. P1 (*error visibility*).
  - Edge: `event.event_type.replace('_',' ')` (`:157`) — only replaces the **first** underscore;
    multi-underscore types would render half-snake.
- **Interactions & nav:** back to `/events`; map deep-link; RSVP/cancel; check-in submit; share;
  comment post. No calendar add (.ics / Google Cal), no share-the-event (only share *results*),
  no directions beyond a raw Google Maps query.
- **UX problems:**
  - **P0 — No "add to calendar" / reminder.** The single most expected event action (Eventbrite,
    Meetup, Google Cal) is absent. RSVP sets a DB row and 15 XP but the user gets **no reminder
    mechanism** they control. Combined with no client-side reminder, attendance relies on memory.
  - **P1 — Check-in code is manual + low-trust.** User must type an organizer code
    (`:313-323`); there's no QR scan, no geofence, no "I'm here" GPS check-in. Manual codes are
    error-prone on mobile and easily shared by no-shows. Competitors use QR/geo check-in.
  - **P1 — No pace groups / "who's going" depth.** Attendees are flat name chips (`:236-251`).
    For a run club the high-value info is **pace groups** (5:00/km vs 6:30/km pack), distances,
    and tier — none surfaced, though tier/pace data exists elsewhere in the app. Strava Club runs
    and NRC organize attendees by pace/group.
  - **P1 — RSVP error silent** (see states). 409 "full" reverts with no message.
  - **P2 — "Maybe" path gives no XP and no host notification** (`events.routes.ts:220`), so the
    social-proof "M maybe" count never converts; no nudge to upgrade Maybe→Going.
  - **P2 — Share card duplicates brand system**; should reuse the standardized run-card.
  - **P2 — Hosts vs attendees visual language differs** (rounded boxes vs pills) for essentially the
    same "person chip" — inconsistency (*consistency & standards*).
- **Redesign opportunities:**
  - "Add to calendar" + opt-in reminders (24h / 1h) — push via the app's notification system.
  - **Pace-group breakdown** of attendees (group the `event.attendees` by pace zone) — turns a
    generic RSVP list into run-club-specific value.
  - QR / geofenced check-in to replace typed codes; show a live "N checked in" ring on the day.
  - Map preview of the start point inline (reuse `EventMapView` single-pin) instead of a text link.
  - Convert "Maybe" with a gentle prompt and award partial XP to make the maybe count meaningful.
  - Surface a "share this event / invite friends" action (the only sharing today is *post-event*).

---

### EventCard (`components/events/EventCard.tsx`)

- **Purpose:** list row for one upcoming event.
- **Features & data:** type badge + icon (`EVENT_STYLES` `:1-7`), relative date
  (`formatEventDate` `:9-23`), title, location, **friends-going avatars + social-proof copy**
  (`:69-89`, from `event.friends_going` / `friends_going_count`), spots-left pill (`:95-103`,
  red ≤10), and a status pill: `LIVE` (`:105-109`), RSVP `✓ Going`/`~ Maybe` (`:110-118`), or
  `Full` (`:119-123`). This is the **best component in the cluster** — friends-going social proof
  ("Asha is going" / "3 friends going") is exactly the right mechanic.
- **States:** purely presentational; relies on parent for loading/empty.
- **UX problems:**
  - **P1 — `event: any`** (`:26`) — no typing; the whole cluster passes untyped `any` events
    (CLAUDE.md forbids unjustified `any`). Risk of silent shape drift between list and detail
    endpoints (e.g. list returns `friends_going`, detail returns `attendees`).
  - **P2 — No image/thumbnail.** Cards are text-only; events have no cover image concept. Eventbrite/
    Meetup cards lead with imagery for scanability and desire.
  - **P2 — Past/completed events** aren't represented here (list only fetches upcoming/live), so a
    "Mine → Past" view would need card variants.
- **Redesign opportunities:** add cover image / map-snapshot thumbnail; add a compact pace-group
  hint; make the friends-going avatars the standardized stacked-avatar component (see C).

---

### AttendeeAvatars (`components/events/AttendeeAvatars.tsx`)

- **Purpose:** stacked overlapping avatars + "+N".
- **Features & data:** `attendees` (typed `Attendee[]` with `user_id/name/profile_image_url`),
  `totalCount`, `maxShow=5`; computes `remaining` (`:14-15`); renders initials fallback (`:31-33`).
- **States:** returns `null` if nothing to show (`:17`) — silent, no "Be the first" affordance
  (the *inline* copy in EventsPage handles that instead, proving the duplication).
- **UX problems:**
  - **P2 — Duplicated & divergent.** This typed component is imported **only** by
    `EventDetailPage.tsx:7` (and not actually rendered in the body I read — the detail page renders
    its own attendee chips at `:236-251`). Meanwhile EventsPage ships a *second* inline
    `AttendeeAvatars` with different props. Two implementations, one barely used. Consolidate.
  - **P2 — `null` empty state** pushes empty-state responsibility onto every caller.
- **Redesign opportunities:** make this the canonical stacked-avatar primitive used by EventCard,
  hero, and detail; add an optional trailing "N going" label and a "Be the first" empty variant.

---

### EventMapView (`components/events/EventMapView.tsx`)

- **Purpose:** Leaflet dark map of events with location.
- **Features & data:** dynamic `import('leaflet')` (`:16`); CartoDB dark tiles (`:25`); custom
  pin divIcons (`:50-55`); click popup with title/location/"N going" (`:59-67`); `fitBounds` to
  markers (`:71-73`); marker click → `onEventClick` (`:68`). Filters to events with lat/lng
  (`:76`) and shows an empty state if none (`:78-88`).
- **States:** empty state present (`:78-88`). No loading state while Leaflet imports / tiles load.
  No error state if the dynamic import or tiles fail. P2.
- **UX problems:**
  - **P1 — Hardcoded Mumbai center** (`:23`) — no geolocation; map jumps from wrong region before
    `fitBounds`. Visible flash for non-Mumbai clubs.
  - **P1 — Popup branding bug.** Popup "N going" text color is `#c8ff00` lime (`:63`) — **not a
    token color**. Project accent is `#F97316`. Off-brand hardcoded color leaking into the map.
    Same with the pin gradient `#FF6B35→#FF2E63` (`:52`) which is also off the documented accent.
  - **P2 — Cleanup bug.** The mount effect's cleanup reads `mapInstance` from the closure where it's
    still `null` at mount (`:34`), so `mapInstance?.remove()` likely never runs → potential Leaflet
    re-init leak on remount. (*Technical, but causes "map container already initialized" errors.*)
  - **P2 — No clustering** for dense areas; many pins overlap.
- **Redesign opportunities:** geolocate + recenter; cluster markers; token-correct pins/popups;
  a bottom-sheet card list synced to the map (Meetup/Airbnb pattern); promote to its own sub-tab.

---

### RegistrationModal (`components/events/RegistrationModal.tsx`) — ORPHANED / DEAD CODE

- **Purpose (as built):** a confirmation modal showing the user's name/phone/email, a
  commitment checkbox, and "Confirm Registration".
- **Features & data:** pulls `name/phone/email` from `useAuth` (`:18-20`); `agreed` gate (`:64`);
  `onConfirm` callback (`:22-27`).
- **CRITICAL FINDING — it is never imported or rendered anywhere.** A repo-wide search for
  `RegistrationModal` returns **only its own definition**; nothing in the app uses it. The actual
  RSVP flow is the inline buttons in `EventDetailPage.tsx:255-289`, which call `/events/:id/rsvp`
  directly with **no modal, no commitment checkbox, and no payment**.
- **PAYMENT GAP:** the brief asks how RSVP/registration + **Razorpay payment** works. **There is no
  payment in the events flow at all** — no `price`/`amount`/`razorpay` field on events
  (`events.routes.ts` has none), no payment in this modal, and `RewardsPage.tsx:15,20` sells
  "Host Event" (75 Kendu) and "Priority RSVP" (15 Kendu) that route to `/events` but have **no
  implementation**. So today: all events are free RSVPs; the only "currency" is XP/Kendu, and even
  the Kendu spends advertised in Rewards are unwired. P0 for any paid-event ambition.
- **UX problems:**
  - **P0 — Dead component / broken promise.** Either delete it or make it the real registration
    surface. As-is it's misleading scaffolding.
  - **P1 — Read-only contact fields with placeholders** (`:50-58`) look like editable inputs but
    aren't; if a user has no phone/email there's no way to add one here.
  - **P1 — `onConfirm` has no error handling** (`:22-27`) — `await onConfirm()` then unconditionally
    flips `submitting=false`; a thrown error closes nothing and shows nothing.
- **Redesign opportunities:** If paid events are on the roadmap, this becomes the Razorpay
  checkout step (order create → Razorpay handler → confirm RSVP). If not, fold the commitment
  checkbox into the detail-page RSVP and delete the modal.

---

## C. Reusable components inventory

| Component | Where | Standardize as |
|---|---|---|
| **Stacked avatars + "+N"** | `AttendeeAvatars.tsx` **and** inline `EventsPage.tsx:177-206` **and** `EventCard.tsx:69-89` | One `AvatarStack` primitive (props: `people`, `total`, `max`, optional `label`, `emptyText="Be the first"`). Three drifting copies today. |
| **Event/type badge** | `EventCard.tsx:1-7,40-43`, `EventDetailPage.tsx:10-20,153-159` | `EventTypeBadge` with shared `EVENT_STYLES` (color/bg/border/icon) — currently duplicated maps in two files that already disagree (`coffee_meetup` vs `workout` icon sets). |
| **Countdown / relative-date pill** | `CountdownBadge` (`EventsPage.tsx:164-175`), `formatEventDate` (`EventCard.tsx:9-23`), `formatEventDateTime` (`EventDetailPage.tsx:22-30`) | One date/time util module (with timezone handling) + a `CountdownPill`. Three separate `new Date(date+'T'+time)` implementations. |
| **Person chip** | hosts `EventDetailPage.tsx:213-225`, attendees `:239-249` | `PersonChip` (avatar + name + optional sublabel/role) — two visual styles for the same idea. |
| **Stat trio (km / pace / time)** | results `EventDetailPage.tsx:368-387`, recap `:488-503` | `StatTriple` mono-number block — reusable across run/recap/coach. |
| **Leaderboard row** | `EventRecap` `:507-522` | `LeaderboardRow` (rank medal + avatar + name + metric) — shared with Community/Home. |
| **Mini leaderboard / recap card** | `EventRecap` `:481-525` | `RecapCard` — reusable for any group activity. |
| **Empty-state block** | list `EventsPage.tsx:117-126`, map `EventMapView.tsx:78-88`, not-found `EventDetailPage.tsx:122-134` | `EmptyState` (icon + title + subtitle + optional CTA) — used app-wide. |
| **Skeleton card** | `EventsPage.tsx:98-112`, `EventDetailPage.tsx:112-118` | `SkeletonCard` variants. |

---

## D. Top 5 highest-impact changes for this tab

1. **Fill the tab with the sub-screens that are already built but unreachable.** Wire
   `/events/my` ("Mine"/agenda) and `/events/nearby` ("Nearby") into sub-tabs. *Both endpoints
   exist and ship zero UI today* (`events.routes.ts:98-150`) — this is the cheapest way to turn a
   thin one-list page into a real destination, and gives users a reason to return (their own
   agenda). **Benefit:** the promoted tab stops feeling empty; personal RSVPs become a habit loop.

2. **Add real error states + reminders.** (a) Give the list and detail queries `isError` handling
   so failures stop masquerading as "no events" / "event not found"
   (`EventsPage.tsx:32`, `EventDetailPage.tsx:41`). (b) On RSVP, add "Add to calendar" + opt-in
   24h/1h reminders. **Benefit:** trust (the app stops lying about empties) and *actual attendance*
   (RSVP today has no reminder mechanism, so it's a forgettable DB row).

3. **Resolve the registration/payment story (kill or wire the dead modal).** `RegistrationModal`
   is never imported and there is **no Razorpay/payment anywhere in events**, while Rewards sells
   "Host Event"/"Priority RSVP" that go nowhere (`RewardsPage.tsx:15,20`). Decide: free-RSVP-only →
   delete the modal and fold its commitment checkbox into detail RSVP; or paid events → make the
   modal the Razorpay checkout. **Benefit:** removes a broken promise and dead scaffolding;
   unlocks monetization if desired.

4. **Make attendees run-club-specific: pace groups + check-in upgrade.** Group "who's going" by
   pace zone instead of flat chips (`EventDetailPage.tsx:236-251`), and replace the typed
   organizer code (`:313-323`) with QR / geofenced check-in plus a live "N checked in" indicator.
   **Benefit:** turns a generic event list into a runner's tool (find your pack), and makes
   day-of check-in trustworthy and one-tap.

5. **Consolidate the cluster's duplicated primitives and fix the off-brand map.** Collapse the
   three `AvatarStack`s, two type-badge maps, and three date utilities into shared components
   (section C); geolocate the map and replace the hardcoded Mumbai center (`EventMapView.tsx:23`)
   and the off-token lime/pink popup & pin colors (`:52,63`) with accent `#F97316`. **Benefit:**
   visual consistency, smaller surface for shape-drift bugs, and a map that works outside Mumbai
   and looks on-brand.
