import { Router, Response } from 'express';
import db from '../database/pg';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

// GET / — list all feature_flags
router.get('/', async (req: AuthRequest, res: Response) => {
  const flags = await db.query(`
    SELECT ff.*,
      (SELECT COUNT(*) FROM feature_flag_overrides WHERE flag_id = ff.id) as override_count
    FROM feature_flags ff
    ORDER BY ff.created_at DESC
  `, []);

  res.json(flags);
});

// POST / — create a flag
router.post('/', async (req: AuthRequest, res: Response) => {
  const { key, name, description, enabled, rollout_percentage } = req.body;
  if (!key || !name) return res.status(400).json({ error: 'key and name are required' });

  const existing = await db.queryOne('SELECT id FROM feature_flags WHERE key = $1', [key]);
  if (existing) return res.status(409).json({ error: 'Flag key already exists' });

  const result = await db.execute(`
    INSERT INTO feature_flags (key, name, description, enabled, rollout_percentage)
    VALUES ($1, $2, $3, $4, $5) RETURNING id
  `, [
    key,
    name,
    description || null,
    enabled ? 1 : 0,
    rollout_percentage ?? 100
  ]);

  res.status(201).json({ id: result.rows[0]?.id, success: true });
});

// PUT /:id — update flag
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { enabled, rollout_percentage, target_segments } = req.body;

  await db.execute(`
    UPDATE feature_flags SET
      enabled = COALESCE($1, enabled),
      rollout_percentage = COALESCE($2, rollout_percentage),
      target_segments = COALESCE($3, target_segments),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
  `, [
    enabled !== undefined ? (enabled ? 1 : 0) : null,
    rollout_percentage !== undefined ? rollout_percentage : null,
    target_segments ? JSON.stringify(target_segments) : null,
    req.params.id
  ]);

  res.json({ success: true });
});

// DELETE /:id — delete flag
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  await db.execute('DELETE FROM feature_flags WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// GET /evaluate/:key — check if flag is enabled for a given user
router.get('/evaluate/:key', async (req: AuthRequest, res: Response) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id query param is required' });

  const flag = await db.queryOne('SELECT * FROM feature_flags WHERE key = $1', [req.params.key]) as any;
  if (!flag) return res.status(404).json({ error: 'Flag not found' });

  // Check user-specific override first
  const override = await db.queryOne(
    'SELECT enabled FROM feature_flag_overrides WHERE flag_id = $1 AND user_id = $2',
    [flag.id, user_id]
  ) as any;

  if (override) {
    return res.json({ key: flag.key, enabled: !!override.enabled, reason: 'override' });
  }

  // Check global enabled
  if (!flag.enabled) {
    return res.json({ key: flag.key, enabled: false, reason: 'globally_disabled' });
  }

  // Check rollout percentage
  if (flag.rollout_percentage < 100) {
    const userId = parseInt(user_id as string, 10);
    const hash = (userId * 2654435761) % 100; // simple hash for consistent bucketing
    const isInRollout = hash < flag.rollout_percentage;
    return res.json({ key: flag.key, enabled: isInRollout, reason: 'rollout_percentage' });
  }

  res.json({ key: flag.key, enabled: true, reason: 'enabled' });
});

// POST /:id/overrides — set user-specific override
router.post('/:id/overrides', async (req: AuthRequest, res: Response) => {
  const { user_id, enabled } = req.body;
  if (!user_id || enabled === undefined) {
    return res.status(400).json({ error: 'user_id and enabled are required' });
  }

  await db.execute(`
    INSERT INTO feature_flag_overrides (flag_id, user_id, enabled) VALUES ($1, $2, $3)
    ON CONFLICT (flag_id, user_id) DO UPDATE SET enabled = $3
  `, [req.params.id, user_id, enabled ? 1 : 0]);

  res.status(201).json({ success: true });
});

// DELETE /:id/overrides/:userId — remove override
router.delete('/:id/overrides/:userId', async (req: AuthRequest, res: Response) => {
  await db.execute('DELETE FROM feature_flag_overrides WHERE flag_id = $1 AND user_id = $2',
    [req.params.id, req.params.userId]);
  res.json({ success: true });
});

export default router;
