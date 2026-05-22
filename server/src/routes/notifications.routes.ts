import { Router, Response } from 'express';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';

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

// GET /notifications/unread-count — just the badge number
router.get('/unread-count', (req: AuthRequest, res: Response) => {
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
