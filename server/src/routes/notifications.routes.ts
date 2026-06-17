import { Router, Response } from 'express';
import db from '../database/pg';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateInsights } from '../engine/proactiveCoach';

const router = Router();
router.use(authenticate);

// GET /notifications — paginated notification list
router.get('/', async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 30;
  const offset = (page - 1) * limit;

  const notifications = await db.query(`
    SELECT n.*, u.name as actor_name, u.profile_image_url as actor_image
    FROM user_notifications n
    LEFT JOIN users u ON n.actor_id = u.id
    WHERE n.user_id = $1
    ORDER BY n.created_at DESC
    LIMIT $2 OFFSET $3
  `, [req.userId, limit, offset]) as any[];

  const unreadRow = await db.queryOne(
    'SELECT COUNT(*) as c FROM user_notifications WHERE user_id = $1 AND read = 0',
    [req.userId]
  ) as any;
  const unread_count = parseInt(unreadRow.c);

  res.json({
    notifications: notifications.map(n => ({ ...n, read: !!n.read })),
    unread_count,
    page,
    has_more: notifications.length === limit,
  });
});

// GET /notifications/unread-count — just the badge number + generate proactive notifications
router.get('/unread-count', async (req: AuthRequest, res: Response) => {
  await generateProactiveNotifications(req.userId!);
  const countRow = await db.queryOne(
    'SELECT COUNT(*) as c FROM user_notifications WHERE user_id = $1 AND read = 0',
    [req.userId]
  ) as any;
  res.json({ count: parseInt(countRow.c) });
});

// POST /notifications/read-all — mark all as read
router.post('/read-all', async (req: AuthRequest, res: Response) => {
  await db.execute('UPDATE user_notifications SET read = 1 WHERE user_id = $1 AND read = 0', [req.userId]);
  res.json({ success: true });
});

// POST /notifications/:id/read — mark one as read
router.post('/:id/read', async (req: AuthRequest, res: Response) => {
  await db.execute('UPDATE user_notifications SET read = 1 WHERE id = $1 AND user_id = $2', [
    parseInt(req.params.id), req.userId
  ]);
  res.json({ success: true });
});

export default router;

// Proactive notifications: AI coaching insights + streak warning + event reminders
async function generateProactiveNotifications(userId: number) {
  const today = new Date().toISOString().split('T')[0];

  // --- AI Coaching Insights (from proactive coach engine) ---
  const insights = await generateInsights(userId);
  for (const insight of insights) {
    // Only create notifications for high-priority insights (3+)
    if (insight.priority < 3) continue;

    // Deduplicate: don't send same insight title today
    const existing = await db.queryOne(
      "SELECT id FROM user_notifications WHERE user_id = $1 AND type = 'ai_insight' AND title = $2 AND date(created_at) = $3",
      [userId, insight.title, today]
    ) as any;

    if (!existing) {
      await db.execute("INSERT INTO user_notifications (user_id, type, title, body) VALUES ($1, 'ai_insight', $2, $3)",
        [userId, insight.title, insight.body]);
    }
  }

  // --- Streak warning (legacy — kept for backward compat, now also handled by proactive coach) ---
  const xp = await db.queryOne('SELECT current_streak_days, last_activity_date FROM user_xp WHERE user_id = $1', [userId]) as any;
  if (xp && xp.current_streak_days >= 3 && xp.last_activity_date) {
    const lastDate = new Date(xp.last_activity_date);
    const diffDays = Math.floor((Date.now() - lastDate.getTime()) / 86400000);
    if (diffDays === 1) {
      const existing = await db.queryOne(
        "SELECT id FROM user_notifications WHERE user_id = $1 AND type = 'event_reminder' AND title LIKE '%streak%' AND date(created_at) = $2",
        [userId, today]
      ) as any;
      if (!existing) {
        await db.execute("INSERT INTO user_notifications (user_id, type, title, body) VALUES ($1, 'event_reminder', $2, $3)",
          [userId, `Your ${xp.current_streak_days}-day streak is at risk!`, 'Run today to keep it alive. Even a short one counts.']);
      }
    }
  }

  // --- Event reminder: event tomorrow that user RSVP'd to ---
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const upcomingEvents = await db.query(`
    SELECT e.title, e.time FROM event_rsvps er
    JOIN events e ON er.event_id = e.id
    WHERE er.user_id = $1 AND er.status = 'going' AND e.date = $2 AND e.status = 'upcoming'
  `, [userId, tomorrow]) as any[];

  for (const ev of upcomingEvents) {
    const existing = await db.queryOne(
      "SELECT id FROM user_notifications WHERE user_id = $1 AND type = 'event_reminder' AND title LIKE $2 AND date(created_at) = $3",
      [userId, `%${ev.title}%`, today]
    ) as any;
    if (!existing) {
      await db.execute("INSERT INTO user_notifications (user_id, type, title, body) VALUES ($1, 'event_reminder', $2, $3)",
        [userId, `${ev.title} is tomorrow!`, `${ev.time} — don't forget your running shoes.`]);
    }
  }
}

// Helper: create a notification (used by other route files)
export function createNotification(
  userId: number,
  type: string,
  title: string,
  body?: string,
  actorId?: number,
  targetType?: string,
  targetId?: number
) {
  if (actorId === userId) return; // don't notify self
  db.execute(`
    INSERT INTO user_notifications (user_id, type, title, body, actor_id, target_type, target_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [userId, type, title, body || null, actorId || null, targetType || null, targetId || null]);

  // Push via WebSocket
  try {
    const { pushToUser } = require('../websocket');
    pushToUser(userId, { type: 'notification', notification: { type, title, body } });
  } catch {}
}
