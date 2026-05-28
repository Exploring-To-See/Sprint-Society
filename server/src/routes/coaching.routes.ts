import { Router, Response } from 'express';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { classifyTier } from '../engine/tierClassifier';
import { calculateIdealPace, analyzeCurrentPace } from '../engine/paceCalculator';
import { generateWeeklyChallenges } from '../engine/challengeGenerator';
import { generateTransformationPlan } from '../engine/transformationPlan';
import { awardKenduForChallenge } from '../engine/kenduEngine';
import { createNotification } from './notifications.routes';

const router = Router();

router.get('/tier', authenticate, (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  const runs = db.prepare(`
    SELECT distance_meters, moving_time_seconds, start_date FROM activities
    WHERE user_id = ? ORDER BY start_date DESC LIMIT 30
  `).all(req.userId) as any[];

  const result = classifyTier(user, runs);

  db.prepare(`
    INSERT INTO tier_history (user_id, tier, estimated_vo2max, age_graded_percent, score)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.userId, result.tier, result.estimated_vo2max, result.age_graded_percent, result.score);

  res.json(result);
});

router.get('/ideal-pace', authenticate, (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  const runs = db.prepare(`
    SELECT distance_meters, moving_time_seconds, start_date FROM activities
    WHERE user_id = ? ORDER BY start_date DESC LIMIT 30
  `).all(req.userId) as any[];

  const tierResult = classifyTier(user, runs);
  const idealZones = calculateIdealPace(user.age, user.gender, user.weight_kg, user.height_cm, user.fitness_level, tierResult.tier);

  const recentRuns = db.prepare(`
    SELECT average_pace_per_km, distance_meters FROM activities
    WHERE user_id = ? AND average_pace_per_km > 0 ORDER BY start_date DESC LIMIT 10
  `).all(req.userId) as any[];

  const analysis = analyzeCurrentPace(recentRuns, idealZones);
  res.json(analysis);
});

router.get('/transformation', authenticate, (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  const runs = db.prepare(`
    SELECT distance_meters, moving_time_seconds, start_date, average_pace_per_km FROM activities
    WHERE user_id = ? ORDER BY start_date DESC LIMIT 30
  `).all(req.userId) as any[];

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

  db.prepare(`
    INSERT INTO transformation_plans (user_id, current_pace_per_km, target_pace_per_km, current_tier, target_tier, estimated_weeks, plan_data)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.userId, plan.current_pace_per_km, plan.target_pace_per_km, plan.current_tier, plan.target_tier, plan.estimated_weeks, JSON.stringify(plan.milestones));

  res.json(plan);
});

router.get('/challenges', authenticate, (req: AuthRequest, res: Response) => {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekStartStr = weekStart.toISOString().split('T')[0];

  let challenges = db.prepare(`
    SELECT * FROM challenges WHERE user_id = ? AND week_start = ?
  `).all(req.userId, weekStartStr) as any[];

  if (challenges.length === 0) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as any;
    const runs = db.prepare(`
      SELECT distance_meters, moving_time_seconds, start_date FROM activities
      WHERE user_id = ? ORDER BY start_date DESC LIMIT 30
    `).all(req.userId) as any[];

    const tierResult = classifyTier(user, runs);
    const newChallenges = generateWeeklyChallenges(req.userId!, tierResult.tier, weekStartStr);

    const stmt = db.prepare(`
      INSERT INTO challenges (user_id, week_start, category, title, description, target_value, target_unit, tier, xp_reward)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const c of newChallenges) {
      stmt.run(req.userId, weekStartStr, c.category, c.title, c.description, c.target_value || null, c.target_unit || null, c.tier, c.xp_reward);
    }

    challenges = db.prepare(`
      SELECT * FROM challenges WHERE user_id = ? AND week_start = ?
    `).all(req.userId, weekStartStr) as any[];
  }

  res.json(challenges.map(c => ({ ...c, completed: Boolean(c.completed) })));
});

router.post('/challenges/:id/complete', authenticate, (req: AuthRequest, res: Response) => {
  const challenge = db.prepare('SELECT * FROM challenges WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as any;
  if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
  if (challenge.completed) return res.status(400).json({ error: 'Already completed' });

  db.prepare('UPDATE challenges SET completed = 1, completed_at = CURRENT_TIMESTAMP WHERE id = ?').run(challenge.id);

  // Award XP (original challenge XP + 15 bonus XP)
  const totalXpReward = challenge.xp_reward + 15;
  db.prepare('UPDATE user_xp SET total_xp = total_xp + ? WHERE user_id = ?').run(totalXpReward, req.userId);
  db.prepare(`INSERT INTO xp_transactions (user_id, amount, source, description) VALUES (?, ?, 'challenge', ?)`).run(req.userId, totalXpReward, `Completed: ${challenge.title}`);

  // Award Kendu for challenge completion
  const kenduEarned = awardKenduForChallenge(req.userId!, challenge.id);
  if (kenduEarned > 0) {
    createNotification(req.userId!, 'kendu_earned', `Challenge complete! +${kenduEarned} Kendu`, `Completed: ${challenge.title}`);
  }

  const xp = db.prepare('SELECT total_xp, current_level FROM user_xp WHERE user_id = ?').get(req.userId) as any;
  const newLevel = calculateLevel(xp.total_xp);
  if (newLevel > xp.current_level) {
    db.prepare('UPDATE user_xp SET current_level = ? WHERE user_id = ?').run(newLevel, req.userId);
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
