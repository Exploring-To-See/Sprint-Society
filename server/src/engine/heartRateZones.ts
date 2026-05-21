/**
 * Heart Rate Zone Engine
 *
 * Finally USES the heartrate data we've been storing from Strava.
 * Implements Karvonen method (HR reserve) for personalized zones.
 *
 * Zone system based on exercise physiology:
 * - Z1: Recovery (50-60% HRR) — active recovery, warmup
 * - Z2: Aerobic Base (60-70% HRR) — easy runs, long runs, fat burning
 * - Z3: Tempo (70-80% HRR) — marathon pace, lactate threshold approach
 * - Z4: Threshold (80-90% HRR) — tempo runs, lactate threshold
 * - Z5: VO2max (90-100% HRR) — intervals, max effort
 */

interface HRZone {
  zone: number;
  name: string;
  min_bpm: number;
  max_bpm: number;
  min_percent: number;
  max_percent: number;
  description: string;
  training_effect: string;
  feel: string;
}

interface HRProfile {
  max_hr: number;
  resting_hr: number;
  hr_reserve: number;
  zones: HRZone[];
  lactate_threshold_hr: number;
  aerobic_threshold_hr: number;
}

interface HRAnalysis {
  activity_hr_avg: number;
  activity_hr_max: number;
  primary_zone: number;
  zone_distribution: { zone: number; percent: number; minutes: number }[];
  was_in_target: boolean;
  target_zone: number;
  feedback: string;
  efficiency_score: number; // 0-100 (pace relative to HR effort)
}

// ===== HR ZONE CALCULATION (Karvonen Method) =====

export function calculateHRZones(maxHR: number, restingHR?: number): HRProfile {
  // If no resting HR, estimate from age (Tanaka formula inverse isn't great, use 60 as default)
  const restHR = restingHR || 60;
  const reserve = maxHR - restHR;

  // Lactate threshold is typically 85-90% of max HR
  const lthr = Math.round(restHR + reserve * 0.85);
  // Aerobic threshold is typically 75-80% of max HR
  const aerobicThreshold = Math.round(restHR + reserve * 0.73);

  const zones: HRZone[] = [
    {
      zone: 1, name: 'Recovery',
      min_bpm: Math.round(restHR + reserve * 0.50),
      max_bpm: Math.round(restHR + reserve * 0.60),
      min_percent: 50, max_percent: 60,
      description: 'Active recovery and warmup',
      training_effect: 'Promotes blood flow, aids recovery without adding fatigue',
      feel: 'Very easy. Can hold a full conversation. Barely feels like exercise.',
    },
    {
      zone: 2, name: 'Aerobic Base',
      min_bpm: Math.round(restHR + reserve * 0.60),
      max_bpm: Math.round(restHR + reserve * 0.70),
      min_percent: 60, max_percent: 70,
      description: 'Easy runs, long runs — your bread and butter',
      training_effect: 'Builds aerobic engine, fat oxidation, mitochondrial density',
      feel: 'Comfortable. Can speak in full sentences. Could go for hours.',
    },
    {
      zone: 3, name: 'Tempo',
      min_bpm: Math.round(restHR + reserve * 0.70),
      max_bpm: Math.round(restHR + reserve * 0.80),
      min_percent: 70, max_percent: 80,
      description: 'Marathon pace and steady-state efforts',
      training_effect: 'Improves lactate clearance, aerobic capacity',
      feel: 'Comfortably hard. Short sentences only. Sustainable for 30-60 min.',
    },
    {
      zone: 4, name: 'Threshold',
      min_bpm: Math.round(restHR + reserve * 0.80),
      max_bpm: Math.round(restHR + reserve * 0.90),
      min_percent: 80, max_percent: 90,
      description: 'Tempo runs, threshold intervals',
      training_effect: 'Raises lactate threshold, increases speed at threshold',
      feel: 'Hard. Only a few words possible. Sustainable for 20-40 min max.',
    },
    {
      zone: 5, name: 'VO2max',
      min_bpm: Math.round(restHR + reserve * 0.90),
      max_bpm: maxHR,
      min_percent: 90, max_percent: 100,
      description: 'Intervals, hill repeats, race finishing kicks',
      training_effect: 'Maximizes oxygen uptake, neuromuscular power',
      feel: 'Very hard to all-out. Cannot speak. Sustainable for 3-8 minutes.',
    },
  ];

  return {
    max_hr: maxHR,
    resting_hr: restHR,
    hr_reserve: reserve,
    zones,
    lactate_threshold_hr: lthr,
    aerobic_threshold_hr: aerobicThreshold,
  };
}

// ===== ESTIMATE MAX HR =====

export function estimateMaxHR(age: number, method: 'tanaka' | 'gulati' | 'activity_based' = 'tanaka', gender?: string, activityMaxHR?: number): number {
  // If we have actual max HR from activities, use it (most accurate)
  if (activityMaxHR && activityMaxHR > 150) {
    // Actual observed max is likely 95-100% of true max (rare to hit absolute max)
    return Math.round(activityMaxHR * 1.03);
  }

  // Formula-based estimates
  switch (method) {
    case 'tanaka':
      // Tanaka et al. (2001): 208 - 0.7 × age (better than 220-age)
      return Math.round(208 - 0.7 * age);
    case 'gulati':
      // Gulati et al. (2010): 206 - 0.88 × age (for females)
      return Math.round(206 - 0.88 * age);
    default:
      return gender === 'female' ? Math.round(206 - 0.88 * age) : Math.round(208 - 0.7 * age);
  }
}

// ===== ANALYZE ACTIVITY HR =====

export function analyzeActivityHR(
  avgHR: number,
  maxHR: number,
  durationMinutes: number,
  sessionType: string,
  hrProfile: HRProfile,
  actualPacePerKm: number
): HRAnalysis {
  // Determine which zone the average HR falls in
  let primaryZone = 1;
  for (const zone of hrProfile.zones) {
    if (avgHR >= zone.min_bpm && avgHR <= zone.max_bpm) {
      primaryZone = zone.zone;
      break;
    }
    if (avgHR > zone.max_bpm) primaryZone = zone.zone + 1;
  }
  primaryZone = Math.min(5, Math.max(1, primaryZone));

  // Target zone for session type
  const targetZones: Record<string, number> = {
    easy: 2, recovery: 1, long: 2, tempo: 4, interval: 5, fartlek: 3, race: 4,
  };
  const targetZone = targetZones[sessionType] || 2;

  // Was the effort appropriate?
  const wasInTarget = Math.abs(primaryZone - targetZone) <= 1;

  // Feedback
  let feedback: string;
  if (primaryZone > targetZone + 1) {
    feedback = `Too hard for a ${sessionType} run. You were in Zone ${primaryZone} but should be in Zone ${targetZone}. Slow down to protect recovery.`;
  } else if (primaryZone < targetZone - 1) {
    feedback = `Too easy for a ${sessionType} session. Zone ${primaryZone} vs target Zone ${targetZone}. Push harder to get the intended training stimulus.`;
  } else if (wasInTarget) {
    feedback = `Perfect execution. Zone ${primaryZone} is right on target for ${sessionType} work.`;
  } else {
    feedback = `Close enough. Zone ${primaryZone} vs target ${targetZone} — minor deviation.`;
  }

  // Cardiac efficiency: pace achieved per unit of HR effort
  // Lower pace (faster) at lower HR = more efficient
  const hrPercent = avgHR / hrProfile.max_hr;
  const expectedPaceAtHR = hrPercent < 0.65 ? 400 : hrPercent < 0.75 ? 340 : hrPercent < 0.85 ? 300 : 260;
  const efficiencyRatio = expectedPaceAtHR / Math.max(actualPacePerKm, 180);
  const efficiencyScore = Math.round(Math.min(100, efficiencyRatio * 100));

  // Estimate zone distribution (simplified — from avg and max)
  const zoneDistribution = estimateZoneDistribution(avgHR, maxHR, durationMinutes, hrProfile);

  return {
    activity_hr_avg: avgHR,
    activity_hr_max: maxHR,
    primary_zone: primaryZone,
    zone_distribution: zoneDistribution,
    was_in_target: wasInTarget,
    target_zone: targetZone,
    feedback,
    efficiency_score: efficiencyScore,
  };
}

function estimateZoneDistribution(
  avgHR: number,
  maxHR: number,
  durationMinutes: number,
  hrProfile: HRProfile
): { zone: number; percent: number; minutes: number }[] {
  // Without second-by-second HR data, estimate from avg + max
  // Assume normal-ish distribution around avg
  const distribution: { zone: number; percent: number; minutes: number }[] = [];

  for (const zone of hrProfile.zones) {
    const zoneMid = (zone.min_bpm + zone.max_bpm) / 2;
    const distFromAvg = Math.abs(zoneMid - avgHR);
    const spread = (maxHR - avgHR) * 0.8;

    // Gaussian-like weighting
    let weight = Math.exp(-0.5 * Math.pow(distFromAvg / Math.max(spread, 10), 2));
    // Boost if max HR reached this zone
    if (maxHR >= zone.min_bpm && zone.zone >= 4) weight += 0.1;

    distribution.push({
      zone: zone.zone,
      percent: 0, // calculated after normalization
      minutes: 0,
    });
    (distribution[distribution.length - 1] as any)._weight = weight;
  }

  // Normalize to 100%
  const totalWeight = distribution.reduce((s, d) => s + ((d as any)._weight || 0), 0);
  for (const d of distribution) {
    const w = (d as any)._weight || 0;
    d.percent = Math.round((w / totalWeight) * 100);
    d.minutes = Math.round((d.percent / 100) * durationMinutes);
    delete (d as any)._weight;
  }

  return distribution;
}

// ===== AEROBIC DECOUPLING (Pa:Hr — Pace to HR ratio drift) =====

export function detectAerobicDecoupling(
  firstHalfAvgHR: number,
  secondHalfAvgHR: number,
  firstHalfAvgPace: number,
  secondHalfAvgPace: number
): { decoupling_percent: number; assessment: string; is_concerning: boolean } {
  // Aerobic decoupling: if HR rises while pace stays same (or pace drops while HR stays same)
  // Good aerobic fitness = <5% decoupling on long runs
  const hrRatio = secondHalfAvgHR / firstHalfAvgHR;
  const paceRatio = secondHalfAvgPace / firstHalfAvgPace;

  // Combined decoupling metric (Joe Friel method)
  const decoupling = ((hrRatio / paceRatio) - 1) * 100;

  let assessment: string;
  let concerning: boolean;

  if (decoupling < 3) {
    assessment = 'Excellent aerobic fitness. Minimal cardiac drift.';
    concerning = false;
  } else if (decoupling < 5) {
    assessment = 'Good aerobic base. Slight drift is normal for long efforts.';
    concerning = false;
  } else if (decoupling < 8) {
    assessment = 'Moderate decoupling. More aerobic base training needed, or pace was too fast.';
    concerning = true;
  } else {
    assessment = 'Significant decoupling. Either too fast for aerobic effort, dehydrated, or insufficient base fitness.';
    concerning = true;
  }

  return { decoupling_percent: Math.round(decoupling * 10) / 10, assessment, is_concerning: concerning };
}
