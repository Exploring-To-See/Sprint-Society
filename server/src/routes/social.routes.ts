import { Router, Response } from 'express';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createNotification } from './notifications.routes';

const router = Router();
router.use(authenticate);

// GET /social/feed — Activity feed from people you follow (+ your own)
router.get('/feed', (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  // Get IDs of people this user follows + self
  const following = db.prepare(
    `SELECT following_id FROM follows WHERE follower_id = ?`
  ).all(req.userId) as any[];

  const followingIds = [req.userId, ...following.map((f: any) => f.following_id)];
  const placeholders = followingIds.map(() => '?').join(',');

  const activities = db.prepare(`
    SELECT a.*, u.name as user_name, u.profile_image_url,
      COALESCE(k.kudos_count, 0) as kudos_count,
      COALESCE(c.comments_count, 0) as comments_count,
      COALESCE(uk.user_gave_kudos, 0) as user_gave_kudos,
      uk.reaction_type as user_reaction_type
    FROM activities a
    JOIN users u ON a.user_id = u.id
    LEFT JOIN (SELECT activity_id, COUNT(*) as kudos_count FROM kudos GROUP BY activity_id) k ON k.activity_id = a.id
    LEFT JOIN (SELECT activity_id, COUNT(*) as comments_count FROM comments GROUP BY activity_id) c ON c.activity_id = a.id
    LEFT JOIN (SELECT activity_id, 1 as user_gave_kudos, reaction_type FROM kudos WHERE user_id = ?) uk ON uk.activity_id = a.id
    WHERE a.user_id IN (${placeholders})
    ORDER BY a.start_date DESC
    LIMIT ? OFFSET ?
  `).all(req.userId, ...followingIds, limit, offset) as any[];

  const EMOJIS: Record<string, string> = { high_five: '🙌', fire: '🔥', impressive: '💪', respect: '🫡', lets_go: '⚡' };

  res.json({
    feed: activities.map(a => ({
      ...a,
      user_gave_kudos: a.user_gave_kudos > 0,
      user_reaction_emoji: a.user_reaction_type ? (EMOJIS[a.user_reaction_type] || '🙌') : null,
      distance_km: Math.round(a.distance_meters / 100) / 10,
      duration_minutes: Math.round(a.moving_time_seconds / 60),
      pace_formatted: formatPace(a.average_pace_per_km),
    })),
    page,
    has_more: activities.length === limit,
  });
});

const REACTION_EMOJIS: Record<string, string> = { high_five: '🙌', fire: '🔥', impressive: '💪', respect: '🫡', lets_go: '⚡' };

// POST /social/kudos/:activityId — Give reaction
router.post('/kudos/:activityId', (req: AuthRequest, res: Response) => {
  const activityId = parseInt(req.params.activityId);
  const reactionType = req.body?.reaction_type || 'high_five';

  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(activityId) as any;
  if (!activity) return res.status(404).json({ error: 'Activity not found' });

  try {
    db.prepare('INSERT INTO kudos (user_id, activity_id, reaction_type) VALUES (?, ?, ?)').run(req.userId, activityId, reactionType);

    if (activity.user_id !== req.userId) {
      db.prepare('UPDATE user_xp SET total_xp = total_xp + 5 WHERE user_id = ?').run(activity.user_id);
      db.prepare('INSERT INTO xp_transactions (user_id, amount, source, description) VALUES (?, ?, ?, ?)').run(
        activity.user_id, 5, 'kudos_received', 'Received kudos from a club member'
      );
      const emoji = REACTION_EMOJIS[reactionType] || '🙌';
      const actorName = (db.prepare('SELECT name FROM users WHERE id = ?').get(req.userId) as any)?.name || 'Someone';
      createNotification(activity.user_id, 'kudos', `${actorName} reacted ${emoji}`, 'On your recent run', req.userId, 'activity', activityId);
    }

    const count = db.prepare('SELECT COUNT(*) as count FROM kudos WHERE activity_id = ?').get(activityId) as any;
    res.json({ success: true, kudos_count: count.count });
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Already reacted' });
    }
    console.error('[Social] Kudos error:', e.message);
    return res.status(500).json({ error: 'Failed to save reaction' });
  }
});

// DELETE /social/kudos/:activityId — Remove kudos
router.delete('/kudos/:activityId', (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM kudos WHERE user_id = ? AND activity_id = ?').run(req.userId, parseInt(req.params.activityId));
  const count = db.prepare('SELECT COUNT(*) as count FROM kudos WHERE activity_id = ?').get(parseInt(req.params.activityId)) as any;
  res.json({ success: true, kudos_count: count.count });
});

// GET /social/comments/:activityId — Get comments for an activity
router.get('/comments/:activityId', (req: AuthRequest, res: Response) => {
  const comments = db.prepare(`
    SELECT c.*, u.name as user_name, u.profile_image_url
    FROM comments c JOIN users u ON c.user_id = u.id
    WHERE c.activity_id = ?
    ORDER BY c.created_at ASC
  `).all(parseInt(req.params.activityId)) as any[];

  res.json(comments);
});

// POST /social/comments/:activityId — Add a comment
router.post('/comments/:activityId', (req: AuthRequest, res: Response) => {
  const { body } = req.body;
  if (!body || body.trim().length === 0) return res.status(400).json({ error: 'Comment cannot be empty' });
  if (body.length > 500) return res.status(400).json({ error: 'Comment too long (max 500 chars)' });

  const activityId = parseInt(req.params.activityId);
  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(activityId) as any;
  if (!activity) return res.status(404).json({ error: 'Activity not found' });

  const result = db.prepare('INSERT INTO comments (user_id, activity_id, body) VALUES (?, ?, ?)').run(
    req.userId, activityId, body.trim()
  );

  // Award XP for receiving a comment
  if (activity.user_id !== req.userId) {
    db.prepare('UPDATE user_xp SET total_xp = total_xp + 3 WHERE user_id = ?').run(activity.user_id);
    const actorName = (db.prepare('SELECT name FROM users WHERE id = ?').get(req.userId) as any)?.name || 'Someone';
    createNotification(activity.user_id, 'comment', `${actorName} commented on your run`, body.trim().slice(0, 80), req.userId, 'activity', activityId);
  }

  const comment = db.prepare(`
    SELECT c.*, u.name as user_name, u.profile_image_url
    FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?
  `).get(result.lastInsertRowid) as any;

  res.json(comment);
});

// POST /social/follow/:userId — Follow a user
router.post('/follow/:userId', (req: AuthRequest, res: Response) => {
  const targetId = parseInt(req.params.userId);
  if (targetId === req.userId) return res.status(400).json({ error: 'Cannot follow yourself' });

  const target = db.prepare('SELECT id, name FROM users WHERE id = ?').get(targetId) as any;
  if (!target) return res.status(404).json({ error: 'User not found' });

  try {
    db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(req.userId, targetId);
    const actorName = (db.prepare('SELECT name FROM users WHERE id = ?').get(req.userId) as any)?.name || 'Someone';
    createNotification(targetId, 'follow', `${actorName} started following you`, undefined, req.userId, 'user', req.userId);
    res.json({ success: true, following: true });
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) {
      return res.json({ success: true, following: true, already_following: true });
    }
    throw e;
  }
});

// DELETE /social/follow/:userId — Unfollow a user
router.delete('/follow/:userId', (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(req.userId, parseInt(req.params.userId));
  res.json({ success: true, following: false });
});

// GET /social/following — Who you follow
router.get('/following', (req: AuthRequest, res: Response) => {
  const following = db.prepare(`
    SELECT u.id, u.name, u.profile_image_url, ux.current_level, ux.total_xp
    FROM follows f
    JOIN users u ON f.following_id = u.id
    LEFT JOIN user_xp ux ON u.id = ux.user_id
    WHERE f.follower_id = ?
    ORDER BY u.name ASC
  `).all(req.userId);

  res.json(following);
});

// GET /social/followers — Who follows you
router.get('/followers', (req: AuthRequest, res: Response) => {
  const followers = db.prepare(`
    SELECT u.id, u.name, u.profile_image_url, ux.current_level, ux.total_xp
    FROM follows f
    JOIN users u ON f.follower_id = u.id
    LEFT JOIN user_xp ux ON u.id = ux.user_id
    WHERE f.following_id = ?
    ORDER BY f.created_at DESC
  `).all(req.userId);

  res.json(followers);
});

// GET /social/discover — Suggest people to follow (club members not yet followed)
router.get('/discover', (req: AuthRequest, res: Response) => {
  const suggestions = db.prepare(`
    SELECT u.id, u.name, u.profile_image_url, u.running_experience,
      ux.current_level, ux.total_xp,
      (SELECT COUNT(*) FROM activities WHERE user_id = u.id) as total_runs
    FROM users u
    LEFT JOIN user_xp ux ON u.id = ux.user_id
    WHERE u.id != ? AND u.role = 'runner'
      AND u.id NOT IN (SELECT following_id FROM follows WHERE follower_id = ?)
    ORDER BY ux.total_xp DESC
    LIMIT 10
  `).all(req.userId, req.userId);

  res.json(suggestions);
});

function formatPace(seconds: number): string {
  if (!seconds) return '--:--';
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export default router;
