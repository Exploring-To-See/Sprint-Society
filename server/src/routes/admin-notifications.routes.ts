import { Router, Response } from 'express';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

// GET / — list all notifications
router.get('/', (req: AuthRequest, res: Response) => {
  const notifications = db.prepare(`
    SELECT * FROM notifications
    ORDER BY created_at DESC
  `).all();

  res.json(notifications);
});

// POST / — create notification
router.post('/', (req: AuthRequest, res: Response) => {
  const { title, body, target_type, target_id, scheduled_at } = req.body;
  if (!title || !body || !target_type) {
    return res.status(400).json({ error: 'title, body, and target_type are required' });
  }

  const status = scheduled_at ? 'scheduled' : 'draft';

  const result = db.prepare(`
    INSERT INTO notifications (title, body, target_type, target_id, scheduled_at, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(title, body, target_type, target_id || null, scheduled_at || null, status);

  res.status(201).json({ id: result.lastInsertRowid, success: true });
});

// POST /:id/send — mark notification as sent
router.post('/:id/send', (req: AuthRequest, res: Response) => {
  const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id) as any;
  if (!notification) return res.status(404).json({ error: 'Notification not found' });

  if (notification.status === 'sent') {
    return res.status(400).json({ error: 'Notification already sent' });
  }

  // Count target recipients for sent_count
  let sentCount = 0;
  if (notification.target_type === 'all') {
    const result = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'runner'").get() as any);
    sentCount = result.count;
  } else if (notification.target_type === 'segment' && notification.target_id) {
    const result = (db.prepare('SELECT COUNT(*) as count FROM segment_members WHERE segment_id = ?').get(notification.target_id) as any);
    sentCount = result.count;
  } else if (notification.target_type === 'user') {
    sentCount = 1;
  }

  db.prepare(`
    UPDATE notifications SET
      sent_at = CURRENT_TIMESTAMP,
      status = 'sent',
      sent_count = ?
    WHERE id = ?
  `).run(sentCount, req.params.id);

  res.json({ success: true, sent_count: sentCount });
});

// DELETE /:id — delete draft notification
router.delete('/:id', (req: AuthRequest, res: Response) => {
  const notification = db.prepare('SELECT status FROM notifications WHERE id = ?').get(req.params.id) as any;
  if (!notification) return res.status(404).json({ error: 'Notification not found' });

  if (notification.status === 'sent') {
    return res.status(400).json({ error: 'Cannot delete a sent notification' });
  }

  db.prepare('DELETE FROM notifications WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// GET /subscriptions — list push_subscriptions count
router.get('/subscriptions', (req: AuthRequest, res: Response) => {
  const total = (db.prepare('SELECT COUNT(*) as count FROM push_subscriptions').get() as any).count;
  const byUser = (db.prepare('SELECT COUNT(DISTINCT user_id) as count FROM push_subscriptions').get() as any).count;

  res.json({ total_subscriptions: total, unique_users: byUser });
});

export default router;
