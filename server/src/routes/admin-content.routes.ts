import { Router, Response } from 'express';
import db from '../database/pg';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

// GET / — list all content_blocks (ordered by created_at DESC)
router.get('/', async (req: AuthRequest, res: Response) => {
  const blocks = await db.query(`
    SELECT cb.*, s.name as segment_name
    FROM content_blocks cb
    LEFT JOIN segments s ON cb.target_segment_id = s.id
    ORDER BY cb.created_at DESC
  `, []);

  res.json(blocks);
});

// POST / — create content_block
router.post('/', async (req: AuthRequest, res: Response) => {
  const { type, title, body, target_tier, target_segment_id, published, scheduled_at } = req.body;
  if (!type || !title || !body) {
    return res.status(400).json({ error: 'type, title, and body are required' });
  }

  const result = await db.execute(`
    INSERT INTO content_blocks (type, title, body, target_tier, target_segment_id, published, scheduled_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
  `, [
    type,
    title,
    body,
    target_tier || null,
    target_segment_id || null,
    published ? 1 : 0,
    scheduled_at || null
  ]);

  res.status(201).json({ id: result.rows[0]?.id, success: true });
});

// PUT /:id — update content_block
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { type, title, body, target_tier, target_segment_id, published, scheduled_at } = req.body;

  await db.execute(`
    UPDATE content_blocks SET
      type = COALESCE($1, type),
      title = COALESCE($2, title),
      body = COALESCE($3, body),
      target_tier = COALESCE($4, target_tier),
      target_segment_id = COALESCE($5, target_segment_id),
      published = COALESCE($6, published),
      scheduled_at = COALESCE($7, scheduled_at)
    WHERE id = $8
  `, [
    type || null,
    title || null,
    body || null,
    target_tier !== undefined ? target_tier : null,
    target_segment_id !== undefined ? target_segment_id : null,
    published !== undefined ? (published ? 1 : 0) : null,
    scheduled_at !== undefined ? scheduled_at : null,
    req.params.id
  ]);

  res.json({ success: true });
});

// DELETE /:id — delete content_block
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  await db.execute('DELETE FROM content_blocks WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// GET /published — return currently published content
router.get('/published', async (req: AuthRequest, res: Response) => {
  const blocks = await db.query(`
    SELECT cb.*, s.name as segment_name
    FROM content_blocks cb
    LEFT JOIN segments s ON cb.target_segment_id = s.id
    WHERE cb.published = 1
      AND (cb.scheduled_at IS NULL OR cb.scheduled_at <= NOW())
    ORDER BY cb.created_at DESC
  `, []);

  res.json(blocks);
});

// POST /:id/publish — set published=1
router.post('/:id/publish', async (req: AuthRequest, res: Response) => {
  await db.execute('UPDATE content_blocks SET published = 1 WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// POST /:id/unpublish — set published=0
router.post('/:id/unpublish', async (req: AuthRequest, res: Response) => {
  await db.execute('UPDATE content_blocks SET published = 0 WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

export default router;
