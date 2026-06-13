import { Router, Response } from 'express';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { classifyTier } from '../engine/tierClassifier';
import { generateWeeklyChallenges } from '../engine/challengeGenerator';
import { safeJsonParse } from '../utils/response';

const router = Router();
router.use(authenticate);

function xpNeededForLevel(level: number): number {
  return Math.round(100 * Math.pow(1.15, level - 1));
}

function totalXpToReachLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) total += xpNeededForLevel(i);
  return total;
}

router.get('/', (req: AuthRequest, res: Response) => {
  // 1. XP
  const xpRow = db.prepare('SELECT * FROM user_xp WHERE user_id = ?').get(req.userId) as any;
  let xp;
  if (!xpRow) {
    xp = { total_xp: 0, current_level: 1, current_streak_days: 0, longest_streak_days: 0, xp_to_next_level: 100, level_progress_percent: 0 };
  } else {
    const xpForNextLevel = xpNeededForLevel(xpRow.current_level + 1);
    const xpInCurrentLevel = xpRow.total_xp - totalXpToReachLevel(xpRow.current_level);
    const progress = Math.min(100, Math.round((xpInCurrentLevel / xpForNextLevel) * 100));
    xp = {
      total_xp: xpRow.total_xp,
      current_level: xpRow.current_level,
      current_streak_days: xpRow.current_streak_days,
      longest_streak_days: xpRow.longest_streak_days,
      xp_to_next_level: Math.max(0, xpForNextLevel - xpInCurrentLevel),
      level_progress_percent: progress,
    };
  }

  // 2. Tier
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as any;
  const runs = db.prepare(
    'SELECT distance_meters, moving_time_seconds, start_date FROM activities WHERE user_id = ? ORDER BY start_date DESC LIMIT 30'
  ).all(req.userId) as any[];
  const tier = classifyTier(user, runs);

  // 3. Challenges
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekStartStr = weekStart.toISOString().split('T')[0];

  let challenges = db.prepare('SELECT * FROM challenges WHERE user_id = ? AND week_start = ?').all(req.userId, weekStartStr) as any[];
  if (challenges.length === 0) {
    const newChallenges = generateWeeklyChallenges(req.userId!, tier.tier, weekStartStr);
    const stmt = db.prepare('INSERT INTO challenges (user_id, week_start, category, title, description, target_value, target_unit, tier, xp_reward) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const c of newChallenges) {
      stmt.run(req.userId, weekStartStr, c.category, c.title, c.description, c.target_value || null, c.target_unit || null, c.tier, c.xp_reward);
    }
    challenges = db.prepare('SELECT * FROM challenges WHERE user_id = ? AND week_start = ?').all(req.userId, weekStartStr) as any[];
  }

  // 4. Run stats
  const runStats = db.prepare(`
    SELECT COUNT(*) as total_runs, COALESCE(SUM(distance_meters), 0) as total_distance,
      COALESCE(SUM(moving_time_seconds), 0) as total_time, COALESCE(AVG(average_pace_per_km), 0) as avg_pace,
      COALESCE(MIN(average_pace_per_km), 0) as best_pace, COALESCE(MAX(distance_meters), 0) as longest_run,
      COALESCE(SUM(elevation_gain), 0) as total_elevation
    FROM activities WHERE user_id = ?
  `).get(req.userId);

  // 5. Plan week
  const existingPlan = db.prepare('SELECT plan_data, generated_at FROM transformation_plans WHERE user_id = ? ORDER BY generated_at DESC LIMIT 1').get(req.userId) as any;
  let planWeek = null;
  if (existingPlan) {
    const plan = safeJsonParse(existingPlan.plan_data, { weeks: [] });
    const startDate = new Date(existingPlan.generated_at);
    const weeksSinceStart = Math.floor((Date.now() - startDate.getTime()) / (7 * 86400000));
    const currentWeekIndex = Math.min(weeksSinceStart, plan.weeks.length - 1);
    planWeek = { current_week: currentWeekIndex + 1, total_weeks: plan.weeks?.length || 0, week: plan.weeks?.[currentWeekIndex] || null };
  }

  // 6. Profiling status
  const profile = db.prepare('SELECT profiling_complete FROM runner_profiles WHERE user_id = ?').get(req.userId) as any;
  const profilingStatus = { complete: !!profile?.profiling_complete };

  res.json({ data: { xp, tier, challenges: challenges.map((c: any) => ({ ...c, completed: Boolean(c.completed) })), runStats, planWeek, profilingStatus } });
});

export default router;
