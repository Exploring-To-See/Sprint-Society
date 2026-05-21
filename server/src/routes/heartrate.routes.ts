import { Router, Response } from 'express';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { calculateHRZones, estimateMaxHR, analyzeActivityHR, detectAerobicDecoupling } from '../engine/heartRateZones';

const router = Router();
router.use(authenticate);

// GET /heartrate/zones — Get user's personalized HR zones
router.get('/zones', (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Get max HR from activities or estimate
  const maxHRFromActivities = db.prepare(
    `SELECT MAX(max_heartrate) as max_hr FROM activities WHERE user_id = ? AND max_heartrate > 0`
  ).get(req.userId) as any;

  const maxHR = estimateMaxHR(
    user.age || 30,
    'tanaka',
    user.gender,
    maxHRFromActivities?.max_hr || undefined
  );

  // Resting HR: use lowest avg HR from easy/recovery runs if available
  const restingHREstimate = db.prepare(
    `SELECT MIN(average_heartrate) as resting_estimate
     FROM activities WHERE user_id = ? AND average_heartrate > 40
     AND distance_meters > 1000 AND average_pace_per_km > 360`
  ).get(req.userId) as any;

  const restingHR = restingHREstimate?.resting_estimate
    ? Math.max(40, restingHREstimate.resting_estimate - 20) // Subtract 20 since running HR > resting
    : undefined;

  const profile = calculateHRZones(maxHR, restingHR);

  res.json({
    ...profile,
    source: maxHRFromActivities?.max_hr ? 'activity_based' : 'formula_estimated',
    tip: maxHRFromActivities?.max_hr
      ? 'Zones calibrated from your actual running data.'
      : 'Zones estimated from age. Do a max effort run to calibrate more accurately.',
  });
});

// GET /heartrate/analysis/:activityId — Analyze HR for a specific run
router.get('/analysis/:activityId', (req: AuthRequest, res: Response) => {
  const activity = db.prepare(
    `SELECT * FROM activities WHERE id = ? AND user_id = ?`
  ).get(req.params.activityId, req.userId) as any;

  if (!activity) return res.status(404).json({ error: 'Activity not found' });
  if (!activity.average_heartrate) return res.json({ error: 'No HR data for this activity', has_hr: false });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as any;

  const maxHRFromActivities = db.prepare(
    `SELECT MAX(max_heartrate) as max_hr FROM activities WHERE user_id = ? AND max_heartrate > 0`
  ).get(req.userId) as any;

  const maxHR = estimateMaxHR(user.age || 30, 'tanaka', user.gender, maxHRFromActivities?.max_hr);
  const profile = calculateHRZones(maxHR);

  // Determine session type from training plan match (simplified — use pace to infer)
  const pacePerKm = activity.average_pace_per_km;
  let inferredType = 'easy';
  if (pacePerKm < 270) inferredType = 'interval';
  else if (pacePerKm < 320) inferredType = 'tempo';
  else if (pacePerKm < 370) inferredType = 'long';
  else inferredType = 'easy';

  const analysis = analyzeActivityHR(
    activity.average_heartrate,
    activity.max_heartrate || activity.average_heartrate,
    activity.moving_time_seconds / 60,
    inferredType,
    profile,
    pacePerKm
  );

  res.json({ ...analysis, has_hr: true, inferred_session_type: inferredType });
});

// GET /heartrate/trends — HR efficiency over time
router.get('/trends', (req: AuthRequest, res: Response) => {
  const weeks = parseInt(req.query.weeks as string) || 12;

  const activities = db.prepare(
    `SELECT average_heartrate, average_pace_per_km, distance_meters, moving_time_seconds, start_date
     FROM activities WHERE user_id = ? AND average_heartrate > 0
     AND start_date > datetime('now', '-${weeks * 7} days')
     ORDER BY start_date ASC`
  ).all(req.userId) as any[];

  if (activities.length < 3) {
    return res.json({ trends: [], message: 'Need at least 3 runs with HR data for trends.' });
  }

  // Calculate cardiac efficiency per run: pace achieved / HR effort
  // Lower pace at lower HR = more efficient
  const trends = activities.map((a: any) => ({
    date: a.start_date,
    avg_hr: a.average_heartrate,
    pace_per_km: a.average_pace_per_km,
    efficiency: Math.round((1000 / a.average_pace_per_km) / (a.average_heartrate / 100) * 100) / 100,
    distance_km: Math.round(a.distance_meters / 100) / 10,
  }));

  // Overall trend: compare first third vs last third efficiency
  const third = Math.floor(trends.length / 3);
  const earlyEfficiency = trends.slice(0, third).reduce((s: number, t: any) => s + t.efficiency, 0) / third;
  const recentEfficiency = trends.slice(-third).reduce((s: number, t: any) => s + t.efficiency, 0) / third;
  const improvement = Math.round((recentEfficiency - earlyEfficiency) / earlyEfficiency * 100);

  res.json({
    trends,
    summary: {
      total_hr_runs: activities.length,
      early_efficiency: Math.round(earlyEfficiency * 100) / 100,
      recent_efficiency: Math.round(recentEfficiency * 100) / 100,
      improvement_percent: improvement,
      message: improvement > 5
        ? `Cardiac efficiency improved ${improvement}% — your heart is getting stronger.`
        : improvement < -5
          ? `Efficiency dropped ${Math.abs(improvement)}% — might be overtraining or need recovery.`
          : 'Cardiac efficiency stable — consistent training.',
    },
  });
});

export default router;
