import { Router, Response } from 'express';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

// GET / — list all feature_flags
router.get('/', (req: AuthRequest, res: Response) => {
  const flags = db.prepare(`
    SELECT ff.*,
      (SELECT COUNT(*) FROM feature_flag_overrides WHERE flag_id = ff.id) as override_count
    FROM feature_flags ff
    ORDER BY ff.created_at DESC
  `).all();

  res.json(flags);
});

// POST / — create a flag
router.post('/', (req: AuthRequest, res: Response) => {
  const { key, name, description, enabled, rollout_percentage } = req.body;
  if (!key || !name) return res.status(400).json({ error: 'key and name are required' });

  const existing = db.prepare('SELECT id FROM feature_flags WHERE key = ?').get(key);
  if (existing) return res.status(409).json({ error: 'Flag key already exists' });

  const result = db.prepare(`
    INSERT INTO feature_flags (key, name, description, enabled, rollout_percentage)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    key,
    name,
    description || null,
    enabled ? 1 : 0,
    rollout_percentage ?? 100
  );

  res.status(201).json({ id: result.lastInsertRowid, success: true });
});

// PUT /:id — update flag
router.put('/:id', (req: AuthRequest, res: Response) => {
  const { enabled, rollout_percentage, target_segments } = req.body;

  db.prepare(`
    UPDATE feature_flags SET
      enabled = COALESCE(?, enabled),
      rollout_percentage = COALESCE(?, rollout_percentage),
      target_segments = COALESCE(?, target_segments),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    enabled !== undefined ? (enabled ? 1 : 0) : null,
    rollout_percentage !== undefined ? rollout_percentage : null,
    target_segments ? JSON.stringify(target_segments) : null,
    req.params.id
  );

  res.json({ success: true });
});

// DELETE /:id — delete flag
router.delete('/:id', (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM feature_flags WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// GET /evaluate/:key — check if flag is enabled for a given user
router.get('/evaluate/:key', (req: AuthRequest, res: Response) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id query param is required' });

  const flag = db.prepare('SELECT * FROM feature_flags WHERE key = ?').get(req.params.key) as any;
  if (!flag) return res.status(404).json({ error: 'Flag not found' });

  // Check user-specific override first
  const override = db.prepare(
    'SELECT enabled FROM feature_flag_overrides WHERE flag_id = ? AND user_id = ?'
  ).get(flag.id, user_id) as any;

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
router.post('/:id/overrides', (req: AuthRequest, res: Response) => {
  const { user_id, enabled } = req.body;
  if (!user_id || enabled === undefined) {
    return res.status(400).json({ error: 'user_id and enabled are required' });
  }

  db.prepare(`
    INSERT OR REPLACE INTO feature_flag_overrides (flag_id, user_id, enabled)
    VALUES (?, ?, ?)
  `).run(req.params.id, user_id, enabled ? 1 : 0);

  res.status(201).json({ success: true });
});

// DELETE /:id/overrides/:userId — remove override
router.delete('/:id/overrides/:userId', (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM feature_flag_overrides WHERE flag_id = ? AND user_id = ?')
    .run(req.params.id, req.params.userId);
  res.json({ success: true });
});

export default router;
