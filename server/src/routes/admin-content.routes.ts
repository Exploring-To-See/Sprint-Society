import { Router, Response } from 'express';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

// GET / — list all content_blocks (ordered by created_at DESC)
router.get('/', (req: AuthRequest, res: Response) => {
  const blocks = db.prepare(`
    SELECT cb.*, s.name as segment_name
    FROM content_blocks cb
    LEFT JOIN segments s ON cb.target_segment_id = s.id
    ORDER BY cb.created_at DESC
  `).all();

  res.json(blocks);
});

// POST / — create content_block
router.post('/', (req: AuthRequest, res: Response) => {
  const { type, title, body, target_tier, target_segment_id, published, scheduled_at } = req.body;
  if (!type || !title || !body) {
    return res.status(400).json({ error: 'type, title, and body are required' });
  }

  const result = db.prepare(`
    INSERT INTO content_blocks (type, title, body, target_tier, target_segment_id, published, scheduled_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    type,
    title,
    body,
    target_tier || null,
    target_segment_id || null,
    published ? 1 : 0,
    scheduled_at || null
  );

  res.status(201).json({ id: result.lastInsertRowid, success: true });
});

// PUT /:id — update content_block
router.put('/:id', (req: AuthRequest, res: Response) => {
  const { type, title, body, target_tier, target_segment_id, published, scheduled_at } = req.body;

  db.prepare(`
    UPDATE content_blocks SET
      type = COALESCE(?, type),
      title = COALESCE(?, title),
      body = COALESCE(?, body),
      target_tier = COALESCE(?, target_tier),
      target_segment_id = COALESCE(?, target_segment_id),
      published = COALESCE(?, published),
      scheduled_at = COALESCE(?, scheduled_at)
    WHERE id = ?
  `).run(
    type || null,
    title || null,
    body || null,
    target_tier !== undefined ? target_tier : null,
    target_segment_id !== undefined ? target_segment_id : null,
    published !== undefined ? (published ? 1 : 0) : null,
    scheduled_at !== undefined ? scheduled_at : null,
    req.params.id
  );

  res.json({ success: true });
});

// DELETE /:id — delete content_block
router.delete('/:id', (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM content_blocks WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// GET /published — return currently published content
router.get('/published', (req: AuthRequest, res: Response) => {
  const blocks = db.prepare(`
    SELECT cb.*, s.name as segment_name
    FROM content_blocks cb
    LEFT JOIN segments s ON cb.target_segment_id = s.id
    WHERE cb.published = 1
      AND (cb.scheduled_at IS NULL OR cb.scheduled_at <= datetime('now'))
    ORDER BY cb.created_at DESC
  `).all();

  res.json(blocks);
});

// POST /:id/publish — set published=1
router.post('/:id/publish', (req: AuthRequest, res: Response) => {
  db.prepare('UPDATE content_blocks SET published = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// POST /:id/unpublish — set published=0
router.post('/:id/unpublish', (req: AuthRequest, res: Response) => {
  db.prepare('UPDATE content_blocks SET published = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
