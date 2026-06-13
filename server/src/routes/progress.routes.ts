import { Router, Response } from 'express';
import db from '../database/pg';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateProgressReport } from '../engine/progressTracker';

const router = Router();
router.use(authenticate);

// GET /progress/weekly — This week vs last week
router.get('/weekly', async (req: AuthRequest, res: Response) => {
  const runs = await db.query(
    `SELECT distance_meters, moving_time_seconds, average_pace_per_km, start_date
     FROM activities WHERE user_id = $1 ORDER BY start_date DESC LIMIT 100`,
    [req.userId]
  ) as any[];

  const report = generateProgressReport(runs, 'weekly');
  res.json(report);
});

// GET /progress/monthly — This month vs last month
router.get('/monthly', async (req: AuthRequest, res: Response) => {
  const runs = await db.query(
    `SELECT distance_meters, moving_time_seconds, average_pace_per_km, start_date
     FROM activities WHERE user_id = $1 ORDER BY start_date DESC LIMIT 200`,
    [req.userId]
  ) as any[];

  const report = generateProgressReport(runs, 'monthly');
  res.json(report);
});

// GET /progress/all-time — Full history
router.get('/all-time', async (req: AuthRequest, res: Response) => {
  const runs = await db.query(
    `SELECT distance_meters, moving_time_seconds, average_pace_per_km, start_date
     FROM activities WHERE user_id = $1 ORDER BY start_date DESC`,
    [req.userId]
  ) as any[];

  const report = generateProgressReport(runs, 'all_time');
  res.json(report);
});

// GET /progress/improvement — "You were HERE, now you're HERE" visualization data
router.get('/improvement', async (req: AuthRequest, res: Response) => {
  const runs = await db.query(
    `SELECT distance_meters, moving_time_seconds, average_pace_per_km, start_date
     FROM activities WHERE user_id = $1 ORDER BY start_date ASC`,
    [req.userId]
  ) as any[];

  if (runs.length < 2) {
    return res.json({ has_data: false, message: 'Complete more runs to see your improvement' });
  }

  // First week average vs this week average
  const firstWeekRuns = runs.slice(0, Math.min(3, Math.ceil(runs.length * 0.2)));
  const recentRuns = runs.slice(-Math.min(5, Math.ceil(runs.length * 0.2)));

  const firstAvgPace = firstWeekRuns.reduce((s, r) => s + r.average_pace_per_km, 0) / firstWeekRuns.length;
  const recentAvgPace = recentRuns.reduce((s, r) => s + r.average_pace_per_km, 0) / recentRuns.length;

  const firstAvgDist = firstWeekRuns.reduce((s, r) => s + r.distance_meters, 0) / firstWeekRuns.length;
  const recentAvgDist = recentRuns.reduce((s, r) => s + r.distance_meters, 0) / recentRuns.length;

  const paceImprovement = Math.round(firstAvgPace - recentAvgPace);
  const distanceGrowth = Math.round(((recentAvgDist - firstAvgDist) / firstAvgDist) * 100);

  // Weekly pace trend for chart
  const weeklyPaces: { week: string; pace: number; distance_km: number }[] = [];
  const weekMap = new Map<string, { paces: number[]; distances: number[] }>();

  for (const run of runs) {
    const weekStart = getWeekStart(new Date(run.start_date));
    const key = weekStart.toISOString().split('T')[0];
    if (!weekMap.has(key)) weekMap.set(key, { paces: [], distances: [] });
    weekMap.get(key)!.paces.push(run.average_pace_per_km);
    weekMap.get(key)!.distances.push(run.distance_meters / 1000);
  }

  for (const [week, data] of weekMap) {
    weeklyPaces.push({
      week,
      pace: Math.round(data.paces.reduce((a, b) => a + b, 0) / data.paces.length),
      distance_km: Math.round(data.distances.reduce((a, b) => a + b, 0) * 10) / 10,
    });
  }

  res.json({
    has_data: true,
    before: {
      avg_pace: Math.round(firstAvgPace),
      avg_distance_km: Math.round(firstAvgDist / 100) / 10,
      period: firstWeekRuns[0]?.start_date,
    },
    now: {
      avg_pace: Math.round(recentAvgPace),
      avg_distance_km: Math.round(recentAvgDist / 100) / 10,
      period: recentRuns[recentRuns.length - 1]?.start_date,
    },
    improvement: {
      pace_seconds: paceImprovement,
      pace_improved: paceImprovement > 0,
      distance_growth_percent: distanceGrowth,
      total_runs: runs.length,
    },
    trend: weeklyPaces,
  });
});

// GET /progress/journey — milestone timeline
router.get('/journey', async (req: AuthRequest, res: Response) => {
  const milestones: { date: string; type: string; title: string; detail: string; icon: string }[] = [];

  // Tier changes
  const tierChanges = await db.query(
    `SELECT tier, calculated_at FROM tier_history WHERE user_id = $1 ORDER BY calculated_at ASC`,
    [req.userId]
  ) as any[];

  tierChanges.forEach((t, i) => {
    if (i === 0) {
      milestones.push({ date: t.calculated_at, type: 'tier', title: `Classified: ${t.tier}`, detail: 'First tier assessment', icon: t.tier === 'advanced' ? '👑' : t.tier === 'intermediate' ? '⚡' : '🌱' });
    } else if (tierChanges[i - 1].tier !== t.tier) {
      milestones.push({ date: t.calculated_at, type: 'tier', title: `Promoted to ${t.tier}`, detail: `Upgraded from ${tierChanges[i - 1].tier}`, icon: t.tier === 'advanced' ? '👑' : '⚡' });
    }
  });

  // Distance milestones (50km, 100km, 250km, 500km)
  const totalDist = (await db.queryOne('SELECT COALESCE(SUM(distance_meters), 0) as total FROM activities WHERE user_id = $1', [req.userId]) as any).total / 1000;
  const distMilestones = [50, 100, 250, 500, 1000];
  for (const km of distMilestones) {
    if (totalDist >= km) {
      const milestone = await db.queryOne(`
        SELECT start_date FROM (
          SELECT start_date, SUM(distance_meters / 1000.0) OVER (ORDER BY start_date) as running_total
          FROM activities WHERE user_id = $1
        ) sub WHERE running_total >= $2 LIMIT 1
      `, [req.userId, km]) as any;
      if (milestone) {
        milestones.push({ date: milestone.start_date, type: 'distance', title: `${km}km Total`, detail: 'Distance milestone reached', icon: '🗺️' });
      }
    }
  }

  // Achievements earned
  const achievements = await db.query(
    `SELECT a.name, a.icon, ua.earned_at FROM user_achievements ua JOIN achievements a ON a.id = ua.achievement_id WHERE ua.user_id = $1 ORDER BY ua.earned_at ASC`,
    [req.userId]
  ) as any[];

  achievements.forEach(a => {
    milestones.push({ date: a.earned_at, type: 'achievement', title: a.name, detail: 'Achievement unlocked', icon: a.icon });
  });

  // First run
  const firstRun = await db.queryOne('SELECT start_date, distance_meters FROM activities WHERE user_id = $1 ORDER BY start_date ASC LIMIT 1', [req.userId]) as any;
  if (firstRun) {
    milestones.push({ date: firstRun.start_date, type: 'first', title: 'First Run', detail: `${(firstRun.distance_meters / 1000).toFixed(1)}km`, icon: '🎯' });
  }

  milestones.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  res.json({ milestones, total_distance_km: Math.round(totalDist) });
});

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default router;
