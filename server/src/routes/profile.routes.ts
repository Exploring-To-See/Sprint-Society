import { Router, Response } from 'express';
import db from '../database/pg';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /profile/:id — public profile of another user
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const userId = parseInt(req.params.id);

  const user = await db.queryOne(`
    SELECT u.id, u.name, u.profile_image_url, u.running_experience, u.created_at as joined_at,
      ux.current_level, ux.total_xp, ux.current_streak_days
    FROM users u
    LEFT JOIN user_xp ux ON u.id = ux.user_id
    WHERE u.id = $1 AND u.role != 'disabled'
  `, [userId]);

  if (!user) return res.status(404).json({ error: 'User not found' });

  // Tier
  const tierRow = await db.queryOne('SELECT tier FROM tier_history WHERE user_id = $1 ORDER BY calculated_at DESC LIMIT 1', [userId]);

  // Stats
  const stats = await db.queryOne(`
    SELECT COUNT(*) as total_runs, COALESCE(SUM(distance_meters), 0) as total_distance
    FROM activities WHERE user_id = $1
  `, [userId]);

  // Follow status
  const isFollowingRow = await db.queryOne('SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2', [req.userId, userId]);
  const isFollowing = !!isFollowingRow;
  const followersCountRow = await db.queryOne('SELECT COUNT(*) as c FROM follows WHERE following_id = $1', [userId]);
  const followersCount = followersCountRow.c;
  const followingCountRow = await db.queryOne('SELECT COUNT(*) as c FROM follows WHERE follower_id = $1', [userId]);
  const followingCount = followingCountRow.c;

  // Communities
  const communities = await db.query(`
    SELECT c.id, c.name, c.category FROM community_members cm
    JOIN communities c ON cm.community_id = c.id
    WHERE cm.user_id = $1
    LIMIT 5
  `, [userId]);

  // Recent achievements
  const achievements = await db.query(`
    SELECT a.name, a.description, a.icon, a.category, ua.earned_at
    FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.id
    WHERE ua.user_id = $1
    ORDER BY ua.earned_at DESC
    LIMIT 6
  `, [userId]);

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

// PATCH /profile/photo — update profile photo
router.patch('/photo', async (req: AuthRequest, res: Response) => {
  const { photo } = req.body;
  if (!photo || !photo.startsWith('data:image/')) {
    return res.status(400).json({ error: 'Valid base64 image required' });
  }
  if (photo.length > 2_000_000) {
    return res.status(413).json({ error: 'Image too large (max ~1.5MB)' });
  }
  await db.execute('UPDATE users SET profile_image_url = $1 WHERE id = $2', [photo, req.userId]);
  res.json({ success: true });
});

export default router;
