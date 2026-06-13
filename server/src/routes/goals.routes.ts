import { Router, Response } from 'express';
import db from '../database/pg';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /goals — List user's goals
router.get('/', async (req: AuthRequest, res: Response) => {
  const goals = await db.query(`
    SELECT g.*, e.title as event_name, e.start_time as event_date
    FROM user_goals g
    LEFT JOIN events e ON g.event_id = e.id
    WHERE g.user_id = $1 AND g.status = 'active'
    ORDER BY g.target_date ASC NULLS LAST, g.created_at DESC
  `, [req.userId]);

  const completed = await db.query(`
    SELECT * FROM user_goals WHERE user_id = $1 AND status = 'completed'
    ORDER BY completed_at DESC LIMIT 5
  `, [req.userId]);

  res.json({ active: goals, completed });
});

// POST /goals — Create a new goal
router.post('/', async (req: AuthRequest, res: Response) => {
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

  const result = await db.execute(`
    INSERT INTO user_goals (user_id, type, distance_meters, target_time_seconds, target_pace_per_km, target_date, target_km, target_period, event_id, name)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id
  `, [
    req.userId, type,
    distance_meters || null, target_time_seconds || null, target_pace_per_km || null,
    target_date || null, target_km || null, target_period || null,
    event_id || null, goalName
  ]);

  res.status(201).json({
    id: result.rows[0]?.id,
    name: goalName,
    type,
    message: 'Goal created! Your AI coach will build a plan around this.',
  });
});

// PUT /goals/:id — Update a goal (complete/abandon/modify)
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const goal = await db.queryOne('SELECT * FROM user_goals WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]) as any;
  if (!goal) return res.status(404).json({ error: 'Goal not found' });

  const { status, target_date, target_time_seconds, name } = req.body;

  if (status === 'completed') {
    await db.execute('UPDATE user_goals SET status = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2', ['completed', goal.id]);
  } else if (status === 'abandoned') {
    await db.execute('UPDATE user_goals SET status = $1 WHERE id = $2', ['abandoned', goal.id]);
  } else {
    await db.execute(`
      UPDATE user_goals SET
        target_date = COALESCE($1, target_date),
        target_time_seconds = COALESCE($2, target_time_seconds),
        name = COALESCE($3, name)
      WHERE id = $4
    `, [target_date || null, target_time_seconds || null, name || null, goal.id]);
  }

  res.json({ message: 'Goal updated' });
});

// DELETE /goals/:id — Remove a goal
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const result = await db.execute('DELETE FROM user_goals WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  if (result.rowCount === 0) return res.status(404).json({ error: 'Goal not found' });
  res.json({ message: 'Goal deleted' });
});

// POST /goals/generate-plan — Merge all active goals into one training plan
router.post('/generate-plan', async (req: AuthRequest, res: Response) => {
  const goals = await db.query(`
    SELECT * FROM user_goals WHERE user_id = $1 AND status = 'active' ORDER BY target_date ASC NULLS LAST
  `, [req.userId]) as any[];

  if (goals.length === 0) {
    return res.status(400).json({ error: 'No active goals. Set at least one goal first.' });
  }

  // Use the primary goal (nearest date or first created) for plan generation
  const primaryGoal = goals[0];

  // Get user data for plan generation
  const user = await db.queryOne('SELECT * FROM users WHERE id = $1', [req.userId]) as any;
  const recentRuns = await db.query(`
    SELECT distance_meters, moving_time_seconds, average_pace_per_km, start_date
    FROM activities WHERE user_id = $1 ORDER BY start_date DESC LIMIT 30
  `, [req.userId]) as any[];

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
    await db.execute(`
      INSERT INTO transformation_plans (user_id, current_pace_per_km, target_pace_per_km, estimated_weeks, plan_data)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      req.userId,
      plan.training_paces?.tempo || 360,
      (plan.training_paces?.tempo || 360) * 0.9,
      plan.total_weeks || 8,
      JSON.stringify(plan)
    ]);

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
