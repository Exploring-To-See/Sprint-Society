import { Router, Response } from 'express';
import db from '../database/pg';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateInsights } from '../engine/proactiveCoach';
import { config } from '../config';
import { sendNotificationEmail } from '../services/email.service';

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

// GET /notifications/unread-count — JUST the badge number (single indexed COUNT).
// This is polled by every active client, so it must be cheap. Proactive-notification
// generation (a 6-15 query cascade) was moved OFF this hot path into the Vercel Cron
// maintenance job (server/src/scheduler/jobs.ts → /api/cron/maintenance).
router.get('/unread-count', async (req: AuthRequest, res: Response) => {
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

// Proactive notifications: AI coaching insights + streak warning + event reminders.
// Exported so the Vercel Cron maintenance job can run it on a slow cadence for all
// users, instead of on every badge poll.
export async function generateProactiveNotifications(userId: number) {
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
// Async + awaited by callers so the INSERT actually flushes before a serverless
// function freezes on res.json(). Wrapped so a notification failure is logged but
// never throws into — and thus never breaks — the caller's primary action.
export async function createNotification(
  userId: number,
  type: string,
  title: string,
  body?: string,
  actorId?: number,
  targetType?: string,
  targetId?: number
): Promise<void> {
  if (actorId === userId) return; // don't notify self
  try {
    await db.execute(`
      INSERT INTO user_notifications (user_id, type, title, body, actor_id, target_type, target_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [userId, type, title, body || null, actorId || null, targetType || null, targetId || null]);

    // Push via WebSocket (best-effort; a no-op on serverless)
    try {
      const { pushToUser } = require('../websocket');
      pushToUser(userId, { type: 'notification', notification: { type, title, body } });
    } catch {}

    // Email for high-value, LOW-frequency notifications only. We deliberately do
    // NOT email high-frequency social events (kudos/comment/follow) — that would
    // annoy users and wreck deliverability. Best-effort: never blocks the notif.
    if (EMAIL_NOTIFICATION_TYPES[type]) {
      try {
        const u = await db.queryOne<{ email: string; name: string }>(
          'SELECT email, name FROM users WHERE id = $1', [userId]
        );
        if (u?.email) {
          await sendNotificationEmail(u.email, u.name || 'Runner', {
            subject: title,
            heading: EMAIL_NOTIFICATION_TYPES[type],
            title,
            body,
            ctaText: 'Open Sprint Society',
            ctaUrl: config.clientUrl,
          });
        }
      } catch (mailErr) {
        console.error('[createNotification] email failed (non-fatal):', mailErr instanceof Error ? mailErr.message : mailErr);
      }
    }
  } catch (e) {
    console.error('[createNotification] failed (non-fatal):', e instanceof Error ? e.message : e);
  }
}

// Notification types that get a real email (heading shown in the email). Keep
// this list to important, infrequent events so emails stay welcome + inboxed.
const EMAIL_NOTIFICATION_TYPES: Record<string, string> = {
  achievement: 'Achievement unlocked',
  level_up: 'You levelled up',
  kendu_earned: 'Kendu earned',
  event_reminder: 'Event reminder',
  subscription: 'Your subscription',
  security: 'Security alert',
  system: 'Sprint Society',
};
