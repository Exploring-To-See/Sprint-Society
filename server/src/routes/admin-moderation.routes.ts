import { Router, Response } from 'express';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';
import { logAuditAction } from './admin-audit.routes';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

// GET /queue — return latest 50 comments + community_posts as moderation queue
router.get('/queue', (req: AuthRequest, res: Response) => {
  const comments = db.prepare(`
    SELECT c.id, c.body, c.created_at, c.user_id, u.name as author_name,
      'comment' as content_type, c.activity_id as target_id
    FROM comments c
    JOIN users u ON c.user_id = u.id
    ORDER BY c.created_at DESC
    LIMIT 25
  `).all();

  const posts = db.prepare(`
    SELECT cp.id, cp.body, cp.created_at, cp.author_id as user_id, u.name as author_name,
      'community_post' as content_type, cp.community_id as target_id
    FROM community_posts cp
    JOIN users u ON cp.author_id = u.id
    ORDER BY cp.created_at DESC
    LIMIT 25
  `).all();

  // Combine and sort by most recent
  const queue = [...comments, ...posts].sort((a: any, b: any) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  res.json(queue.slice(0, 50));
});

// POST /comments/:id/hide — delete a comment by id
router.post('/comments/:id/hide', (req: AuthRequest, res: Response) => {
  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id) as any;
  if (!comment) return res.status(404).json({ error: 'Comment not found' });

  db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);

  logAuditAction(
    req.userId as number,
    'hide_comment',
    'comment',
    parseInt(req.params.id),
    JSON.stringify({ body: comment.body, user_id: comment.user_id })
  );

  res.json({ success: true });
});

// POST /posts/:id/hide — delete a community_post by id
router.post('/posts/:id/hide', (req: AuthRequest, res: Response) => {
  const post = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(req.params.id) as any;
  if (!post) return res.status(404).json({ error: 'Post not found' });

  db.prepare('DELETE FROM community_posts WHERE id = ?').run(req.params.id);

  logAuditAction(
    req.userId as number,
    'hide_post',
    'community_post',
    parseInt(req.params.id),
    JSON.stringify({ body: post.body, author_id: post.author_id })
  );

  res.json({ success: true });
});

// GET /reports — placeholder (reports table not yet created)
router.get('/reports', (req: AuthRequest, res: Response) => {
  res.json([]);
});

// POST /users/:id/warn — placeholder (log to audit)
router.post('/users/:id/warn', (req: AuthRequest, res: Response) => {
  const { reason } = req.body;
  const userId = parseInt(req.params.id);

  const user = db.prepare('SELECT id, name FROM users WHERE id = ?').get(userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  logAuditAction(
    req.userId as number,
    'warn_user',
    'user',
    userId,
    JSON.stringify({ reason: reason || 'No reason provided', user_name: user.name })
  );

  res.json({ success: true, message: `Warning logged for user ${user.name}` });
});

// POST /users/:id/ban — log to audit (role CHECK constraint doesn't include 'banned')
router.post('/users/:id/ban', (req: AuthRequest, res: Response) => {
  const { reason } = req.body;
  const userId = parseInt(req.params.id);

  const user = db.prepare('SELECT id, name, role FROM users WHERE id = ?').get(userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'admin') return res.status(400).json({ error: 'Cannot ban admin accounts' });

  // Since the role CHECK constraint doesn't include 'banned', we log and disable
  logAuditAction(
    req.userId as number,
    'ban_user',
    'user',
    userId,
    JSON.stringify({ reason: reason || 'No reason provided', user_name: user.name })
  );

  res.json({ success: true, message: `Ban logged for user ${user.name}. Use disable endpoint to restrict access.` });
});

// GET /chat-messages — recent chat messages across all communities
router.get('/chat-messages', (req: AuthRequest, res: Response) => {
  const messages = db.prepare(`
    SELECT m.id, m.body, m.created_at, m.user_id, m.community_id,
      u.name as author_name, c.name as community_name
    FROM community_chat_messages m
    JOIN users u ON m.user_id = u.id
    JOIN communities c ON m.community_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 50
  `).all() as any[];

  res.json(messages);
});

// DELETE /chat-messages/:id — delete a chat message
router.delete('/chat-messages/:id', (req: AuthRequest, res: Response) => {
  const msgId = parseInt(req.params.id);
  const msg = db.prepare('SELECT * FROM community_chat_messages WHERE id = ?').get(msgId) as any;
  if (!msg) return res.status(404).json({ error: 'Message not found' });

  db.prepare('DELETE FROM community_chat_messages WHERE id = ?').run(msgId);
  logAuditAction(req.userId!, 'delete_chat_message', 'chat_message', msgId, JSON.stringify({ body: msg.body, community_id: msg.community_id }));

  res.json({ success: true });
});

export default router;
