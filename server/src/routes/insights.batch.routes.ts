import { Router, Response } from 'express';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { calculateTrainingLoad, trackVDOTProgression, detectDetraining } from '../engine/adaptiveEngine';
import { classifyTier } from '../engine/tierClassifier';
import { estimateVDOT, getTrainingPaces, predictRaceTime } from '../engine/trainingPlanGenerator';
import { calculateAllPRs, getPRSummary } from '../engine/personalRecords';

const router = Router();
router.use(authenticate);

router.get('/', (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as any;
  if (!user) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });

  // Shared: recent activities (used by load, summary, vdot, predictions)
  const activities = db.prepare(
    `SELECT distance_meters, moving_time_seconds, average_heartrate, average_pace_per_km, start_date, elevation_gain, max_heartrate, id
     FROM activities WHERE user_id = ? AND start_date > datetime('now', '-90 days')
     ORDER BY start_date DESC`
  ).all(req.userId) as any[];

  // 1. Adaptive load
  const recentActivities = activities.filter((a: any) => {
    const daysAgo = (Date.now() - new Date(a.start_date).getTime()) / 86400000;
    return daysAgo <= 35;
  });
  const load = recentActivities.length > 0 ? calculateTrainingLoad(recentActivities, user.max_heartrate) : null;

  // 2. Weekly summary (adaptive summary)
  const qualifyingRuns = activities.filter((a: any) => a.distance_meters >= 1500);
  const progression = qualifyingRuns.length >= 3 ? trackVDOTProgression(qualifyingRuns) : null;
  const lastActivity = activities[0]?.start_date || null;
  const detraining = detectDetraining(lastActivity);

  const summary = recentActivities.length > 0 ? {
    vdot: progression?.current_vdot || null,
    readiness: null,
    detraining,
    injury_risk: load?.injury_risk || 'low',
  } : null;

  // 3. VDOT progression
  let vdotProgression = null;
  if (progression) {
    const paces = getTrainingPaces(progression.current_vdot);
    vdotProgression = { ...progression, current_paces: paces };
  }

  // 4. Tier
  const tierRuns = db.prepare(
    'SELECT distance_meters, moving_time_seconds, start_date FROM activities WHERE user_id = ? ORDER BY start_date DESC LIMIT 30'
  ).all(req.userId) as any[];
  const tier = classifyTier(user, tierRuns);

  // 5. Race predictions
  const predRuns = db.prepare(
    'SELECT distance_meters, moving_time_seconds, average_pace_per_km, start_date FROM activities WHERE user_id = ? ORDER BY start_date DESC LIMIT 20'
  ).all(req.userId) as any[];
  const vdot = estimateVDOT(predRuns);

  function predict(distance: number) {
    const predictedSeconds = predictRaceTime(vdot, distance);
    const hours = Math.floor(predictedSeconds / 3600);
    const minutes = Math.floor((predictedSeconds % 3600) / 60);
    const seconds = predictedSeconds % 60;
    return {
      distance_meters: distance,
      predicted_seconds: predictedSeconds,
      predicted_formatted: hours > 0
        ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${minutes}:${seconds.toString().padStart(2, '0')}`,
      vdot,
      confidence: predRuns.length >= 5 ? 'high' : predRuns.length >= 2 ? 'medium' : 'low',
    };
  }

  const predictions = {
    '5K': predict(5000),
    '10K': predict(10000),
    'Half': predict(21097),
    'Marathon': predict(42195),
  };

  // 6. Run stats
  const stats = db.prepare(`
    SELECT COUNT(*) as total_runs, COALESCE(SUM(distance_meters), 0) as total_distance,
      COALESCE(SUM(moving_time_seconds), 0) as total_time, COALESCE(AVG(average_pace_per_km), 0) as avg_pace,
      COALESCE(MIN(average_pace_per_km), 0) as best_pace, COALESCE(MAX(distance_meters), 0) as longest_run,
      COALESCE(SUM(elevation_gain), 0) as total_elevation
    FROM activities WHERE user_id = ?
  `).get(req.userId);

  // 7. Records
  const allActivities = db.prepare(
    `SELECT id, distance_meters, moving_time_seconds, average_pace_per_km, average_heartrate, max_heartrate, elevation_gain, start_date
     FROM activities WHERE user_id = ? ORDER BY start_date DESC`
  ).all(req.userId) as any[];
  const records = allActivities.length > 0 ? getPRSummary(calculateAllPRs(allActivities)) : { race_prs: [], effort_prs: [], total_count: 0 };

  res.json({ data: { adaptive: load, summary, vdotProgression, tier, predictions, stats, records } });
});

export default router;
