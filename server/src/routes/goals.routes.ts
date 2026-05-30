import { Router, Response } from 'express';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /goals — List user's goals
router.get('/', (req: AuthRequest, res: Response) => {
  const goals = db.prepare(`
    SELECT g.*, e.title as event_name, e.start_time as event_date
    FROM user_goals g
    LEFT JOIN events e ON g.event_id = e.id
    WHERE g.user_id = ? AND g.status = 'active'
    ORDER BY g.target_date ASC NULLS LAST, g.created_at DESC
  `).all(req.userId);

  const completed = db.prepare(`
    SELECT * FROM user_goals WHERE user_id = ? AND status = 'completed'
    ORDER BY completed_at DESC LIMIT 5
  `).all(req.userId);

  res.json({ active: goals, completed });
});

// POST /goals — Create a new goal
router.post('/', (req: AuthRequest, res: Response) => {
  const { type, distance_meters, target_time_seconds, target_pace_per_km, target_date, target_km, target_period, event_id, name } = req.body;

  if (!type || !['race', 'pace', 'volume', 'event'].includes(type)) {
    return res.status(400).json({ error: 'type required: race, pace, volume, or event' });
  }

  // Validate based on type
  if (type === 'race' && !distance_meters) {
    return res.status(400).json({ error: 'distance_meters required for race goals' });
  }
  if (type === 'pace' && !distance_meters) {
    return res.status(400).json({ error: 'distance_meters required for pace goals' });
  }
  if (type === 'volume' && (!target_km || !target_period)) {
    return res.status(400).json({ error: 'target_km and target_period required for volume goals' });
  }
  if (type === 'event' && !event_id) {
    return res.status(400).json({ error: 'event_id required for event goals' });
  }

  // Auto-generate name if not provided
  let goalName = name;
  if (!goalName) {
    if (type === 'race') {
      const distLabel = distance_meters >= 42000 ? 'Marathon' : distance_meters >= 21000 ? 'Half Marathon' : `${(distance_meters / 1000).toFixed(0)}K`;
      if (target_time_seconds) {
        const min = Math.floor(target_time_seconds / 60);
        const sec = target_time_seconds % 60;
        goalName = `Sub-${min}${sec > 0 ? `:${sec.toString().padStart(2, '0')}` : ''} ${distLabel}`;
      } else {
        goalName = `Complete ${distLabel}`;
      }
    } else if (type === 'pace') {
      const distLabel = distance_meters >= 42000 ? 'Marathon' : distance_meters >= 21000 ? 'Half Marathon' : `${(distance_meters / 1000).toFixed(0)}K`;
      const paceMin = Math.floor((target_pace_per_km || 0) / 60);
      const paceSec = Math.round((target_pace_per_km || 0) % 60);
      goalName = `${paceMin}:${paceSec.toString().padStart(2, '0')}/km ${distLabel}`;
    } else if (type === 'volume') {
      goalName = `${target_km}km per ${target_period}`;
    } else {
      goalName = 'Event preparation';
    }
  }

  const result = db.prepare(`
    INSERT INTO user_goals (user_id, type, distance_meters, target_time_seconds, target_pace_per_km, target_date, target_km, target_period, event_id, name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.userId, type,
    distance_meters || null, target_time_seconds || null, target_pace_per_km || null,
    target_date || null, target_km || null, target_period || null,
    event_id || null, goalName
  );

  res.status(201).json({
    id: result.lastInsertRowid,
    name: goalName,
    type,
    message: 'Goal created! Your AI coach will build a plan around this.',
  });
});

// PUT /goals/:id — Update a goal (complete/abandon/modify)
router.put('/:id', (req: AuthRequest, res: Response) => {
  const goal = db.prepare('SELECT * FROM user_goals WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;
  if (!goal) return res.status(404).json({ error: 'Goal not found' });

  const { status, target_date, target_time_seconds, name } = req.body;

  if (status === 'completed') {
    db.prepare('UPDATE user_goals SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?').run('completed', goal.id);
  } else if (status === 'abandoned') {
    db.prepare('UPDATE user_goals SET status = ? WHERE id = ?').run('abandoned', goal.id);
  } else {
    db.prepare(`
      UPDATE user_goals SET
        target_date = COALESCE(?, target_date),
        target_time_seconds = COALESCE(?, target_time_seconds),
        name = COALESCE(?, name)
      WHERE id = ?
    `).run(target_date || null, target_time_seconds || null, name || null, goal.id);
  }

  res.json({ message: 'Goal updated' });
});

// DELETE /goals/:id — Remove a goal
router.delete('/:id', (req: AuthRequest, res: Response) => {
  const result = db.prepare('DELETE FROM user_goals WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Goal not found' });
  res.json({ message: 'Goal deleted' });
});

// POST /goals/generate-plan — Merge all active goals into one training plan
router.post('/generate-plan', (req: AuthRequest, res: Response) => {
  const goals = db.prepare(`
    SELECT * FROM user_goals WHERE user_id = ? AND status = 'active' ORDER BY target_date ASC NULLS LAST
  `).all(req.userId) as any[];

  if (goals.length === 0) {
    return res.status(400).json({ error: 'No active goals. Set at least one goal first.' });
  }

  // Use the primary goal (nearest date or first created) for plan generation
  const primaryGoal = goals[0];

  // Get user data for plan generation
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as any;
  const recentRuns = db.prepare(`
    SELECT distance_meters, moving_time_seconds, average_pace_per_km, start_date
    FROM activities WHERE user_id = ? ORDER BY start_date DESC LIMIT 30
  `).all(req.userId) as any[];

  // Build race goal from primary goal
  const raceGoal = {
    distance_meters: primaryGoal.distance_meters || 5000,
    target_time_seconds: primaryGoal.target_time_seconds || undefined,
    race_date: primaryGoal.target_date || undefined,
    race_name: primaryGoal.name,
  };

  try {
    const { generateTrainingPlan } = require('../engine/trainingPlanGenerator');
    const plan = generateTrainingPlan(user, recentRuns, raceGoal);

    // Store the plan
    db.prepare(`
      INSERT INTO transformation_plans (user_id, current_pace_per_km, target_pace_per_km, estimated_weeks, plan_data)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      req.userId,
      plan.training_paces?.tempo || 360,
      (plan.training_paces?.tempo || 360) * 0.9,
      plan.total_weeks || 8,
      JSON.stringify(plan)
    );

    res.json({
      message: 'Plan generated from your goals!',
      plan_summary: {
        total_weeks: plan.total_weeks,
        weekly_volume_km: plan.target_weekly_volume_km,
        primary_goal: primaryGoal.name,
        all_goals: goals.map((g: any) => g.name),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate plan: ' + (err.message || 'Unknown error') });
  }
});

export default router;
