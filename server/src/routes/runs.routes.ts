import { Router, Response } from 'express';
import db from '../database/pg';
import { authenticate, AuthRequest } from '../middleware/auth';
import { executeRunCascade } from '../engine/runCascade';
import { safeJsonParse } from '../utils/response';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  const runs = await db.query(`
    SELECT * FROM activities WHERE user_id = $1 AND deleted_at IS NULL ORDER BY start_date DESC LIMIT $2 OFFSET $3
  `, [req.userId, limit, offset]);

  const total = await db.queryOne('SELECT COUNT(*) as count FROM activities WHERE user_id = $1 AND deleted_at IS NULL', [req.userId]);

  res.json({ data: { runs: runs.map(parseRun), total: total.count, page, limit } });
});

router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  const stats = await db.queryOne(`
    SELECT
      COUNT(*) as total_runs,
      COALESCE(SUM(distance_meters), 0) as total_distance,
      COALESCE(SUM(moving_time_seconds), 0) as total_time,
      COALESCE(AVG(average_pace_per_km), 0) as avg_pace,
      COALESCE(MIN(average_pace_per_km), 0) as best_pace,
      COALESCE(MAX(distance_meters), 0) as longest_run,
      COALESCE(SUM(elevation_gain), 0) as total_elevation
    FROM activities WHERE user_id = $1
  `, [req.userId]);

  res.json(stats);
});

router.get('/chart-data', authenticate, async (req: AuthRequest, res: Response) => {
  const weeks = parseInt(req.query.weeks as string) || 12;
  const since = new Date();
  since.setDate(since.getDate() - weeks * 7);

  const runs = await db.query(`
    SELECT start_date, distance_meters, moving_time_seconds, average_pace_per_km
    FROM activities WHERE user_id = $1 AND start_date >= $2 ORDER BY start_date ASC
  `, [req.userId, since.toISOString()]);

  res.json(runs);
});

router.get('/weekly-summary', authenticate, async (req: AuthRequest, res: Response) => {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);

  const thisWeek = await db.queryOne(`
    SELECT COUNT(*) as runs, COALESCE(SUM(distance_meters), 0) as distance,
    COALESCE(SUM(moving_time_seconds), 0) as time, COALESCE(AVG(average_pace_per_km), 0) as avg_pace
    FROM activities WHERE user_id = $1 AND start_date >= $2
  `, [req.userId, weekStart.toISOString()]);

  const lastWeek = await db.queryOne(`
    SELECT COALESCE(AVG(average_pace_per_km), 0) as avg_pace
    FROM activities WHERE user_id = $1 AND start_date >= $2 AND start_date < $3
  `, [req.userId, prevWeekStart.toISOString(), weekStart.toISOString()]);

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
router.get('/trends', authenticate, async (req: AuthRequest, res: Response) => {
  const weeks = [];
  for (let i = 7; i >= 0; i--) {
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() - (i * 7));
    weekEnd.setHours(23, 59, 59, 999);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const data = await db.queryOne(`
      SELECT COUNT(*) as runs, COALESCE(SUM(distance_meters), 0) as distance,
        COUNT(DISTINCT DATE(start_date)) as days_run
      FROM activities WHERE user_id = $1 AND start_date >= $2 AND start_date <= $3
    `, [req.userId, weekStart.toISOString(), weekEnd.toISOString()]);

    weeks.push({
      week_start: weekStart.toISOString().split('T')[0],
      km: Math.round(data.distance / 1000 * 10) / 10,
      runs: data.runs,
      days_run: data.days_run,
    });
  }
  res.json(weeks);
});

// POST /runs/log — Run completion with full cascade (XP + Kendu + achievements + notifications)
router.post('/log', authenticate, async (req: AuthRequest, res: Response) => {
  const { distance_meters, moving_time_seconds, start_date, elevation_gain, splits, rpe } = req.body;

  if (!distance_meters || !moving_time_seconds) {
    return res.status(400).json({ error: 'Distance and time required' });
  }

  const pacePerKm = distance_meters > 0 ? (moving_time_seconds / (distance_meters / 1000)) : 0;

  const anomalies: string[] = [];
  if (pacePerKm > 0 && pacePerKm < 150) anomalies.push('pace_faster_than_world_record');
  if (pacePerKm > 1200) anomalies.push('pace_unrealistically_slow');
  if (distance_meters > 100000) anomalies.push('distance_over_100km');
  if (distance_meters < 50) anomalies.push('distance_too_short');
  const avgSpeedKmh = distance_meters > 0 ? (distance_meters / 1000) / (moving_time_seconds / 3600) : 0;
  if (avgSpeedKmh > 45) anomalies.push('speed_exceeds_human_limit');

  if (splits) {
    const parsed = typeof splits === 'string' ? safeJsonParse(splits, null) : splits;
    if (Array.isArray(parsed)) {
      for (const split of parsed) {
        if (split.time_seconds && split.time_seconds < 90) anomalies.push('split_faster_than_world_record');
        if (split.time_seconds && split.time_seconds > 1200) anomalies.push('split_unrealistically_slow');
      }
    }
  }

  if (anomalies.length > 0 && anomalies.includes('speed_exceeds_human_limit')) {
    return res.status(400).json({ error: 'Run data appears invalid — speed exceeds human limits. GPS may have glitched.', anomalies });
  }

  const { map_polyline } = req.body;

  const result = await db.queryOne(`
    INSERT INTO activities (user_id, distance_meters, moving_time_seconds, elapsed_time_seconds, average_pace_per_km, start_date, activity_type, elevation_gain, splits, rpe, map_polyline)
    VALUES ($1, $2, $3, $4, $5, $6, 'Run', $7, $8, $9, $10)
    RETURNING id
  `, [
    req.userId,
    distance_meters,
    moving_time_seconds,
    moving_time_seconds,
    pacePerKm,
    start_date || new Date().toISOString(),
    elevation_gain || null,
    splits || null,
    rpe || null,
    map_polyline || null
  ]);

  // Await the cascade before responding. It writes XP, Kendu, PBs, achievements,
  // goal progress and notifications — fire-and-forget would (a) serialize a
  // pending Promise as `{}` to the client and (b) lose every write on a
  // serverless host, which freezes the function the moment the response is sent.
  const cascade = await executeRunCascade({
    userId: req.userId!,
    activityId: result.id as number,
    distanceMeters: distance_meters,
    movingTimeSeconds: moving_time_seconds,
    pacePerKm,
    elevationGain: elevation_gain || null,
    rpe: rpe || null,
  });

  res.status(201).json({
    id: result.id,
    message: 'Run saved!',
    cascade,
    ...(anomalies.length > 0 ? { warnings: anomalies } : {}),
  });
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const run = await db.queryOne('SELECT * FROM activities WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  if (!run) return res.status(404).json({ error: 'Run not found' });
  res.json(parseRun(run));
});

function parseRun(run: any) {
  return {
    ...run,
    start_latlng: safeJsonParse(run.start_latlng, null),
    end_latlng: safeJsonParse(run.end_latlng, null),
    splits: safeJsonParse(run.splits, []),
  };
}

export default router;
