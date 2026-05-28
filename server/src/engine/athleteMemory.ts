/**
 * Athlete Memory — Lightweight Pattern Tracking
 *
 * Builds an athlete profile from SQL aggregations. No LLM needed —
 * just computes patterns from the activities table over time.
 */

import db from '../database/db';

export interface AthleteProfile {
  preferredRunTime: 'morning' | 'afternoon' | 'evening' | 'varies';
  averageWeeklyRuns: number;
  paceTrajectory: 'improving' | 'stable' | 'declining';
  streakReliability: 'high' | 'medium' | 'low';
  totalDistanceKm: number;
  longestRun: number;
  personalBests: { distance: string; pace: number }[];
  weeklyPattern: number[]; // runs per day of week (Mon=0...Sun=6)
}

interface ActivityRow {
  distance_meters: number;
  moving_time_seconds: number;
  average_pace_per_km: number;
  start_date: string;
}

export function getAthleteProfile(userId: number): AthleteProfile {
  // All activities for this user
  const allActivities = db.prepare(`
    SELECT distance_meters, moving_time_seconds, average_pace_per_km, start_date
    FROM activities WHERE user_id = ?
    ORDER BY start_date DESC
  `).all(userId) as ActivityRow[];

  // Last 30 days for trajectory
  const last30Days = db.prepare(`
    SELECT distance_meters, moving_time_seconds, average_pace_per_km, start_date
    FROM activities
    WHERE user_id = ? AND start_date >= datetime('now', '-30 days')
    ORDER BY start_date DESC
  `).all(userId) as ActivityRow[];

  // XP data for streak reliability
  const xpData = db.prepare(
    'SELECT current_streak_days, longest_streak_days, last_activity_date FROM user_xp WHERE user_id = ?'
  ).get(userId) as { current_streak_days: number; longest_streak_days: number; last_activity_date: string | null } | undefined;

  return {
    preferredRunTime: computePreferredTime(allActivities),
    averageWeeklyRuns: computeAverageWeeklyRuns(allActivities),
    paceTrajectory: computePaceTrajectory(last30Days),
    streakReliability: computeStreakReliability(allActivities, xpData),
    totalDistanceKm: computeTotalDistance(allActivities),
    longestRun: computeLongestRun(allActivities),
    personalBests: computePersonalBests(allActivities),
    weeklyPattern: computeWeeklyPattern(allActivities),
  };
}

/**
 * Determine preferred run time based on activity start hours
 */
function computePreferredTime(activities: ActivityRow[]): 'morning' | 'afternoon' | 'evening' | 'varies' {
  if (activities.length < 3) return 'varies';

  const buckets = { morning: 0, afternoon: 0, evening: 0 };

  for (const a of activities) {
    const hour = new Date(a.start_date).getHours();
    if (hour >= 5 && hour < 12) buckets.morning++;
    else if (hour >= 12 && hour < 17) buckets.afternoon++;
    else buckets.evening++;
  }

  const total = activities.length;
  const maxBucket = Math.max(buckets.morning, buckets.afternoon, buckets.evening);

  // If one bucket has > 60% of runs, that's their preference
  if (maxBucket / total > 0.6) {
    if (buckets.morning === maxBucket) return 'morning';
    if (buckets.afternoon === maxBucket) return 'afternoon';
    return 'evening';
  }

  return 'varies';
}

/**
 * Calculate average runs per week (over all time or last 8 weeks)
 */
function computeAverageWeeklyRuns(activities: ActivityRow[]): number {
  if (activities.length === 0) return 0;

  const now = Date.now();
  const eightWeeksAgo = now - 56 * 86400000;
  const recentRuns = activities.filter(a => new Date(a.start_date).getTime() >= eightWeeksAgo);

  if (recentRuns.length === 0) return 0;

  // Calculate actual weeks spanned
  const earliest = Math.min(...recentRuns.map(a => new Date(a.start_date).getTime()));
  const weeksSpanned = Math.max(1, (now - earliest) / (7 * 86400000));

  return Math.round((recentRuns.length / weeksSpanned) * 10) / 10;
}

/**
 * Determine pace trajectory from last 30 days using linear regression
 */
function computePaceTrajectory(last30Days: ActivityRow[]): 'improving' | 'stable' | 'declining' {
  const validRuns = last30Days.filter(a => a.average_pace_per_km > 0 && a.distance_meters > 1000);
  if (validRuns.length < 4) return 'stable';

  const now = Date.now();
  const points = validRuns.map(a => ({
    dayAge: (now - new Date(a.start_date).getTime()) / 86400000,
    pace: a.average_pace_per_km,
  }));

  // Linear regression: pace vs day_age (positive dayAge = older)
  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.dayAge, 0);
  const sumY = points.reduce((s, p) => s + p.pace, 0);
  const sumXY = points.reduce((s, p) => s + p.dayAge * p.pace, 0);
  const sumX2 = points.reduce((s, p) => s + p.dayAge * p.dayAge, 0);

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return 'stable';

  const slope = (n * sumXY - sumX * sumY) / denom;

  // Positive slope means older runs were faster (pace was lower in the past = dayAge high, pace low)
  // Actually: positive slope = as dayAge increases, pace increases = older runs were slower
  // So positive slope = newer runs are faster = improving
  // Threshold: > 1 sec/km improvement per week ~ 0.14 per day
  if (slope > 0.1) return 'improving';
  if (slope < -0.1) return 'declining';
  return 'stable';
}

/**
 * Determine streak reliability based on historical patterns
 */
function computeStreakReliability(
  activities: ActivityRow[],
  xpData: { current_streak_days: number; longest_streak_days: number; last_activity_date: string | null } | undefined
): 'high' | 'medium' | 'low' {
  if (!xpData || activities.length < 5) return 'low';

  // Count how many "streaks" they've broken in the last 60 days
  const last60 = activities.filter(a =>
    new Date(a.start_date).getTime() >= Date.now() - 60 * 86400000
  );

  if (last60.length === 0) return 'low';

  const dates = [...new Set(last60.map(a => new Date(a.start_date).toISOString().split('T')[0]))].sort();
  let gaps = 0;

  for (let i = 1; i < dates.length; i++) {
    const diff = (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86400000;
    if (diff > 2) gaps++; // Gap of more than 2 days = streak break
  }

  // High: 0-1 gaps, Medium: 2-3 gaps, Low: 4+ gaps
  if (gaps <= 1) return 'high';
  if (gaps <= 3) return 'medium';
  return 'low';
}

/**
 * Total distance in km
 */
function computeTotalDistance(activities: ActivityRow[]): number {
  const total = activities.reduce((s, a) => s + a.distance_meters, 0);
  return Math.round(total / 100) / 10; // Round to 1 decimal
}

/**
 * Longest single run in km
 */
function computeLongestRun(activities: ActivityRow[]): number {
  if (activities.length === 0) return 0;
  const max = Math.max(...activities.map(a => a.distance_meters));
  return Math.round(max / 100) / 10;
}

/**
 * Personal bests by standard race distances
 */
function computePersonalBests(activities: ActivityRow[]): { distance: string; pace: number }[] {
  const pbs: { distance: string; pace: number }[] = [];

  // Best overall pace (for runs > 1km)
  const significantRuns = activities.filter(a => a.average_pace_per_km > 0 && a.distance_meters >= 1000);
  if (significantRuns.length > 0) {
    const bestPace = Math.min(...significantRuns.map(a => a.average_pace_per_km));
    pbs.push({ distance: 'overall', pace: bestPace });
  }

  // Best 5K pace
  const fiveKRuns = activities.filter(a => a.distance_meters >= 4800 && a.distance_meters <= 5500 && a.average_pace_per_km > 0);
  if (fiveKRuns.length > 0) {
    const best5k = Math.min(...fiveKRuns.map(a => a.average_pace_per_km));
    pbs.push({ distance: '5K', pace: best5k });
  }

  // Best 10K pace
  const tenKRuns = activities.filter(a => a.distance_meters >= 9500 && a.distance_meters <= 10500 && a.average_pace_per_km > 0);
  if (tenKRuns.length > 0) {
    const best10k = Math.min(...tenKRuns.map(a => a.average_pace_per_km));
    pbs.push({ distance: '10K', pace: best10k });
  }

  // Best half marathon pace
  const hmRuns = activities.filter(a => a.distance_meters >= 20500 && a.distance_meters <= 22000 && a.average_pace_per_km > 0);
  if (hmRuns.length > 0) {
    const bestHm = Math.min(...hmRuns.map(a => a.average_pace_per_km));
    pbs.push({ distance: 'Half Marathon', pace: bestHm });
  }

  return pbs;
}

/**
 * Runs per day of week (Mon=0 ... Sun=6)
 */
function computeWeeklyPattern(activities: ActivityRow[]): number[] {
  const pattern = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun

  for (const a of activities) {
    const date = new Date(a.start_date);
    const jsDay = date.getDay(); // 0=Sun, 1=Mon...6=Sat
    const mondayIndex = jsDay === 0 ? 6 : jsDay - 1; // Convert to Mon=0...Sun=6
    pattern[mondayIndex]++;
  }

  return pattern;
}
