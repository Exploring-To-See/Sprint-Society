/**
 * Progress Tracker — "Show Undeniable Improvement"
 *
 * Generates progress reports that make improvement impossible to ignore.
 * Weekly comparisons, trend lines, personal records, improvement velocity.
 */

interface ProgressReport {
  period: 'weekly' | 'monthly' | 'all_time';
  summary: {
    total_runs: number;
    total_distance_km: number;
    total_time_minutes: number;
    avg_pace_per_km: number;
    best_pace_per_km: number;
  };
  comparison?: {
    runs_change: number;
    distance_change_percent: number;
    pace_change_seconds: number;
    pace_improved: boolean;
    message: string;
  };
  personal_records: PersonalRecord[];
  streaks: {
    current: number;
    longest: number;
    active: boolean;
  };
  improvement_velocity: {
    pace_improvement_per_week: number;
    distance_growth_per_week: number;
    projected_5k_time_in_4_weeks: number;
  };
  milestones_reached: string[];
  next_milestone: { name: string; progress_percent: number; remaining: string };
}

interface PersonalRecord {
  category: string;
  value: number;
  formatted: string;
  date: string;
  is_new: boolean;
}

interface RunData {
  distance_meters: number;
  moving_time_seconds: number;
  average_pace_per_km: number;
  start_date: string;
}

export function generateProgressReport(runs: RunData[], period: 'weekly' | 'monthly' | 'all_time'): ProgressReport {
  const now = Date.now();
  const periodMs = period === 'weekly' ? 7 * 86400000 : period === 'monthly' ? 30 * 86400000 : Infinity;
  const previousPeriodMs = periodMs * 2;

  const currentRuns = runs.filter(r => now - new Date(r.start_date).getTime() < periodMs);
  const previousRuns = runs.filter(r => {
    const age = now - new Date(r.start_date).getTime();
    return age >= periodMs && age < previousPeriodMs;
  });

  const totalDist = currentRuns.reduce((s, r) => s + r.distance_meters, 0);
  const totalTime = currentRuns.reduce((s, r) => s + r.moving_time_seconds, 0);
  const avgPace = currentRuns.length > 0
    ? currentRuns.reduce((s, r) => s + r.average_pace_per_km * r.distance_meters, 0) / totalDist
    : 0;
  const bestPace = currentRuns.length > 0
    ? Math.min(...currentRuns.filter(r => r.distance_meters > 1000).map(r => r.average_pace_per_km))
    : 0;

  // Comparison with previous period
  let comparison;
  if (previousRuns.length > 0 && currentRuns.length > 0) {
    const prevDist = previousRuns.reduce((s, r) => s + r.distance_meters, 0);
    const prevAvgPace = previousRuns.reduce((s, r) => s + r.average_pace_per_km * r.distance_meters, 0) / prevDist;
    const paceChange = Math.round(avgPace - prevAvgPace);
    const distChange = prevDist > 0 ? Math.round(((totalDist - prevDist) / prevDist) * 100) : 0;

    let message: string;
    if (paceChange < -5) message = `You're ${Math.abs(paceChange)}s/km faster than last ${period === 'weekly' ? 'week' : 'month'}!`;
    else if (paceChange > 5) message = `Pace was ${paceChange}s/km slower — might need more recovery.`;
    else message = `Consistent effort. Pace stable within 5s/km.`;

    comparison = {
      runs_change: currentRuns.length - previousRuns.length,
      distance_change_percent: distChange,
      pace_change_seconds: paceChange,
      pace_improved: paceChange < 0,
      message,
    };
  }

  // Personal records
  const prs = calculatePRs(runs);

  // Improvement velocity (linear regression on pace over last 8 weeks)
  const eightWeekRuns = runs.filter(r => now - new Date(r.start_date).getTime() < 56 * 86400000);
  const velocity = calculateImprovementVelocity(eightWeekRuns);

  // Milestones
  const totalDistKm = runs.reduce((s, r) => s + r.distance_meters, 0) / 1000;
  const milestones = calculateMilestones(totalDistKm, runs.length, bestPace);

  return {
    period,
    summary: {
      total_runs: currentRuns.length,
      total_distance_km: Math.round(totalDist / 100) / 10,
      total_time_minutes: Math.round(totalTime / 60),
      avg_pace_per_km: Math.round(avgPace),
      best_pace_per_km: Math.round(bestPace),
    },
    comparison,
    personal_records: prs,
    streaks: calculateStreaks(runs),
    improvement_velocity: velocity,
    milestones_reached: milestones.reached,
    next_milestone: milestones.next,
  };
}

function calculatePRs(runs: RunData[]): PersonalRecord[] {
  const prs: PersonalRecord[] = [];
  const oneWeekAgo = Date.now() - 7 * 86400000;

  // Fastest 1km
  const fastestPace = runs.filter(r => r.distance_meters >= 1000).sort((a, b) => a.average_pace_per_km - b.average_pace_per_km)[0];
  if (fastestPace) {
    prs.push({
      category: 'Fastest Pace',
      value: fastestPace.average_pace_per_km,
      formatted: formatPace(fastestPace.average_pace_per_km) + '/km',
      date: fastestPace.start_date,
      is_new: new Date(fastestPace.start_date).getTime() > oneWeekAgo,
    });
  }

  // Longest run
  const longest = [...runs].sort((a, b) => b.distance_meters - a.distance_meters)[0];
  if (longest) {
    prs.push({
      category: 'Longest Run',
      value: longest.distance_meters,
      formatted: (longest.distance_meters / 1000).toFixed(1) + ' km',
      date: longest.start_date,
      is_new: new Date(longest.start_date).getTime() > oneWeekAgo,
    });
  }

  // Best 5K (if they've run >= 5km)
  const fiveKRuns = runs.filter(r => r.distance_meters >= 4800 && r.distance_meters <= 5500);
  const best5k = fiveKRuns.sort((a, b) => a.moving_time_seconds - b.moving_time_seconds)[0];
  if (best5k) {
    prs.push({
      category: 'Best 5K',
      value: best5k.moving_time_seconds,
      formatted: formatDuration(best5k.moving_time_seconds),
      date: best5k.start_date,
      is_new: new Date(best5k.start_date).getTime() > oneWeekAgo,
    });
  }

  return prs;
}

function calculateStreaks(runs: RunData[]): { current: number; longest: number; active: boolean } {
  if (runs.length === 0) return { current: 0, longest: 0, active: false };

  const dates = [...new Set(runs.map(r => new Date(r.start_date).toISOString().split('T')[0]))].sort();
  let current = 1, longest = 1, streak = 1;

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;

    if (diff <= 2) { // Allow 1 rest day in streak
      streak++;
      longest = Math.max(longest, streak);
    } else {
      streak = 1;
    }
  }

  // Is streak still active? (ran in last 2 days)
  const lastRunDate = new Date(dates[dates.length - 1]);
  const active = (Date.now() - lastRunDate.getTime()) < 2 * 86400000;
  current = active ? streak : 0;

  return { current, longest, active };
}

function calculateImprovementVelocity(runs: RunData[]) {
  if (runs.length < 4) {
    return { pace_improvement_per_week: 0, distance_growth_per_week: 0, projected_5k_time_in_4_weeks: 0 };
  }

  // Simple linear regression on pace over weeks
  const now = Date.now();
  const points = runs.map(r => ({
    week: (now - new Date(r.start_date).getTime()) / (7 * 86400000),
    pace: r.average_pace_per_km,
  }));

  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.week, 0);
  const sumY = points.reduce((s, p) => s + p.pace, 0);
  const sumXY = points.reduce((s, p) => s + p.week * p.pace, 0);
  const sumX2 = points.reduce((s, p) => s + p.week * p.week, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const currentPace = sumY / n;

  // Negative slope = getting faster (pace decreasing)
  const paceImprovementPerWeek = Math.round(-slope * 10) / 10;

  // Project 5K time in 4 weeks
  const projectedPace = currentPace + slope * (-4); // 4 weeks into future
  const projected5kTime = Math.round(projectedPace * 5);

  return {
    pace_improvement_per_week: paceImprovementPerWeek,
    distance_growth_per_week: 0, // TODO: calculate from volume trend
    projected_5k_time_in_4_weeks: projected5kTime,
  };
}

function calculateMilestones(totalDistKm: number, totalRuns: number, bestPace: number) {
  const distanceMilestones = [10, 25, 50, 100, 250, 500, 1000];
  const runMilestones = [5, 10, 25, 50, 100, 250];
  const paceMilestones = [420, 360, 330, 300, 270, 240]; // seconds/km

  const reached: string[] = [];

  for (const m of distanceMilestones) {
    if (totalDistKm >= m) reached.push(`${m}km Total Distance`);
  }
  for (const m of runMilestones) {
    if (totalRuns >= m) reached.push(`${m} Runs Completed`);
  }
  for (const m of paceMilestones) {
    if (bestPace > 0 && bestPace <= m) reached.push(`Sub-${formatPace(m)}/km Pace`);
  }

  // Next milestone
  const nextDist = distanceMilestones.find(m => totalDistKm < m) || 1000;
  const progress = Math.round((totalDistKm / nextDist) * 100);

  return {
    reached,
    next: {
      name: `${nextDist}km Total`,
      progress_percent: Math.min(99, progress),
      remaining: `${(nextDist - totalDistKm).toFixed(1)}km to go`,
    },
  };
}

function formatPace(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function formatDuration(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}
