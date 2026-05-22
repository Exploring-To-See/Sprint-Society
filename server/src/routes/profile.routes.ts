import { Router, Response } from 'express';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /profile/:id — public profile of another user
router.get('/:id', (req: AuthRequest, res: Response) => {
  const userId = parseInt(req.params.id);

  const user = db.prepare(`
    SELECT u.id, u.name, u.profile_image_url, u.running_experience, u.created_at as joined_at,
      ux.current_level, ux.total_xp, ux.current_streak_days
    FROM users u
    LEFT JOIN user_xp ux ON u.id = ux.user_id
    WHERE u.id = ? AND u.role != 'disabled'
  `).get(userId) as any;

  if (!user) return res.status(404).json({ error: 'User not found' });

  // Tier
  const tierRow = db.prepare('SELECT tier FROM tier_history WHERE user_id = ? ORDER BY calculated_at DESC LIMIT 1').get(userId) as any;

  // Stats
  const stats = db.prepare(`
    SELECT COUNT(*) as total_runs, COALESCE(SUM(distance_meters), 0) as total_distance
    FROM activities WHERE user_id = ?
  `).get(userId) as any;

  // Follow status
  const isFollowing = !!(db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(req.userId, userId) as any);
  const followersCount = (db.prepare('SELECT COUNT(*) as c FROM follows WHERE following_id = ?').get(userId) as any).c;
  const followingCount = (db.prepare('SELECT COUNT(*) as c FROM follows WHERE follower_id = ?').get(userId) as any).c;

  // Communities
  const communities = db.prepare(`
    SELECT c.id, c.name, c.category FROM community_members cm
    JOIN communities c ON cm.community_id = c.id
    WHERE cm.user_id = ?
    LIMIT 5
  `).all(userId) as any[];

  // Recent achievements
  const achievements = db.prepare(`
    SELECT a.name, a.description, a.icon, a.category, ua.earned_at
    FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.id
    WHERE ua.user_id = ?
    ORDER BY ua.earned_at DESC
    LIMIT 6
  `).all(userId) as any[];

  res.json({
    id: user.id,
    name: user.name,
    profile_image_url: user.profile_image_url,
    running_experience: user.running_experience,
    current_tier: tierRow?.tier || null,
    current_level: user.current_level || 1,
    total_xp: user.total_xp || 0,
    total_runs: stats.total_runs,
    total_distance_km: Math.round(stats.total_distance / 1000),
    current_streak_days: user.current_streak_days || 0,
    joined_at: user.joined_at,
    is_following: isFollowing,
    followers_count: followersCount,
    following_count: followingCount,
    communities,
    recent_achievements: achievements.map(a => ({ ...a, earned: true })),
  });
});

export default router;
