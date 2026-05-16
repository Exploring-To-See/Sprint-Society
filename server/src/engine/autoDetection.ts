/**
 * Auto-Detection Engine
 *
 * Automatically detects:
 * - Training session completion (from synced run data)
 * - Challenge completion (from activity patterns)
 * - Runner profile/level (from run history)
 * - Fitness improvements (trend analysis)
 *
 * ZERO manual "Done" buttons for running activities.
 * The app KNOWS you ran because it has the data.
 */

interface Activity {
  id: number;
  user_id: number;
  distance_meters: number;
  moving_time_seconds: number;
  average_pace_per_km: number;
  average_heartrate?: number;
  max_heartrate?: number;
  elevation_gain?: number;
  start_date: string;
}

interface PlannedSession {
  day: number;
  type: string;
  distance_km?: number;
  duration_minutes?: number;
  target_pace_per_km?: number;
  intervals?: { reps: number; distance_m: number; pace_per_km: number };
}

interface Challenge {
  id: number;
  category: string;
  requirement_type?: string;
  target_value?: number;
  target_unit?: string;
}

// ===== SESSION AUTO-MATCHING =====

export function matchActivityToSession(
  activity: Activity,
  plannedSession: PlannedSession
): { matched: boolean; confidence: number; reason: string } {

  if (plannedSession.type === 'rest' || plannedSession.type === 'cross_training') {
    return { matched: false, confidence: 0, reason: 'Not a running session' };
  }

  const activityDistKm = activity.distance_meters / 1000;
  let confidence = 0;
  const reasons: string[] = [];

  // Distance match (±20% tolerance)
  if (plannedSession.distance_km) {
    const distRatio = activityDistKm / plannedSession.distance_km;
    if (distRatio >= 0.8 && distRatio <= 1.3) {
      confidence += 40;
      reasons.push('distance matched');
    } else if (distRatio >= 0.6 && distRatio <= 1.5) {
      confidence += 20;
      reasons.push('distance roughly matched');
    }
  } else {
    confidence += 20; // No distance specified = more lenient
  }

  // Pace match (within zone tolerance)
  if (plannedSession.target_pace_per_km && activity.average_pace_per_km) {
    const paceRatio = activity.average_pace_per_km / plannedSession.target_pace_per_km;

    if (plannedSession.type === 'easy' || plannedSession.type === 'recovery') {
      // Easy/recovery: anything slower than target is fine
      if (paceRatio >= 0.9 && paceRatio <= 1.3) {
        confidence += 30;
        reasons.push('pace in easy zone');
      }
    } else if (plannedSession.type === 'tempo') {
      // Tempo: should be close to target (±10%)
      if (paceRatio >= 0.9 && paceRatio <= 1.1) {
        confidence += 35;
        reasons.push('pace matched tempo target');
      } else if (paceRatio >= 0.85 && paceRatio <= 1.15) {
        confidence += 20;
        reasons.push('pace near tempo zone');
      }
    } else if (plannedSession.type === 'interval' || plannedSession.type === 'fartlek') {
      // Intervals: average pace will be mixed, so be lenient
      if (paceRatio >= 0.85 && paceRatio <= 1.2) {
        confidence += 25;
        reasons.push('pace consistent with speed work');
      }
    } else if (plannedSession.type === 'long') {
      // Long run: should be easy-moderate pace
      if (paceRatio >= 0.95 && paceRatio <= 1.25) {
        confidence += 30;
        reasons.push('pace in long run zone');
      }
    }
  } else {
    confidence += 15;
  }

  // Duration match (if specified)
  if (plannedSession.duration_minutes) {
    const actDuration = activity.moving_time_seconds / 60;
    const durRatio = actDuration / plannedSession.duration_minutes;
    if (durRatio >= 0.7 && durRatio <= 1.4) {
      confidence += 20;
      reasons.push('duration matched');
    }
  }

  // Day-of-week match bonus
  const activityDay = new Date(activity.start_date).getDay() || 7;
  if (activityDay === plannedSession.day) {
    confidence += 10;
    reasons.push('ran on planned day');
  }

  const matched = confidence >= 50;

  return {
    matched,
    confidence: Math.min(100, confidence),
    reason: matched ? reasons.join(', ') : 'No strong match to planned session',
  };
}

// ===== CHALLENGE AUTO-COMPLETION =====

export function checkChallengeCompletion(
  challenge: Challenge,
  recentActivities: Activity[]
): { completed: boolean; reason: string } {

  // Only auto-complete running-related challenges
  const autoCategories = ['running', 'technique', 'gear'];
  if (!autoCategories.includes(challenge.category)) {
    return { completed: false, reason: 'Requires manual confirmation (non-running challenge)' };
  }

  if (!challenge.target_value) {
    return { completed: false, reason: 'No measurable target' };
  }

  // Running challenges: check if any recent activity matches
  if (challenge.category === 'running') {
    const targetUnit = challenge.target_unit || '';

    if (targetUnit.includes('km') || targetUnit.includes('m')) {
      // Distance-based challenge
      const targetMeters = targetUnit.includes('km') ? challenge.target_value * 1000 : challenge.target_value;
      const matchingRun = recentActivities.find(a => a.distance_meters >= targetMeters * 0.9);
      if (matchingRun) {
        return { completed: true, reason: `Ran ${(matchingRun.distance_meters / 1000).toFixed(1)}km (target: ${(targetMeters / 1000).toFixed(1)}km)` };
      }
    }

    if (targetUnit.includes('/km') || targetUnit.includes('pace')) {
      // Pace-based challenge
      const matchingRun = recentActivities.find(a =>
        a.average_pace_per_km <= challenge.target_value! && a.distance_meters >= 1000
      );
      if (matchingRun) {
        return { completed: true, reason: `Ran at ${formatPace(matchingRun.average_pace_per_km)}/km (target: ${formatPace(challenge.target_value)}/km)` };
      }
    }

    if (targetUnit.includes('min')) {
      // Duration-based challenge
      const targetSeconds = challenge.target_value * 60;
      const matchingRun = recentActivities.find(a => a.moving_time_seconds >= targetSeconds * 0.9);
      if (matchingRun) {
        return { completed: true, reason: `Ran for ${Math.round(matchingRun.moving_time_seconds / 60)} minutes` };
      }
    }
  }

  return { completed: false, reason: 'Target not yet reached' };
}

// ===== RUNNER PROFILE AUTO-DETECTION =====

export function detectRunnerProfile(activities: Activity[]): {
  estimated_level: 'none' | 'beginner' | 'intermediate' | 'advanced';
  weekly_volume_km: number;
  avg_pace_per_km: number;
  consistency_score: number; // 0-100
  longest_run_km: number;
  runs_per_week: number;
  has_speed_work: boolean;
  has_long_runs: boolean;
  trend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
  summary: string;
} {
  if (activities.length === 0) {
    return {
      estimated_level: 'none',
      weekly_volume_km: 0,
      avg_pace_per_km: 0,
      consistency_score: 0,
      longest_run_km: 0,
      runs_per_week: 0,
      has_speed_work: false,
      has_long_runs: false,
      trend: 'insufficient_data',
      summary: 'No run data available. Connect Strava or start running to get your personalized plan.',
    };
  }

  // Calculate weekly stats from last 8 weeks
  const eightWeeksAgo = Date.now() - 56 * 86400000;
  const recent = activities.filter(a => new Date(a.start_date).getTime() > eightWeeksAgo);
  const weeks = Math.max(1, Math.min(8, Math.ceil((Date.now() - new Date(activities[activities.length - 1]?.start_date || Date.now()).getTime()) / (7 * 86400000))));

  const totalDist = recent.reduce((s, a) => s + a.distance_meters, 0);
  const weeklyVolume = totalDist / (weeks * 1000);
  const runsPerWeek = recent.length / weeks;
  const avgPace = recent.length > 0
    ? recent.reduce((s, a) => s + a.average_pace_per_km, 0) / recent.length
    : 0;
  const longestRun = Math.max(...activities.map(a => a.distance_meters)) / 1000;

  // Detect speed work (any run with pace < 80% of average)
  const hasSpeedWork = recent.some(a => a.average_pace_per_km < avgPace * 0.85);

  // Detect long runs (any run > 1.5x average distance)
  const avgDist = totalDist / Math.max(1, recent.length);
  const hasLongRuns = recent.some(a => a.distance_meters > avgDist * 1.4);

  // Consistency: how many weeks out of 8 had at least 2 runs?
  const weekBuckets = new Map<number, number>();
  for (const a of recent) {
    const weekNum = Math.floor((Date.now() - new Date(a.start_date).getTime()) / (7 * 86400000));
    weekBuckets.set(weekNum, (weekBuckets.get(weekNum) || 0) + 1);
  }
  const activeWeeks = [...weekBuckets.values()].filter(count => count >= 2).length;
  const consistencyScore = Math.round((activeWeeks / Math.min(8, weeks)) * 100);

  // Trend: compare first half pace vs second half pace
  let trend: 'improving' | 'stable' | 'declining' | 'insufficient_data' = 'insufficient_data';
  if (recent.length >= 6) {
    const half = Math.floor(recent.length / 2);
    const firstHalfPace = recent.slice(half).reduce((s, a) => s + a.average_pace_per_km, 0) / (recent.length - half);
    const secondHalfPace = recent.slice(0, half).reduce((s, a) => s + a.average_pace_per_km, 0) / half;
    const diff = firstHalfPace - secondHalfPace;
    if (diff > 5) trend = 'improving'; // pace decreasing = getting faster
    else if (diff < -5) trend = 'declining';
    else trend = 'stable';
  }

  // Level detection
  let level: 'none' | 'beginner' | 'intermediate' | 'advanced';
  if (weeklyVolume >= 50 && avgPace < 300 && runsPerWeek >= 5) {
    level = 'advanced';
  } else if (weeklyVolume >= 20 && avgPace < 360 && runsPerWeek >= 3) {
    level = 'intermediate';
  } else if (recent.length >= 3) {
    level = 'beginner';
  } else {
    level = 'none';
  }

  // Human-readable summary
  const summaries = {
    advanced: `Strong runner. ${weeklyVolume.toFixed(0)}km/week at ${formatPace(avgPace)}/km with ${runsPerWeek.toFixed(1)} runs/week. Ready for race-specific training.`,
    intermediate: `Solid foundation. ${weeklyVolume.toFixed(0)}km/week at ${formatPace(avgPace)}/km. Room to grow in volume and speed work.`,
    beginner: `Building the habit. ${weeklyVolume.toFixed(0)}km/week at ${formatPace(avgPace)}/km. Focus on consistency and easy miles.`,
    none: 'Just getting started. Every run counts — the algorithm will calibrate quickly after 3+ runs.',
  };

  return {
    estimated_level: level,
    weekly_volume_km: Math.round(weeklyVolume * 10) / 10,
    avg_pace_per_km: Math.round(avgPace),
    consistency_score: consistencyScore,
    longest_run_km: Math.round(longestRun * 10) / 10,
    runs_per_week: Math.round(runsPerWeek * 10) / 10,
    has_speed_work: hasSpeedWork,
    has_long_runs: hasLongRuns,
    trend,
    summary: summaries[level],
  };
}

// ===== AUTO-SYNC HANDLER =====
// Call this every time a new activity syncs from Strava

export function processNewActivity(
  activity: Activity,
  currentWeekSessions: PlannedSession[],
  activeChallenges: Challenge[],
  recentActivities: Activity[]
): {
  session_matched: boolean;
  session_match_confidence: number;
  challenges_completed: number[];
  xp_earned: number;
  summary: string;
} {
  let xpEarned = 0;
  const completedChallengeIds: number[] = [];
  let sessionMatched = false;
  let matchConfidence = 0;

  // 1. Try to match to a planned session
  for (const session of currentWeekSessions) {
    const match = matchActivityToSession(activity, session);
    if (match.matched && match.confidence > matchConfidence) {
      sessionMatched = true;
      matchConfidence = match.confidence;
      xpEarned += 30; // Session completion XP
    }
  }

  // 2. Check challenge completions
  const allActivities = [activity, ...recentActivities];
  for (const challenge of activeChallenges) {
    const result = checkChallengeCompletion(challenge, allActivities);
    if (result.completed) {
      completedChallengeIds.push(challenge.id);
      xpEarned += 50; // Challenge XP (will be overridden by actual challenge XP reward)
    }
  }

  // 3. Base XP for any run
  const distKm = activity.distance_meters / 1000;
  xpEarned += Math.round(distKm * 10); // 10 XP per km

  const summary = sessionMatched
    ? `Matched planned session (${matchConfidence}% confidence). +${xpEarned} XP.`
    : `Run logged. +${xpEarned} XP.`;

  return {
    session_matched: sessionMatched,
    session_match_confidence: matchConfidence,
    challenges_completed: completedChallengeIds,
    xp_earned: xpEarned,
    summary,
  };
}

function formatPace(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}
