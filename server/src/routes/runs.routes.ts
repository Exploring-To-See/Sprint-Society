import { Router, Response } from 'express';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  const runs = db.prepare(`
    SELECT * FROM activities WHERE user_id = ? ORDER BY start_date DESC LIMIT ? OFFSET ?
  `).all(req.userId, limit, offset);

  const total = db.prepare('SELECT COUNT(*) as count FROM activities WHERE user_id = ?').get(req.userId) as any;

  res.json({ runs: runs.map(parseRun), total: total.count, page, limit });
});

router.get('/stats', authenticate, (req: AuthRequest, res: Response) => {
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_runs,
      COALESCE(SUM(distance_meters), 0) as total_distance,
      COALESCE(SUM(moving_time_seconds), 0) as total_time,
      COALESCE(AVG(average_pace_per_km), 0) as avg_pace,
      COALESCE(MIN(average_pace_per_km), 0) as best_pace,
      COALESCE(MAX(distance_meters), 0) as longest_run,
      COALESCE(SUM(elevation_gain), 0) as total_elevation
    FROM activities WHERE user_id = ?
  `).get(req.userId);

  res.json(stats);
});

router.get('/chart-data', authenticate, (req: AuthRequest, res: Response) => {
  const weeks = parseInt(req.query.weeks as string) || 12;
  const since = new Date();
  since.setDate(since.getDate() - weeks * 7);

  const runs = db.prepare(`
    SELECT start_date, distance_meters, moving_time_seconds, average_pace_per_km
    FROM activities WHERE user_id = ? AND start_date >= ? ORDER BY start_date ASC
  `).all(req.userId, since.toISOString());

  res.json(runs);
});

router.get('/weekly-summary', authenticate, (req: AuthRequest, res: Response) => {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);

  const thisWeek = db.prepare(`
    SELECT COUNT(*) as runs, COALESCE(SUM(distance_meters), 0) as distance,
    COALESCE(SUM(moving_time_seconds), 0) as time, COALESCE(AVG(average_pace_per_km), 0) as avg_pace
    FROM activities WHERE user_id = ? AND start_date >= ?
  `).get(req.userId, weekStart.toISOString()) as any;

  const lastWeek = db.prepare(`
    SELECT COALESCE(AVG(average_pace_per_km), 0) as avg_pace
    FROM activities WHERE user_id = ? AND start_date >= ? AND start_date < ?
  `).get(req.userId, prevWeekStart.toISOString(), weekStart.toISOString()) as any;

  const improvement = lastWeek.avg_pace > 0 && thisWeek.avg_pace > 0
    ? ((lastWeek.avg_pace - thisWeek.avg_pace) / lastWeek.avg_pace) * 100
    : 0;

  res.json({
    total_distance_km: Math.round((thisWeek.distance / 1000) * 100) / 100,
    total_runs: thisWeek.runs,
    total_time_minutes: Math.round(thisWeek.time / 60),
    average_pace_per_km: Math.round(thisWeek.avg_pace),
    improvement_percent: Math.round(improvement * 10) / 10,
  });
});

// GET /runs/trends — weekly volume + consistency for last 8 weeks
router.get('/trends', authenticate, (req: AuthRequest, res: Response) => {
  const weeks = [];
  for (let i = 7; i >= 0; i--) {
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() - (i * 7));
    weekEnd.setHours(23, 59, 59, 999);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const data = db.prepare(`
      SELECT COUNT(*) as runs, COALESCE(SUM(distance_meters), 0) as distance,
        COUNT(DISTINCT date(start_date)) as days_run
      FROM activities WHERE user_id = ? AND start_date >= ? AND start_date <= ?
    `).get(req.userId, weekStart.toISOString(), weekEnd.toISOString()) as any;

    weeks.push({
      week_start: weekStart.toISOString().split('T')[0],
      km: Math.round(data.distance / 1000 * 10) / 10,
      runs: data.runs,
      days_run: data.days_run,
    });
  }
  res.json(weeks);
});

router.get('/:id', authenticate, (req: AuthRequest, res: Response) => {
  const run = db.prepare('SELECT * FROM activities WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!run) return res.status(404).json({ error: 'Run not found' });
  res.json(parseRun(run));
});

function parseRun(run: any) {
  return {
    ...run,
    start_latlng: run.start_latlng ? JSON.parse(run.start_latlng) : null,
    end_latlng: run.end_latlng ? JSON.parse(run.end_latlng) : null,
    splits: run.splits ? JSON.parse(run.splits) : [],
  };
}

export default router;
