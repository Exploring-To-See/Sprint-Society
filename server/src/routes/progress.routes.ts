import { Router, Response } from 'express';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateProgressReport } from '../engine/progressTracker';

const router = Router();
router.use(authenticate);

// GET /progress/weekly — This week vs last week
router.get('/weekly', (req: AuthRequest, res: Response) => {
  const runs = db.prepare(
    `SELECT distance_meters, moving_time_seconds, average_pace_per_km, start_date
     FROM activities WHERE user_id = ? ORDER BY start_date DESC LIMIT 100`
  ).all(req.userId) as any[];

  const report = generateProgressReport(runs, 'weekly');
  res.json(report);
});

// GET /progress/monthly — This month vs last month
router.get('/monthly', (req: AuthRequest, res: Response) => {
  const runs = db.prepare(
    `SELECT distance_meters, moving_time_seconds, average_pace_per_km, start_date
     FROM activities WHERE user_id = ? ORDER BY start_date DESC LIMIT 200`
  ).all(req.userId) as any[];

  const report = generateProgressReport(runs, 'monthly');
  res.json(report);
});

// GET /progress/all-time — Full history
router.get('/all-time', (req: AuthRequest, res: Response) => {
  const runs = db.prepare(
    `SELECT distance_meters, moving_time_seconds, average_pace_per_km, start_date
     FROM activities WHERE user_id = ? ORDER BY start_date DESC`
  ).all(req.userId) as any[];

  const report = generateProgressReport(runs, 'all_time');
  res.json(report);
});

// GET /progress/improvement — "You were HERE, now you're HERE" visualization data
router.get('/improvement', (req: AuthRequest, res: Response) => {
  const runs = db.prepare(
    `SELECT distance_meters, moving_time_seconds, average_pace_per_km, start_date
     FROM activities WHERE user_id = ? ORDER BY start_date ASC`
  ).all(req.userId) as any[];

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

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default router;
