# Training Load Management & Periodization Math

## Acute:Chronic Workload Ratio (ACWR) — Detailed

### The Concept
ACWR compares recent training load (acute, 7 days) to longer-term average (chronic, 28 days). It detects whether a runner is building too fast, maintaining, or detraining.

### Calculation
```
ACWR = Acute Load (7-day total) / Chronic Load (28-day average per week)
```
Example: 45km this week / (40+38+42+36)/4 avg = 45/39 = 1.15

### Interpretation
| ACWR | Meaning | Action |
|------|---------|--------|
| < 0.8 | Undertraining / detraining | Increase load gradually |
| 0.8 - 1.0 | Maintaining | Safe zone |
| 1.0 - 1.3 | Building (sweet spot) | Optimal adaptation zone |
| 1.3 - 1.5 | Caution | Monitor closely, ensure recovery |
| > 1.5 | Danger zone | HIGH injury risk — reduce immediately |

### EWMA (Exponentially Weighted Moving Average)
Traditional ACWR treats all days in the window equally. EWMA gives MORE weight to recent days (more responsive to spikes). Research shows EWMA is a better injury predictor.
```
EWMA_today = (load_today × lambda) + (EWMA_yesterday × (1 - lambda))
Lambda_acute = 2/(7+1) = 0.25
Lambda_chronic = 2/(28+1) = 0.069
```
Use EWMA for real-time monitoring. Use simple ratio for weekly planning.

### What Counts as "Load"
Multiple options (use one consistently):
- **Distance (km):** Simplest. Works for most runners.
- **Duration (min):** Better when comparing easy and hard sessions.
- **sRPE (session RPE × duration):** Most accurate. RPE 7 × 45 min = 315 AU (arbitrary units).
- **TSS/TRIMP:** HR-based. More complex but accounts for intensity distribution within a session.

### Spike Detection
The most dangerous pattern: 2+ weeks of low volume followed by a sudden return to full volume.
- Runner on holiday for 2 weeks (chronic drops to 15km/wk average)
- Returns and immediately runs 40km week → ACWR = 40/15 = 2.67 → VERY high injury risk
- Prevention: rebuild by 10-15% per week after any break of 7+ days

## Training Stress Score (TSS)

### Concept (Adapted from Cycling)
TSS normalizes training load by intensity relative to threshold. A 60-minute run at threshold = 100 TSS. Easier = less TSS per hour. Harder = more.

### Running TSS Approximation
```
rTSS = (duration_min × intensity_factor² × 100) / 60
Intensity Factor (IF) = session_pace / threshold_pace
```
Example: 60 min at 90% of threshold pace: IF = 0.9, rTSS = (60 × 0.81 × 100)/60 = 81

### Weekly TSS Budgets by Level
| Level | Weekly TSS Range | Typical Volume |
|-------|-----------------|----------------|
| Beginner | 150-250 | 15-25 km |
| Intermediate | 300-450 | 30-50 km |
| Advanced | 450-650 | 50-80 km |
| Elite | 650-900 | 80-150 km |

### Using TSS for Planning
- Increase weekly TSS by max 10% per week
- Deload week: reduce TSS by 30-40%
- Race week: TSS drops to 40-50% of peak week
- Post-race recovery: match TSS to the weeks BEFORE the training block, not the peak

## Periodization Mathematics

### Macrocycle Planning (Season: 16-24 weeks)
Divide into phases with clear objectives:
```
Base Phase:     40% of total time (6-10 weeks)
Build Phase:    30% of total time (5-7 weeks)
Peak Phase:     15% of total time (2-4 weeks)
Taper:          10% of total time (1-3 weeks)
Race + Recovery: 5% of total time (1-2 weeks)
```

### Volume Progression by Phase
```
Base:  Start at 70% of target peak volume, build to 85%
Build: 85% → 100% peak volume (add intensity, volume plateaus)
Peak:  90-95% volume with highest quality percentage
Taper: 100% → 60% volume (maintain intensity, cut volume)
```

### Intensity Distribution by Phase
| Phase | Easy % | Tempo % | VO2max % | Speed % |
|-------|--------|---------|----------|---------|
| Base | 90 | 8 | 2 | 0 |
| Build | 80 | 12 | 6 | 2 |
| Peak | 75 | 10 | 10 | 5 |
| Taper | 80 | 10 | 8 | 2 |

### The Mesocycle (3-4 Week Block)
Standard pattern:
- Week 1: Load (moderate stress)
- Week 2: Load+ (highest stress — peak of the block)
- Week 3: Load (same as week 1, or slightly higher)
- Week 4: DELOAD (reduce 30-40%)

Adaptation happens during deload, not during loading. Loading provides the STIMULUS. Recovery provides the ADAPTATION.

## Monotony and Strain (Foster, 1998)

### Training Monotony
```
Monotony = Weekly mean load / Standard deviation of daily load
```
High monotony (>2.0) = every day is the same intensity. This is BAD.
- Even if total volume is moderate, high monotony suppresses immune function
- Fix: vary daily training (hard/easy alternation, different session types)

### Training Strain
```
Strain = Weekly load × Monotony
```
High strain (>3000-4000 AU using sRPE) = high risk of illness and overtraining.
- Strain accounts for both AMOUNT and PATTERN of training
- A 50km week with varied intensity is less straining than 50km all at moderate pace
- This is another reason 80/20 works: it reduces monotony and therefore strain

## Overtraining Syndrome — Detection and Prevention

### Stages
1. **Overreaching (functional):** 1-2 weeks of accumulated fatigue. Normal. Resolved by deload. Performance returns within days.
2. **Overreaching (non-functional):** 2-4 weeks of stalled/declining performance despite adequate recovery attempts. Takes 2-4 weeks to resolve. Warning sign.
3. **Overtraining Syndrome (OTS):** Months of underperformance, hormonal disruption, immune suppression, mood disturbance. Takes months to years to fully recover. The goal is to NEVER reach this.

### Detection Markers
- **Performance:** Declining despite maintained/increased training
- **Resting HR:** Elevated 5-10 bpm above personal baseline for 3+ days
- **HRV:** Trending downward over 5-7 days
- **Sleep:** Difficulty falling asleep or waking unrested
- **Mood:** Irritability, lack of motivation, anxiety, depression
- **Illness:** Increased frequency of colds/upper respiratory infections
- **Appetite:** Decreased despite high energy expenditure
- **Muscle soreness:** Lingering beyond 48h after moderate sessions

### Prevention Protocol
1. Never increase volume AND intensity simultaneously
2. Include deload every 3-4 weeks (non-negotiable)
3. Keep monotony below 2.0 (vary daily training stress)
4. Track resting HR and HRV daily (trend matters more than single reading)
5. Minimum 1 full rest day per week (no exceptions for non-elite)
6. Sleep minimum 7 hours (8-9 preferred during hard blocks)
7. If 3+ detection markers present for 3+ days: immediate deload

## Readiness Score — Daily Decision Making

### Building a Readiness Model
Combine subjective + objective markers to decide training intensity today:

**Input variables (1-5 scale each):**
- Sleep quality (1=terrible, 5=great)
- Muscle soreness (1=very sore, 5=fresh)
- Energy/motivation (1=exhausted, 5=energized)
- Resting HR deviation (1=high, 5=normal)
- HRV trend (1=declining, 5=stable/improving)

**Readiness Score:**
```
Score = (sleep + soreness + energy + HR + HRV) / 5
```
| Score | Recommendation |
|-------|---------------|
| 4.0-5.0 | Green: quality session today |
| 3.0-3.9 | Yellow: easy run, reduce planned intensity by 1 zone |
| 2.0-2.9 | Orange: recovery only or rest |
| 1.0-1.9 | Red: complete rest, assess for illness/overtraining |

### Adaptive Training
The best coaches (human and AI) adjust TODAY's session based on readiness:
- Planned tempo but readiness = 2.5? → Convert to easy run.
- Planned easy but readiness = 4.8 after deload? → Extend slightly or add strides.
- Three consecutive "Yellow" days? → Unscheduled deload regardless of plan.

The plan is a GUIDE, not a mandate. The body's state determines execution.

## Volume Landmarks by Goal

### Safe Minimums (quality sessions can't compensate for insufficient volume)
| Goal | Minimum Weekly Volume | Recommended |
|------|----------------------|-------------|
| 5K completion | 15-20 km | 25-30 km |
| 5K competitive | 30-40 km | 40-60 km |
| 10K competitive | 40-50 km | 50-70 km |
| Half marathon | 40-50 km | 55-80 km |
| Marathon (finish) | 45-55 km | 55-75 km |
| Marathon (competitive) | 65-80 km | 80-120 km |
| Ultra marathon | 60-80 km | 80-130 km |

### Building to Target Volume
- Start at 60% of target. Build 10% per week for 3 weeks. Deload. Repeat.
- Time to safe marathon volume from zero: 6-9 months minimum
- Rushing volume = injury. There are no shortcuts to building mileage.

## Dual-Factor Fitness Model (Banister)

### The Concept
Performance = Fitness - Fatigue
- Training increases BOTH fitness and fatigue simultaneously
- Fatigue dissipates faster than fitness (days vs weeks)
- Taper works because: you stop adding fatigue, it dissipates, and fitness remains → performance peaks

### TSB (Training Stress Balance)
```
TSB = CTL (Chronic Training Load / "fitness") - ATL (Acute Training Load / "fatigue")
```
- Negative TSB = fatigued (building phase)
- TSB near zero = maintenance
- Positive TSB (+5 to +25) = fresh, ready to race
- Very positive TSB (>30) = detraining (too much rest)

### Race-Day Targeting
Plan taper to arrive at TSB +10 to +20 on race day:
- 3 weeks out: TSB typically -15 to -25
- Reduce volume 30% per week while maintaining intensity
- Race day: TSB arrives at +10 to +20 = optimal freshness + maintained fitness
