/**
 * Sprint Society — Training Plan Generator v2.0
 *
 * Based on:
 * - Jack Daniels' VDOT training methodology
 * - Lydiard base training principles
 * - 80/20 polarized training (Stephen Seiler)
 * - Progressive overload (10% rule) with deload cycles
 * - Race-day reverse engineering
 *
 * This is the core engine that makes people faster.
 */

interface UserProfile {
  id: number;
  age: number;
  gender: 'male' | 'female' | 'non-binary';
  weight_kg: number;
  height_cm: number;
  fitness_level: 'sedentary' | 'lightly_active' | 'active' | 'very_active';
  running_experience: 'none' | 'beginner' | 'intermediate' | 'advanced';
}

interface RunHistory {
  distance_meters: number;
  moving_time_seconds: number;
  average_pace_per_km: number;
  average_heartrate?: number;
  start_date: string;
  activity_type?: string;
}

interface RaceGoal {
  distance_meters: number;
  target_time_seconds?: number;
  race_date?: string;
  race_name?: string;
}

interface TrainingWeek {
  week_number: number;
  phase: 'base' | 'build' | 'peak' | 'taper' | 'recovery';
  phase_name: string;
  total_distance_km: number;
  total_sessions: number;
  intensity_distribution: { easy: number; moderate: number; hard: number };
  sessions: TrainingSession[];
  focus: string;
  tips: string[];
}

interface TrainingSession {
  day: number;
  type: 'easy' | 'long' | 'tempo' | 'interval' | 'recovery' | 'rest' | 'cross_training' | 'fartlek';
  title: string;
  description: string;
  distance_km?: number;
  duration_minutes?: number;
  target_pace_per_km?: number;
  target_hr_zone?: number;
  intervals?: { reps: number; distance_m: number; rest_seconds: number; pace_per_km: number };
  warmup_km?: number;
  cooldown_km?: number;
  rpe: number; // 1-10 rated perceived exertion
}

interface TrainingPlan {
  user_id: number;
  goal: RaceGoal;
  vdot: number;
  training_paces: TrainingPaces;
  total_weeks: number;
  current_weekly_volume_km: number;
  target_weekly_volume_km: number;
  weeks: TrainingWeek[];
  generated_at: string;
}

export interface TrainingPaces {
  easy_min: number;    // seconds per km
  easy_max: number;
  marathon: number;
  tempo: number;
  interval: number;    // 1km rep pace
  repetition: number;  // 400m rep pace
  long_run: number;
}

// ===== VDOT TABLE (Jack Daniels) =====
// Maps VDOT score to equivalent race performances and training paces
const VDOT_TABLE: Record<number, { marathon_pace: number; tempo_pace: number; interval_pace: number; easy_pace_min: number; easy_pace_max: number }> = {
  30: { marathon_pace: 398, tempo_pace: 370, interval_pace: 340, easy_pace_min: 460, easy_pace_max: 510 },
  32: { marathon_pace: 380, tempo_pace: 354, interval_pace: 324, easy_pace_min: 440, easy_pace_max: 490 },
  34: { marathon_pace: 364, tempo_pace: 338, interval_pace: 310, easy_pace_min: 422, easy_pace_max: 470 },
  36: { marathon_pace: 348, tempo_pace: 324, interval_pace: 296, easy_pace_min: 405, easy_pace_max: 452 },
  38: { marathon_pace: 334, tempo_pace: 310, interval_pace: 284, easy_pace_min: 390, easy_pace_max: 435 },
  40: { marathon_pace: 320, tempo_pace: 298, interval_pace: 272, easy_pace_min: 376, easy_pace_max: 420 },
  42: { marathon_pace: 308, tempo_pace: 286, interval_pace: 262, easy_pace_min: 363, easy_pace_max: 406 },
  44: { marathon_pace: 296, tempo_pace: 276, interval_pace: 252, easy_pace_min: 350, easy_pace_max: 393 },
  46: { marathon_pace: 286, tempo_pace: 266, interval_pace: 244, easy_pace_min: 339, easy_pace_max: 380 },
  48: { marathon_pace: 276, tempo_pace: 257, interval_pace: 236, easy_pace_min: 328, easy_pace_max: 368 },
  50: { marathon_pace: 266, tempo_pace: 248, interval_pace: 228, easy_pace_min: 318, easy_pace_max: 357 },
  52: { marathon_pace: 258, tempo_pace: 240, interval_pace: 222, easy_pace_min: 308, easy_pace_max: 346 },
  54: { marathon_pace: 250, tempo_pace: 233, interval_pace: 216, easy_pace_min: 300, easy_pace_max: 337 },
  56: { marathon_pace: 242, tempo_pace: 226, interval_pace: 210, easy_pace_min: 292, easy_pace_max: 328 },
  58: { marathon_pace: 235, tempo_pace: 220, interval_pace: 205, easy_pace_min: 284, easy_pace_max: 320 },
  60: { marathon_pace: 228, tempo_pace: 214, interval_pace: 200, easy_pace_min: 277, easy_pace_max: 312 },
  62: { marathon_pace: 222, tempo_pace: 209, interval_pace: 195, easy_pace_min: 270, easy_pace_max: 305 },
  64: { marathon_pace: 216, tempo_pace: 204, interval_pace: 191, easy_pace_min: 264, easy_pace_max: 298 },
  66: { marathon_pace: 210, tempo_pace: 199, interval_pace: 187, easy_pace_min: 258, easy_pace_max: 292 },
  68: { marathon_pace: 205, tempo_pace: 195, interval_pace: 183, easy_pace_min: 252, easy_pace_max: 286 },
  70: { marathon_pace: 200, tempo_pace: 190, interval_pace: 179, easy_pace_min: 247, easy_pace_max: 280 },
  75: { marathon_pace: 188, tempo_pace: 180, interval_pace: 170, easy_pace_min: 234, easy_pace_max: 265 },
  80: { marathon_pace: 177, tempo_pace: 170, interval_pace: 162, easy_pace_min: 222, easy_pace_max: 252 },
  85: { marathon_pace: 167, tempo_pace: 161, interval_pace: 155, easy_pace_min: 211, easy_pace_max: 240 },
};

// ===== CORE FUNCTIONS =====

export function estimateVDOT(runs: RunHistory[]): number {
  if (runs.length === 0) return 30;

  // Use best recent performance (last 6 weeks, longest run)
  const sixWeeksAgo = Date.now() - 42 * 86400000;
  const recentRuns = runs.filter(r => new Date(r.start_date).getTime() > sixWeeksAgo);
  const relevantRuns = recentRuns.length >= 3 ? recentRuns : runs.slice(0, 10);

  // Find the best effort (fastest pace for a meaningful distance)
  let bestVDOT = 30;
  for (const run of relevantRuns) {
    if (run.distance_meters < 1500) continue; // Skip very short runs
    const velocity = run.distance_meters / run.moving_time_seconds; // m/s
    const percentVO2 = 0.8 + 0.1894393 * Math.exp(-0.012778 * run.moving_time_seconds) +
      0.2989558 * Math.exp(-0.1932605 * run.moving_time_seconds);
    const vo2 = -4.60 + 0.182258 * velocity * 60 + 0.000104 * Math.pow(velocity * 60, 2);
    const vdot = vo2 / percentVO2;
    if (vdot > bestVDOT && vdot < 85) bestVDOT = vdot;
  }

  return Math.round(bestVDOT * 2) / 2; // Round to nearest 0.5
}

export function getTrainingPaces(vdot: number): TrainingPaces {
  // Interpolate from VDOT table
  const keys = Object.keys(VDOT_TABLE).map(Number).sort((a, b) => a - b);
  let lower = keys[0], upper = keys[keys.length - 1];

  for (let i = 0; i < keys.length - 1; i++) {
    if (vdot >= keys[i] && vdot <= keys[i + 1]) {
      lower = keys[i];
      upper = keys[i + 1];
      break;
    }
  }

  const ratio = upper === lower ? 0 : (vdot - lower) / (upper - lower);
  const lowerPaces = VDOT_TABLE[lower];
  const upperPaces = VDOT_TABLE[upper];

  const lerp = (a: number, b: number) => Math.round(a + (b - a) * ratio);

  return {
    easy_min: lerp(lowerPaces.easy_pace_min, upperPaces.easy_pace_min),
    easy_max: lerp(lowerPaces.easy_pace_max, upperPaces.easy_pace_max),
    marathon: lerp(lowerPaces.marathon_pace, upperPaces.marathon_pace),
    tempo: lerp(lowerPaces.tempo_pace, upperPaces.tempo_pace),
    interval: lerp(lowerPaces.interval_pace, upperPaces.interval_pace),
    repetition: lerp(lowerPaces.interval_pace - 15, upperPaces.interval_pace - 15),
    long_run: lerp(lowerPaces.easy_pace_min + 10, upperPaces.easy_pace_min + 10),
  };
}

export function calculateWeeklyVolume(runs: RunHistory[]): number {
  const fourWeeksAgo = Date.now() - 28 * 86400000;
  const recentRuns = runs.filter(r => new Date(r.start_date).getTime() > fourWeeksAgo);
  const totalMeters = recentRuns.reduce((sum, r) => sum + r.distance_meters, 0);
  return Math.round((totalMeters / 4000) * 10) / 10; // Average weekly km, rounded to 0.1
}

function calculateTargetVolume(currentVolume: number, goal: RaceGoal, weeks: number): number {
  const distanceKm = goal.distance_meters / 1000;
  // Target peak volume should be ~1.5-2x race distance per week for marathon, 3-4x for 5K
  let targetMultiplier = distanceKm <= 5 ? 4 : distanceKm <= 10 ? 3 : distanceKm <= 21.1 ? 2.5 : 2;
  let target = distanceKm * targetMultiplier;

  // Cap growth: can't more than double current volume
  target = Math.min(target, currentVolume * 2.2);
  // Floor: at least 20% more than current
  target = Math.max(target, currentVolume * 1.2);
  // Absolute minimum
  target = Math.max(target, 15);

  return Math.round(target);
}

// ===== PHASE ALLOCATION =====
// Based on Daniels' phase structure with Lydiard base influence

function allocatePhases(totalWeeks: number): { phase: TrainingWeek['phase']; weeks: number }[] {
  if (totalWeeks <= 6) {
    return [
      { phase: 'base', weeks: 2 },
      { phase: 'build', weeks: 2 },
      { phase: 'peak', weeks: 1 },
      { phase: 'taper', weeks: 1 },
    ];
  }
  if (totalWeeks <= 12) {
    return [
      { phase: 'base', weeks: Math.ceil(totalWeeks * 0.3) },
      { phase: 'build', weeks: Math.ceil(totalWeeks * 0.3) },
      { phase: 'peak', weeks: Math.ceil(totalWeeks * 0.25) },
      { phase: 'taper', weeks: Math.max(1, Math.floor(totalWeeks * 0.15)) },
    ];
  }
  // 12+ weeks: full periodization
  return [
    { phase: 'base', weeks: Math.ceil(totalWeeks * 0.3) },
    { phase: 'build', weeks: Math.ceil(totalWeeks * 0.25) },
    { phase: 'peak', weeks: Math.ceil(totalWeeks * 0.25) },
    { phase: 'taper', weeks: Math.max(2, Math.floor(totalWeeks * 0.15)) },
    { phase: 'recovery', weeks: 1 },
  ];
}

// ===== SESSION GENERATORS =====

function generateEasyRun(paces: TrainingPaces, distance_km: number): TrainingSession {
  return {
    day: 0, type: 'easy', title: `Easy Run — ${distance_km}km`,
    description: `Conversational pace. Should feel comfortable. Breathe through nose if possible.`,
    distance_km, target_pace_per_km: paces.easy_min, target_hr_zone: 2, rpe: 4,
  };
}

function generateLongRun(paces: TrainingPaces, distance_km: number): TrainingSession {
  return {
    day: 0, type: 'long', title: `Long Run — ${distance_km}km`,
    description: `Start easy, maintain steady effort. Practice fueling if >90min. Build aerobic endurance.`,
    distance_km, target_pace_per_km: paces.long_run, target_hr_zone: 2, rpe: 5,
  };
}

function generateTempoRun(paces: TrainingPaces, distance_km: number): TrainingSession {
  const tempoKm = Math.max(2, Math.round(distance_km * 0.6));
  return {
    day: 0, type: 'tempo', title: `Tempo Run — ${tempoKm}km at threshold`,
    description: `Warm up 1.5km easy, then ${tempoKm}km at tempo pace (comfortably hard), cool down 1.5km.`,
    distance_km, target_pace_per_km: paces.tempo, target_hr_zone: 4,
    warmup_km: 1.5, cooldown_km: 1.5, rpe: 7,
  };
}

function generateIntervals(paces: TrainingPaces, phase: string): TrainingSession {
  let reps: number, distance_m: number, rest_seconds: number;

  if (phase === 'base') {
    reps = 6; distance_m = 400; rest_seconds = 90;
  } else if (phase === 'build') {
    reps = 5; distance_m = 800; rest_seconds = 120;
  } else {
    reps = 4; distance_m = 1000; rest_seconds = 150;
  }

  return {
    day: 0, type: 'interval',
    title: `Intervals — ${reps}×${distance_m}m`,
    description: `Warm up 2km. Run ${reps}×${distance_m}m at interval pace with ${rest_seconds}s jog recovery. Cool down 1.5km.`,
    target_pace_per_km: paces.interval, target_hr_zone: 5,
    intervals: { reps, distance_m, rest_seconds, pace_per_km: paces.interval },
    warmup_km: 2, cooldown_km: 1.5, rpe: 8,
  };
}

function generateFartlek(paces: TrainingPaces, duration_minutes: number): TrainingSession {
  return {
    day: 0, type: 'fartlek', title: `Fartlek — ${duration_minutes}min`,
    description: `After warmup, alternate 2min hard / 2min easy for ${duration_minutes - 10}min. Fun, unstructured speed work.`,
    duration_minutes, target_hr_zone: 3, rpe: 6,
  };
}

function generateRecoveryRun(paces: TrainingPaces): TrainingSession {
  return {
    day: 0, type: 'recovery', title: 'Recovery Run — 3km',
    description: 'Very easy. Slower than easy pace. Promotes blood flow without adding fatigue. Walk if needed.',
    distance_km: 3, target_pace_per_km: paces.easy_max + 20, target_hr_zone: 1, rpe: 2,
  };
}

// ===== WEEK GENERATOR =====

function generateWeek(
  weekNum: number,
  phase: TrainingWeek['phase'],
  volumeKm: number,
  sessionsPerWeek: number,
  paces: TrainingPaces,
  isDeload: boolean
): TrainingWeek {
  const adjustedVolume = isDeload ? volumeKm * 0.6 : volumeKm;
  const sessions: TrainingSession[] = [];

  // 80/20 rule: 80% easy, 20% hard (polarized training)
  const easyDistance = adjustedVolume * 0.8;
  const hardDistance = adjustedVolume * 0.2;

  if (phase === 'base') {
    // Base: all easy + one long run + one fartlek
    const longKm = Math.round(adjustedVolume * 0.3);
    sessions.push({ ...generateLongRun(paces, longKm), day: 6 });
    sessions.push({ ...generateFartlek(paces, 30), day: 3 });
    const remainingKm = adjustedVolume - longKm - 5;
    const easyRuns = Math.max(1, sessionsPerWeek - 3);
    for (let i = 0; i < easyRuns; i++) {
      sessions.push({ ...generateEasyRun(paces, Math.round(remainingKm / easyRuns)), day: i + 1 });
    }
    sessions.push({ day: 7, type: 'rest', title: 'Rest Day', description: 'Full rest. Sleep well. Hydrate.', rpe: 0 });
  } else if (phase === 'build') {
    // Build: long run + tempo + intervals + easy
    const longKm = Math.round(adjustedVolume * 0.3);
    sessions.push({ ...generateLongRun(paces, longKm), day: 6 });
    sessions.push({ ...generateTempoRun(paces, Math.round(adjustedVolume * 0.15) + 3), day: 2 });
    sessions.push({ ...generateIntervals(paces, 'build'), day: 4 });
    const remainingKm = adjustedVolume - longKm - 8;
    sessions.push({ ...generateEasyRun(paces, Math.round(remainingKm * 0.6)), day: 1 });
    sessions.push({ ...generateRecoveryRun(paces), day: 5 });
    sessions.push({ day: 7, type: 'rest', title: 'Rest Day', description: 'Full rest or gentle walk.', rpe: 0 });
  } else if (phase === 'peak') {
    // Peak: race-specific work, highest intensity
    const longKm = Math.round(adjustedVolume * 0.25);
    sessions.push({ ...generateLongRun(paces, longKm), day: 6 });
    sessions.push({ ...generateTempoRun(paces, Math.round(adjustedVolume * 0.15) + 3), day: 2 });
    sessions.push({ ...generateIntervals(paces, 'peak'), day: 4 });
    sessions.push({ ...generateEasyRun(paces, Math.round(adjustedVolume * 0.15)), day: 1 });
    sessions.push({ ...generateEasyRun(paces, Math.round(adjustedVolume * 0.1)), day: 3 });
    sessions.push({ day: 5, type: 'rest', title: 'Rest Day', description: 'Rest before long run.', rpe: 0 });
    sessions.push({ day: 7, type: 'rest', title: 'Rest Day', description: 'Recovery after long run.', rpe: 0 });
  } else if (phase === 'taper') {
    // Taper: reduce volume 40-60%, maintain some intensity
    sessions.push({ ...generateEasyRun(paces, Math.round(adjustedVolume * 0.25)), day: 1 });
    sessions.push({ ...generateTempoRun(paces, 5), day: 3 });
    sessions.push({ ...generateEasyRun(paces, Math.round(adjustedVolume * 0.2)), day: 5 });
    sessions.push({ day: 2, type: 'rest', title: 'Rest Day', description: 'Trust the taper. Rest is training.', rpe: 0 });
    sessions.push({ day: 4, type: 'rest', title: 'Rest Day', description: 'Light stretching only.', rpe: 0 });
    sessions.push({ day: 6, type: 'rest', title: 'Rest / Shakeout', description: '10min very easy jog if you feel restless.', rpe: 1 });
    sessions.push({ day: 7, type: 'rest', title: 'RACE DAY or Rest', description: 'Race day! Trust your training.', rpe: 0 });
  } else {
    // Recovery week
    sessions.push({ ...generateRecoveryRun(paces), day: 2 });
    sessions.push({ ...generateEasyRun(paces, 4), day: 4 });
    sessions.push({ ...generateRecoveryRun(paces), day: 6 });
    sessions.push({ day: 1, type: 'rest', title: 'Rest Day', description: 'Complete rest.', rpe: 0 });
    sessions.push({ day: 3, type: 'cross_training', title: 'Cross Training', description: 'Swimming, cycling, yoga — anything that isn\'t running.', rpe: 3 });
    sessions.push({ day: 5, type: 'rest', title: 'Rest Day', description: 'Rest and recover.', rpe: 0 });
    sessions.push({ day: 7, type: 'rest', title: 'Rest Day', description: 'Prepare for next phase.', rpe: 0 });
  }

  const phaseNames: Record<string, string> = {
    base: 'Base Building', build: 'Build Phase', peak: 'Peak / Race-Specific',
    taper: 'Taper', recovery: 'Recovery',
  };

  const phaseTips: Record<string, string[]> = {
    base: ['Keep all runs conversational', 'Build your aerobic engine — this is the foundation', 'Don\'t skip the long run'],
    build: ['Hard days hard, easy days easy', 'Tempo pace = comfortably hard, not all-out', 'Sleep 7-9 hours for recovery'],
    peak: ['This is the hardest phase — trust it', 'Nail the long run + intervals', 'Recovery between hard sessions is critical'],
    taper: ['Less is more — trust your fitness', 'Maintain routine but reduce volume', 'Visualize your race'],
    recovery: ['Full reset before next block', 'Move your body but don\'t push', 'Focus on sleep and nutrition'],
  };

  return {
    week_number: weekNum,
    phase,
    phase_name: phaseNames[phase],
    total_distance_km: Math.round(adjustedVolume),
    total_sessions: sessions.filter(s => s.type !== 'rest').length,
    intensity_distribution: { easy: 80, moderate: 10, hard: 10 },
    sessions: sessions.sort((a, b) => a.day - b.day),
    focus: phaseNames[phase],
    tips: phaseTips[phase],
  };
}

// ===== MAIN GENERATOR =====

export function generateTrainingPlan(
  user: UserProfile,
  runs: RunHistory[],
  goal: RaceGoal
): TrainingPlan {
  const vdot = estimateVDOT(runs);
  const paces = getTrainingPaces(vdot);
  const currentVolume = calculateWeeklyVolume(runs);

  // Determine plan duration
  let totalWeeks: number;
  if (goal.race_date) {
    const weeksToRace = Math.floor((new Date(goal.race_date).getTime() - Date.now()) / (7 * 86400000));
    totalWeeks = Math.max(6, Math.min(24, weeksToRace));
  } else {
    // No race date: default based on goal distance
    const distKm = goal.distance_meters / 1000;
    totalWeeks = distKm <= 5 ? 8 : distKm <= 10 ? 12 : distKm <= 21.1 ? 16 : 20;
  }

  const targetVolume = calculateTargetVolume(currentVolume, goal, totalWeeks);
  const phases = allocatePhases(totalWeeks);

  // Sessions per week based on experience
  const sessionsPerWeek = user.running_experience === 'advanced' ? 6 :
    user.running_experience === 'intermediate' ? 5 :
    user.running_experience === 'beginner' ? 4 : 3;

  // Generate week by week
  const weeks: TrainingWeek[] = [];
  let weekCounter = 1;
  let currentVolumeProgression = currentVolume || 15;

  for (const phaseBlock of phases) {
    for (let i = 0; i < phaseBlock.weeks; i++) {
      // Progressive overload: increase 8-10% per week, deload every 4th week
      const isDeload = weekCounter % 4 === 0;
      if (!isDeload) {
        const progressRate = phaseBlock.phase === 'taper' ? 0.6 : 1.08;
        currentVolumeProgression = Math.min(currentVolumeProgression * progressRate, targetVolume);
      }

      weeks.push(generateWeek(
        weekCounter,
        phaseBlock.phase,
        currentVolumeProgression,
        sessionsPerWeek,
        paces,
        isDeload
      ));
      weekCounter++;
    }
  }

  return {
    user_id: user.id,
    goal,
    vdot,
    training_paces: paces,
    total_weeks: weeks.length,
    current_weekly_volume_km: currentVolume,
    target_weekly_volume_km: targetVolume,
    weeks,
    generated_at: new Date().toISOString(),
  };
}

// ===== RACE TIME PREDICTION =====

export function predictRaceTime(vdot: number, distanceMeters: number): number {
  // Based on Daniels' VDOT equivalency tables
  // Uses the oxygen cost and sustainability formulas
  const distanceKm = distanceMeters / 1000;

  // Approximate race pace from VDOT for given distance
  // Shorter = faster than VDOT predicts, longer = slower
  const paces = getTrainingPaces(vdot);

  if (distanceKm <= 5) {
    return Math.round(distanceKm * paces.interval * 1.02); // Slightly slower than interval pace
  } else if (distanceKm <= 10) {
    return Math.round(distanceKm * (paces.tempo + (paces.interval - paces.tempo) * 0.3));
  } else if (distanceKm <= 21.1) {
    return Math.round(distanceKm * (paces.marathon + (paces.tempo - paces.marathon) * 0.4));
  } else {
    return Math.round(distanceKm * paces.marathon);
  }
}

// ===== READINESS SCORE =====

export function calculateReadiness(
  runs: RunHistory[],
  currentPlan?: TrainingWeek
): { score: number; label: string; color: string; recommendation: string } {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);
  const twoDaysAgo = new Date(today.getTime() - 2 * 86400000);

  const yesterdayRuns = runs.filter(r => {
    const d = new Date(r.start_date);
    return d >= yesterday && d < today;
  });

  const twoDaysAgoRuns = runs.filter(r => {
    const d = new Date(r.start_date);
    return d >= twoDaysAgo && d < yesterday;
  });

  let score = 80; // Base readiness

  // Cross-training activities contribute at 50% fatigue (still stresses body, less running-specific)
  const RUNNING_TYPES = ['Run', 'TrailRun', 'VirtualRun'];
  const effectiveVolume = (activities: RunHistory[]) =>
    activities.reduce((s, r) => {
      const multiplier = RUNNING_TYPES.includes(r.activity_type || 'Run') ? 1.0 : 0.5;
      return s + (r.distance_meters * multiplier);
    }, 0) / 1000;

  // Fatigue from yesterday
  const yesterdayVolume = effectiveVolume(yesterdayRuns);
  if (yesterdayVolume > 10) score -= 20;
  else if (yesterdayVolume > 5) score -= 10;

  // Two hard days in a row
  const twoDaysVolume = effectiveVolume(twoDaysAgoRuns);
  if (yesterdayVolume > 5 && twoDaysVolume > 5) score -= 15;

  // Rest day bonus
  if (yesterdayVolume === 0) score += 10;
  if (yesterdayVolume === 0 && twoDaysVolume === 0) score += 5;

  // Clamp
  score = Math.max(20, Math.min(100, score));

  if (score >= 75) {
    return { score, label: 'Ready', color: 'green', recommendation: 'Good to go. Your body is recovered — train as planned.' };
  } else if (score >= 50) {
    return { score, label: 'Moderate', color: 'yellow', recommendation: 'Take it easy today. Swap hard sessions for easy runs or rest.' };
  } else {
    return { score, label: 'Fatigued', color: 'red', recommendation: 'Rest recommended. Your body needs recovery. Light walk or stretching only.' };
  }
}
