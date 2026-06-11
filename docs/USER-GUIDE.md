# Sprint Society — User Guide

## What is Sprint Society?

Sprint Society is an AI-powered run club app that tracks your runs, coaches your pace, and gamifies your fitness journey. Connect your Strava, get personalized training zones, complete weekly challenges, and level up.

---

## Getting Started

### 1. Create Your Account

**Option A: Sign in with Google (Recommended)**
- Tap **Continue with Google** on the home screen
- Select your Google account — done in 2 seconds
- New users are taken to AI Profiling automatically

**Option B: Sign up with Email**
- Tap **Join with Email**
- Enter your name, phone, email, and password
- Add a profile photo (optional)
- Fill in your profile:
  - Gender, age, height, weight
  - Current activity level (sedentary → very active)
  - Running experience (brand new → competitive)
  - Any injury history (optional)

### 2. Connect Strava

- Go to your **Profile** tab (👤)
- Tap **Connect Strava**
- Authorize Sprint Society to read your activities
- Your runs sync automatically from now on

### 3. Start Running

That's it. Go run. Your data flows in from Strava and the app does the rest.

---

## App Sections

### ⚡ Dashboard (Home)

Your daily hub, prioritized for action:

- **Readiness + Today's Session** — what to do right now (with streak urgency: "Don't break your 7-day streak")
- **Coach Says** — one-liner daily recommendation based on recovery
- **Friends Running Today** — see which friends are active with escalating streak badges (🔥 3d, ⚡ 14d, 🌟 30d)
- **Streak Visual** — weekly streak bar with escalating fire/lightning/star badges
- **Level & XP** — your current level and progress to the next one
- **Daily Insight** — AI-generated tip based on your data
- **AI Score** — composite score (consistency + improvement + load balance)
- **Pace Trend** — 12-week chart showing your pace over time
- **Weekly Challenges** — tap to complete, earn XP
- **Quick Stats** — total runs, distance, best pace

### 🏘️ Communities

Join or create run clubs:

- **Feed** — community posts with likes and comments
- **Chat** — real-time messaging with other members (WebSocket-powered, typing indicators)
- **Leaderboard** — weekly ranking of members by distance (with medals for top 3)
- **Weekly Digest** — auto-generated summary: active members, total runs, km, top runner
- **Members** — see who's in the community with roles
- **Info** — community description and settings

### 📅 Events

- **List View** — filter by type (All, Runs, Social, Health)
- **Map View** — toggle to see events on an interactive map with pins
- **Social Proof** — see which friends are going (friend avatars on cards)
- **Nearby** — discover events within your area
- **Recaps** — completed events show leaderboard with who ran fastest

### 🤖 AI Coach

Your AI coach now shows **contextual suggestions** based on your state:
- Days since last run → "3 days since your run — need a comeback plan?"
- Event tomorrow → "Want a pre-event checklist?"
- Streak fire → "7-day streak! Should I adjust targets?"
- Post-run → "How was today's run? Let me analyze it"

Green dot on chat button when coach has a proactive suggestion for you.

### 📈 Progress

Two views:
- **Stats** — before/after pace comparison, weekly pace chart, personal records, improvement velocity
- **Journey** — visual timeline of all your milestones (first run, tier promotions, distance milestones, badge unlocks)

### 🎯 Coaching

Your AI running coach. Shows:

- **Your Tier** — Beginner, Intermediate, or Advanced (recalculated from your data)
- **Score Breakdown** — age-graded %, VO2max estimate, distance score, consistency
- **Pace Zones** — your personalized training zones:
  - Easy (recovery runs)
  - Tempo (sustained effort)
  - Interval (speed work)
  - Race (competition pace)
- **Transformation Journey** — week-by-week plan showing how to reach the next tier, with specific targets and tips

### 🏃 Run History

All your synced runs in one place:

- Date, distance, duration, pace, elevation
- Scroll through your full history
- If empty → connect Strava to import runs

### 📸 Share

Create viral shareable run cards with 5 templates:

1. Pick a run from your recent activity
2. Choose a template:
   - **Dark Minimal** — clean dark theme with green accents
   - **Gradient Pace** — vibrant gradient highlighting your pace
   - **Achievement** — trophy-focused celebration card
   - **Streak Fire** — shows your streak prominently with fire/star badges
   - **Race Recap** — detailed stat breakdown in blue tones
3. All templates are Instagram Story format (9:16, 1080x1920)
4. Shows: distance, time, pace, streak badge, tier badge
5. Tap **Download** to save as PNG
6. Tap **Share** to send directly to WhatsApp/Instagram

### 👤 Profile

- Your stats at a glance: level, XP, streak
- Strava connection status + manual sync button
- **Achievements** — badges you've earned and ones still locked
- Logout

### 🤖 AI Coach (Pro/Premium)

Your personal AI running coach that learns about you over time:

- **Chat** — Ask anything about training, nutrition, recovery, race prep
  - Coach references your actual data (pace, runs, tier, streak)
  - Personalized advice — never generic
  - 30 messages/day on Pro, unlimited context memory
- **AI Profile** — View what your coach knows about you:
  - Health notes (injuries, conditions you've mentioned)
  - Goals (races, targets you're working toward)
  - Personal context (schedule, preferences, diet)
  - Edit any field to correct or add info
- **Training Evaluation** — After each run sync, the AI analyzes:
  - Readiness score (0-100)
  - Risk flags (overtraining, injury warning)
  - Plan adjustments (suggested changes)
- **Usage** — Track how many messages you've used today

---

## Weekly Challenges

Every week you get fresh challenges across 7 categories:

| Category | Examples |
|----------|----------|
| 💪 Bodyweight | Planks, squats, lunges |
| 🥗 Nutrition | Protein goals, meal prep |
| 💧 Hydration | Water intake targets |
| 🎯 Technique | Cadence drills, posture |
| 👟 Gear | Shoe rotation, reflective gear |
| 🌬️ Breathing | Patterns, meditation |
| 🏃 Running | Tempo runs, distance goals |

Tap the circle next to a challenge to mark it complete and earn XP instantly.

Challenge difficulty and XP rewards scale with your tier:
- Beginner: 30–50 XP per challenge
- Intermediate: 45–65 XP
- Advanced: 65–90 XP

---

## XP & Leveling

- Earn XP from: completing runs, finishing challenges, unlocking achievements
- Each level requires more XP than the last (exponential curve)
- Your level is displayed on your dashboard and profile
- Compete on the **Leaderboard** (top 50 runners by XP)

---

## Tier System

Your tier reflects your actual running ability:

| Tier | Level Range | What It Means |
|------|-------------|---------------|
| Beginner | B1–B10 | Building your base |
| Intermediate | I1–I10 | Solid runner, consistent |
| Advanced | A1–A10 | Competitive, high fitness |
| Pro | P1–P10 | Elite-level (unlocks at A5+) |

Score is calculated from 6 factors:
- Performance — race/training times (40%)
- Volume — weekly distance (15%)
- Consistency — active weeks (15%)
- Recovery/Readiness — rest, HRV, sleep (15%)
- VO2max estimate (10%)
- Pace Compliance — training to zones (5%)

### Classification Status

Your classification has one of three statuses:

- **Calibrating** — first 3 weeks on the platform. Your level is preliminary and capped at I5 while we gather enough data.
- **Provisional** — based on training data only. Accurate but unverified.
- **Validated** — backed by a verified race result. This is the gold standard.

Your tier updates automatically as you improve. Advancement requires 3 consecutive weeks at the next level, passing safety checks, and adequate recovery.

---

## Strava Sync

- **Auto-sync**: New runs import automatically via webhook (within minutes of finishing)
- **Manual sync**: Tap the sync button on your Profile to pull recent activities
- Only running activities are imported (no cycling, swimming, etc.)

---

## Shareable Run Cards

Perfect for Instagram stories:
- Portrait format, designed for mobile sharing
- Shows your key stats + Sprint Society branding
- Download as PNG or share directly to any app

---

## FAQ

**Q: Do I need a Strava account?**
A: No — you can track runs directly using the built-in GPS Run Tracker. Strava sync is optional and auto-imports your runs if connected.

**Q: Can I add runs manually?**
A: Use the GPS Run Tracker (tap the orange Run button in the bottom nav) to record runs with live pace, distance, splits, and elevation. Runs can also be auto-synced from Strava.

**Q: How often does my tier update?**
A: Every time you visit the Coaching tab. It recalculates from your latest data.

**Q: Why is my streak at 0?**
A: Streaks count consecutive active days. If you haven't synced a run recently, it resets.

**Q: Can I change my profile info after signup?**
A: Yes — go to Profile and update your details. Your pace zones and tier will recalculate.

**Q: How do weekly challenges reset?**
A: New challenges generate every Monday. Uncompleted challenges from last week disappear.

**Q: Is my data private?**
A: Yes. Only you can see your runs and stats. The leaderboard shows names and XP only.

**Q: What happens if I disconnect Strava?**
A: Your existing synced runs stay in the app, but no new runs will import until you reconnect.

**Q: How is my VO2max estimated?**
A: From your recent running pace, distance, and age — using standard exercise physiology formulas.

**Q: Can I use this without a running watch?**
A: Yes — use the built-in GPS Run Tracker on your phone. No external device needed.

---

## Tips for Getting the Most Out of Sprint Society

1. **Run consistently** — even short runs count toward streaks and consistency score
2. **Complete challenges** — easy XP and they push you to be a better all-round athlete
3. **Check your pace zones** — run most of your km at Easy pace, save hard efforts for intervals
4. **Follow your transformation plan** — it's designed to get you to the next tier safely
5. **Share your cards** — flex on your friends, keep yourself accountable
