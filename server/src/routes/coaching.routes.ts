import { Router, Response } from 'express';
import db from '../database/pg';
import { authenticate, AuthRequest } from '../middleware/auth';
import { classifyTier } from '../engine/tierClassifier';
import { calculateIdealPace, analyzeCurrentPace } from '../engine/paceCalculator';
import { generateWeeklyChallenges } from '../engine/challengeGenerator';
import { generateTransformationPlan } from '../engine/transformationPlan';
import { awardKenduForChallenge } from '../engine/kenduEngine';
import { createNotification } from './notifications.routes';

const router = Router();

router.get('/tier', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await db.queryOne('SELECT * FROM users WHERE id = $1', [req.userId]);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const runs = await db.query(`
    SELECT distance_meters, moving_time_seconds, start_date FROM activities
    WHERE user_id = $1 ORDER BY start_date DESC LIMIT 30
  `, [req.userId]);

  const result = classifyTier(user, runs);

  await db.execute(`
    INSERT INTO tier_history (user_id, tier, estimated_vo2max, age_graded_percent, score)
    VALUES ($1, $2, $3, $4, $5)
  `, [req.userId, result.tier, result.estimated_vo2max, result.age_graded_percent, result.score]);

  res.json(result);
});

router.get('/ideal-pace', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await db.queryOne('SELECT * FROM users WHERE id = $1', [req.userId]);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const runs = await db.query(`
    SELECT distance_meters, moving_time_seconds, start_date FROM activities
    WHERE user_id = $1 ORDER BY start_date DESC LIMIT 30
  `, [req.userId]);

  const tierResult = classifyTier(user, runs);
  const idealZones = calculateIdealPace(user.age, user.gender, user.weight_kg, user.height_cm, user.fitness_level, tierResult.tier);

  const recentRuns = await db.query(`
    SELECT average_pace_per_km, distance_meters FROM activities
    WHERE user_id = $1 AND average_pace_per_km > 0 ORDER BY start_date DESC LIMIT 10
  `, [req.userId]);

  const analysis = analyzeCurrentPace(recentRuns, idealZones);
  res.json(analysis);
});

router.get('/transformation', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await db.queryOne('SELECT * FROM users WHERE id = $1', [req.userId]);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const runs = await db.query(`
    SELECT distance_meters, moving_time_seconds, start_date, average_pace_per_km FROM activities
    WHERE user_id = $1 ORDER BY start_date DESC LIMIT 30
  `, [req.userId]);

  const tierResult = classifyTier(user, runs);
  const idealZones = calculateIdealPace(user.age, user.gender, user.weight_kg, user.height_cm, user.fitness_level, tierResult.tier);

  const recentPaces = runs.filter((r: any) => r.average_pace_per_km > 0);
  const currentPace = recentPaces.length > 0
    ? recentPaces.reduce((s: number, r: any) => s + r.average_pace_per_km, 0) / recentPaces.length
    : idealZones.easy_pace_per_km;

  const plan = generateTransformationPlan(
    Math.round(currentPace),
    idealZones.tempo_pace_per_km,
    tierResult.tier
  );

  await db.execute(`
    INSERT INTO transformation_plans (user_id, current_pace_per_km, target_pace_per_km, current_tier, target_tier, estimated_weeks, plan_data)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [req.userId, plan.current_pace_per_km, plan.target_pace_per_km, plan.current_tier, plan.target_tier, plan.estimated_weeks, JSON.stringify(plan.milestones)]);

  res.json(plan);
});

router.get('/challenges', authenticate, async (req: AuthRequest, res: Response) => {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekStartStr = weekStart.toISOString().split('T')[0];

  let challenges = await db.query(`
    SELECT * FROM challenges WHERE user_id = $1 AND week_start = $2
  `, [req.userId, weekStartStr]);

  if (challenges.length === 0) {
    const user = await db.queryOne('SELECT * FROM users WHERE id = $1', [req.userId]);
    const runs = await db.query(`
      SELECT distance_meters, moving_time_seconds, start_date FROM activities
      WHERE user_id = $1 ORDER BY start_date DESC LIMIT 30
    `, [req.userId]);

    const tierResult = classifyTier(user, runs);
    const newChallenges = generateWeeklyChallenges(req.userId!, tierResult.tier, weekStartStr);

    for (const c of newChallenges) {
      await db.execute(`
        INSERT INTO challenges (user_id, week_start, category, title, description, target_value, target_unit, tier, xp_reward)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [req.userId, weekStartStr, c.category, c.title, c.description, c.target_value || null, c.target_unit || null, c.tier, c.xp_reward]);
    }

    challenges = await db.query(`
      SELECT * FROM challenges WHERE user_id = $1 AND week_start = $2
    `, [req.userId, weekStartStr]);
  }

  res.json(challenges.map(c => ({ ...c, completed: Boolean(c.completed) })));
});

router.post('/challenges/:id/complete', authenticate, async (req: AuthRequest, res: Response) => {
  const challenge = await db.queryOne('SELECT * FROM challenges WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
  if (challenge.completed) return res.status(400).json({ error: 'Already completed' });

  await db.execute('UPDATE challenges SET completed = true, completed_at = CURRENT_TIMESTAMP WHERE id = $1', [challenge.id]);

  // Award XP (original challenge XP + 15 bonus XP)
  const totalXpReward = challenge.xp_reward + 15;
  await db.execute('UPDATE user_xp SET total_xp = total_xp + $1 WHERE user_id = $2', [totalXpReward, req.userId]);
  await db.execute(`INSERT INTO xp_transactions (user_id, amount, source, description) VALUES ($1, $2, 'challenge', $3)`, [req.userId, totalXpReward, `Completed: ${challenge.title}`]);

  // Award Kendu for challenge completion
  const kenduEarned = awardKenduForChallenge(req.userId!, challenge.id);
  if (kenduEarned > 0) {
    createNotification(req.userId!, 'kendu_earned', `Challenge complete! +${kenduEarned} Kendu`, `Completed: ${challenge.title}`);
  }

  const xp = await db.queryOne('SELECT total_xp, current_level FROM user_xp WHERE user_id = $1', [req.userId]);
  const newLevel = calculateLevel(xp.total_xp);
  if (newLevel > xp.current_level) {
    await db.execute('UPDATE user_xp SET current_level = $1 WHERE user_id = $2', [newLevel, req.userId]);
  }

  res.json({ success: true, xp_earned: totalXpReward, kendu_earned: kenduEarned, new_total_xp: xp.total_xp });
});

function calculateLevel(totalXp: number): number {
  let level = 1;
  let xpNeeded = 100;
  let accumulated = 0;
  while (accumulated + xpNeeded <= totalXp) {
    accumulated += xpNeeded;
    level++;
    xpNeeded = Math.floor(100 * Math.pow(1.5, level - 1));
  }
  return level;
}

export default router;
