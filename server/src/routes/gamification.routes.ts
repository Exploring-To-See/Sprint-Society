import { Router, Response } from 'express';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/xp', authenticate, (req: AuthRequest, res: Response) => {
  const xp = db.prepare('SELECT * FROM user_xp WHERE user_id = ?').get(req.userId) as any;
  if (!xp) {
    return res.json({ total_xp: 0, current_level: 1, current_streak_days: 0, longest_streak_days: 0, xp_to_next_level: 100, level_progress_percent: 0 });
  }

  const xpForCurrentLevel = xpNeededForLevel(xp.current_level);
  const xpForNextLevel = xpNeededForLevel(xp.current_level + 1);
  const xpInCurrentLevel = xp.total_xp - totalXpToReachLevel(xp.current_level);
  const xpNeeded = xpForNextLevel;
  const progress = Math.min(100, Math.round((xpInCurrentLevel / xpNeeded) * 100));

  res.json({
    total_xp: xp.total_xp,
    current_level: xp.current_level,
    current_streak_days: xp.current_streak_days,
    longest_streak_days: xp.longest_streak_days,
    xp_to_next_level: Math.max(0, xpNeeded - xpInCurrentLevel),
    level_progress_percent: progress,
  });
});

router.get('/achievements', authenticate, (req: AuthRequest, res: Response) => {
  const achievements = db.prepare(`
    SELECT a.*, ua.earned_at
    FROM achievements a
    LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
    ORDER BY a.category, a.requirement_value
  `).all(req.userId) as any[];

  res.json(achievements.map(a => ({
    ...a,
    earned: !!a.earned_at,
  })));
});

router.get('/leaderboard', authenticate, (req: AuthRequest, res: Response) => {
  const leaderboard = db.prepare(`
    SELECT u.id as user_id, u.name, ux.total_xp, ux.current_level,
      COALESCE((SELECT tier FROM tier_history WHERE user_id = u.id ORDER BY calculated_at DESC LIMIT 1), 'beginner') as tier,
      COALESCE((SELECT SUM(distance_meters) / 1000 FROM activities WHERE user_id = u.id), 0) as total_distance_km
    FROM users u
    JOIN user_xp ux ON u.id = ux.user_id
    ORDER BY ux.total_xp DESC
    LIMIT 50
  `).all();

  res.json(leaderboard);
});

router.get('/history', authenticate, (req: AuthRequest, res: Response) => {
  const transactions = db.prepare(`
    SELECT * FROM xp_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
  `).all(req.userId);

  res.json(transactions);
});

function xpNeededForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

function totalXpToReachLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpNeededForLevel(i);
  }
  return total;
}

export default router;
