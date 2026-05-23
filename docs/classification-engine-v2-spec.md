# Runner Classification Engine V2 — Technical Specification

> This document defines the EXACT scoring formulas, normalization curves, and advancement logic.
> No code is written until this spec is approved.
> All 3 audit acceptance criteria must be satisfied.

---

## Final Scoring Weights

```
Performance (5K/10K/HM/Marathon):  40%
Training Volume (weekly km):       15%
Consistency (weeks active):        15%
Recovery/Readiness:                15%
VO2max/VDOT:                       10%
Pace Zone Compliance:               5%
                                  ────
                                  100%
```

---

## Factor 1: Performance (40%)

### What it measures
Actual race times or time-trial equivalents across 4 distances.

### Benchmark Table (Age-graded via World Athletics)

| Level | Male 5K | Male 10K | Male HM | Male Marathon | Female 5K | Female 10K | Female HM | Female Marathon |
|-------|---------|----------|---------|---------------|-----------|------------|-----------|----------------|
| B1 | >45:00 | N/A | N/A | N/A | >50:00 | N/A | N/A | N/A |
| B3 | 38:00 | N/A | N/A | N/A | 43:00 | N/A | N/A | N/A |
| B5 | 33:00 | 70:00 | N/A | N/A | 38:00 | 78:00 | N/A | N/A |
| B7 | 30:00 | 63:00 | N/A | N/A | 34:00 | 72:00 | N/A | N/A |
| B10 | 27:00 | 57:00 | 2:10:00 | 5:00:00 | 31:00 | 65:00 | 2:30:00 | 5:30:00 |
| I1 | 26:00 | 55:00 | 2:05:00 | 4:45:00 | 30:00 | 63:00 | 2:25:00 | 5:15:00 |
| I3 | 24:00 | 50:00 | 1:52:00 | 4:15:00 | 28:00 | 58:00 | 2:10:00 | 4:45:00 |
| I5 | 22:00 | 46:00 | 1:42:00 | 3:50:00 | 26:00 | 54:00 | 2:00:00 | 4:20:00 |
| I7 | 20:30 | 43:00 | 1:35:00 | 3:30:00 | 24:00 | 50:00 | 1:52:00 | 4:00:00 |
| I10 | 19:00 | 40:00 | 1:28:00 | 3:15:00 | 22:30 | 47:00 | 1:44:00 | 3:45:00 |
| A1 | 18:30 | 39:00 | 1:26:00 | 3:10:00 | 22:00 | 46:00 | 1:42:00 | 3:40:00 |
| A3 | 17:30 | 37:00 | 1:22:00 | 3:00:00 | 20:30 | 43:00 | 1:36:00 | 3:25:00 |
| A5 | 16:30 | 35:00 | 1:18:00 | 2:50:00 | 19:30 | 41:00 | 1:31:00 | 3:15:00 |
| A7 | 15:45 | 33:00 | 1:14:00 | 2:40:00 | 18:30 | 39:00 | 1:27:00 | 3:05:00 |
| A10 | 15:00 | 31:30 | 1:10:00 | 2:30:00 | 17:30 | 37:00 | 1:22:00 | 2:55:00 |
| P1 | 14:30 | 30:30 | 1:08:00 | 2:25:00 | 17:00 | 36:00 | 1:20:00 | 2:50:00 |
| P3 | 14:00 | 29:30 | 1:06:00 | 2:20:00 | 16:30 | 35:00 | 1:18:00 | 2:42:00 |
| P5 | 13:30 | 28:30 | 1:04:00 | 2:15:00 | 16:00 | 34:00 | 1:15:00 | 2:35:00 |
| P7 | 13:10 | 27:30 | 1:02:00 | 2:10:00 | 15:30 | 33:00 | 1:13:00 | 2:28:00 |
| P10 | 12:45 | 26:30 | 1:00:00 | 2:03:00 | 15:00 | 31:30 | 1:10:00 | 2:18:00 |

**Note:** Tier transitions (B10→I1, I10→A1, A10→P1) have WIDER gaps than within-tier transitions. This is intentional — crossing a tier should feel like a meaningful leap.

### Normalization Formula

```typescript
function normalizePerformance(bestTimes: { fiveK?: number; tenK?: number; halfM?: number; marathon?: number }, age: number, gender: 'male' | 'female'): number {
  // Convert each time to age-graded equivalent
  // Find best equivalent level across all distances
  // Return 1-40 score (B1=1, P10=40)
  
  // Use the BEST available distance (most favorable to user)
  // If no race data: use training run best pace × distance estimation
  
  const scores: number[] = [];
  if (bestTimes.fiveK) scores.push(timeToLevel(bestTimes.fiveK, '5k', age, gender));
  if (bestTimes.tenK) scores.push(timeToLevel(bestTimes.tenK, '10k', age, gender));
  if (bestTimes.halfM) scores.push(timeToLevel(bestTimes.halfM, 'hm', age, gender));
  if (bestTimes.marathon) scores.push(timeToLevel(bestTimes.marathon, 'marathon', age, gender));
  
  if (scores.length === 0) return estimateFromTrainingPace(recentRuns, age, gender);
  return Math.max(...scores); // Best distance wins
}
```

### Race vs Training distinction
- **Race result** (from official event or Sprint Society event with live tracking) → "Validated" score
- **Training run** (Strava sync, solo run) → "Provisional" score (capped at 90% confidence)
- Users are encouraged to race or do time trials to "unlock" full Performance score

---

## Factor 2: Training Volume (15%)

### What it measures
Average weekly km over the last 4 weeks (rolling). Gender-adjusted.

### Benchmarks

| Level Range | Male Weekly KM | Female Weekly KM | Sessions/Week |
|-------------|----------------|------------------|---------------|
| B1-B3 | 0-10 | 0-8 | 1-2 |
| B4-B7 | 10-25 | 8-20 | 2-3 |
| B8-B10 | 25-35 | 20-30 | 3-4 |
| I1-I3 | 35-45 | 30-40 | 4-5 |
| I4-I7 | 45-60 | 40-52 | 4-5 |
| I8-I10 | 60-75 | 52-65 | 5-6 |
| A1-A3 | 75-95 | 65-82 | 6-7 |
| A4-A7 | 95-120 | 82-105 | 6-8 |
| A8-A10 | 120-140 | 105-120 | 7-10 |
| P1-P3 | 140-160 | 120-140 | 10-12 |
| P4-P7 | 160-190 | 140-165 | 11-13 |
| P8-P10 | 190-220+ | 165-190+ | 12-14 |

### Normalization Formula

```typescript
function normalizeVolume(avgWeeklyKm: number, gender: 'male' | 'female'): number {
  // Female thresholds are 13% lower than male (research-backed)
  const genderMultiplier = gender === 'female' ? 1.13 : 1.0;
  const adjustedKm = avgWeeklyKm * genderMultiplier;
  
  // Piecewise linear mapping to 1-40 scale
  if (adjustedKm <= 0) return 1;
  if (adjustedKm <= 10) return 1 + (adjustedKm / 10) * 2; // B1-B3
  if (adjustedKm <= 35) return 3 + ((adjustedKm - 10) / 25) * 7; // B3-B10
  if (adjustedKm <= 75) return 10 + ((adjustedKm - 35) / 40) * 10; // I1-I10
  if (adjustedKm <= 140) return 20 + ((adjustedKm - 75) / 65) * 10; // A1-A10
  if (adjustedKm <= 220) return 30 + ((adjustedKm - 140) / 80) * 10; // P1-P10
  return 40; // Cap
}
```

---

## Factor 3: Consistency (15%)

### What it measures
How many of the last 12 weeks had at least 2 training sessions. Separated from "training age."

### Formula

```typescript
function normalizeConsistency(activeWeeksLast12: number, totalWeeksOnPlatform: number): number {
  // Primary: what % of last 12 weeks were active?
  const recentConsistency = activeWeeksLast12 / 12; // 0.0 to 1.0
  
  // Secondary: total time on platform (training age proxy, capped at 2 years)
  const platformMonths = Math.min(24, totalWeeksOnPlatform / 4.33);
  const maturityBonus = platformMonths / 24 * 5; // 0-5 bonus points
  
  // Map to 1-40
  const baseScore = recentConsistency * 35; // 0-35 from recent weeks
  return Math.min(40, Math.round(baseScore + maturityBonus));
}
```

**Key principle:** Recent consistency matters MORE than historical training age. A lapsed elite who hasn't run in 6 months scores LOW here despite 10 years of history.

---

## Factor 4: Recovery/Readiness (15%)

### What it measures
Whether the user is recovering adequately between sessions. Gates advancement for overtrained users.

### Data sources (priority order)
1. **HRV data** (if wearable synced: Garmin, Apple Watch, WHOOP) → best signal
2. **Rest days per week** (calculable from activity data) → always available
3. **Self-reported perceived exertion** (RPE after each run, 1-10 scale) → fallback
4. **Sleep data** (if available from wearable) → bonus signal

### Formula

```typescript
function normalizeRecovery(data: {
  avgRestDaysPerWeek: number;      // from activity logs
  hrvTrend?: 'improving' | 'stable' | 'declining';
  avgRPE?: number;                  // 1-10 scale
  avgSleepHours?: number;
}): number {
  let score = 20; // Start at midpoint
  
  // Rest days (most important, always available)
  // 1-2 rest days/week is optimal for most levels
  if (data.avgRestDaysPerWeek >= 1 && data.avgRestDaysPerWeek <= 3) score += 8;
  else if (data.avgRestDaysPerWeek === 0) score -= 10; // No rest = danger
  else if (data.avgRestDaysPerWeek > 4) score -= 5; // Too much rest = not training
  
  // HRV (if available)
  if (data.hrvTrend === 'improving') score += 6;
  else if (data.hrvTrend === 'stable') score += 3;
  else if (data.hrvTrend === 'declining') score -= 8;
  
  // RPE (if available) — avg should be 5-7 for good training
  if (data.avgRPE) {
    if (data.avgRPE >= 4 && data.avgRPE <= 7) score += 4;
    else if (data.avgRPE > 8) score -= 6; // Every run is a death march
    else if (data.avgRPE < 3) score += 2; // Running too easy (fine for beginners)
  }
  
  // Sleep (if available)
  if (data.avgSleepHours) {
    if (data.avgSleepHours >= 7) score += 4;
    else if (data.avgSleepHours < 6) score -= 4;
  }
  
  return Math.max(1, Math.min(40, score));
}
```

---

## Factor 5: VO2max/VDOT (10%)

### What it measures
Aerobic ceiling. Estimated from race performance (Daniels formula) or wearable.

### Formula

```typescript
function normalizeVO2max(vo2max: number, gender: 'male' | 'female'): number {
  // Gender-adjusted thresholds
  const offset = gender === 'female' ? 5 : 0; // Female VO2max ~5 lower for same performance level
  const adjusted = vo2max + offset;
  
  if (adjusted <= 28) return 1;
  if (adjusted <= 35) return 1 + ((adjusted - 28) / 7) * 4;   // B1-B5
  if (adjusted <= 42) return 5 + ((adjusted - 35) / 7) * 5;   // B5-B10
  if (adjusted <= 52) return 10 + ((adjusted - 42) / 10) * 10; // I1-I10
  if (adjusted <= 65) return 20 + ((adjusted - 52) / 13) * 10; // A1-A10
  if (adjusted <= 80) return 30 + ((adjusted - 65) / 15) * 10; // P1-P10
  return 40;
}
```

### Data freshness decay
```typescript
function applyFreshnessDecay(score: number, lastMeasuredDate: Date): number {
  const daysOld = (Date.now() - lastMeasuredDate.getTime()) / 86400000;
  if (daysOld <= 14) return score; // Fresh — full weight
  if (daysOld <= 30) return score * 0.95;
  if (daysOld <= 60) return score * 0.85;
  if (daysOld <= 90) return score * 0.70;
  return score * 0.50; // >3 months old — heavily discounted
}
```

---

## Factor 6: Pace Zone Compliance (5%)

### What it measures
Did the user actually run at the prescribed effort? "Running easy runs easy" is the #1 predictor of long-term improvement.

### Formula

```typescript
function normalizePaceCompliance(runs: Run[], prescribedZones: PaceZones): number {
  if (runs.length < 5) return 20; // Not enough data, neutral score
  
  let compliantRuns = 0;
  
  for (const run of runs) {
    const prescribed = run.prescribedZone; // 'easy' | 'tempo' | 'interval'
    const actualPace = run.average_pace_per_km;
    
    if (prescribed === 'easy' && actualPace >= prescribedZones.easy * 0.95) compliantRuns++;
    else if (prescribed === 'tempo' && actualPace >= prescribedZones.tempo * 0.9 && actualPace <= prescribedZones.tempo * 1.1) compliantRuns++;
    else if (prescribed === 'interval' && actualPace <= prescribedZones.interval * 1.1) compliantRuns++;
    else if (!prescribed) compliantRuns++; // Unstructured run, always compliant
  }
  
  const complianceRate = compliantRuns / runs.length; // 0.0 to 1.0
  return Math.round(complianceRate * 40); // Map to 1-40
}
```

**Note:** Only kicks in meaningfully at Intermediate+ (beginners don't have structured plans yet, so they get neutral 20/40).

---

## Composite Score Calculation

```typescript
function calculateRunnerLevel(factors: {
  performance: number;    // 1-40
  volume: number;         // 1-40
  consistency: number;    // 1-40
  recovery: number;       // 1-40
  vo2max: number;         // 1-40
  paceCompliance: number; // 1-40
}): { tier: 'B' | 'I' | 'A' | 'P'; subLevel: number; rawScore: number } {
  
  const rawScore = 
    factors.performance * 0.40 +
    factors.volume * 0.15 +
    factors.consistency * 0.15 +
    factors.recovery * 0.15 +
    factors.vo2max * 0.10 +
    factors.paceCompliance * 0.05;
  
  // Map raw score (1-40) to tier + sub-level
  const level = Math.max(1, Math.min(40, Math.round(rawScore)));
  
  let tier: 'B' | 'I' | 'A' | 'P';
  let subLevel: number;
  
  if (level <= 10) { tier = 'B'; subLevel = level; }
  else if (level <= 20) { tier = 'I'; subLevel = level - 10; }
  else if (level <= 30) { tier = 'A'; subLevel = level - 20; }
  else { tier = 'P'; subLevel = level - 30; }
  
  return { tier, subLevel, rawScore };
}
```

---

## Advancement Logic

### Level-Up Triggers (ALL must be met)
1. Composite score at target level for **3 consecutive weeks**
2. Performance factor specifically at or above target (can't advance on volume alone)
3. No active safety rail violations
4. Recovery factor ≥ 15/40 (minimum recovery threshold)

### Level-Down Rules
- **4 consecutive weeks** below current sub-level threshold → drop 1 sub-level
- **8 consecutive weeks** below tier threshold → tier demotion (e.g., I1 → B10)
- Language: "Your [tier] [level] status is on hold — let's rebuild" (not "you dropped")
- Injury/illness exception: user can self-report "taking a break" → freezes level for up to 8 weeks

### Probationary Period (Cold Start)
- First 3 weeks after registration: classification is "Calibrating..."
- During this time, score adjusts freely without the 3-week sustained requirement
- After 3 weeks: score locks in as initial placement
- Level shown with "~" prefix until first validated race (e.g., "~I4")

---

## Safety Rails (Parallel System — NOT in scoring)

```typescript
function checkSafetyRails(user: UserData): SafetyRailStatus {
  const rails: string[] = [];
  
  // 1. ACWR (Acute:Chronic Workload Ratio)
  const acwr = user.acuteLoad7day / Math.max(1, user.chronicLoad28day);
  if (acwr > 1.5) rails.push('ACWR_HIGH'); // Block advancement
  if (acwr > 1.8) rails.push('ACWR_CRITICAL'); // Urgent rest recommendation
  
  // 2. Volume spike
  const thisWeekKm = user.currentWeekVolume;
  const avg4WeekKm = user.avg4WeekVolume;
  if (thisWeekKm > avg4WeekKm * 1.2) rails.push('VOLUME_SPIKE'); // Caution
  if (thisWeekKm > avg4WeekKm * 1.3) rails.push('VOLUME_DANGER'); // Block
  
  // 3. Missed weeks
  const consecutiveMissedWeeks = user.weeksSinceLastRun;
  if (consecutiveMissedWeeks >= 4) rails.push('EXTENDED_BREAK'); // Level hold
  
  return {
    canAdvance: rails.length === 0,
    activeRails: rails,
    message: generateSafetyMessage(rails, user.coachPersonality),
  };
}
```

### Coach personality in safety messages

| Rail | Kendu_Ishu | Kendu_Nainu | Kendu_Goggins | Kendu_Kip |
|------|-----------|-------------|---------------|-----------|
| ACWR_HIGH | "Load ratio 1.6. Reduce intensity 20% this week." | "Hey, your body's working hard! Easy day tomorrow? 💛" | "Even warriors rest. Smart training > hard training." | "Patience. Pull back now, surge forward next week." |
| VOLUME_SPIKE | "Volume up 25% vs 4-week avg. Injury probability elevated." | "Woah, big week! Maybe swap one run for a walk?" | "Discipline means knowing when MORE isn't better." | "The body adapts on its own schedule. Don't force it." |
| EXTENDED_BREAK | "Welcome back. Resuming at 70% of previous volume." | "Hey stranger! Let's ease back in — no pressure! 🏃" | "You took time off. Own it. Now show up." | "Rest was needed. The road is still there." |

---

## What Users SEE (UX)

### Level Card (simplified)
```
┌──────────────────────────────────┐
│  INTERMEDIATE                    │
│  ████████░░░░░░  (Level 4)      │
│                                  │
│  Next milestone: 22:00 5K        │
│  + 3km/week more volume          │
│  Est. 5 weeks                    │
└──────────────────────────────────┘
```

Users NEVER see: raw score, decimal points, factor weights, or the number "40."
They see: **Tier name + progress bar + next concrete goal + time estimate.**

### Radar Chart (Profile deep-dive, optional)
Shows 5 axes: Performance, Volume, Consistency, Recovery, VO2max
(Pace Compliance feeds into coaching tips, not shown to user directly)

---

## Database Schema Changes

```sql
-- New table: runner classification history
CREATE TABLE runner_levels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  tier TEXT NOT NULL, -- 'B', 'I', 'A', 'P'
  sub_level INTEGER NOT NULL, -- 1-10
  raw_score REAL NOT NULL,
  performance_score REAL,
  volume_score REAL,
  consistency_score REAL,
  recovery_score REAL,
  vo2max_score REAL,
  compliance_score REAL,
  status TEXT DEFAULT 'active', -- 'active', 'calibrating', 'on_hold', 'validated'
  calculated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Safety rail events
CREATE TABLE safety_rail_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  rail_type TEXT NOT NULL, -- 'ACWR_HIGH', 'VOLUME_SPIKE', 'EXTENDED_BREAK'
  triggered_at TEXT DEFAULT (datetime('now')),
  resolved_at TEXT,
  coach_message TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## Acceptance Criteria (From 3 Audits)

- [ ] LT and Running Economy NOT in scoring (coaching labels only)
- [ ] VO2max at 10% weight (reduced from 20%)
- [ ] Recovery/Readiness at 15% with fallback for users without wearables
- [ ] 10K AND Half Marathon in performance table
- [ ] Gender-adjusted volume benchmarks (13% lower for women)
- [ ] Level-down rules defined with soft language
- [ ] Cold start / probationary placement (3-week calibration)
- [ ] Data freshness decay on VO2max readings
- [ ] Safety rails operate independently from scoring
- [ ] Tier boundaries wider than within-tier gaps
- [ ] Progressive reveal (Pro gated behind A5+)
- [ ] Pace Zone Compliance measurable from GPS alone
- [ ] Race results create "Validated" status vs "Provisional"
- [ ] Age-grading applied automatically via World Athletics tables
