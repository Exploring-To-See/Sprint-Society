# Sprint Society — Runner Classification System (Research Report)

## Executive Summary

The current system is too simple: 3 buckets (beginner/intermediate/advanced) based solely on estimated VO2max. This doesn't reflect real running progression, which is a multi-year journey with measurable checkpoints.

**Proposed system: 4 Tiers x 10 Levels = 40-point scale**

| Tier | Levels | Who | Timeline to Next Tier |
|------|--------|-----|----------------------|
| Beginner | 1-10 | Never run → can run 5K continuously | 2-6 months |
| Intermediate | 1-10 | Regular runner → competitive club runner | 6-24 months |
| Advanced | 1-10 | Club competitive → sub-elite performance | 2-5 years |
| Pro | 1-10 | Sub-elite → international/world class | 5-15+ years |

**Pro 10 = Kipchoge-level.** Most humans will never reach it. That's the point — it's a realistic quest.

---

## Classification Factors (Multi-Dimensional Score)

Unlike simple VO2max-only systems, Sprint Society uses a **composite score** from 6 measurable factors:

### 1. Performance (40% weight)
Actual race times or equivalent time-trial performances. Most objective measure.

| Level | Male 5K | Female 5K | Male Marathon | Female Marathon |
|-------|---------|-----------|--------------|----------------|
| B1 | Can't run 1km | Can't run 1km | N/A | N/A |
| B5 | 35:00 | 40:00 | N/A | N/A |
| B10 | 28:00 | 32:00 | 5:00:00 | 5:30:00 |
| I1 | 27:00 | 31:00 | 4:45:00 | 5:15:00 |
| I5 | 23:00 | 27:00 | 4:00:00 | 4:30:00 |
| I10 | 20:00 | 23:30 | 3:30:00 | 4:00:00 |
| A1 | 19:30 | 23:00 | 3:20:00 | 3:50:00 |
| A5 | 17:30 | 20:30 | 3:00:00 | 3:25:00 |
| A10 | 15:30 | 18:00 | 2:40:00 | 3:00:00 |
| P1 | 15:00 | 17:30 | 2:35:00 | 2:55:00 |
| P5 | 14:00 | 16:30 | 2:25:00 | 2:45:00 |
| P10 | 13:00 | 15:00 | 2:05:00 | 2:20:00 |

*Based on Jack Daniels VDOT tables + World Athletics age-grading percentages*

### 2. VO2max / VDOT (20% weight)
Estimated from race performance or direct testing.

| Level | VO2max (Male) | VO2max (Female) | VDOT Equivalent |
|-------|---------------|-----------------|-----------------|
| B1 | <30 | <25 | <25 |
| B5 | 30-35 | 25-30 | 25-30 |
| B10 | 35-40 | 30-35 | 30-37 |
| I1 | 40-42 | 35-37 | 37-40 |
| I5 | 42-48 | 37-43 | 40-48 |
| I10 | 48-52 | 43-47 | 48-52 |
| A1 | 52-55 | 47-50 | 52-55 |
| A5 | 55-60 | 50-55 | 55-60 |
| A10 | 60-65 | 55-60 | 60-65 |
| P1 | 65-68 | 60-63 | 65-68 |
| P5 | 68-73 | 63-67 | 68-73 |
| P10 | 75+ | 68+ | 75+ |

### 3. Training Volume (15% weight)
Weekly km consistently maintained. Volume = aerobic engine size.

| Level | Weekly KM | Sessions/Week |
|-------|-----------|---------------|
| B1-B3 | 0-10 | 1-2 |
| B4-B7 | 10-20 | 2-3 |
| B8-B10 | 20-30 | 3-4 |
| I1-I5 | 30-50 | 4-5 |
| I6-I10 | 50-70 | 5-6 |
| A1-A5 | 70-100 | 6-7 |
| A6-A10 | 100-130 | 7-10 |
| P1-P5 | 130-160 | 10-12 |
| P6-P10 | 160-220+ | 12-14 (doubles) |

### 4. Consistency (15% weight)
How many weeks per year the runner trains without interruption.

| Level | Weeks/Year Active | Training Age (Years) |
|-------|-------------------|---------------------|
| B1-B5 | <20 | 0-0.5 |
| B6-B10 | 20-35 | 0.5-1 |
| I1-I5 | 35-42 | 1-2 |
| I6-I10 | 42-48 | 2-4 |
| A1-A5 | 48-50 | 4-7 |
| A6-A10 | 50-52 | 7-10 |
| P1-P10 | 50-52 (year-round) | 10+ |

### 5. Lactate Threshold (5% weight)
Percentage of VO2max sustainable at threshold. Improves with training age.

| Level Range | LT as % of VO2max |
|-------------|-------------------|
| Beginner | 60-70% |
| Intermediate | 70-80% |
| Advanced | 80-87% |
| Pro | 87-92% |

### 6. Running Economy (5% weight)
Oxygen cost at a given speed. Mostly genetic + biomechanics + years of running.

Measured indirectly through: pace-to-HR ratio improvement over time.

---

## Level Advancement: How People Move Up

### The Formula

```
Level Score = (Performance × 0.40) + (VO2max × 0.20) + (Volume × 0.15) + (Consistency × 0.15) + (LT% × 0.05) + (Economy × 0.05)
```

Each factor scored 1-40 (matching the total scale), then weighted.

### Advancement Triggers

A runner advances a level when:
1. **Sustained performance** — hit the pace/time threshold for 3+ consecutive weeks (not a one-off good day)
2. **Volume milestone** — consistently hitting the weekly km for that level for 4+ weeks
3. **No regression** — hasn't dropped below current level's threshold in 2 weeks

### Realistic Timelines (Based on Training Science)

| Progression | Typical Duration | What Changes |
|-------------|-----------------|--------------|
| B1 → B5 | 4-8 weeks | Build habit. Run/walk → continuous running. |
| B5 → B10 | 8-16 weeks | Build base. Run 5K without stopping. Add frequency. |
| B10 → I1 | 2-4 months | First structured training. Add tempo runs. |
| I1 → I5 | 6-12 months | Introduce intervals. Race a 5K. Training cycles. |
| I5 → I10 | 12-24 months | Higher volume. Periodization. Multiple race distances. |
| I10 → A1 | 6-12 months | Serious training. 6+ days/week. Racing regularly. |
| A1 → A5 | 1-3 years | High volume. Altitude/heat training. Strength work. |
| A5 → A10 | 2-5 years | Peak training. Professional coaching. 100+ km/week. |
| A10 → P1 | 2-4 years | Sub-elite. National level. Training camps. |
| P1 → P5 | 3-5 years | Elite. International competition. Full-time runner. |
| P5 → P10 | 5-10+ years | World class. 99.99th percentile. Genetic + dedication. |

**Total journey B1 → P10: 15-25+ years of dedicated training.** This is realistic — Olympic marathoners typically train 10-15 years before peaking.

---

## Training Prescription by Level

### Beginner (1-10): Build the Habit

| Sub-level | Focus | Weekly Structure | Key Principle |
|-----------|-------|-----------------|---------------|
| B1-B3 | Habit formation | 2-3 run/walks, 15-30 min | "Just get out the door" |
| B4-B6 | Continuous running | 3 runs, 20-35 min all easy | "Run slow to run long" |
| B7-B9 | Base building | 3-4 runs, 30-45 min, 1 slightly longer | "Add 10% volume/week max" |
| B10 | Race ready | 4 runs, including first tempo effort | "You can now race a 5K" |

**Training split:** 100% easy pace. NO intervals. NO speed work. ONLY aerobic development.
**Coach personality at this level:** Encouraging, celebrating small wins, removing barriers.

### Intermediate (1-10): Build the Engine

| Sub-level | Focus | Weekly Structure | Key Principle |
|-----------|-------|-----------------|---------------|
| I1-I3 | Introduce structure | 4 runs: 3 easy + 1 tempo (20 min) | "Quality within quantity" |
| I4-I6 | Speed introduction | 4-5 runs: 3 easy + 1 tempo + 1 interval | "Your body adapts to stress" |
| I7-I9 | Volume + intensity | 5-6 runs: 3 easy + 1 long + 1 tempo + 1 interval | "Periodize in 4-week blocks" |
| I10 | Race specialization | 5-6 runs: structured by race distance | "Train specifically for your goal race" |

**Training split:** 80% easy, 10% tempo, 10% intervals (polarized model).
**Coach personality:** More technical. Explaining training zones. Introducing data.

### Advanced (1-10): Optimize Everything

| Sub-level | Focus | Weekly Structure | Key Principle |
|-----------|-------|-----------------|---------------|
| A1-A3 | High volume base | 6-7 runs, 70-90 km/week, doubles start | "Volume is the foundation of speed" |
| A4-A6 | Lactate threshold focus | 6-7 runs, threshold sessions 2x/week | "Push the ceiling higher" |
| A7-A9 | Peak specific training | 7+ runs, race-specific blocks, altitude | "Every session has a purpose" |
| A10 | Championship prep | 10+ sessions/week, tapering mastered | "Peak when it matters" |

**Training split:** 80% easy, 8% tempo, 8% VO2max, 4% race pace.
**Additional:** Strength training 2x/week, mobility, nutrition timing, sleep optimization.
**Coach personality:** Analytical. Data-heavy. Marginal gains focus.

### Pro (1-10): World-Class Performance

| Sub-level | Focus | Weekly Structure | Key Principle |
|-----------|-------|-----------------|---------------|
| P1-P3 | National level | 130-150 km/week, periodized blocks | "Recovery is as important as training" |
| P4-P6 | International level | 150-180 km/week, altitude camps | "Race selection is strategy" |
| P7-P9 | Sub-2:10 marathon | 180-200+ km/week, full-time | "Every 1% matters" |
| P10 | World record contender | 200+ km/week, bespoke everything | "No human is limited" |

**Training split:** Varies by coach/methodology. Typically 85% easy, 15% quality.
**Additional:** Full-time athlete. Team of physios, nutritionists, biomechanists, coaches.
**Coach personality:** Strategic partner. Race tactics. Peaking cycles. Competition intelligence.

---

## What Makes This Different From Competitors

| Feature | Strava | Nike Run Club | Garmin | Sprint Society |
|---------|--------|---------------|--------|---------------|
| Classification | None (just segments) | 4 levels (basic) | Training status only | 40-point composite scale |
| Multi-factor | No | No | Partial (load + recovery) | 6 factors weighted |
| Realistic timeline | No progression | No timeline | No | Months/years displayed |
| Sub-levels | No | No | No | 10 within each tier |
| What to improve | Not told | Generic plans | Vague suggestions | Specific next-level criteria shown |
| Training by level | Same for all | Same 4-week plans | Basic zones | Level-specific prescription |

---

## How Sprint Society Shows This to Users

### Level Card (Profile)
```
┌──────────────────────────────────────┐
│  INTERMEDIATE · Level 6              │
│  ████████████████░░░░  6.3/10        │
│                                      │
│  Next: I7 (est. 6 weeks)            │
│  Need: 5K under 22:00 + 45km/week   │
│                                      │
│  VO2max: 46.2  │  LT: 77%           │
│  Volume: 42km  │  Consistency: 89%   │
└──────────────────────────────────────┘
```

### Advancement Panel (What's Needed)
```
┌──────────────────────────────────────┐
│  To reach Intermediate 7:            │
│                                      │
│  ✓ 5K pace under 4:30/km (done!)    │
│  ○ Weekly volume 45km+ (you: 42km)  │
│  ○ Sustained for 4 weeks (week 2/4) │
│  ○ No missed weeks (streak: 6)      │
│                                      │
│  Estimated: 6 weeks at current rate  │
└──────────────────────────────────────┘
```

### Journey Map (Train tab)
Shows the full 40-level path. User sees where they are, where friends are, what's ahead. Creates aspiration without discouragement.

---

## Age Grading

Since a 40-year-old and a 20-year-old shouldn't be compared raw:

- All performance benchmarks are **age-graded** using World Athletics tables
- A 35:00 5K for a 16-year-old = Beginner 5
- A 35:00 5K for a 55-year-old = Intermediate 3 (age-adjusted)
- This means EVERYONE can progress regardless of age

---

## Implementation Changes Needed

### Backend (ai-profiler.ts)
1. Replace 3-tier system with 40-level composite scorer
2. Add `calculateLevel(performance, vo2max, volume, consistency, lt, economy)` function
3. Store `runner_level` (1-40), `tier` (B/I/A/P), and `sub_level` (1-10)
4. Track progression history (level changes over time)
5. Calculate "next level" requirements for each user

### Frontend (Train tab + Profile)
1. Level card showing current position on 40-point scale
2. "What's needed for next level" checklist
3. Estimated time to next level
4. Journey map visualization (all 40 levels as a path)

### Training Engine
1. Training prescription varies by exact sub-level (not just tier)
2. Intensity distribution shifts as level increases
3. Volume recommendations scale with level
4. Recovery advice adapts to training age

---

## Sources & Methodology

This framework is built from:
- **Jack Daniels' Running Formula** — VDOT tables, training pace calculation
- **Pfitzinger's Advanced Marathoning** — volume/intensity by level
- **World Athletics age-grading tables** — performance normalization
- **Norwegian method research** — polarized training distribution
- **Long-term athlete development (LTAD) models** — progression timelines
- **Billat et al.** — VO2max/vVO2max relationship to performance
- **Seiler (2010)** — intensity distribution in elite runners
- **IAAF scoring tables** — performance point equivalents

---

## Questions for Ishan Before Implementation

1. Do we show the FULL 40-level scale upfront? Or reveal tiers gradually (gamification)?
2. Should "Pro" tier be aspirational only (shown but not achievable for most) or hidden until Advanced 8+?
3. Age-grading: apply automatically, or let users opt-in?
4. Should we factor in **race participation** (actual races, not just training runs)?
5. How aggressive should level-down be? (If someone stops training for a month, do they drop levels?)
