/**
 * Runner Classification Engine V2
 *
 * Implements the full scoring, normalization, safety-rail, and advancement/regression
 * logic as defined in docs/classification-engine-v2-spec.md.
 *
 * Pure TypeScript. No external dependencies.
 */

// ============================================================================
// Types
// ============================================================================

export type ClassificationTier = 'B' | 'I' | 'A' | 'P';
export type Gender = 'male' | 'female';
export type HRVTrend = 'improving' | 'stable' | 'declining';
export type PrescribedZone = 'easy' | 'tempo' | 'interval';

export interface FactorScores {
  performance: number;    // 1-40
  volume: number;         // 1-40
  consistency: number;    // 1-40
  recovery: number;       // 1-40
  vo2max: number;         // 1-40
  paceCompliance: number; // 1-40
}

export type ClassificationStatus = 'calibrating' | 'provisional' | 'validated';

export interface LevelResult {
  tier: ClassificationTier;
  subLevel: number;
  rawScore: number;
  status: ClassificationStatus;
}

export interface CalibrationInput {
  weeksOnPlatform: number;
  hasRaceResult: boolean;
}

export interface BestTimes {
  fiveK?: number;    // seconds
  tenK?: number;     // seconds
  halfM?: number;    // seconds
  marathon?: number; // seconds
}

export interface RecoveryData {
  avgRestDaysPerWeek: number;
  hrvTrend?: HRVTrend;
  avgRPE?: number;       // 1-10
  avgSleepHours?: number;
}

export interface RunForCompliance {
  prescribedZone?: PrescribedZone;
  average_pace_per_km: number; // seconds per km
}

export interface PaceZones {
  easy: number;     // seconds per km
  tempo: number;    // seconds per km
  interval: number; // seconds per km
}

export type SafetyRail =
  | 'ACWR_HIGH'
  | 'ACWR_CRITICAL'
  | 'VOLUME_SPIKE'
  | 'VOLUME_DANGER'
  | 'EXTENDED_BREAK';

export interface SafetyRailStatus {
  canAdvance: boolean;
  activeRails: SafetyRail[];
  message: string;
}

export interface UserSafetyData {
  acuteLoad7day: number;
  chronicLoad28day: number;
  currentWeekVolume: number;
  avg4WeekVolume: number;
  weeksSinceLastRun: number;
}

export interface AdvancementResult {
  advances: boolean;
  reason: string;
}

export interface RegressionResult {
  regresses: boolean;
  newTier?: ClassificationTier;
  newSubLevel?: number;
  reason: string;
}

// ============================================================================
// Performance Benchmark Table
// Times in seconds. null = not applicable at that level.
// ============================================================================

interface BenchmarkEntry {
  level: number; // 1-40 mapped to the labeled level
  male5K: number | null;
  male10K: number | null;
  maleHM: number | null;
  maleMarathon: number | null;
  female5K: number | null;
  female10K: number | null;
  femaleHM: number | null;
  femaleMarathon: number | null;
}

function timeStr(t: string): number {
  // "45:00" or "2:10:00" → seconds
  const parts = t.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return parts[0] * 60 + parts[1];
}

// Labeled benchmark levels with their corresponding 1-40 score
const BENCHMARKS: { label: string; score: number; male5K: number | null; male10K: number | null; maleHM: number | null; maleMarathon: number | null; female5K: number | null; female10K: number | null; femaleHM: number | null; femaleMarathon: number | null }[] = [
  { label: 'B1',  score: 1,  male5K: timeStr('45:00'), male10K: null, maleHM: null, maleMarathon: null, female5K: timeStr('50:00'), female10K: null, femaleHM: null, femaleMarathon: null },
  { label: 'B3',  score: 3,  male5K: timeStr('38:00'), male10K: null, maleHM: null, maleMarathon: null, female5K: timeStr('43:00'), female10K: null, femaleHM: null, femaleMarathon: null },
  { label: 'B5',  score: 5,  male5K: timeStr('33:00'), male10K: timeStr('70:00'), maleHM: null, maleMarathon: null, female5K: timeStr('38:00'), female10K: timeStr('78:00'), femaleHM: null, femaleMarathon: null },
  { label: 'B7',  score: 7,  male5K: timeStr('30:00'), male10K: timeStr('63:00'), maleHM: null, maleMarathon: null, female5K: timeStr('34:00'), female10K: timeStr('72:00'), femaleHM: null, femaleMarathon: null },
  { label: 'B10', score: 10, male5K: timeStr('27:00'), male10K: timeStr('57:00'), maleHM: timeStr('2:10:00'), maleMarathon: timeStr('5:00:00'), female5K: timeStr('31:00'), female10K: timeStr('65:00'), femaleHM: timeStr('2:30:00'), femaleMarathon: timeStr('5:30:00') },
  { label: 'I1',  score: 11, male5K: timeStr('26:00'), male10K: timeStr('55:00'), maleHM: timeStr('2:05:00'), maleMarathon: timeStr('4:45:00'), female5K: timeStr('30:00'), female10K: timeStr('63:00'), femaleHM: timeStr('2:25:00'), femaleMarathon: timeStr('5:15:00') },
  { label: 'I3',  score: 13, male5K: timeStr('24:00'), male10K: timeStr('50:00'), maleHM: timeStr('1:52:00'), maleMarathon: timeStr('4:15:00'), female5K: timeStr('28:00'), female10K: timeStr('58:00'), femaleHM: timeStr('2:10:00'), femaleMarathon: timeStr('4:45:00') },
  { label: 'I5',  score: 15, male5K: timeStr('22:00'), male10K: timeStr('46:00'), maleHM: timeStr('1:42:00'), maleMarathon: timeStr('3:50:00'), female5K: timeStr('26:00'), female10K: timeStr('54:00'), femaleHM: timeStr('2:00:00'), femaleMarathon: timeStr('4:20:00') },
  { label: 'I7',  score: 17, male5K: timeStr('20:30'), male10K: timeStr('43:00'), maleHM: timeStr('1:35:00'), maleMarathon: timeStr('3:30:00'), female5K: timeStr('24:00'), female10K: timeStr('50:00'), femaleHM: timeStr('1:52:00'), femaleMarathon: timeStr('4:00:00') },
  { label: 'I10', score: 20, male5K: timeStr('19:00'), male10K: timeStr('40:00'), maleHM: timeStr('1:28:00'), maleMarathon: timeStr('3:15:00'), female5K: timeStr('22:30'), female10K: timeStr('47:00'), femaleHM: timeStr('1:44:00'), femaleMarathon: timeStr('3:45:00') },
  { label: 'A1',  score: 21, male5K: timeStr('18:30'), male10K: timeStr('39:00'), maleHM: timeStr('1:26:00'), maleMarathon: timeStr('3:10:00'), female5K: timeStr('22:00'), female10K: timeStr('46:00'), femaleHM: timeStr('1:42:00'), femaleMarathon: timeStr('3:40:00') },
  { label: 'A3',  score: 23, male5K: timeStr('17:30'), male10K: timeStr('37:00'), maleHM: timeStr('1:22:00'), maleMarathon: timeStr('3:00:00'), female5K: timeStr('20:30'), female10K: timeStr('43:00'), femaleHM: timeStr('1:36:00'), femaleMarathon: timeStr('3:25:00') },
  { label: 'A5',  score: 25, male5K: timeStr('16:30'), male10K: timeStr('35:00'), maleHM: timeStr('1:18:00'), maleMarathon: timeStr('2:50:00'), female5K: timeStr('19:30'), female10K: timeStr('41:00'), femaleHM: timeStr('1:31:00'), femaleMarathon: timeStr('3:15:00') },
  { label: 'A7',  score: 27, male5K: timeStr('15:45'), male10K: timeStr('33:00'), maleHM: timeStr('1:14:00'), maleMarathon: timeStr('2:40:00'), female5K: timeStr('18:30'), female10K: timeStr('39:00'), femaleHM: timeStr('1:27:00'), femaleMarathon: timeStr('3:05:00') },
  { label: 'A10', score: 30, male5K: timeStr('15:00'), male10K: timeStr('31:30'), maleHM: timeStr('1:10:00'), maleMarathon: timeStr('2:30:00'), female5K: timeStr('17:30'), female10K: timeStr('37:00'), femaleHM: timeStr('1:22:00'), femaleMarathon: timeStr('2:55:00') },
  { label: 'P1',  score: 31, male5K: timeStr('14:30'), male10K: timeStr('30:30'), maleHM: timeStr('1:08:00'), maleMarathon: timeStr('2:25:00'), female5K: timeStr('17:00'), female10K: timeStr('36:00'), femaleHM: timeStr('1:20:00'), femaleMarathon: timeStr('2:50:00') },
  { label: 'P3',  score: 33, male5K: timeStr('14:00'), male10K: timeStr('29:30'), maleHM: timeStr('1:06:00'), maleMarathon: timeStr('2:20:00'), female5K: timeStr('16:30'), female10K: timeStr('35:00'), femaleHM: timeStr('1:18:00'), femaleMarathon: timeStr('2:42:00') },
  { label: 'P5',  score: 35, male5K: timeStr('13:30'), male10K: timeStr('28:30'), maleHM: timeStr('1:04:00'), maleMarathon: timeStr('2:15:00'), female5K: timeStr('16:00'), female10K: timeStr('34:00'), femaleHM: timeStr('1:15:00'), femaleMarathon: timeStr('2:35:00') },
  { label: 'P7',  score: 37, male5K: timeStr('13:10'), male10K: timeStr('27:30'), maleHM: timeStr('1:02:00'), maleMarathon: timeStr('2:10:00'), female5K: timeStr('15:30'), female10K: timeStr('33:00'), femaleHM: timeStr('1:13:00'), femaleMarathon: timeStr('2:28:00') },
  { label: 'P10', score: 40, male5K: timeStr('12:45'), male10K: timeStr('26:30'), maleHM: timeStr('1:00:00'), maleMarathon: timeStr('2:03:00'), female5K: timeStr('15:00'), female10K: timeStr('31:30'), femaleHM: timeStr('1:10:00'), femaleMarathon: timeStr('2:18:00') },
];

// ============================================================================
// Age Grading (from existing ageGrading.ts — inline for pure-function isolation)
// ============================================================================

function getAgeFactor(age: number, gender: Gender): number {
  const table: Record<Gender, Record<string, number>> = {
    male: {
      '13-19': 0.84, '20-24': 0.97, '25-29': 1.00, '30-34': 0.98,
      '35-39': 0.96, '40-44': 0.93, '45-49': 0.90, '50-54': 0.86,
      '55-59': 0.82, '60-64': 0.77, '65-69': 0.72, '70-74': 0.66,
      '75-79': 0.60, '80+': 0.54,
    },
    female: {
      '13-19': 0.82, '20-24': 0.97, '25-29': 1.00, '30-34': 0.98,
      '35-39': 0.96, '40-44': 0.93, '45-49': 0.89, '50-54': 0.85,
      '55-59': 0.80, '60-64': 0.75, '65-69': 0.69, '70-74': 0.63,
      '75-79': 0.57, '80+': 0.51,
    },
  };

  let bracket: string;
  if (age < 20) bracket = '13-19';
  else if (age < 25) bracket = '20-24';
  else if (age < 30) bracket = '25-29';
  else if (age < 35) bracket = '30-34';
  else if (age < 40) bracket = '35-39';
  else if (age < 45) bracket = '40-44';
  else if (age < 50) bracket = '45-49';
  else if (age < 55) bracket = '50-54';
  else if (age < 60) bracket = '55-59';
  else if (age < 65) bracket = '60-64';
  else if (age < 70) bracket = '65-69';
  else if (age < 75) bracket = '70-74';
  else if (age < 80) bracket = '75-79';
  else bracket = '80+';

  return table[gender][bracket] ?? 0.80;
}

/**
 * Age-grade a time: returns the equivalent time for a 25-29 year old.
 * Lower is better, so we divide by age factor (older runners get credit).
 */
function ageGradeTime(timeSeconds: number, age: number, gender: Gender): number {
  const factor = getAgeFactor(age, gender);
  // A 40yo running 20:00 with factor 0.93 → age-graded = 20:00 * 0.93 = 18:36 (faster equivalent)
  return timeSeconds * factor;
}

// ============================================================================
// Core: timeToLevel — interpolates benchmark table for a given time + distance
// ============================================================================

type DistanceKey = '5k' | '10k' | 'hm' | 'marathon';

function getColumnForDistance(distance: DistanceKey, gender: Gender): (entry: typeof BENCHMARKS[0]) => number | null {
  const key = `${gender === 'female' ? 'female' : 'male'}${distance === '5k' ? '5K' : distance === '10k' ? '10K' : distance === 'hm' ? 'HM' : 'Marathon'}` as keyof typeof BENCHMARKS[0];
  return (entry) => entry[key] as number | null;
}

/**
 * Given a time (seconds) at a specific distance, return a 1-40 level score.
 * Applies age grading first, then interpolates benchmark table.
 * Lower time = higher level (faster = better).
 */
function timeToLevel(timeSeconds: number, distance: DistanceKey, age: number, gender: Gender): number {
  const ageGraded = ageGradeTime(timeSeconds, age, gender);
  const getCol = getColumnForDistance(distance, gender);

  // Collect all benchmark entries that have data for this distance
  const points: { score: number; time: number }[] = [];
  for (const entry of BENCHMARKS) {
    const t = getCol(entry);
    if (t !== null) {
      points.push({ score: entry.score, time: t });
    }
  }

  if (points.length === 0) return 1;

  // Points are ordered from slowest (lowest score) to fastest (highest score)
  // Times decrease as scores increase (faster = higher level)

  // If slower than the slowest benchmark
  if (ageGraded >= points[0].time) return points[0].score;

  // If faster than the fastest benchmark
  if (ageGraded <= points[points.length - 1].time) return points[points.length - 1].score;

  // Interpolate between adjacent benchmark points
  for (let i = 0; i < points.length - 1; i++) {
    const upper = points[i];     // slower time, lower score
    const lower = points[i + 1]; // faster time, higher score

    if (ageGraded <= upper.time && ageGraded >= lower.time) {
      // Linear interpolation
      const timeDiff = upper.time - lower.time;
      const scoreDiff = lower.score - upper.score;
      const fraction = (upper.time - ageGraded) / timeDiff;
      return upper.score + fraction * scoreDiff;
    }
  }

  return 1;
}

// ============================================================================
// Exported Functions
// ============================================================================

/**
 * 1. calculateRunnerLevel — composite weighted score → tier + sub-level + status
 *
 * Status logic:
 * - "calibrating": user has < 3 weeks on platform (cold start period)
 * - "validated": user has a verified race result backing their performance score
 * - "provisional": training data only, no race verification
 */
export function calculateRunnerLevel(factors: FactorScores, calibration?: CalibrationInput): LevelResult {
  const rawScore =
    factors.performance * 0.40 +
    factors.volume * 0.15 +
    factors.consistency * 0.15 +
    factors.recovery * 0.15 +
    factors.vo2max * 0.10 +
    factors.paceCompliance * 0.05;

  const level = Math.max(1, Math.min(40, Math.round(rawScore)));

  let tier: ClassificationTier;
  let subLevel: number;

  if (level <= 10) { tier = 'B'; subLevel = level; }
  else if (level <= 20) { tier = 'I'; subLevel = level - 10; }
  else if (level <= 30) { tier = 'A'; subLevel = level - 20; }
  else { tier = 'P'; subLevel = level - 30; }

  // Determine classification status
  let status: ClassificationStatus;
  if (calibration && calibration.weeksOnPlatform < 3) {
    status = 'calibrating';
  } else if (calibration && calibration.hasRaceResult) {
    status = 'validated';
  } else {
    status = 'provisional';
  }

  // During calibration, cap advancement at I5 (level 15) to prevent over-classification
  if (status === 'calibrating' && level > 15) {
    tier = 'I';
    subLevel = 5;
    return { tier, subLevel, rawScore, status };
  }

  return { tier, subLevel, rawScore, status };
}

/**
 * 2. normalizePerformance — race times → 1-40 score with age grading
 *    Uses BEST available distance (most favorable to user)
 */
export function normalizePerformance(bestTimes: BestTimes, age: number, gender: Gender): number {
  const scores: number[] = [];

  if (bestTimes.fiveK && bestTimes.fiveK > 0) {
    scores.push(timeToLevel(bestTimes.fiveK, '5k', age, gender));
  }
  if (bestTimes.tenK && bestTimes.tenK > 0) {
    scores.push(timeToLevel(bestTimes.tenK, '10k', age, gender));
  }
  if (bestTimes.halfM && bestTimes.halfM > 0) {
    scores.push(timeToLevel(bestTimes.halfM, 'hm', age, gender));
  }
  if (bestTimes.marathon && bestTimes.marathon > 0) {
    scores.push(timeToLevel(bestTimes.marathon, 'marathon', age, gender));
  }

  if (scores.length === 0) return 1; // No data
  return Math.max(1, Math.min(40, Math.max(...scores)));
}

/**
 * 3. normalizeVolume — weekly km → 1-40 (gender-adjusted, females get 13% boost)
 */
export function normalizeVolume(avgWeeklyKm: number, gender: Gender): number {
  const genderMultiplier = gender === 'female' ? 1.13 : 1.0;
  const adjustedKm = avgWeeklyKm * genderMultiplier;

  // Piecewise linear mapping to 1-40 scale
  let score: number;
  if (adjustedKm <= 0) score = 1;
  else if (adjustedKm <= 10) score = 1 + (adjustedKm / 10) * 2;           // 1 → 3 (B1-B3)
  else if (adjustedKm <= 35) score = 3 + ((adjustedKm - 10) / 25) * 7;    // 3 → 10 (B3-B10)
  else if (adjustedKm <= 75) score = 10 + ((adjustedKm - 35) / 40) * 10;  // 10 → 20 (I1-I10)
  else if (adjustedKm <= 140) score = 20 + ((adjustedKm - 75) / 65) * 10; // 20 → 30 (A1-A10)
  else if (adjustedKm <= 220) score = 30 + ((adjustedKm - 140) / 80) * 10; // 30 → 40 (P1-P10)
  else score = 40;

  return Math.max(1, Math.min(40, Math.round(score)));
}

/**
 * 4. normalizeConsistency — active weeks / 12 → 1-40 with platform maturity bonus
 */
export function normalizeConsistency(activeWeeksLast12: number, totalWeeksOnPlatform: number): number {
  const recentConsistency = Math.min(1, activeWeeksLast12 / 12);

  // Platform maturity bonus: capped at 24 months
  const platformMonths = Math.min(24, totalWeeksOnPlatform / 4.33);
  const maturityBonus = (platformMonths / 24) * 5; // 0-5 bonus points

  const baseScore = recentConsistency * 35; // 0-35 from recent weeks
  return Math.max(1, Math.min(40, Math.round(baseScore + maturityBonus)));
}

/**
 * 5. normalizeRecovery — rest days, HRV, RPE, sleep → 1-40
 */
export function normalizeRecovery(data: RecoveryData): number {
  // Recovery should scale with training quality, not just "being alive"
  // Base score is LOW — you earn recovery points by training smart
  let score = 8;

  // Rest days — optimal is 1-2 for trained runners, 2-3 for beginners
  if (data.avgRestDaysPerWeek >= 1 && data.avgRestDaysPerWeek <= 2) score += 10; // Optimal for serious runners
  else if (data.avgRestDaysPerWeek > 2 && data.avgRestDaysPerWeek <= 3) score += 6; // Good for beginners
  else if (data.avgRestDaysPerWeek === 0) score -= 5; // No rest = danger
  else if (data.avgRestDaysPerWeek > 4) score -= 3; // Barely training

  // HRV (if available) — BIG differentiator
  if (data.hrvTrend === 'improving') score += 10;
  else if (data.hrvTrend === 'stable') score += 5;
  else if (data.hrvTrend === 'declining') score -= 6;

  // RPE — moderate training effort (5-7) is ideal
  if (data.avgRPE !== undefined) {
    if (data.avgRPE >= 5 && data.avgRPE <= 7) score += 5;
    else if (data.avgRPE > 8) score -= 4;
    else if (data.avgRPE < 4) score += 0; // Too easy, no bonus
  }

  // Sleep (if available)
  if (data.avgSleepHours !== undefined) {
    if (data.avgSleepHours >= 7.5) score += 5;
    else if (data.avgSleepHours >= 7) score += 3;
    else if (data.avgSleepHours < 6) score -= 4;
  }

  return Math.max(1, Math.min(40, score));
}

/**
 * 6. normalizeVO2max — with freshness decay based on measurement date
 */
export function normalizeVO2max(vo2max: number, gender: Gender, lastMeasuredDate?: Date): number {
  // Gender-adjusted thresholds
  const offset = gender === 'female' ? 5 : 0;
  const adjusted = vo2max + offset;

  let score: number;
  if (adjusted <= 28) score = 1;
  else if (adjusted <= 35) score = 1 + ((adjusted - 28) / 7) * 4;    // B1-B5
  else if (adjusted <= 42) score = 5 + ((adjusted - 35) / 7) * 5;    // B5-B10
  else if (adjusted <= 52) score = 10 + ((adjusted - 42) / 10) * 10;  // I1-I10
  else if (adjusted <= 65) score = 20 + ((adjusted - 52) / 13) * 10;  // A1-A10
  else if (adjusted <= 80) score = 30 + ((adjusted - 65) / 15) * 10;  // P1-P10
  else score = 40;

  // Apply freshness decay
  if (lastMeasuredDate) {
    score = applyFreshnessDecay(score, lastMeasuredDate);
  }

  return Math.max(1, Math.min(40, Math.round(score)));
}

/**
 * Freshness decay for VO2max readings
 */
function applyFreshnessDecay(score: number, lastMeasuredDate: Date): number {
  const daysOld = (Date.now() - lastMeasuredDate.getTime()) / 86400000;
  if (daysOld <= 14) return score;          // Fresh — full weight
  if (daysOld <= 30) return score * 0.95;
  if (daysOld <= 60) return score * 0.85;
  if (daysOld <= 90) return score * 0.70;
  return score * 0.50;                       // >3 months old — heavily discounted
}

/**
 * 7. normalizePaceCompliance — % runs at correct effort → 1-40
 */
export function normalizePaceCompliance(runs: RunForCompliance[], prescribedZones: PaceZones): number {
  if (runs.length < 5) return 20; // Not enough data, neutral score

  let compliantRuns = 0;

  for (const run of runs) {
    const prescribed = run.prescribedZone;
    const actualPace = run.average_pace_per_km;

    if (!prescribed) {
      // Unstructured run, always compliant
      compliantRuns++;
    } else if (prescribed === 'easy' && actualPace >= prescribedZones.easy * 0.95) {
      // Easy runs should be SLOW (high sec/km). Compliant if at least 95% of easy pace
      compliantRuns++;
    } else if (prescribed === 'tempo' && actualPace >= prescribedZones.tempo * 0.9 && actualPace <= prescribedZones.tempo * 1.1) {
      // Tempo within ±10%
      compliantRuns++;
    } else if (prescribed === 'interval' && actualPace <= prescribedZones.interval * 1.1) {
      // Intervals should be fast (low sec/km). Compliant if within 10% of target
      compliantRuns++;
    }
  }

  const complianceRate = compliantRuns / runs.length;
  return Math.max(1, Math.min(40, Math.round(complianceRate * 40)));
}

/**
 * 8. checkSafetyRails — ACWR, volume spike, missed weeks → status
 */
export function checkSafetyRails(userData: UserSafetyData): SafetyRailStatus {
  const rails: SafetyRail[] = [];

  // 1. ACWR (Acute:Chronic Workload Ratio)
  const acwr = userData.acuteLoad7day / Math.max(1, userData.chronicLoad28day);
  if (acwr > 1.8) rails.push('ACWR_CRITICAL');
  else if (acwr > 1.5) rails.push('ACWR_HIGH');

  // 2. Volume spike
  const avg = Math.max(1, userData.avg4WeekVolume);
  const ratio = userData.currentWeekVolume / avg;
  if (ratio > 1.3) rails.push('VOLUME_DANGER');
  else if (ratio > 1.2) rails.push('VOLUME_SPIKE');

  // 3. Missed weeks
  if (userData.weeksSinceLastRun >= 4) rails.push('EXTENDED_BREAK');

  // Generate message
  const message = generateSafetyMessage(rails);

  return {
    canAdvance: rails.filter(r => r !== 'VOLUME_SPIKE').length === 0,
    // VOLUME_SPIKE is caution only, doesn't block. VOLUME_DANGER blocks.
    activeRails: rails,
    message,
  };
}

function generateSafetyMessage(rails: SafetyRail[]): string {
  if (rails.length === 0) return 'All clear. Keep pushing.';

  const messages: string[] = [];
  if (rails.includes('ACWR_CRITICAL')) {
    messages.push('Load ratio critical. Mandatory rest/easy days recommended.');
  } else if (rails.includes('ACWR_HIGH')) {
    messages.push('Load ratio elevated. Reduce intensity this week.');
  }
  if (rails.includes('VOLUME_DANGER')) {
    messages.push('Volume spike >30% — injury risk high. Scale back.');
  } else if (rails.includes('VOLUME_SPIKE')) {
    messages.push('Volume up >20% vs 4-week average. Monitor closely.');
  }
  if (rails.includes('EXTENDED_BREAK')) {
    messages.push('Extended break detected. Resume at 70% of previous volume.');
  }

  return messages.join(' ');
}

/**
 * 9. checkAdvancement — determines if user advances a level
 *
 * Requirements (ALL must be met):
 * - Score at target level for 3+ consecutive weeks
 * - Performance factor at target
 * - No safety rail violations (blocking ones)
 * - Recovery >= 15/40
 */
export function checkAdvancement(
  currentLevel: LevelResult,
  newScore: number,
  weeksSustained: number,
  safetyStatus: SafetyRailStatus,
  performanceScore?: number,
  recoveryScore?: number
): AdvancementResult {
  const currentNumericLevel = tierToNumeric(currentLevel.tier, currentLevel.subLevel);
  const targetLevel = currentNumericLevel + 1;

  if (targetLevel > 40) {
    return { advances: false, reason: 'Already at maximum level (P10).' };
  }

  // Check: score at target for 3+ consecutive weeks
  if (Math.round(newScore) < targetLevel) {
    return { advances: false, reason: `Score (${newScore.toFixed(1)}) below target level ${targetLevel}.` };
  }

  if (weeksSustained < 3) {
    return { advances: false, reason: `Need 3 consecutive weeks at target. Currently: ${weeksSustained} week(s).` };
  }

  // Check: Performance specifically at target
  if (performanceScore !== undefined) {
    if (performanceScore < targetLevel) {
      return { advances: false, reason: `Performance factor (${performanceScore.toFixed(1)}) below target. Can't advance on volume alone.` };
    }
  }

  // Check: No blocking safety rails
  if (!safetyStatus.canAdvance) {
    return { advances: false, reason: `Safety rail active: ${safetyStatus.activeRails.join(', ')}. ${safetyStatus.message}` };
  }

  // Check: Recovery >= 15/40
  if (recoveryScore !== undefined && recoveryScore < 15) {
    return { advances: false, reason: `Recovery too low (${recoveryScore}/40). Minimum 15 required for advancement.` };
  }

  return { advances: true, reason: 'All advancement criteria met.' };
}

/**
 * 10. checkRegression — determines if user drops a level
 *
 * Rules:
 * - 4 consecutive weeks below current sub-level → drop 1 sub-level
 * - 8 consecutive weeks below tier threshold → tier demotion
 */
export function checkRegression(
  currentLevel: LevelResult,
  newScore: number,
  weeksBelowThreshold: number
): RegressionResult {
  const currentNumeric = tierToNumeric(currentLevel.tier, currentLevel.subLevel);
  const tierFloor = tierToFloor(currentLevel.tier);

  // 8 weeks below tier floor → tier demotion
  if (weeksBelowThreshold >= 8 && Math.round(newScore) < tierFloor) {
    const demotedNumeric = Math.max(1, tierFloor - 1);
    const { tier: newTier, subLevel: newSub } = numericToLevel(demotedNumeric);
    return {
      regresses: true,
      newTier,
      newSubLevel: newSub,
      reason: `${weeksBelowThreshold} weeks below ${currentLevel.tier} threshold. Your status is on hold — let's rebuild.`,
    };
  }

  // 4 weeks below current sub-level → drop 1 sub-level
  if (weeksBelowThreshold >= 4 && Math.round(newScore) < currentNumeric) {
    const droppedNumeric = Math.max(1, currentNumeric - 1);
    const { tier: newTier, subLevel: newSub } = numericToLevel(droppedNumeric);
    return {
      regresses: true,
      newTier,
      newSubLevel: newSub,
      reason: `${weeksBelowThreshold} weeks below current level. Adjusting placement — let's rebuild.`,
    };
  }

  return {
    regresses: false,
    reason: 'Level maintained.',
  };
}

// ============================================================================
// Utility Helpers
// ============================================================================

function tierToNumeric(tier: ClassificationTier, subLevel: number): number {
  const offsets: Record<ClassificationTier, number> = { B: 0, I: 10, A: 20, P: 30 };
  return offsets[tier] + subLevel;
}

function tierToFloor(tier: ClassificationTier): number {
  const floors: Record<ClassificationTier, number> = { B: 1, I: 11, A: 21, P: 31 };
  return floors[tier];
}

function numericToLevel(numeric: number): { tier: ClassificationTier; subLevel: number } {
  const n = Math.max(1, Math.min(40, numeric));
  if (n <= 10) return { tier: 'B', subLevel: n };
  if (n <= 20) return { tier: 'I', subLevel: n - 10 };
  if (n <= 30) return { tier: 'A', subLevel: n - 20 };
  return { tier: 'P', subLevel: n - 30 };
}

/**
 * Convenience: Get tier display name
 */
export function tierDisplayName(tier: ClassificationTier): string {
  const names: Record<ClassificationTier, string> = {
    B: 'Beginner',
    I: 'Intermediate',
    A: 'Advanced',
    P: 'Pro',
  };
  return names[tier];
}

/**
 * Convenience: Full classification from raw user data (all-in-one)
 */
export function classifyRunner(params: {
  bestTimes: BestTimes;
  age: number;
  gender: Gender;
  avgWeeklyKm: number;
  activeWeeksLast12: number;
  totalWeeksOnPlatform: number;
  recovery: RecoveryData;
  vo2max: number;
  vo2maxMeasuredDate?: Date;
  runs: RunForCompliance[];
  prescribedZones: PaceZones;
  hasRaceResult?: boolean;
}): LevelResult & { factors: FactorScores } {
  const performance = normalizePerformance(params.bestTimes, params.age, params.gender);
  const volume = normalizeVolume(params.avgWeeklyKm, params.gender);
  const consistency = normalizeConsistency(params.activeWeeksLast12, params.totalWeeksOnPlatform);
  const recovery = normalizeRecovery(params.recovery);
  const vo2max = normalizeVO2max(params.vo2max, params.gender, params.vo2maxMeasuredDate);
  const paceCompliance = normalizePaceCompliance(params.runs, params.prescribedZones);

  const factors: FactorScores = { performance, volume, consistency, recovery, vo2max, paceCompliance };

  const calibration: CalibrationInput = {
    weeksOnPlatform: Math.round(params.totalWeeksOnPlatform),
    hasRaceResult: params.hasRaceResult ?? false,
  };

  const result = calculateRunnerLevel(factors, calibration);

  return { ...result, factors };
}
