import { Router, Response } from 'express';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateInsights } from '../engine/proactiveCoach';

const router = Router();
router.use(authenticate);

// GET /notifications — paginated notification list
router.get('/', (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 30;
  const offset = (page - 1) * limit;

  const notifications = db.prepare(`
    SELECT n.*, u.name as actor_name, u.profile_image_url as actor_image
    FROM user_notifications n
    LEFT JOIN users u ON n.actor_id = u.id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.userId, limit, offset) as any[];

  const unread_count = (db.prepare(
    'SELECT COUNT(*) as c FROM user_notifications WHERE user_id = ? AND read = 0'
  ).get(req.userId) as any).c;

  res.json({
    notifications: notifications.map(n => ({ ...n, read: !!n.read })),
    unread_count,
    page,
    has_more: notifications.length === limit,
  });
});

// GET /notifications/unread-count — just the badge number + generate proactive notifications
router.get('/unread-count', (req: AuthRequest, res: Response) => {
  generateProactiveNotifications(req.userId!);
  const count = (db.prepare(
    'SELECT COUNT(*) as c FROM user_notifications WHERE user_id = ? AND read = 0'
  ).get(req.userId) as any).c;
  res.json({ count });
});

// POST /notifications/read-all — mark all as read
router.post('/read-all', (req: AuthRequest, res: Response) => {
  db.prepare('UPDATE user_notifications SET read = 1 WHERE user_id = ? AND read = 0').run(req.userId);
  res.json({ success: true });
});

// POST /notifications/:id/read — mark one as read
router.post('/:id/read', (req: AuthRequest, res: Response) => {
  db.prepare('UPDATE user_notifications SET read = 1 WHERE id = ? AND user_id = ?').run(
    parseInt(req.params.id), req.userId
  );
  res.json({ success: true });
});

export default router;

// Proactive notifications: AI coaching insights + streak warning + event reminders
function generateProactiveNotifications(userId: number) {
  const today = new Date().toISOString().split('T')[0];

  // --- AI Coaching Insights (from proactive coach engine) ---
  const insights = generateInsights(userId);
  for (const insight of insights) {
    // Only create notifications for high-priority insights (3+)
    if (insight.priority < 3) continue;

    // Deduplicate: don't send same insight title today
    const existing = db.prepare(
      "SELECT id FROM user_notifications WHERE user_id = ? AND type = 'ai_insight' AND title = ? AND date(created_at) = ?"
    ).get(userId, insight.title, today) as any;

    if (!existing) {
      db.prepare("INSERT INTO user_notifications (user_id, type, title, body) VALUES (?, 'ai_insight', ?, ?)")
        .run(userId, insight.title, insight.body);
    }
  }

  // --- Streak warning (legacy — kept for backward compat, now also handled by proactive coach) ---
  const xp = db.prepare('SELECT current_streak_days, last_activity_date FROM user_xp WHERE user_id = ?').get(userId) as any;
  if (xp && xp.current_streak_days >= 3 && xp.last_activity_date) {
    const lastDate = new Date(xp.last_activity_date);
    const diffDays = Math.floor((Date.now() - lastDate.getTime()) / 86400000);
    if (diffDays === 1) {
      const existing = db.prepare(
        "SELECT id FROM user_notifications WHERE user_id = ? AND type = 'event_reminder' AND title LIKE '%streak%' AND date(created_at) = ?"
      ).get(userId, today) as any;
      if (!existing) {
        db.prepare("INSERT INTO user_notifications (user_id, type, title, body) VALUES (?, 'event_reminder', ?, ?)")
          .run(userId, `Your ${xp.current_streak_days}-day streak is at risk!`, 'Run today to keep it alive. Even a short one counts.');
      }
    }
  }

  // --- Event reminder: event tomorrow that user RSVP'd to ---
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const upcomingEvents = db.prepare(`
    SELECT e.title, e.time FROM event_rsvps er
    JOIN events e ON er.event_id = e.id
    WHERE er.user_id = ? AND er.status = 'going' AND e.date = ? AND e.status = 'upcoming'
  `).all(userId, tomorrow) as any[];

  for (const ev of upcomingEvents) {
    const existing = db.prepare(
      "SELECT id FROM user_notifications WHERE user_id = ? AND type = 'event_reminder' AND title LIKE ? AND date(created_at) = ?"
    ).get(userId, `%${ev.title}%`, today) as any;
    if (!existing) {
      db.prepare("INSERT INTO user_notifications (user_id, type, title, body) VALUES (?, 'event_reminder', ?, ?)")
        .run(userId, `${ev.title} is tomorrow!`, `${ev.time} — don't forget your running shoes.`);
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
  db.prepare(`
    INSERT INTO user_notifications (user_id, type, title, body, actor_id, target_type, target_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId, type, title, body || null, actorId || null, targetType || null, targetId || null);
}
