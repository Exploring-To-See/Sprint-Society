# Sprint Society — Product Strategy (CPE Audit v1)

## The Thesis
**If Sprint Society users improve 2x faster than any other app's users, the product sells itself.**

Everything else — UI, social, gamification — is in service of this one truth: **make people undeniably faster/fitter, and they'll never leave.**

---

## Critical Strategic Decisions

### 1. No LLM Dependency (Cost = ₹0 per user)
- All coaching intelligence runs as **custom algorithms on our server**
- Complex decision trees built from sports science research
- Scales to 1M users without API costs
- Claude API introduced LATER as premium chat feature (₹49/mo tier, 10K+ users)
- This is how COROS, Garmin, TrainingPeaks all work — algorithms, not LLMs

### 2. Multi-Source Data (Never depend on Strava alone)
- Build GPS tracking into the app itself (independence)
- Apple Health / Google Fit as primary health data source
- Strava as a bonus sync, not a requirement
- Manual entry fallback for users without any wearable
- Weather API for condition-aware planning

### 3. The Algorithm IS the Moat
- If our periodization engine produces 2x faster improvement than competitors, nothing else matters
- This requires: world-class sports science implementation + continuous calibration from user results
- Every user's improvement data feeds back to improve the model for everyone (federated learning)

---

## North Star: Show Undeniable Progress

### Daily Hook (3 reasons to open every day)
1. **Morning**: Readiness score (Green/Yellow/Red) — 2 seconds to check
2. **Day**: Micro-challenge (even on rest days: stretch, hydrate, breathwork)
3. **Evening**: Social feed (what your club members ran today)

### Anti-Churn Strategy
- **Weekly**: "You were HERE → now you're HERE" visualization
- **Monthly**: Pace improvement chart, distance growth, streak celebration
- **The metric users see**: their pace improving week over week. Undeniable.

---

## Onboarding Strategy (Cold Start Solution)

### Flow:
1. **Signup** (name, email, password) — 30 seconds
2. **Connect Strava** (if they have history → instant AI calibration)
3. **Smart profiling** (10 questions adapted to their level) — 2 minutes
4. **If new runner**: Gamified 7-day onboarding journey (micro-challenges, unlock progressively)
5. **If existing runner**: Immediate personalized plan from Strava history
6. **Progressive profiling**: 2-3 micro-questions per week for 3 weeks (sleep, nutrition, schedule)

---

## Build Priority (What Ships When)

### Month 1: Core Loop (Prove the Algorithm Works)
- [ ] Periodized training plan generator (custom algorithm, no LLM)
- [ ] Adaptive daily adjustment (based on completed runs vs plan)
- [ ] Readiness score (simple: based on volume + rest days)
- [ ] Progress visualization (pace trend + improvement %)
- [ ] Deep onboarding flow (Strava import OR assessment runs)
- [ ] GPS tracking built into app (Strava independence)

### Month 2: Retention + Social
- [ ] Streak system with rest-day micro-challenges
- [ ] Weekly progress visualization ("you vs last week")
- [ ] Leaderboard (Sprint Society members)
- [ ] Club challenge system (admin-created)
- [ ] Injury prediction (load monitoring)
- [ ] Race planning (pick a race → get a plan)

### Month 3: Depth + Polish
- [ ] Nutrition coaching (user-controlled depth)
- [ ] Recovery engine (sleep + active rest)
- [ ] Multiple coach personas (algorithm-driven, not LLM)
- [ ] Sharing suite (Instagram cards, transformation views)
- [ ] Payments integration (Razorpay, ₹9/mo)
- [ ] Apple Health / Google Fit integration

### Month 4+: Scale
- [ ] Federated learning (collective intelligence)
- [ ] Audio coaching during runs
- [ ] Race-day live coaching
- [ ] Claude API chat (premium feature)
- [ ] Global percentile rankings
- [ ] B2B features (white-label for other clubs)

---

## Loopholes Fixed

| Original Problem | Fix |
|-----------------|-----|
| Claude API costs ₹2-5/call vs ₹9/mo pricing | Custom algorithms, zero API cost. LLM is future premium. |
| Strava dependency | Built-in GPS + Apple Health + manual entry from day 1 |
| Cold start (no data for new users) | Strava import OR smart profiling + gamified assessment week |
| No retention architecture | Triple daily hook + weekly progress viz + social feed |
| Scope creep (4 phases, years of work) | Month-by-month priorities. Ship core loop first. |
| No moat against copycats | The algorithm's effectiveness IS the moat. Better results = unforkable. |

---

## Acquisition Signals (What Makes Companies Want to Buy You)

1. **Provable user improvement** — "Our users improve pace 47% faster than NRC users"
2. **Retention** — DAU/MAU ratio above 40% (industry average is 15-20%)
3. **Indian market ownership** — dominant position in a growing market
4. **Proprietary algorithm** — IP that can't be replicated without the data
5. **Community network effects** — value increases with each new user
6. **Revenue per user trending up** — ₹9 → ₹19 → ₹49 path is clear

---

## What I'd Change in the Architecture Doc

1. ~~Claude API as primary coaching~~ → Custom algorithm engine (zero cost)
2. ~~LLM for daily plans~~ → Decision tree + sports science rules
3. Add: **Built-in GPS tracking** (critical for Strava independence)
4. Add: **Readiness score** as the daily hook
5. Add: **Weekly improvement visualization** as the retention anchor
6. Add: **Payment system (Razorpay)** in Month 3
7. Clarify: Coach personas are **algorithm-driven** (different decision weights), not LLM personalities

---

## My Recommendation as CPE

**Ship Month 1 scope in 30 days.** The training plan generator that actually makes people faster — that's the whole bet. Everything else is decoration until the core algorithm proves it works.

Get 50 real runners using it. Measure their improvement over 8 weeks. If they're getting faster, you have product-market fit. If not, no amount of social features or gamification saves it.

**The algorithm is everything.**
