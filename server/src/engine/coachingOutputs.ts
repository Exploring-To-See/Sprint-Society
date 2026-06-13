/**
 * Structured Coaching Outputs — Deterministic Coaching Content
 *
 * Generates weekly summaries, pre-run briefs, and post-run analyses
 * using pure rule-based logic. No LLM dependency.
 */

import db from '../database/pg';

// --- Types ---

export interface WeeklySummary {
  totalKm: number;
  totalRuns: number;
  avgPace: number; // seconds/km
  paceChange: number; // seconds diff from previous week (negative = faster)
  streakDays: number;
  kenduEarned: number;
  topAchievement: string | null;
  nextGoal: string;
}

export interface EnvironmentalContext {
  has_alert: boolean;
  temperature_warning: string | null;
  aqi_warning: string | null;
  pace_adjustment_percent: number;
  tips: string[];
}

export interface PreRunBrief {
  suggestedDistance: number; // km
  suggestedPace: string; // formatted "M:SS"
  warmupTip: string;
  focusArea: string;
  environment?: EnvironmentalContext;
}

export interface PostRunAnalysis {
  score: number; // 1-100
  paceConsistency: 'very_consistent' | 'consistent' | 'variable' | 'erratic';
  splitAnalysis: string;
  comparedToAverage: string;
  improvementAreas: string[];
}

// --- Internal Types ---

interface ActivityRow {
  id: number;
  distance_meters: number;
  moving_time_seconds: number;
  average_pace_per_km: number;
  start_date: string;
  splits: string | null;
  elevation_gain: number | null;
  rpe: number | null;
}

// --- Exports ---

export async function generateWeeklySummary(userId: number): Promise<WeeklySummary> {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfPrevWeek = new Date(startOfWeek);
  startOfPrevWeek.setDate(startOfPrevWeek.getDate() - 7);

  // This week's activities
  const thisWeek = await db.query(`
    SELECT distance_meters, moving_time_seconds, average_pace_per_km, start_date
    FROM activities WHERE user_id = $1 AND start_date >= $2
    ORDER BY start_date DESC
  `, [userId, startOfWeek.toISOString()]) as ActivityRow[];

  // Previous week's activities
  const prevWeek = await db.query(`
    SELECT distance_meters, moving_time_seconds, average_pace_per_km, start_date
    FROM activities WHERE user_id = $1 AND start_date >= $2 AND start_date < $3
    ORDER BY start_date DESC
  `, [userId, startOfPrevWeek.toISOString(), startOfWeek.toISOString()]) as ActivityRow[];

  // XP/Streak
  const xp = await db.queryOne('SELECT current_streak_days FROM user_xp WHERE user_id = $1', [userId]) as { current_streak_days: number } | undefined;

  // Kendu earned this week
  const kendu = await db.queryOne(`
    SELECT COALESCE(SUM(amount), 0) as total FROM xp_transactions
    WHERE user_id = $1 AND created_at >= $2 AND source = 'run_completed'
  `, [userId, startOfWeek.toISOString()]) as { total: number };

  // Recent achievement
  const recentAchievement = await db.queryOne(`
    SELECT a.name FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.id
    WHERE ua.user_id = $1 AND ua.earned_at >= $2
    ORDER BY ua.earned_at DESC LIMIT 1
  `, [userId, startOfWeek.toISOString()]) as { name: string } | undefined;

  // Calculate stats
  const totalKm = thisWeek.reduce((s, a) => s + a.distance_meters, 0) / 1000;
  const totalRuns = thisWeek.length;

  const validPaceRuns = thisWeek.filter(a => a.average_pace_per_km > 0);
  const avgPace = validPaceRuns.length > 0
    ? validPaceRuns.reduce((s, a) => s + a.average_pace_per_km, 0) / validPaceRuns.length
    : 0;

  const prevValidRuns = prevWeek.filter(a => a.average_pace_per_km > 0);
  const prevAvgPace = prevValidRuns.length > 0
    ? prevValidRuns.reduce((s, a) => s + a.average_pace_per_km, 0) / prevValidRuns.length
    : 0;

  const paceChange = prevAvgPace > 0 ? Math.round(avgPace - prevAvgPace) : 0;

  // Next goal determination
  const nextGoal = await determineNextGoal(userId, totalKm, totalRuns);

  return {
    totalKm: Math.round(totalKm * 10) / 10,
    totalRuns,
    avgPace: Math.round(avgPace),
    paceChange,
    streakDays: xp?.current_streak_days || 0,
    kenduEarned: kendu.total,
    topAchievement: recentAchievement?.name || null,
    nextGoal,
  };
}

export async function generatePreRunBrief(userId: number): Promise<PreRunBrief> {
  // Get last 7 days of activity
  const recentRuns = await db.query(`
    SELECT distance_meters, average_pace_per_km, start_date, rpe
    FROM activities WHERE user_id = $1 AND start_date >= NOW() - INTERVAL '7 days'
    ORDER BY start_date DESC
  `, [userId]) as ActivityRow[];

  // Get runner profile for pace zones
  const profile = await db.queryOne(`
    SELECT estimated_vo2max, training_days_per_week FROM runner_profiles WHERE user_id = $1
  `, [userId]) as { estimated_vo2max: number; training_days_per_week: number } | undefined;

  // Determine suggested distance based on recent volume
  const recentAvgDistance = recentRuns.length > 0
    ? recentRuns.reduce((s, a) => s + a.distance_meters, 0) / recentRuns.length / 1000
    : 3; // Default 3km for new runners

  // Determine effort level based on recent load
  const ranYesterday = recentRuns.length > 0 &&
    (Date.now() - new Date(recentRuns[0].start_date).getTime()) < 36 * 3600000;
  const highRPERecent = recentRuns.filter(a => a.rpe && a.rpe >= 7).length;

  let effortType: 'easy' | 'moderate' | 'hard';
  if (ranYesterday || highRPERecent >= 2) {
    effortType = 'easy';
  } else if (recentRuns.length >= 3 && highRPERecent === 0) {
    effortType = 'moderate';
  } else if (recentRuns.length >= 5 && !ranYesterday) {
    effortType = 'hard';
  } else {
    effortType = 'easy';
  }

  // Calculate suggested pace
  const avgPace = recentRuns.length > 0
    ? recentRuns.filter(a => a.average_pace_per_km > 0).reduce((s, a) => s + a.average_pace_per_km, 0) /
      recentRuns.filter(a => a.average_pace_per_km > 0).length
    : 420; // Default 7:00/km

  let suggestedPaceSec: number;
  let suggestedDistance: number;

  switch (effortType) {
    case 'easy':
      suggestedPaceSec = avgPace + 30; // 30s slower than avg
      suggestedDistance = Math.max(2, recentAvgDistance * 0.7);
      break;
    case 'moderate':
      suggestedPaceSec = avgPace;
      suggestedDistance = recentAvgDistance;
      break;
    case 'hard':
      suggestedPaceSec = avgPace - 20;
      suggestedDistance = recentAvgDistance * 0.8;
      break;
  }

  // Warmup tips rotation
  const warmupTips = [
    '5 min walk + 10 leg swings each side + 10 high knees',
    '3 min brisk walk + dynamic stretches: hip circles, ankle rolls, arm swings',
    'Start your first km at walking pace. Let your body warm up naturally.',
    '2 min walk + 30s A-skips + 30s B-skips + 30s butt kicks',
    'Slow jog for 3 min, then 4x 20m strides at 70% effort',
  ];

  // Focus areas based on recent patterns
  const focusAreas = [
    'Keep your cadence steady — aim for 170-180 steps/min',
    'Focus on breathing rhythm: inhale 3 steps, exhale 2 steps',
    'Run tall — imagine a string pulling you up from the crown of your head',
    'Land midfoot, not heel. Light, quick steps.',
    'Relax your shoulders and unclench your fists',
  ];

  const dayIndex = new Date().getDay();

  // India-specific environmental context
  const envContext = getEnvironmentalContext();

  return {
    suggestedDistance: Math.round(suggestedDistance * 10) / 10,
    suggestedPace: formatPace(suggestedPaceSec),
    warmupTip: warmupTips[dayIndex % warmupTips.length],
    focusArea: focusAreas[dayIndex % focusAreas.length],
    environment: envContext,
  };
}

export async function generatePostRunAnalysis(userId: number, activityId: number): Promise<PostRunAnalysis> {
  // Get the specific activity
  const activity = await db.queryOne(`
    SELECT id, distance_meters, moving_time_seconds, average_pace_per_km, splits, elevation_gain, rpe, start_date
    FROM activities WHERE id = $1 AND user_id = $2
  `, [activityId, userId]) as ActivityRow | undefined;

  if (!activity) {
    return {
      score: 0,
      paceConsistency: 'variable',
      splitAnalysis: 'Activity not found.',
      comparedToAverage: 'No data available.',
      improvementAreas: [],
    };
  }

  // Get user's average stats (last 30 days, excluding this run)
  const avgStats = await db.queryOne(`
    SELECT AVG(average_pace_per_km) as avg_pace, AVG(distance_meters) as avg_dist
    FROM activities
    WHERE user_id = $1 AND id != $2 AND start_date >= NOW() - INTERVAL '30 days' AND average_pace_per_km > 0
  `, [userId, activityId]) as { avg_pace: number | null; avg_dist: number | null };

  // Analyze splits
  let splitData: number[] = [];
  if (activity.splits) {
    try {
      const parsed = JSON.parse(activity.splits);
      if (Array.isArray(parsed)) {
        splitData = parsed.map((s: any) => typeof s === 'number' ? s : s.pace || s.average_pace || 0).filter((p: number) => p > 0);
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Calculate pace consistency
  const paceConsistency = analyzePaceConsistency(splitData);

  // Split analysis text
  const splitAnalysis = generateSplitText(splitData, activity.distance_meters);

  // Compared to average
  const comparedToAverage = generateComparisonText(activity, avgStats);

  // Score calculation (1-100)
  const score = calculateRunScore(activity, avgStats, paceConsistency, splitData);

  // Improvement areas
  const improvementAreas = identifyImprovementAreas(activity, avgStats, paceConsistency, splitData);

  return {
    score,
    paceConsistency,
    splitAnalysis,
    comparedToAverage,
    improvementAreas,
  };
}

// --- Helper Functions ---

async function determineNextGoal(userId: number, weekKm: number, weekRuns: number): Promise<string> {
  // Get total stats
  const stats = await db.queryOne(`
    SELECT COUNT(*) as total_runs, COALESCE(SUM(distance_meters), 0) as total_dist
    FROM activities WHERE user_id = $1
  `, [userId]) as { total_runs: number; total_dist: number };

  const totalKm = stats.total_dist / 1000;

  // Progressive goals
  if (stats.total_runs < 5) return 'Complete 5 total runs to unlock your first achievement';
  if (totalKm < 50) return `Run ${Math.round(50 - totalKm)}km more to reach the 50km milestone`;
  if (weekRuns < 3) return 'Hit 3 runs this week for optimal consistency';
  if (totalKm < 100) return `${Math.round(100 - totalKm)}km to the 100km Club`;
  if (weekRuns < 4) return 'Push for 4 runs this week — your best consistency yet';
  if (totalKm < 200) return `${Math.round(200 - totalKm)}km to 200km — you\'re crushing it`;
  return 'Maintain your streak and aim for a new personal best this week';
}

function analyzePaceConsistency(splits: number[]): 'very_consistent' | 'consistent' | 'variable' | 'erratic' {
  if (splits.length < 2) return 'consistent';

  const avg = splits.reduce((s, p) => s + p, 0) / splits.length;
  const variance = splits.reduce((s, p) => s + Math.pow(p - avg, 2), 0) / splits.length;
  const cv = Math.sqrt(variance) / avg;

  if (cv < 0.03) return 'very_consistent';
  if (cv < 0.07) return 'consistent';
  if (cv < 0.15) return 'variable';
  return 'erratic';
}

function generateSplitText(splits: number[], distanceMeters: number): string {
  if (splits.length === 0) {
    return `${(distanceMeters / 1000).toFixed(1)}km completed. No split data available for detailed analysis.`;
  }

  const fastest = Math.min(...splits);
  const slowest = Math.max(...splits);
  const diff = slowest - fastest;

  if (splits.length <= 2) {
    return `${splits.length} splits recorded. Pace range: ${formatPace(fastest)} - ${formatPace(slowest)}/km.`;
  }

  // Detect negative/positive split pattern
  const firstHalf = splits.slice(0, Math.floor(splits.length / 2));
  const secondHalf = splits.slice(Math.floor(splits.length / 2));
  const firstAvg = firstHalf.reduce((s, p) => s + p, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((s, p) => s + p, 0) / secondHalf.length;

  let pattern: string;
  if (secondAvg < firstAvg - 5) {
    pattern = 'Negative split — you finished faster than you started. Great pacing strategy!';
  } else if (firstAvg < secondAvg - 10) {
    pattern = 'Positive split — you slowed in the second half. Try starting 10-15s/km slower.';
  } else {
    pattern = 'Even split — consistent effort throughout. Solid execution.';
  }

  return `${splits.length} km splits | Range: ${formatPace(fastest)} - ${formatPace(slowest)}/km (${Math.round(diff)}s spread). ${pattern}`;
}

function generateComparisonText(
  activity: ActivityRow,
  avgStats: { avg_pace: number | null; avg_dist: number | null }
): string {
  if (!avgStats.avg_pace || !avgStats.avg_dist) {
    return 'First tracked run — great start! Keep logging runs to see progress comparisons.';
  }

  const paceDiff = Math.round(activity.average_pace_per_km - avgStats.avg_pace);
  const distDiff = Math.round(((activity.distance_meters - avgStats.avg_dist) / avgStats.avg_dist) * 100);

  const parts: string[] = [];

  if (paceDiff < -10) parts.push(`${Math.abs(paceDiff)}s/km faster than your 30-day average`);
  else if (paceDiff > 10) parts.push(`${paceDiff}s/km slower than your 30-day average`);
  else parts.push('Right on your typical pace');

  if (distDiff > 20) parts.push(`${distDiff}% longer than average distance`);
  else if (distDiff < -20) parts.push(`${Math.abs(distDiff)}% shorter than average`);

  return parts.join('. ') + '.';
}

function calculateRunScore(
  activity: ActivityRow,
  avgStats: { avg_pace: number | null; avg_dist: number | null },
  consistency: string,
  splits: number[]
): number {
  let score = 50; // Base score

  // Distance bonus (longer = better, up to +20)
  const distKm = activity.distance_meters / 1000;
  if (distKm >= 10) score += 20;
  else if (distKm >= 5) score += 15;
  else if (distKm >= 3) score += 10;
  else if (distKm >= 1) score += 5;

  // Pace vs average bonus (+/- 15)
  if (avgStats.avg_pace && activity.average_pace_per_km > 0) {
    const paceDiff = avgStats.avg_pace - activity.average_pace_per_km;
    if (paceDiff > 15) score += 15; // Much faster
    else if (paceDiff > 5) score += 10;
    else if (paceDiff > -5) score += 5; // On pace
    else if (paceDiff > -15) score += 0;
    else score -= 5; // Much slower
  }

  // Consistency bonus (+15)
  switch (consistency) {
    case 'very_consistent': score += 15; break;
    case 'consistent': score += 10; break;
    case 'variable': score += 5; break;
    case 'erratic': score += 0; break;
  }

  // RPE appropriateness (not too hard, not too easy)
  if (activity.rpe) {
    if (activity.rpe >= 4 && activity.rpe <= 7) score += 5;
    else if (activity.rpe >= 8) score += 2; // Hard effort is fine
  }

  return Math.max(10, Math.min(100, score));
}

function identifyImprovementAreas(
  activity: ActivityRow,
  avgStats: { avg_pace: number | null; avg_dist: number | null },
  consistency: string,
  splits: number[]
): string[] {
  const areas: string[] = [];

  // Pacing
  if (consistency === 'erratic' || consistency === 'variable') {
    areas.push('Work on even pacing — try to keep splits within 10s/km of each other');
  }

  // Positive splits
  if (splits.length >= 3) {
    const firstSplit = splits[0];
    const lastSplit = splits[splits.length - 1];
    if (lastSplit > firstSplit + 20) {
      areas.push('Start slower to finish stronger — your pace dropped significantly in later km');
    }
  }

  // Short distance
  if (activity.distance_meters < 2000 && avgStats.avg_dist && avgStats.avg_dist > 3000) {
    areas.push('Try to maintain your usual distance — consistency builds fitness');
  }

  // High RPE for easy pace
  if (activity.rpe && activity.rpe >= 8 && avgStats.avg_pace && activity.average_pace_per_km >= avgStats.avg_pace) {
    areas.push('High effort but average pace — focus on form and breathing efficiency');
  }

  // Default encouragement if nothing to improve
  if (areas.length === 0) {
    areas.push('Solid run! Keep up the consistency and gradually increase distance');
  }

  return areas.slice(0, 3);
}

function formatPace(secondsPerKm: number): string {
  const min = Math.floor(secondsPerKm / 60);
  const sec = Math.round(secondsPerKm % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

/**
 * India-Specific Environmental Context
 *
 * Accounts for heat, monsoon, and air pollution — common factors
 * that significantly affect running performance in Indian cities.
 *
 * Science:
 * - Every 1°C above 20°C costs ~0.3% performance (marathon data)
 * - AQI >150 reduces VO2max by 5-15% (respiratory load)
 * - Humidity >80% impairs thermoregulation (sweat can't evaporate)
 */
function getEnvironmentalContext(temperature?: number, humidity?: number, aqi?: number): EnvironmentalContext {
  const tips: string[] = [];
  let paceAdjustment = 0;
  let temperatureWarning: string | null = null;
  let aqiWarning: string | null = null;

  // Month-based seasonal heuristic for India (if no live data)
  const month = new Date().getMonth(); // 0-indexed

  if (!temperature) {
    // Indian seasonal defaults (approximate for North India)
    if (month >= 3 && month <= 5) temperature = 38; // Apr-Jun: summer
    else if (month >= 6 && month <= 8) { temperature = 32; humidity = humidity || 85; } // Jul-Sep: monsoon
    else if (month >= 9 && month <= 10) temperature = 30; // Oct-Nov: post-monsoon
    else temperature = 18; // Dec-Mar: winter (ideal running)
  }

  // Temperature adjustments
  if (temperature && temperature > 35) {
    paceAdjustment = -15; // 15% slower targets
    temperatureWarning = `🌡️ ${temperature}°C — extreme heat. Reduce pace 15s/km. Hydrate every 2km. Run early morning or after sunset.`;
    tips.push('Carry water or plan route with water stops');
    tips.push('Wet your cap/hair before starting');
    tips.push('If dizzy or nauseous, stop immediately');
  } else if (temperature && temperature > 30) {
    paceAdjustment = -8;
    temperatureWarning = `🌡️ ${temperature}°C — warm. Targets relaxed 8s/km. Hydrate well before and during.`;
    tips.push('Start slower than usual — your body needs time to adjust');
    tips.push('Prefer shaded routes');
  } else if (temperature && temperature > 25) {
    paceAdjustment = -3;
    tips.push('Good running weather — stay hydrated');
  }

  // Humidity adjustments (monsoon season)
  if (humidity && humidity > 85) {
    paceAdjustment -= 5;
    tips.push('High humidity — sweat won\'t cool you. Keep effort perception-based, not pace-based.');
    if (!temperatureWarning) temperatureWarning = `💧 Humidity ${humidity}% — sweat evaporation impaired. Go by feel.`;
  }

  // AQI adjustments (Delhi/NCR specific concern)
  if (aqi && aqi > 200) {
    aqiWarning = `⚠️ AQI ${aqi} — Very Unhealthy. Indoor run strongly recommended. If outside: mask, short duration (<20min), nasal breathing.`;
    paceAdjustment -= 10;
    tips.push('Consider treadmill or indoor alternative');
    tips.push('Nasal breathing only — filters more particles');
    tips.push('Avoid heavy traffic routes');
  } else if (aqi && aqi > 150) {
    aqiWarning = `⚠️ AQI ${aqi} — Unhealthy. Keep run short (<30min). Avoid peak traffic hours.`;
    paceAdjustment -= 5;
    tips.push('Run in parks/green areas away from roads');
  } else if (aqi && aqi > 100) {
    tips.push('Moderate air quality — fine for running, prefer green routes');
  }

  return {
    has_alert: !!(temperatureWarning || aqiWarning),
    temperature_warning: temperatureWarning,
    aqi_warning: aqiWarning,
    pace_adjustment_percent: paceAdjustment,
    tips,
  };
}
