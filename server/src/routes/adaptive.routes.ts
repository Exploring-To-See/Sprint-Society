import { Router, Response } from 'express';
import db from '../database/pg';
import { authenticate, AuthRequest } from '../middleware/auth';
import { calculateTrainingLoad, analyzeWeekPerformance, adaptNextWeek, trackVDOTProgression, detectDetraining, calculateRunningEconomy } from '../engine/adaptiveEngine';
import { getTrainingPaces } from '../engine/trainingPlanGenerator';

const router = Router();
router.use(authenticate);

// GET /adaptive/load — Training load metrics (ATL, CTL, TSB, injury risk)
router.get('/load', async (req: AuthRequest, res: Response) => {
  const user = await db.queryOne('SELECT max_heartrate FROM users WHERE id = $1', [req.userId]) as any;

  const activities = await db.query(
    `SELECT distance_meters, moving_time_seconds, average_heartrate, start_date
     FROM activities WHERE user_id = $1 AND start_date > NOW() - INTERVAL '35 days'
     ORDER BY start_date DESC`,
    [req.userId]
  ) as any[];

  if (activities.length === 0) {
    return res.json({
      acute_load: 0, chronic_load: 0, training_stress_balance: 0,
      monotony: 0, strain: 0, injury_risk: 'low',
      message: 'No recent activities. Start running to track training load.',
    });
  }

  const load = calculateTrainingLoad(activities, user?.max_heartrate);

  let advice: string;
  switch (load.injury_risk) {
    case 'critical': advice = 'Stop. You\'re overreaching. Take 2-3 full rest days before next session.'; break;
    case 'high': advice = 'Ease back. Only easy runs this week. Your body needs recovery.'; break;
    case 'moderate': advice = 'Watch out. Keep hard sessions to 1-2 this week max.'; break;
    default: advice = 'Good balance. You can train as planned.';
  }

  res.json({ ...load, advice });
});

// GET /adaptive/this-week — Adapted training for current week (reacts to last week)
router.get('/this-week', async (req: AuthRequest, res: Response) => {
  const user = await db.queryOne('SELECT * FROM users WHERE id = $1', [req.userId]) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Get the current plan
  const existingPlan = await db.queryOne(
    `SELECT plan_data, generated_at FROM transformation_plans WHERE user_id = $1 ORDER BY generated_at DESC LIMIT 1`,
    [req.userId]
  ) as any;

  if (!existingPlan) {
    return res.json({ adapted: false, message: 'No active plan. Generate one first via /training/plan.' });
  }

  const plan = JSON.parse(existingPlan.plan_data);
  const startDate = new Date(existingPlan.generated_at);
  const weeksSinceStart = Math.floor((Date.now() - startDate.getTime()) / (7 * 86400000));
  const currentWeekIndex = Math.min(weeksSinceStart, plan.weeks.length - 1);
  const plannedWeek = plan.weeks[currentWeekIndex];

  // Get last week's activities to analyze performance
  const lastWeekActivities = await db.query(
    `SELECT distance_meters, moving_time_seconds, average_pace_per_km, average_heartrate, max_heartrate, start_date
     FROM activities WHERE user_id = $1 AND start_date > NOW() - INTERVAL '14 days' AND start_date <= NOW() - INTERVAL '7 days'
     ORDER BY start_date ASC`,
    [req.userId]
  ) as any[];

  // Get all recent activities for load calculation
  const recentActivities = await db.query(
    `SELECT distance_meters, moving_time_seconds, average_heartrate, start_date
     FROM activities WHERE user_id = $1 AND start_date > NOW() - INTERVAL '35 days'
     ORDER BY start_date DESC`,
    [req.userId]
  ) as any[];

  // If no last-week data, return the plan as-is
  if (lastWeekActivities.length === 0) {
    return res.json({
      adapted: false,
      current_week: currentWeekIndex + 1,
      week: plannedWeek,
      training_paces: plan.training_paces,
      adaptation: null,
      message: 'No activity data from last week — using original plan.',
    });
  }

  // Build completed sessions from last week's activities
  const previousWeekIndex = Math.max(0, currentWeekIndex - 1);
  const previousPlannedWeek = plan.weeks[previousWeekIndex];
  const plannedSessions = previousPlannedWeek?.sessions?.filter((s: any) => s.type !== 'rest') || [];

  const completedSessions = lastWeekActivities.map((a: any) => ({
    planned_type: inferSessionType(a.average_pace_per_km, plan.training_paces),
    planned_distance_km: 0,
    planned_pace_per_km: plan.training_paces.easy_min,
    actual_distance_km: a.distance_meters / 1000,
    actual_pace_per_km: a.average_pace_per_km,
    actual_heartrate_avg: a.average_heartrate || undefined,
    actual_heartrate_max: a.max_heartrate || undefined,
    date: a.start_date,
  }));

  // Match completed sessions to planned ones
  for (const completed of completedSessions) {
    const matchingPlanned = plannedSessions.find((p: any) => {
      if (p.type === completed.planned_type) return true;
      return false;
    });
    if (matchingPlanned) {
      completed.planned_distance_km = matchingPlanned.distance_km || 0;
      completed.planned_pace_per_km = matchingPlanned.target_pace_per_km || plan.training_paces.easy_min;
    }
  }

  // Analyze performance
  const signals = analyzeWeekPerformance(completedSessions, plannedSessions.length, user.max_heartrate);
  const load = calculateTrainingLoad(recentActivities, user.max_heartrate);

  // Generate adaptation
  const adaptation = adaptNextWeek(signals, plannedWeek.total_distance_km, plan.training_paces, load);

  // Apply adaptation to the planned week
  const adaptedWeek = { ...plannedWeek };
  adaptedWeek.total_distance_km = adaptation.adapted_volume_km;

  // Scale session distances proportionally
  if (adaptation.volume_change_percent !== 0) {
    const scale = adaptation.adapted_volume_km / plannedWeek.total_distance_km;
    adaptedWeek.sessions = plannedWeek.sessions.map((s: any) => ({
      ...s,
      distance_km: s.distance_km ? Math.round(s.distance_km * scale * 10) / 10 : undefined,
    }));
  }

  // Apply pace adjustments
  const adaptedPaces = { ...plan.training_paces, ...adaptation.pace_adjustments };

  res.json({
    adapted: true,
    current_week: currentWeekIndex + 1,
    total_weeks: plan.total_weeks,
    week: adaptedWeek,
    training_paces: adaptedPaces,
    adaptation: {
      volume_change: `${adaptation.volume_change_percent > 0 ? '+' : ''}${adaptation.volume_change_percent}%`,
      intensity: adaptation.intensity_shift,
      signals: adaptation.signals,
      summary: adaptation.summary,
      confidence: adaptation.confidence,
    },
    load_metrics: load,
    vdot: plan.vdot,
  });
});

// GET /adaptive/vdot-progression — VDOT evolution over time
router.get('/vdot-progression', async (req: AuthRequest, res: Response) => {
  const runs = await db.query(
    `SELECT distance_meters, moving_time_seconds, average_pace_per_km, start_date
     FROM activities WHERE user_id = $1 AND distance_meters >= 1500
     ORDER BY start_date DESC LIMIT 100`,
    [req.userId]
  ) as any[];

  if (runs.length < 3) {
    return res.json({ message: 'Need at least 3 qualifying runs (1.5km+) to track VDOT progression.' });
  }

  const progression = trackVDOTProgression(runs);
  const paces = getTrainingPaces(progression.current_vdot);

  res.json({
    ...progression,
    current_paces: paces,
    interpretation: progression.vdot_trend === 'improving'
      ? `Fitness improving! VDOT up ${(progression.current_vdot - progression.vdot_4_weeks_ago).toFixed(1)} in 4 weeks. Training is working.`
      : progression.vdot_trend === 'declining'
        ? `VDOT dropped ${(progression.vdot_4_weeks_ago - progression.current_vdot).toFixed(1)} — could be fatigue, illness, or under-recovery. Consider a deload.`
        : 'Fitness holding steady. Consistent training maintaining current level.',
  });
});

// GET /adaptive/summary — Quick overview for dashboard
router.get('/summary', async (req: AuthRequest, res: Response) => {
  const user = await db.queryOne('SELECT max_heartrate FROM users WHERE id = $1', [req.userId]) as any;

  const activities = await db.query(
    `SELECT distance_meters, moving_time_seconds, average_heartrate, average_pace_per_km, start_date
     FROM activities WHERE user_id = $1 AND start_date > NOW() - INTERVAL '35 days'
     ORDER BY start_date DESC`,
    [req.userId]
  ) as any[];

  if (activities.length === 0) {
    return res.json({
      status: 'no_data',
      message: 'Sync your first run to activate the adaptive engine.',
    });
  }

  const load = calculateTrainingLoad(activities, user?.max_heartrate);
  const runs = activities.filter((a: any) => a.distance_meters >= 1500);
  const progression = runs.length >= 3 ? trackVDOTProgression(runs) : null;

  // Detraining detection
  const lastActivity = activities[0]?.start_date || null;
  const detraining = detectDetraining(lastActivity);

  // Running economy (needs HR data)
  const economy = calculateRunningEconomy(activities);

  res.json({
    status: 'active',
    training_load: {
      acute: load.acute_load,
      chronic: load.chronic_load,
      balance: load.training_stress_balance,
      injury_risk: load.injury_risk,
    },
    fitness: progression ? {
      current_vdot: progression.current_vdot,
      trend: progression.vdot_trend,
      change_4w: Math.round((progression.current_vdot - progression.vdot_4_weeks_ago) * 10) / 10,
    } : null,
    detraining: detraining.detected ? detraining : null,
    running_economy: economy.trend !== 'insufficient_data' ? economy : null,
    weekly_runs: activities.filter((a: any) =>
      Date.now() - new Date(a.start_date).getTime() < 7 * 86400000
    ).length,
    message: buildSummaryMessage(load, progression),
  });
});

function inferSessionType(pacePerKm: number, trainingPaces: any): string {
  if (pacePerKm <= trainingPaces.interval * 1.05) return 'interval';
  if (pacePerKm <= trainingPaces.tempo * 1.05) return 'tempo';
  if (pacePerKm <= trainingPaces.marathon * 1.05) return 'long';
  return 'easy';
}

function buildSummaryMessage(load: any, progression: any): string {
  const parts: string[] = [];

  if (load.injury_risk === 'critical') parts.push('Rest now — injury risk is critical.');
  else if (load.injury_risk === 'high') parts.push('Ease up this week.');
  else if (load.training_stress_balance > 10) parts.push('Fresh and ready to push.');
  else if (load.training_stress_balance < -15) parts.push('Accumulated fatigue — recovery priority.');

  if (progression?.vdot_trend === 'improving') parts.push('Fitness trending up.');
  else if (progression?.vdot_trend === 'declining') parts.push('Consider a recovery block.');

  return parts.join(' ') || 'Training on track.';
}

export default router;
