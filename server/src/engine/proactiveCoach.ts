/**
 * Proactive Coaching Engine — Rule-Based Insights & Nudges
 *
 * Generates personalized coaching insights without any LLM dependency.
 * Pure rule-based logic using activity data, streaks, and pace trends.
 */

import db from '../database/pg';

export interface Insight {
  type: 'warning' | 'encouragement' | 'tip' | 'milestone';
  title: string;
  body: string;
  priority: number; // 1-5, higher = more important
  actionUrl?: string;
}

interface ActivityRow {
  id: number;
  user_id: number;
  distance_meters: number;
  moving_time_seconds: number;
  average_pace_per_km: number;
  start_date: string;
}

interface XpRow {
  current_streak_days: number;
  longest_streak_days: number;
  last_activity_date: string | null;
}

export async function generateInsights(userId: number): Promise<Insight[]> {
  const insights: Insight[] = [];

  // Fetch recent activities (last 14 days)
  const recentActivities = await db.query(`
    SELECT id, user_id, distance_meters, moving_time_seconds, average_pace_per_km, start_date
    FROM activities
    WHERE user_id = $1 AND start_date >= NOW() - INTERVAL '14 days'
    ORDER BY start_date DESC
  `, [userId]) as ActivityRow[];

  // Fetch XP/streak data
  const xpData = await db.queryOne(
    'SELECT current_streak_days, longest_streak_days, last_activity_date FROM user_xp WHERE user_id = $1', [userId]
  ) as XpRow | undefined;

  // Fetch all-time stats
  const allTimeStats = await db.queryOne(`
    SELECT COUNT(*) as total_runs, COALESCE(SUM(distance_meters), 0) as total_distance
    FROM activities WHERE user_id = $1
  `, [userId]) as { total_runs: number; total_distance: number };

  // Rule 1: Overtraining warning
  const overtrain = checkOvertraining(recentActivities);
  if (overtrain) insights.push(overtrain);

  // Rule 2: Streak at risk
  const streakRisk = checkStreakAtRisk(xpData);
  if (streakRisk) insights.push(streakRisk);

  // Rule 3: Improvement celebration
  const improvement = checkImprovementCelebration(recentActivities);
  if (improvement) insights.push(improvement);

  // Rule 4: Volume milestones
  const milestone = checkVolumeMilestone(allTimeStats.total_distance);
  if (milestone) insights.push(milestone);

  // Rule 5: Consistency praise
  const consistency = checkConsistencyPraise(recentActivities);
  if (consistency) insights.push(consistency);

  // Rule 6: Rest day suggestion
  const restDay = checkRestDaySuggestion(recentActivities);
  if (restDay) insights.push(restDay);

  // Rule 7: Pace zone tip
  const paceTip = checkPaceZoneTip(recentActivities);
  if (paceTip) insights.push(paceTip);

  // Sort by priority descending
  insights.sort((a, b) => b.priority - a.priority);

  return insights;
}

/**
 * Rule 1: Overtraining Warning
 * If 3+ runs in last 3 days AND average pace getting slower
 */
function checkOvertraining(activities: ActivityRow[]): Insight | null {
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
  const last3Days = activities.filter(a => a.start_date >= threeDaysAgo);

  if (last3Days.length < 3) return null;

  // Check if pace is getting slower (higher number = slower)
  const sortedByDate = [...last3Days].sort((a, b) =>
    new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );

  let slowerCount = 0;
  for (let i = 1; i < sortedByDate.length; i++) {
    if (sortedByDate[i].average_pace_per_km > sortedByDate[i - 1].average_pace_per_km) {
      slowerCount++;
    }
  }

  if (slowerCount >= Math.floor(sortedByDate.length / 2)) {
    return {
      type: 'warning',
      title: 'Your body needs recovery',
      body: `You've run ${last3Days.length} times in 3 days and your pace is slowing. Consider a rest day — your muscles rebuild during recovery.`,
      priority: 5,
      actionUrl: '/dashboard',
    };
  }

  return null;
}

/**
 * Rule 2: Streak at Risk
 * If last_activity_date was yesterday and current hour >= 18
 */
function checkStreakAtRisk(xpData: XpRow | undefined): Insight | null {
  if (!xpData || !xpData.last_activity_date || xpData.current_streak_days < 2) return null;

  const lastDate = new Date(xpData.last_activity_date);
  const now = new Date();
  const diffMs = now.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  // Last activity was yesterday and it's past 6pm
  if (diffDays === 1 && now.getHours() >= 18) {
    return {
      type: 'warning',
      title: `Your ${xpData.current_streak_days}-day streak is at risk!`,
      body: 'A quick 1km will keep it alive. Even a short jog counts toward your streak.',
      priority: 4,
      actionUrl: '/run',
    };
  }

  return null;
}

/**
 * Rule 3: Improvement Celebration
 * If last 3 runs are faster than previous 3
 */
function checkImprovementCelebration(activities: ActivityRow[]): Insight | null {
  if (activities.length < 6) return null;

  const validRuns = activities.filter(a => a.average_pace_per_km > 0 && a.distance_meters > 500);
  if (validRuns.length < 6) return null;

  const last3 = validRuns.slice(0, 3);
  const prev3 = validRuns.slice(3, 6);

  const avgLast3 = last3.reduce((s, a) => s + a.average_pace_per_km, 0) / 3;
  const avgPrev3 = prev3.reduce((s, a) => s + a.average_pace_per_km, 0) / 3;

  // Lower pace = faster
  if (avgLast3 < avgPrev3) {
    const improvementPct = Math.round(((avgPrev3 - avgLast3) / avgPrev3) * 100);
    if (improvementPct >= 2) {
      return {
        type: 'encouragement',
        title: "You're getting faster!",
        body: `Your average pace improved by ${improvementPct}% over your last 3 runs. The consistency is paying off.`,
        priority: 3,
        actionUrl: '/progress',
      };
    }
  }

  return null;
}

/**
 * Rule 4: Volume Milestone
 * If total_distance crosses 50km, 100km, 200km, 500km thresholds
 */
function checkVolumeMilestone(totalDistanceMeters: number): Insight | null {
  const totalKm = totalDistanceMeters / 1000;
  const thresholds = [500, 200, 100, 50]; // Check highest first

  for (const threshold of thresholds) {
    if (totalKm >= threshold) {
      // Only show if they recently crossed (within 10% above threshold)
      const upperBound = threshold * 1.1;
      if (totalKm <= upperBound) {
        return {
          type: 'milestone',
          title: `${threshold}km milestone reached!`,
          body: `You've run ${Math.round(totalKm)}km total. That's an incredible achievement — keep building on this momentum.`,
          priority: 3,
          actionUrl: '/progress',
        };
      }
      break; // Only show highest relevant milestone
    }
  }

  return null;
}

/**
 * Rule 5: Consistency Praise
 * If ran 4+ times this week
 */
function checkConsistencyPraise(activities: ActivityRow[]): Insight | null {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 6=Sat
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Monday start
  startOfWeek.setHours(0, 0, 0, 0);

  const thisWeekRuns = activities.filter(a =>
    new Date(a.start_date).getTime() >= startOfWeek.getTime()
  );

  if (thisWeekRuns.length >= 4) {
    return {
      type: 'encouragement',
      title: 'Great consistency this week!',
      body: `${thisWeekRuns.length} runs and counting. You're building a strong training habit.`,
      priority: 2,
    };
  }

  return null;
}

/**
 * Rule 6: Rest Day Suggestion
 * If ran every day for 5+ days straight
 */
function checkRestDaySuggestion(activities: ActivityRow[]): Insight | null {
  if (activities.length < 5) return null;

  // Get unique activity dates, sorted most recent first
  const dates = [...new Set(
    activities.map(a => new Date(a.start_date).toISOString().split('T')[0])
  )].sort().reverse();

  // Check consecutive days from today backward
  let consecutiveDays = 0;

  for (let i = 0; i < dates.length && i < 10; i++) {
    const expectedDate = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    if (dates.includes(expectedDate)) {
      consecutiveDays++;
    } else {
      break;
    }
  }

  if (consecutiveDays >= 5) {
    return {
      type: 'tip',
      title: 'Active recovery day recommended',
      body: `You've run ${consecutiveDays} days straight — impressive dedication! Your muscles rebuild during rest. A walk or yoga today will make tomorrow's run stronger.`,
      priority: 4,
    };
  }

  return null;
}

/**
 * Rule 7: Pace Zone Tip
 * If all recent runs are at same pace (low variance)
 */
function checkPaceZoneTip(activities: ActivityRow[]): Insight | null {
  const validRuns = activities.filter(a => a.average_pace_per_km > 0 && a.distance_meters > 1000);
  if (validRuns.length < 4) return null;

  const last5 = validRuns.slice(0, 5);
  const paces = last5.map(a => a.average_pace_per_km);
  const avgPace = paces.reduce((s, p) => s + p, 0) / paces.length;

  // Calculate coefficient of variation
  const variance = paces.reduce((s, p) => s + Math.pow(p - avgPace, 2), 0) / paces.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / avgPace;

  // If CV < 5%, all runs are very similar pace
  if (cv < 0.05) {
    return {
      type: 'tip',
      title: 'Mix up your paces',
      body: 'Your last few runs were all at a similar effort. Try an easy run today — running slower builds aerobic base and makes your fast days even faster.',
      priority: 2,
      actionUrl: '/coaching/pre-run',
    };
  }

  return null;
}
