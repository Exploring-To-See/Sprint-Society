# Sprint Society — AI Coaching Architecture

## Core Differentiators
1. **AI that provably makes you faster** — show the data, promise results
2. **Most personalized coaching on earth** — no two users get the same plan
3. **Community-first with AI backbone** — belonging + accountability + intelligence

---

## System Overview

```
┌─────────────────────────────────────────────────┐
│               SPRINT SOCIETY AI                   │
├─────────────────────────────────────────────────┤
│                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Training │  │ Recovery │  │ Nutrition │      │
│  │ Engine   │  │ Engine   │  │ Engine    │      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       │              │              │            │
│  ┌────▼──────────────▼──────────────▼────┐      │
│  │        Personalization Layer           │      │
│  │  (adapts everything to individual)    │      │
│  └────────────────┬──────────────────────┘      │
│                   │                              │
│  ┌────────────────▼──────────────────────┐      │
│  │      LLM Coaching Layer (Claude)      │      │
│  │  (conversational, explanations, chat) │      │
│  └────────────────┬──────────────────────┘      │
│                   │                              │
│  ┌────────────────▼──────────────────────┐      │
│  │       Data Ingestion Layer            │      │
│  │  (Strava, Apple Health, Garmin,       │      │
│  │   Weather, any wearable via API)      │      │
│  └───────────────────────────────────────┘      │
│                                                   │
└─────────────────────────────────────────────────┘
```

---

## AI Modules

### 1. Training Engine
- **Periodization**: Full macrocycle planning (Base → Build → Peak → Taper)
- **Race planning**: Reverse-engineer from race day. Any race worldwide.
- **Race prediction**: Predict finish time based on training. Updates weekly.
- **Race-day live coaching**: Real-time pace guidance, split targets
- **Distances**: 100m sprint to ultramarathon + trail running
- **Effort prescription**: Adaptive — HR zones if available, pace-based if not, RPE as fallback
- **Progressive overload**: 10% rule, deload weeks, supercompensation
- **Life-aware**: Handles "I'm sick", "travelling", "busy week" — restructures plan
- **Proactive**: Notices patterns and adjusts before user asks

### 2. Recovery Engine
- **Sleep optimization**: Sleep schedules, nap recommendations, circadian alignment
- **Recovery scoring**: Daily readiness (Green/Yellow/Red) from HRV + sleep
- **Active recovery**: Prescribes recovery runs, foam rolling, mobility
- **Injury prediction**: Analyzes load/fatigue patterns, warns before injury
- **Recovery protocols**: Ice baths, compression, stretching sequences
- **Deload automation**: Automatically inserts recovery weeks when fatigue accumulates

### 3. Nutrition Engine
- **User-controlled depth**: User selects their service level (minimal → full meal plans)
- **Coach personas for nutrition**: Different styles (strict, flexible, intuitive)
- **Full meal planning**: Based on training load, macro targets, preferences
- **Pre/post run fueling**: What to eat before/after each workout type
- **Race fueling strategy**: Gel timing, hydration plan, electrolytes
- **Hydration tracking**: Daily targets adjusted by weather + training load
- **Integration**: Syncs with MyFitnessPal and similar apps
- **Adaptive**: Suggests more services over time if user isn't opted in

### 4. Mental Performance Engine
- **Coach personas**: The Scientist, The Motivator, The Zen Master, The Sergeant
- **Breathwork (integrated into runs)**: Cues during running — "3 steps in, 2 out"
- **Visualization**: Pre-race visualization exercises
- **Dealing with the wall**: Mental strategies for when running gets hard
- **Mindfulness runs**: Guided runs focused on presence, not pace
- **Habit psychology**: Streak mechanics, commitment devices, identity reinforcement
- **Flow state training**: How to enter and maintain flow during runs

### 5. Beginner System (Gamified Journey)
- **First month = game**: Unlock new workout types progressively
- **Daily micro-lessons**: 30-second education ("Why rest days matter")
- **Badges for consistency**: Not just performance — showing up matters
- **Walk-run progression**: Gentle, data-driven couch-to-5K alternative
- **No assumptions**: AI watches first 3 runs, builds plan from actual ability

---

## Personalization Layer

### Progressive Profiling (never overwhelming)
- **Day 1**: Name, email, age, gender, height, weight, fitness level (5 questions)
- **Week 1**: 2-3 micro-questions daily (sleep quality, available days, goals)
- **Week 2**: Running history, injury details, preferred time of day
- **Week 3**: Nutrition preferences, stress patterns, equipment access
- **Ongoing**: AI infers from behavior — if you always skip Wednesdays, it adapts

### Data Sources (API-first architecture)
- Strava (primary running data)
- Apple Health / Google Fit (sleep, HR, HRV, steps)
- Garmin Connect
- WHOOP
- Oura Ring
- Weather APIs (training conditions)
- Nutrition apps (MyFitnessPal)
- Period tracking (cycle-based training for female athletes)
- Generic health API for any future wearable

### Real-time Adaptation
- Auto-adjusts daily plan based on: sleep quality, HRV, yesterday's RPE, weather
- User can override: "I want to run anyway" — AI respects autonomy
- Proactive suggestions: notices patterns before user does

---

## Conversational AI Coach (LLM Layer)

### Architecture
- **Claude API** for natural language coaching
- **Sports science guardrails**: Hard rules that LLM cannot violate
  - Never exceed 10% weekly volume increase
  - Always prescribe rest after 3 hard days
  - Never recommend running through sharp pain
  - Follow periodization structure
- **Context window**: Full user history, current plan, recent data fed to Claude
- **Limited to coaching**: Won't answer non-running questions

### Example Interactions
```
User: "My knee feels tight after yesterday's run"
AI: "That's common after tempo work. Don't run today. Here's a 10-min
     quad/IT band mobility routine. If it persists beyond 48 hours, 
     we'll reduce your volume next week."

User: "Can I do my long run tomorrow instead of Sunday?"
AI: "Yes, but you had intervals yesterday. I'd move it to Monday for 
     48h recovery. Want me to swap your schedule?"
```

---

## Social & Community

### Leaderboards
- Weekly / Monthly / Yearly
- Within Sprint Society members
- Global percentile ranking (vs all runners worldwide by age/gender)
- Separate boards: Distance, Consistency, XP, Pace improvement

### Club Features (admin-initiated)
- Group challenges (admin creates, runners compete)
- Club run sessions
- Crew competitions
- Running buddy matching (by pace + location)

### Sharing Suite
- Instagram-ready run cards (auto-generated, branded)
- Training plan shares
- Before/after transformations (pace over time)
- Race prediction shares ("Sprint Society thinks I'll finish in 1:42:30")
- Short video clips (route animation, pace graph)

---

## Federated Learning (Collective Intelligence)

- Anonymized patterns from all users improve predictions
- "Runners with your profile who did X improved by Y"
- Injury risk models trained on collective overtraining patterns
- Race predictions calibrated against actual results across users
- Users contribute by default (opt-out available)

---

## Content Library + Custom Generation

### Static Library
- Exercise database (strength, mobility, stretching) with descriptions
- Nutrition guides by training phase
- Mental performance exercises
- Race preparation checklists

### AI-Generated Content
- Daily workouts generated fresh for each user
- Nutrition suggestions based on today's training
- Recovery protocols based on current fatigue
- Educational micro-lessons timed to relevance

---

## Progress Visualization

### Three Views (user picks preference)
1. **Data view**: Charts, pace trends, volume graphs, PR tracking
2. **Journey view**: Visual path with avatar, milestones, mountains to climb, badges
3. **Transformation view**: Before/after comparisons, dramatic improvement visualization

---

## Smart Notifications

### Context-aware triggers
- "Your HRV shows full recovery — great day for intervals"
- "Rain at 5pm, run now if you can"
- "3 more runs to hit your weekly target"
- "You've been consistent for 14 days — incredible streak"
- "Tomorrow's long run: here's your fueling prep"

---

## Pricing
- ₹9/month (launch to 1000 users)
- ₹19/month (1000-10K users)
- ₹49/month (10K+ users)
- Simple subscription — everything included, no tiers

---

## Technical Stack
- **AI**: Claude API (coaching conversations) + custom algorithms (sports science)
- **Backend**: Express + TypeScript + SQLite → migrate to PostgreSQL at scale
- **Frontend**: React + Vite + TailwindCSS + Framer Motion
- **Data**: API-first architecture for any wearable/health source
- **Deployment**: Railway → AWS/GCP when scaling
- **Payments**: Razorpay (India-first)

---

## Build Phases

### Phase 1 (Current — v1.0) ✅
- Basic tier classification, pace zones, challenges, XP
- Registration, Strava sync, dashboard

### Phase 2 (v2.0 — AI Coach)
- Claude-powered conversational coaching
- Full periodized training plans
- Race planning + prediction
- Progressive profiling (micro-questions)
- Injury prediction + recovery prescription
- Smart notifications

### Phase 3 (v3.0 — Full Platform)
- Nutrition engine with personas
- Mental performance + breathwork
- Full social platform (leaderboard, challenges, buddy matching)
- Content library + video
- Federated learning
- Sharing suite (cards, videos, transformations)

### Phase 4 (v4.0 — Scale)
- Audio coaching during runs
- Multiple wearable integrations
- Race-day live coaching
- B2B (white-label for other clubs)
- Global percentile rankings
