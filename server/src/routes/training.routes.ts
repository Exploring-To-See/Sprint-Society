import { Router, Response } from 'express';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateTrainingPlan, estimateVDOT, getTrainingPaces, predictRaceTime, calculateReadiness } from '../engine/trainingPlanGenerator';

const router = Router();
router.use(authenticate);

// GET /training/plan — Generate or fetch current training plan
router.get('/plan', (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Check for existing active plan
  const existingPlan = db.prepare(
    `SELECT * FROM transformation_plans WHERE user_id = ? ORDER BY generated_at DESC LIMIT 1`
  ).get(req.userId) as any;

  if (existingPlan) {
    const planData = JSON.parse(existingPlan.plan_data || '{}');
    return res.json({
      ...existingPlan,
      ...planData,
      plan_data: undefined,
    });
  }

  // No plan exists — generate a default one
  const runs = db.prepare(
    `SELECT distance_meters, moving_time_seconds, average_pace_per_km, average_heartrate, start_date
     FROM activities WHERE user_id = ? ORDER BY start_date DESC LIMIT 30`
  ).all(req.userId) as any[];

  const defaultGoal = {
    distance_meters: user.running_experience === 'advanced' ? 21100 : user.running_experience === 'intermediate' ? 10000 : 5000,
  };

  const plan = generateTrainingPlan(user, runs, defaultGoal);

  // Save to DB
  db.prepare(
    `INSERT INTO transformation_plans (user_id, current_pace_per_km, target_pace_per_km, current_tier, target_tier, estimated_weeks, plan_data)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    req.userId,
    plan.training_paces.tempo,
    plan.training_paces.tempo * 0.9,
    user.running_experience || 'beginner',
    'intermediate',
    plan.total_weeks,
    JSON.stringify(plan)
  );

  res.json(plan);
});

// POST /training/plan — Generate plan with specific race goal
router.post('/plan', (req: AuthRequest, res: Response) => {
  const { distance_meters, target_time_seconds, race_date, race_name } = req.body;

  if (!distance_meters) return res.status(400).json({ error: 'distance_meters required' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  const runs = db.prepare(
    `SELECT distance_meters, moving_time_seconds, average_pace_per_km, average_heartrate, start_date
     FROM activities WHERE user_id = ? ORDER BY start_date DESC LIMIT 30`
  ).all(req.userId) as any[];

  const goal = { distance_meters, target_time_seconds, race_date, race_name };
  const plan = generateTrainingPlan(user, runs, goal);

  // Save
  db.prepare(
    `INSERT INTO transformation_plans (user_id, current_pace_per_km, target_pace_per_km, current_tier, target_tier, estimated_weeks, plan_data)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    req.userId,
    plan.training_paces.tempo,
    plan.training_paces.tempo * 0.9,
    user.running_experience || 'beginner',
    'intermediate',
    plan.total_weeks,
    JSON.stringify(plan)
  );

  res.json(plan);
});

// GET /training/week — Get this week's sessions
router.get('/week', (req: AuthRequest, res: Response) => {
  const existingPlan = db.prepare(
    `SELECT plan_data, generated_at FROM transformation_plans WHERE user_id = ? ORDER BY generated_at DESC LIMIT 1`
  ).get(req.userId) as any;

  if (!existingPlan) return res.json({ week: null, message: 'No active plan. Generate one first.' });

  const plan = JSON.parse(existingPlan.plan_data);
  const startDate = new Date(existingPlan.generated_at);
  const weeksSinceStart = Math.floor((Date.now() - startDate.getTime()) / (7 * 86400000));
  const currentWeekIndex = Math.min(weeksSinceStart, plan.weeks.length - 1);

  // Wellness-adjusted intensity
  const today = new Date().toISOString().split('T')[0];
  const wellness = db.prepare(
    'SELECT sleep_hours, stress_level, energy_level FROM daily_wellness WHERE user_id = ? AND date = ?'
  ).get(req.userId, today) as any;

  let recoveryFactor = 1.0;
  if (wellness) {
    if (wellness.sleep_hours && wellness.sleep_hours < 6) recoveryFactor -= 0.12;
    if (wellness.stress_level && wellness.stress_level >= 8) recoveryFactor -= 0.10;
    if (wellness.energy_level && wellness.energy_level <= 3) recoveryFactor -= 0.08;
    recoveryFactor = Math.max(0.6, recoveryFactor);
  }

  res.json({
    current_week: currentWeekIndex + 1,
    total_weeks: plan.total_weeks,
    week: plan.weeks[currentWeekIndex],
    training_paces: plan.training_paces,
    vdot: plan.vdot,
    recovery_factor: recoveryFactor,
    wellness_logged: !!wellness,
  });
});

// GET /training/readiness — Daily readiness score
router.get('/readiness', (req: AuthRequest, res: Response) => {
  const runs = db.prepare(
    `SELECT distance_meters, moving_time_seconds, average_pace_per_km, start_date, activity_type
     FROM activities WHERE user_id = ? AND start_date > datetime('now', '-7 days')
     ORDER BY start_date DESC`
  ).all(req.userId) as any[];

  const readiness = calculateReadiness(runs);
  res.json(readiness);
});

// GET /training/paces — Get current VDOT-based training paces
router.get('/paces', (req: AuthRequest, res: Response) => {
  const runs = db.prepare(
    `SELECT distance_meters, moving_time_seconds, average_pace_per_km, start_date
     FROM activities WHERE user_id = ? ORDER BY start_date DESC LIMIT 20`
  ).all(req.userId) as any[];

  const vdot = estimateVDOT(runs);
  const paces = getTrainingPaces(vdot);

  res.json({ vdot, paces });
});

// GET /training/predict — Race time prediction
router.get('/predict', (req: AuthRequest, res: Response) => {
  const distance = Number(req.query.distance) || 5000;

  const runs = db.prepare(
    `SELECT distance_meters, moving_time_seconds, average_pace_per_km, start_date
     FROM activities WHERE user_id = ? ORDER BY start_date DESC LIMIT 20`
  ).all(req.userId) as any[];

  const vdot = estimateVDOT(runs);
  const predictedSeconds = predictRaceTime(vdot, distance);

  const hours = Math.floor(predictedSeconds / 3600);
  const minutes = Math.floor((predictedSeconds % 3600) / 60);
  const seconds = predictedSeconds % 60;

  res.json({
    distance_meters: distance,
    predicted_seconds: predictedSeconds,
    predicted_formatted: hours > 0
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      : `${minutes}:${seconds.toString().padStart(2, '0')}`,
    vdot,
    confidence: runs.length >= 5 ? 'high' : runs.length >= 2 ? 'medium' : 'low',
  });
});

// POST /training/complete-session — Mark a planned session as done
router.post('/complete-session', (req: AuthRequest, res: Response) => {
  const { week_number, day, activity_id } = req.body;

  // Award XP for completing planned training
  const xp = db.prepare('SELECT * FROM user_xp WHERE user_id = ?').get(req.userId) as any;
  if (xp) {
    const xpReward = 30;
    db.prepare('UPDATE user_xp SET total_xp = total_xp + ? WHERE user_id = ?').run(xpReward, req.userId);
    db.prepare('INSERT INTO xp_transactions (user_id, amount, source, description) VALUES (?, ?, ?, ?)').run(
      req.userId, xpReward, 'training_session', `Completed Week ${week_number} Day ${day} session`
    );
  }

  res.json({ message: 'Session completed', xp_awarded: 30 });
});

// POST /training/lt-test — Save lactate threshold test result
router.post('/lt-test', (req: AuthRequest, res: Response) => {
  const { avg_pace_per_km, avg_heartrate, duration_seconds, notes } = req.body;

  if (!avg_pace_per_km || !duration_seconds) {
    return res.status(400).json({ error: 'avg_pace_per_km and duration_seconds required' });
  }

  if (duration_seconds < 900 || duration_seconds > 1500) {
    return res.status(400).json({ error: 'LT test should be 15-25 minutes' });
  }

  const today = new Date().toISOString().split('T')[0];

  db.prepare(`
    INSERT INTO lt_tests (user_id, test_date, avg_pace_per_km, avg_heartrate, duration_seconds, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.userId, today, avg_pace_per_km, avg_heartrate || null, duration_seconds, notes || null);

  res.json({
    message: 'LT test saved',
    lt_pace: avg_pace_per_km,
    lt_heartrate: avg_heartrate || null,
    test_date: today,
  });
});

// GET /training/lt-test — Get latest LT test result
router.get('/lt-test', (req: AuthRequest, res: Response) => {
  const test = db.prepare(`
    SELECT * FROM lt_tests WHERE user_id = ? ORDER BY test_date DESC LIMIT 1
  `).get(req.userId) as any;

  if (!test) {
    return res.json({ has_test: false, message: 'No LT test recorded. Take a 20-min threshold test for personalized training paces.' });
  }

  const daysSinceTest = Math.floor((Date.now() - new Date(test.test_date).getTime()) / 86400000);

  res.json({
    has_test: true,
    lt_pace: test.avg_pace_per_km,
    lt_heartrate: test.avg_heartrate,
    test_date: test.test_date,
    days_since_test: daysSinceTest,
    stale: daysSinceTest > 60,
    stale_message: daysSinceTest > 60 ? 'Test is over 60 days old. Consider re-testing.' : null,
  });
});

export default router;
