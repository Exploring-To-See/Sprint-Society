/**
 * Adaptive Training Engine
 *
 * This is what makes Sprint Society genuinely better than Nike/Strava.
 * Plans aren't static PDFs — they REACT to how you actually run.
 *
 * Core principle: Every synced run triggers plan re-evaluation.
 * - Crushed a tempo? Next week gets slightly harder intervals.
 * - Missed 2 runs? Extend the plan, reduce volume, don't punish.
 * - HR too high on easy day? Flag overreaching, suggest deload.
 * - Consistently faster than target? Bump VDOT estimate up.
 */

import { estimateVDOT, getTrainingPaces, type TrainingPaces } from './trainingPlanGenerator';

interface CompletedSession {
  planned_type: string;
  planned_distance_km: number;
  planned_pace_per_km: number;
  actual_distance_km: number;
  actual_pace_per_km: number;
  actual_heartrate_avg?: number;
  actual_heartrate_max?: number;
  date: string;
  rpe_reported?: number;
}

interface AdaptationSignal {
  type: 'overperformance' | 'underperformance' | 'missed_session' | 'overreaching' | 'hr_drift' | 'consistency_bonus';
  severity: number; // 0-1
  description: string;
  recommendation: string;
}

interface WeekAdaptation {
  original_volume_km: number;
  adapted_volume_km: number;
  volume_change_percent: number;
  intensity_shift: 'harder' | 'same' | 'easier';
  pace_adjustments: Partial<TrainingPaces>;
  signals: AdaptationSignal[];
  confidence: number;
  summary: string;
}

interface LoadMetrics {
  acute_load: number;      // Last 7 days (ATL)
  chronic_load: number;    // Last 28 days (CTL)
  training_stress_balance: number; // CTL - ATL (freshness)
  monotony: number;        // How repetitive (lower = more varied)
  strain: number;          // Load × monotony (injury risk indicator)
  injury_risk: 'low' | 'moderate' | 'high' | 'critical';
}

// ===== TRAINING LOAD (TSS-lite without power meter) =====

export function calculateTrainingLoad(
  activities: { distance_meters: number; moving_time_seconds: number; average_heartrate?: number; start_date: string; activity_type?: string }[],
  userMaxHR?: number
): LoadMetrics {
  const now = Date.now();
  const sevenDays = 7 * 86400000;
  const twentyEightDays = 28 * 86400000;

  const last7 = activities.filter(a => now - new Date(a.start_date).getTime() < sevenDays);
  const last28 = activities.filter(a => now - new Date(a.start_date).getTime() < twentyEightDays);

  // Load = duration × intensity factor
  // Intensity from HR if available, otherwise from pace relative to easy pace
  // Cross-training activities contribute at 0.5x load (still stresses the body, but less running-specific)
  const RUNNING_TYPES = ['Run', 'TrailRun', 'VirtualRun'];
  const calculateSessionLoad = (a: typeof activities[0]): number => {
    const durationHours = a.moving_time_seconds / 3600;
    let intensity = 1.0;

    if (a.average_heartrate && userMaxHR) {
      const hrPercent = a.average_heartrate / userMaxHR;
      // Banister TRIMP-like: exponential weighting of HR intensity
      intensity = hrPercent < 0.6 ? 0.5 :
                  hrPercent < 0.7 ? 1.0 :
                  hrPercent < 0.8 ? 1.5 :
                  hrPercent < 0.9 ? 2.5 :
                  4.0;
    } else {
      // Estimate from pace/distance (less accurate)
      const pacePerKm = a.moving_time_seconds / (a.distance_meters / 1000);
      intensity = pacePerKm < 270 ? 3.0 :  // sub 4:30 = hard
                  pacePerKm < 320 ? 2.0 :  // 5:00-5:20 = moderate-hard
                  pacePerKm < 370 ? 1.2 :  // 6:00-6:10 = moderate
                  1.0;                       // easy
    }

    // Non-running activities contribute at 50% load
    const crossTrainMultiplier = RUNNING_TYPES.includes(a.activity_type || 'Run') ? 1.0 : 0.5;

    return Math.round(durationHours * intensity * crossTrainMultiplier * 100);
  };

  const dailyLoads7: number[] = [];
  for (let d = 0; d < 7; d++) {
    const dayStart = now - (d + 1) * 86400000;
    const dayEnd = now - d * 86400000;
    const dayActivities = last7.filter(a => {
      const t = new Date(a.start_date).getTime();
      return t >= dayStart && t < dayEnd;
    });
    dailyLoads7.push(dayActivities.reduce((sum, a) => sum + calculateSessionLoad(a), 0));
  }

  const acuteLoad = Math.round(dailyLoads7.reduce((s, l) => s + l, 0) / 7);
  const chronicLoad = Math.round(last28.reduce((sum, a) => sum + calculateSessionLoad(a), 0) / 28);
  const tsb = chronicLoad - acuteLoad;

  // Monotony: SD of daily loads (low variation = high monotony = injury risk)
  const mean7 = dailyLoads7.reduce((s, l) => s + l, 0) / 7;
  const variance = dailyLoads7.reduce((s, l) => s + Math.pow(l - mean7, 2), 0) / 7;
  const sd = Math.sqrt(variance);
  const monotony = mean7 > 0 ? Math.round((mean7 / Math.max(sd, 1)) * 100) / 100 : 0;
  const strain = Math.round(acuteLoad * monotony);

  // Injury risk assessment
  const acuteChronicRatio = chronicLoad > 0 ? acuteLoad / chronicLoad : 1;
  let injuryRisk: LoadMetrics['injury_risk'];
  if (acuteChronicRatio > 1.5 || strain > 400) injuryRisk = 'critical';
  else if (acuteChronicRatio > 1.3 || strain > 300) injuryRisk = 'high';
  else if (acuteChronicRatio > 1.1 || monotony > 2.0) injuryRisk = 'moderate';
  else injuryRisk = 'low';

  return { acute_load: acuteLoad, chronic_load: chronicLoad, training_stress_balance: tsb, monotony, strain, injury_risk: injuryRisk };
}

// ===== PLAN ADAPTATION LOGIC =====

export function analyzeWeekPerformance(
  completedSessions: CompletedSession[],
  plannedSessions: number, // how many were planned
  userMaxHR?: number
): AdaptationSignal[] {
  const signals: AdaptationSignal[] = [];

  if (completedSessions.length === 0 && plannedSessions > 0) {
    signals.push({
      type: 'missed_session',
      severity: 1.0,
      description: 'No training completed this week',
      recommendation: 'Reduce next week volume by 30%. Check in — life happens.',
    });
    return signals;
  }

  // Missed sessions
  const completionRate = completedSessions.length / Math.max(1, plannedSessions);
  if (completionRate < 0.6) {
    signals.push({
      type: 'missed_session',
      severity: 0.7,
      description: `Only ${completedSessions.length}/${plannedSessions} sessions completed`,
      recommendation: 'Reduce next week to match achievable frequency.',
    });
  }

  // Pace analysis per session type
  for (const session of completedSessions) {
    if (!session.planned_pace_per_km || !session.actual_pace_per_km) continue;

    const paceRatio = session.actual_pace_per_km / session.planned_pace_per_km;

    if (session.planned_type === 'easy' || session.planned_type === 'recovery') {
      // Easy runs too fast = overreaching sign
      if (paceRatio < 0.88) {
        signals.push({
          type: 'overreaching',
          severity: 0.6,
          description: `Easy run was too fast (${formatPace(session.actual_pace_per_km)} vs planned ${formatPace(session.planned_pace_per_km)})`,
          recommendation: 'Slow down easy days. Fast easy runs = poor recovery.',
        });
      }
    } else if (session.planned_type === 'tempo' || session.planned_type === 'interval') {
      // Hard sessions crushed = VDOT may be underestimated
      if (paceRatio < 0.92) {
        signals.push({
          type: 'overperformance',
          severity: 0.5,
          description: `${session.planned_type} run significantly faster than target`,
          recommendation: 'Fitness is higher than estimated. Bumping pace targets.',
        });
      }
      // Hard sessions significantly missed = fatigue or overtraining
      if (paceRatio > 1.12) {
        signals.push({
          type: 'underperformance',
          severity: 0.5,
          description: `${session.planned_type} run slower than target (${formatPace(session.actual_pace_per_km)} vs ${formatPace(session.planned_pace_per_km)})`,
          recommendation: 'May need more recovery. Consider extra easy day.',
        });
      }
    }

    // HR drift detection (HR too high for given pace = fatigue/overreaching)
    if (session.actual_heartrate_avg && userMaxHR) {
      const hrPercent = session.actual_heartrate_avg / userMaxHR;
      if ((session.planned_type === 'easy' || session.planned_type === 'long') && hrPercent > 0.8) {
        signals.push({
          type: 'hr_drift',
          severity: 0.7,
          description: `Heart rate too high (${Math.round(hrPercent * 100)}% of max) on ${session.planned_type} run`,
          recommendation: 'Cardiac drift detected. May be fatigued, dehydrated, or overreaching.',
        });
      }
    }
  }

  // Consistency bonus
  if (completionRate >= 0.9 && signals.filter(s => s.type === 'underperformance').length === 0) {
    signals.push({
      type: 'consistency_bonus',
      severity: 0.3,
      description: 'Excellent week — consistent execution',
      recommendation: 'Keep it up. Small volume increase next week.',
    });
  }

  return signals;
}

// ===== GENERATE ADAPTED WEEK =====

export function adaptNextWeek(
  signals: AdaptationSignal[],
  currentWeekVolume: number,
  currentPaces: TrainingPaces,
  loadMetrics: LoadMetrics
): WeekAdaptation {
  let volumeMultiplier = 1.0;
  let intensityShift: 'harder' | 'same' | 'easier' = 'same';
  const paceAdjustments: Partial<TrainingPaces> = {};

  // Process signals
  for (const signal of signals) {
    switch (signal.type) {
      case 'overperformance':
        // Slightly advance paces (1-3% faster)
        const improvement = Math.min(0.03, signal.severity * 0.04);
        paceAdjustments.tempo = Math.round(currentPaces.tempo * (1 - improvement));
        paceAdjustments.interval = Math.round(currentPaces.interval * (1 - improvement));
        volumeMultiplier = Math.min(volumeMultiplier * 1.05, 1.12); // Max 12% volume bump
        intensityShift = 'harder';
        break;

      case 'underperformance':
        // Ease back (2-5% slower)
        const regression = Math.min(0.05, signal.severity * 0.06);
        paceAdjustments.tempo = Math.round(currentPaces.tempo * (1 + regression));
        paceAdjustments.interval = Math.round(currentPaces.interval * (1 + regression));
        intensityShift = 'easier';
        break;

      case 'missed_session':
        // Reduce volume proportionally
        volumeMultiplier *= (1 - signal.severity * 0.3);
        intensityShift = 'easier';
        break;

      case 'overreaching':
      case 'hr_drift':
        // Force easier week
        volumeMultiplier *= 0.85;
        intensityShift = 'easier';
        paceAdjustments.easy_min = Math.round(currentPaces.easy_min * 1.03); // Slow down easy pace
        paceAdjustments.easy_max = Math.round(currentPaces.easy_max * 1.03);
        break;

      case 'consistency_bonus':
        volumeMultiplier = Math.min(volumeMultiplier * 1.08, 1.12);
        break;
    }
  }

  // Override with load metrics safety
  if (loadMetrics.injury_risk === 'critical') {
    volumeMultiplier = 0.6; // Force deload
    intensityShift = 'easier';
  } else if (loadMetrics.injury_risk === 'high') {
    volumeMultiplier = Math.min(volumeMultiplier, 0.85);
    intensityShift = 'easier';
  }

  // TSB check: if deeply fatigued (TSB < -20), force rest
  if (loadMetrics.training_stress_balance < -20) {
    volumeMultiplier = Math.min(volumeMultiplier, 0.7);
    intensityShift = 'easier';
  }

  const adaptedVolume = Math.round(currentWeekVolume * volumeMultiplier);
  const volumeChange = Math.round((volumeMultiplier - 1) * 100);

  // Build summary
  const summaryParts: string[] = [];
  if (volumeChange > 5) summaryParts.push(`+${volumeChange}% volume (earned it)`);
  else if (volumeChange < -5) summaryParts.push(`${volumeChange}% volume (recovery priority)`);
  if (intensityShift === 'harder') summaryParts.push('paces bumped slightly');
  if (intensityShift === 'easier') summaryParts.push('backing off intensity');
  if (loadMetrics.injury_risk !== 'low') summaryParts.push(`injury risk: ${loadMetrics.injury_risk}`);

  return {
    original_volume_km: currentWeekVolume,
    adapted_volume_km: adaptedVolume,
    volume_change_percent: volumeChange,
    intensity_shift: intensityShift,
    pace_adjustments: paceAdjustments,
    signals,
    confidence: signals.length > 0 ? 0.8 : 0.5,
    summary: summaryParts.length > 0 ? summaryParts.join(' | ') : 'Staying the course — no adaptation needed.',
  };
}

// ===== VDOT EVOLUTION (Track fitness over time) =====

export function trackVDOTProgression(
  runHistory: { distance_meters: number; moving_time_seconds: number; average_pace_per_km: number; start_date: string }[]
): { current_vdot: number; vdot_4_weeks_ago: number; vdot_trend: 'improving' | 'stable' | 'declining'; weekly_vdots: { week: string; vdot: number }[] } {
  const now = Date.now();
  const weeklyVdots: { week: string; vdot: number }[] = [];

  // Calculate VDOT for each of the last 8 weeks
  for (let w = 0; w < 8; w++) {
    const weekEnd = now - w * 7 * 86400000;
    const weekStart = weekEnd - 6 * 7 * 86400000; // 6-week lookback window for each estimate
    const windowRuns = runHistory.filter(r => {
      const t = new Date(r.start_date).getTime();
      return t >= weekStart && t <= weekEnd;
    });

    if (windowRuns.length >= 2) {
      const vdot = estimateVDOT(windowRuns);
      const weekLabel = new Date(weekEnd).toISOString().split('T')[0];
      weeklyVdots.unshift({ week: weekLabel, vdot });
    }
  }

  const currentVdot = weeklyVdots.length > 0 ? weeklyVdots[weeklyVdots.length - 1].vdot : 30;
  const fourWeeksAgoVdot = weeklyVdots.length >= 4 ? weeklyVdots[weeklyVdots.length - 4].vdot : currentVdot;
  const diff = currentVdot - fourWeeksAgoVdot;

  let trend: 'improving' | 'stable' | 'declining';
  if (diff >= 1) trend = 'improving';
  else if (diff <= -1) trend = 'declining';
  else trend = 'stable';

  return { current_vdot: currentVdot, vdot_4_weeks_ago: fourWeeksAgoVdot, vdot_trend: trend, weekly_vdots: weeklyVdots };
}

function formatPace(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

// ===== DETRAINING DETECTION =====

export interface DetrainingStatus {
  detected: boolean;
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  days_inactive: number;
  fitness_loss_percent: number;
  vdot_adjustment: number;
  recommendation: string;
}

export function detectDetraining(lastActivityDate: string | null): DetrainingStatus {
  if (!lastActivityDate) {
    return { detected: false, severity: 'none', days_inactive: 0, fitness_loss_percent: 0, vdot_adjustment: 0, recommendation: '' };
  }

  const daysSinceLastRun = Math.floor((Date.now() - new Date(lastActivityDate).getTime()) / 86400000);

  if (daysSinceLastRun <= 3) {
    return { detected: false, severity: 'none', days_inactive: daysSinceLastRun, fitness_loss_percent: 0, vdot_adjustment: 0, recommendation: '' };
  }

  // Detraining science (from exercise physiology literature):
  // - VO2max declines ~0.5% per day after day 4 of inactivity
  // - Mitochondrial density drops measurably after 7 days
  // - Capillary density starts declining after 14 days
  // - Full detraining (return to baseline) takes 4-8 weeks of inactivity

  let severity: 'mild' | 'moderate' | 'severe';
  let fitnessLossPercent: number;
  let vdotAdjustment: number;
  let recommendation: string;

  if (daysSinceLastRun <= 7) {
    severity = 'mild';
    fitnessLossPercent = Math.round((daysSinceLastRun - 3) * 0.5);
    vdotAdjustment = -1;
    recommendation = 'Welcome back. Start with 2-3 easy runs this week before resuming plan intensity.';
  } else if (daysSinceLastRun <= 14) {
    severity = 'moderate';
    fitnessLossPercent = Math.round(2 + (daysSinceLastRun - 7) * 1.0);
    vdotAdjustment = -2;
    recommendation = 'Fitness has declined. Take 1 week of easy running before resuming structured training. Reduce target paces by 10-15s/km.';
  } else {
    severity = 'severe';
    fitnessLossPercent = Math.min(25, Math.round(9 + (daysSinceLastRun - 14) * 0.8));
    vdotAdjustment = Math.min(-5, Math.round(-2 - (daysSinceLastRun - 14) * 0.3));
    recommendation = 'Extended break detected. Rebuilding phase recommended: 2 weeks easy running, then gradual return to plan. Plan timeline extended.';
  }

  return {
    detected: true,
    severity,
    days_inactive: daysSinceLastRun,
    fitness_loss_percent: fitnessLossPercent,
    vdot_adjustment: vdotAdjustment,
    recommendation,
  };
}

// ===== RUNNING ECONOMY =====

export interface RunningEconomy {
  current_economy: number | null;
  trend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
  change_percent: number;
  description: string;
}

export function calculateRunningEconomy(
  activities: { average_pace_per_km: number; average_heartrate?: number; start_date: string }[]
): RunningEconomy {
  // Running economy = pace achieved at a given HR intensity
  // If you run faster at the same HR, your economy improved
  const runsWithHR = activities
    .filter(a => a.average_heartrate && a.average_heartrate > 100 && a.average_pace_per_km > 0)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

  if (runsWithHR.length < 6) {
    return { current_economy: null, trend: 'insufficient_data', change_percent: 0, description: 'Need 6+ runs with HR data to calculate economy.' };
  }

  // Compare pace-per-HR-beat for first half vs second half of runs
  const midpoint = Math.floor(runsWithHR.length / 2);
  const firstHalf = runsWithHR.slice(0, midpoint);
  const secondHalf = runsWithHR.slice(midpoint);

  // Economy metric: pace (sec/km) / HR (bpm) — lower = more efficient
  const avgEconomyFirst = firstHalf.reduce((s, r) => s + (r.average_pace_per_km / r.average_heartrate!), 0) / firstHalf.length;
  const avgEconomySecond = secondHalf.reduce((s, r) => s + (r.average_pace_per_km / r.average_heartrate!), 0) / secondHalf.length;

  const changePercent = Math.round(((avgEconomyFirst - avgEconomySecond) / avgEconomyFirst) * 100 * 10) / 10;

  let trend: 'improving' | 'stable' | 'declining';
  let description: string;

  if (changePercent > 2) {
    trend = 'improving';
    description = `Running economy improved ${changePercent}%: faster pace at similar HR over last ${runsWithHR.length} runs.`;
  } else if (changePercent < -2) {
    trend = 'declining';
    description = `Running economy declined ${Math.abs(changePercent)}%: consider more easy aerobic runs to rebuild efficiency.`;
  } else {
    trend = 'stable';
    description = 'Running economy is stable. Consistent training maintaining efficiency.';
  }

  return {
    current_economy: Math.round(avgEconomySecond * 1000) / 1000,
    trend,
    change_percent: changePercent,
    description,
  };
}
