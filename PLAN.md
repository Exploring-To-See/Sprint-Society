# Sprint Society — Complete Master Plan (FINAL)

> **Goal:** Launch when it's genuinely impressive. No rush. Get it right.
> **Principle:** Every screen should make a user say "holy shit this is smart" — not "oh, another fitness app."
> **AI is THE STAR.** Not a chatbot. An ambient intelligence that wows.
> **Timeline:** Take our time. Launch when every screen feels premium.

---

## ALL DECISIONS CONFIRMED

| Decision | Answer |
|----------|--------|
| AI Coach branding | 4 named characters under "Kendu" (Can-Do) brand |
| AI personalities | Coach / Buddy / Scientist / Warrior archetypes |
| Kendu visibility | Subtle — AI embodies the vibe, but app isn't labeled "Kendu Entertainment" overtly |
| Home focus | 95% personal performance + subtle social ticker |
| Community creation | Manual approval (form → admin panel → Ishan approves) |
| 1000 user simulation | Both: backend reports + visual in-app demo (login as simulated user) |
| Events inspiration | Swiggy Scenes + Zomato District (full package: discovery, curation, FOMO, visual) |
| WhatsApp features | All: broadcasts, sub-groups/channels, familiar UX |
| Runner Card | Stats-focused: photo, level, tier, total km, best pace, streak, top badge |

---

## Tracking Legend

| Symbol | Meaning |
|--------|---------|
| [BUILT] | Exists in codebase |
| [IMPROVED] | Existed, was upgraded |
| [ADDED] | New addition during this plan |
| [REJECTED] | Considered and intentionally dropped |
| [AI-SUGGEST] | AI-generated improvement idea for future |

---

---

# SECTION 0: REGISTRATION & ONBOARDING

## Registration (Fast, No Friction)
1. **Simple form:** Name, phone, email, password, invite code
2. **Photo upload** — profile picture during registration
3. **Connect tracking app** — Strava / Apple Health / Google Fit (as a step, not optional afterthought)
4. **Auto-join Sprint Social Club** — mandatory community on onboard (everyone's in it)

## AI Profiling (The Real Experience — AFTER registration)
Separate from registration. This is where the magic happens.

**Flow:**
1. Connect tracking app pulls real data (if Strava connected, use that data)
2. Physical profile: age, sex, height, weight
3. Running background: experience level, injuries, recent race times, weekly km
4. Goals & personality: dream race, why they run, schedule preference, mindset
5. **DNA Reveal:** All data combined into a visual "Running DNA" with:
   - VO2max estimation
   - Pace zones (VDOT-based)
   - Personality tags
   - Strengths + focus areas
   - Assigned AI coach from the Kendu crew
   - Week 1 preview

**Key principle:** Real data > self-reported. If Strava has 6 months of runs, use THAT for classification, not "how many km do you run per week?"

---

---

# SECTION 1: HOME (Dashboard)

## Philosophy
Home = YOUR running world. Personal. Performance. Progress. No repetition from Events/Society tabs.

## What Goes Here
- [ ] **Run log (recent)** — last 3-5 runs with pace, distance, time. Tap to expand.
- [ ] **AI Scorecard** — your current "score" based on consistency, improvement, load balance
- [ ] **Level + XP progress** — current level, XP bar, estimated time to next level
- [ ] **Trends dashboard (TABS):**
  - Pace trend (weekly avg pace over time)
  - KM trend (weekly volume over time)
  - Consistency trend (days run per week over time)
  - [Research more: HR trend, elevation trend, effort trend, recovery trend]
- [ ] **Daily AI insight** — one personalized insight from YOUR data (not generic tips)
- [ ] **Adaptive greeting** — time + context aware ("Back from that 5K? Nice negative split.")
- [ ] **Streak visual** — animated streak counter that grows/evolves
- [ ] **Subtle social line** — single ticker: "Rahul just PR'd" / "3 friends ran today" (NOT a widget, just a line)
- [ ] **Tips section** — keep existing, improve with AI personalization

## What's REMOVED from Home
- ~~Upcoming events widget~~ → lives in Events tab only
- ~~Community activity widget~~ → lives in Society tab only
- ~~Leaderboard~~ → lives in Society/Events

## Layout & Polish
- Cards with depth (shadows, glass morphism)
- Stagger animations on load
- Pull-to-refresh
- Skeleton loaders matching content shape

---

---

# SECTION 2: EVENTS

## Philosophy
Discovery-first. Like Swiggy Scenes / Zomato District — curated, visual, FOMO-inducing. Not a boring list.

## Design Inspiration (Swiggy Scenes + Zomato District)
- **Discovery engine:** "Because you liked [X], try [Y]". Personalized recommendations.
- **Curation:** Featured events, staff picks, "Trending this week"
- **FOMO mechanics:** "Only 8 spots left" / "12 friends going" / countdown timers
- **Visual design:** Beautiful hero images/gradients, bold typography, urgency badges
- **Categories:** Runs / Social / Workshops / Challenges (designed from start, not "Coming Soon")

## Live Event Tracking (The Big Feature)
**Flow:**
1. Runner registers (RSVP)
2. Shows up IRL
3. Enters **organiser's live code** in app → "Checked in. Race starts in 5 min."
4. During run: activity tracked via Strava/GPS
5. **Live leaderboard — gamified map:**
   - Sleek route visualization
   - Animated runner figures (not dots) moving on map
   - Live ranks updating
   - Distance markers, pace indicators
6. **Event finishes:**
   - Auto-detect finish
   - Key insights: "Negative split by 22s/km. Textbook."
   - **Smart Awards:**
     - 1st/2nd/3rd: Gold/Silver/Bronze → auto-added to profile
     - Special: "Most Consistent Pace", "Biggest Negative Split", "Heart Rate Hero"
   - All achievements added to profile automatically
7. **Post-event share card** — shareable graphic (rank, time, key stat, event name)

## Event Card Design
- Hero image or gradient
- Date badge overlay
- Distance pill / category tag
- "X spots left" urgency
- Attendee avatars (people you follow) → tap to see Runner Card popup
- Weather forecast for event day
- Countdown ring (3 days → 1 day → "TODAY!")

## Activity Logs
- **Run log:** All runs synced from Strava (pace, distance, time, HR, route thumbnail)
- **Event participation log:** Events attended, result, rank, achievements earned
- **Expandable detail:** splits, HR graph, effort score, AI commentary

## Layout
- Swipeable cards for browse
- Filter chips: This Week / This Month / Near Me / By Category
- Featured section at top (curated/pinned)
- Past events archive (memories)
- Attendee list → clicking name shows Runner Card popup

---

---

# SECTION 3: SOCIETY (Communities)

## Philosophy
WhatsApp community model: broadcasts + sub-groups + familiar UX. Elevated with gamification and AI.

## Mandatory Sprint Social Club
- Auto-joined on registration (everyone's in)
- The "town square" — announcements, general chat, event shares
- Cannot leave (it's the main community)

## Community Creation (Admin-Approved ONLY)
- **NOT** Level 5+ auto-gate (CHANGED)
- User fills form: Community name, purpose, leader name, contact info
- Form goes to admin panel → Ishan manually approves/rejects
- Reason: ensures meaningful communities, no random trash
- **Community guidelines** framework (displayed to all, enforced by admin)

## Community Features (WhatsApp + Instagram Hybrid)

### Conversations (FB/IG Style)
- [ ] Threaded comments on posts (not flat list)
- [ ] Reply to specific comments
- [ ] Reactions (relevant emojis: 🏃‍♂️🔥💪👏)
- [ ] **Pin comments** — community creator can pin important comments
- [ ] **Polls** — create polls within community (multiple choice)
- [ ] **Attach images** — share photos in posts/comments
- [ ] Rich media posts (text + image + poll in one post)

### Broadcasts (WhatsApp-style)
- [ ] Admin/creator can broadcast to all members (one-way announcement)
- [ ] Push notification on broadcast (if user hasn't muted)
- [ ] Members can react but not reply to broadcasts

### Sub-groups/Channels
- [ ] Community can have topic channels: "Race Prep", "Nutrition", "Memes", "Gear"
- [ ] Members can join specific channels within a community
- [ ] Keeps main feed clean, topics organized

### Member Experience
- [ ] Members list: scrollable with runner level + interesting badges
- [ ] Don't show big "JOINED" logo — subtle confirmation only
- [ ] **Mute group option** — stop notifications without leaving
- [ ] Push notifications from community creator (unless muted)
- [ ] Share events from Events tab into community
- [ ] Vote/poll results visible to all
- [ ] Clicking member name → **Runner Card popup** (Pokemon card style)

### AI Layer
- [ ] Community "vibe" indicator (Competitive / Chill / Supportive / Grind Mode)
- [ ] Smart matching: "Based on your pace, you'd fit in [X]"
- [ ] Weekly digest: "This week: 12 runs, 2 PRs, 1 new member"
- [ ] Member spotlight: "Runner of the week" (auto-selected by AI)

---

---

# SECTION 4: TRAIN / AI

## Philosophy
AI is THE STAR. Not a chatbot. An ambient intelligence that wows. The gamified training path is the killer visual differentiator. Kendu crew are the personalities.

## THE KENDU AI CREW (4 Characters) — FINALIZED

Brand context: "Kendu" = "Can-Do" — a movement of self-motivation.

| Character | Inspired By | Archetype | Vibe | When they appear |
|-----------|------------|-----------|------|-----------------|
| **Kendu_Ishu** | Ishan (co-founder) | The Scientist | Techy, logical, scientific, data-driven. Optimizes everything. | Training analysis, data insights, optimization, explaining the "why" |
| **Kendu_Nainu** | Naina (co-founder) | The Energizer | Lively, fun, action-oriented. Female-specific body needs (cycle, physiology). | Getting out the door, celebrating, fun moments, women's health coaching |
| **Kendu_Goggins** | David Goggins | The Warrior | Discipline, mental toughness, no excuses, grind. | Feeling lazy? Skipping runs? Need tough love? This one shows up. |
| **Kendu_Kip** | Eliud Kipchoge | The Sage | Patience, pacing, recovery, longevity, race wisdom. 80% easy, 20% hard. | Recovery advice, race strategy, overtraining prevention, long-game thinking |

**Coverage:** Every runner type handled:
- Beginner → Nainu (fun) + Kip (patience)
- Data nerd → Ishu
- Lazy/skipping → Goggins
- Overtraining/injured → Kip
- Race day → Kip (pacing) + Ishu (data)
- Women-specific → Nainu
- Mental block → Goggins + Ishu

**How they work:**
- User assigned primary coach during AI Profiling (personality match)
- Can switch anytime in settings
- Coach personality flavors ALL copy (workout descriptions, insights, notifications)
- They don't talk from a chat box — they're woven into the experience
- Subtle Kendu branding: motivational, "can-do" energy throughout

## Gamified Training Path (THE Differentiator)

**Concept:** Visual game-like path showing your training journey. Winding road through landscapes. Each node = a workout/milestone. Animated. Alive. Premium.

- [ ] **Path visualization** — SVG/Canvas animated path with nodes
- [ ] **Terrain biomes** based on training phase:
  - Base building = green hills
  - Speed work = electric/neon city
  - Race prep = mountain summit
  - Recovery = calm water/zen garden
- [ ] **Current position marker** — animated runner avatar
- [ ] **Next workout node** — tap to see what's coming + why
- [ ] **Milestone celebrations** — path lights up, particles fly
- [ ] **Weekly overview** — zoomed-out this week's segment
- [ ] **"What if" projection** — where you'll be in 4/8/12 weeks
- [ ] **Progress ghost** — faded version of you from 4 weeks ago

## Trends Dashboard (Tabs near existing pace view)
- [ ] **Pace trend** — weekly/monthly average over time
- [ ] **KM trend** — weekly volume
- [ ] **Consistency trend** — days run per week / adherence %
- [ ] **[Research more:]** HR trend, elevation, effort score, recovery, VO2max estimate

## AI Intelligence Layer (The Wow)
- [ ] Pattern recognition: "You PR after rest days."
- [ ] Injury risk: warning if load spike
- [ ] Optimal run time: "Best runs at 6:30am."
- [ ] Race predictor: "Predicted 10K: 48:12"
- [ ] Effort prediction before run
- [ ] Real-time plan adaptation (path reroutes on missed run)
- [ ] "Why this workout" science explainer
- [ ] Coach contextual pop-in

## What AI is NOT
- ~~A chatbot~~ (chat is secondary)
- ~~Generic tips~~ (always YOUR data)
- ~~Labeled "AI"~~ (no "Powered by AI" badges)

---

---

# SECTION 5: PROFILE

## Philosophy
Your identity as a runner. Data-driven. Progressively enriched by AI.

## Profile Sections
- [ ] **Header:** Large avatar (photo), name, city, member since, tier badge
- [ ] **Running DNA card** — visual identity from AI profiling. Shareable.
- [ ] **Stats:** Total KM, avg pace, elevation, consistency %, longest streak, level
- [ ] **Records:** PR board with trend arrows
- [ ] **Journey:** Training path progress (visual mini-map)
- [ ] **Achievements:** Trophy showcase (curated favorites)
- [ ] **Communities:** Groups they're in
- [ ] **"Update AI" section** — progressive profiling. Update goals/injuries/race times anytime. AI re-calibrates.
- [ ] **Settings:** Account, Strava, notifications, subscription, coach selection

## Runner Card Popup (Pokemon Card Style)
Appears when clicking any runner's name anywhere in the app:
- **Quick popup** (not full page)
- Shows: Photo + Level + Tier + Total KM + Best Pace + Streak + Top Badge
- Styled like collectible card (gradient background matching tier)
- Gamification: people want impressive cards → motivates running
- "View Full Profile" button to navigate to full page

---

---

# SECTION 6: 1000 USER SIMULATION

## Purpose
Validate AI engine at scale. See how the app feels for different user types.

## Simulation Spec
- 1000 profiles: age 18-65, varied experience, different cities
- 1 year simulated run data per user
- Different patterns: 5x/week, 2x/week, sporadic, injured, returning
- Different goals: weight loss, 5K time, marathon, social, fun

## What We Validate
- AI classification distribution (Beginner/Intermediate/Advanced/Pro)
- Training plan variety (personalized or cookie-cutter?)
- Coach assignment balance
- Insight quality per user
- Leveling rates
- Edge cases (zero runs, one run, long gaps)

## Output
- **Backend reports:** distribution charts, sample outputs, edge case analysis
- **In-app demo:** login as any simulated user, see full experience

---

---

# CROSS-CUTTING

## Runner Card Component (Reusable everywhere)
- Used in: event attendees, community members, leaderboard, search
- Pokemon card style, stats-focused
- Tier determines gradient/color scheme

## Motion & Animation
- Framer Motion page transitions
- Stagger card animations
- Celebrations (confetti, particles, glow)
- Scroll-triggered reveals
- Micro-interactions

## Visual Identity (TODO with Ishan)
- Color system
- Typography scale
- Card system (radius, padding, shadows)
- Icon set
- Dark mode (designed, not inverted)
- Kendu brand colors subtle

---

---

# V2 FEATURES (After 5 Real Runs)

## Run to Earn (Brand Collaboration)
- Brand funds earn pool → runners earn based on performance → redeemed as partner points/coupons
- Example: Kendu Entertainment x Decathlon
- Leverage CSR budgets
- Prerequisites: 5 real runs, brand conversations, legal framework, fair distribution algorithm

---

---

# EXECUTION APPROACH

## Process (Per Section)
1. **Research** — competitors/references
2. **Design** — mockups / layout descriptions
3. **Show Ishan** — present, ask questions
4. **Approve** — confirm or redirect
5. **Build** — implement
6. **Test** — simulate, check flows
7. **Polish** — animations, edge cases

## Priority Order
1. Registration & Onboarding (foundation)
2. Home (first thing users see daily)
3. Train/AI (the star — differentiator)
4. Events (social hook — brings people IRL)
5. Society (retention — keeps them coming back)
6. Profile (identity — makes them invested)
7. 1000 user simulation (validation)
8. Polish pass (animations, consistency)

---

---

# STILL NEEDS ISHAN'S INPUT

1. ~~AI Crew names~~ ✅ DONE — Kendu_Ishu, Kendu_Nainu, Kendu_Goggins, Kendu_Kip
2. **Color system** — brand colors for Sprint Society
3. **Visual references** — apps/designs you love the look of
4. **Invite code format** — "SPRINT-XXXXX" / "KENDU-XXXXX" / other?
5. **Sprint Social Club** — default pinned post / welcome content

---

# DECISION LOG

| Decision | Reason | Date |
|----------|--------|------|
| Free for first 50 | Build community + get feedback before monetizing | 2026-05-22 |
| No DMs in v1 | Community chat covers social need | 2026-05-22 |
| Admin-only events | Quality control for early community | 2026-05-22 |
| Path > List for training | Visual wow factor, gamification, retention | 2026-05-22 |
| AI ambient, not chatbot | Chatbots feel generic. Contextual intelligence = premium. | 2026-05-22 |
| Live event tracking + code check-in | Makes events worth attending through the app | 2026-05-22 |
| Smart awards top 3 + special | Auto-achievement on profile = retention | 2026-05-22 |
| Run to Earn = v2 | Need 5 real runs data first | 2026-05-22 |
| Community = manual approval | Meaningful communities, not random trash | 2026-05-22 |
| Home = personal focus | No repetition from other tabs | 2026-05-22 |
| Kendu AI subtle branding | Benefit the brand without making it feel corporate | 2026-05-22 |
| Take our time | Launch when impressive, not half-baked | 2026-05-22 |

---

*This document is the source of truth. Code serves the plan. Not the other way around.*
