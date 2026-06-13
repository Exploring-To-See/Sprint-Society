import { Router, Response } from 'express';
import db from '../database/pg';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

// GET / — list all notifications
router.get('/', async (req: AuthRequest, res: Response) => {
  const notifications = await db.query(`
    SELECT * FROM notifications
    ORDER BY created_at DESC
  `, []);

  res.json(notifications);
});

// POST / — create notification
router.post('/', async (req: AuthRequest, res: Response) => {
  const { title, body, target_type, target_id, scheduled_at } = req.body;
  if (!title || !body || !target_type) {
    return res.status(400).json({ error: 'title, body, and target_type are required' });
  }

  const status = scheduled_at ? 'scheduled' : 'draft';

  const result = await db.execute(`
    INSERT INTO notifications (title, body, target_type, target_id, scheduled_at, status)
    VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
  `, [title, body, target_type, target_id || null, scheduled_at || null, status]);

  res.status(201).json({ id: result.rows[0]?.id, success: true });
});

// POST /:id/send — mark notification as sent
router.post('/:id/send', async (req: AuthRequest, res: Response) => {
  const notification = await db.queryOne('SELECT * FROM notifications WHERE id = $1', [req.params.id]) as any;
  if (!notification) return res.status(404).json({ error: 'Notification not found' });

  if (notification.status === 'sent') {
    return res.status(400).json({ error: 'Notification already sent' });
  }

  // Count target recipients for sent_count
  let sentCount = 0;
  if (notification.target_type === 'all') {
    const result = await db.queryOne("SELECT COUNT(*) as count FROM users WHERE role = 'runner'", []) as any;
    sentCount = result.count;
  } else if (notification.target_type === 'segment' && notification.target_id) {
    const result = await db.queryOne('SELECT COUNT(*) as count FROM segment_members WHERE segment_id = $1', [notification.target_id]) as any;
    sentCount = result.count;
  } else if (notification.target_type === 'user') {
    sentCount = 1;
  }

  await db.execute(`
    UPDATE notifications SET
      sent_at = CURRENT_TIMESTAMP,
      status = 'sent',
      sent_count = $1
    WHERE id = $2
  `, [sentCount, req.params.id]);

  res.json({ success: true, sent_count: sentCount });
});

// DELETE /:id — delete draft notification
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const notification = await db.queryOne('SELECT status FROM notifications WHERE id = $1', [req.params.id]) as any;
  if (!notification) return res.status(404).json({ error: 'Notification not found' });

  if (notification.status === 'sent') {
    return res.status(400).json({ error: 'Cannot delete a sent notification' });
  }

  await db.execute('DELETE FROM notifications WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// GET /subscriptions — list push_subscriptions count
router.get('/subscriptions', async (req: AuthRequest, res: Response) => {
  const total = (await db.queryOne('SELECT COUNT(*) as count FROM push_subscriptions', []) as any).count;
  const byUser = (await db.queryOne('SELECT COUNT(DISTINCT user_id) as count FROM push_subscriptions', []) as any).count;

  res.json({ total_subscriptions: total, unique_users: byUser });
});

export default router;
