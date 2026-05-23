import { Router, Response } from 'express';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

interface SegmentRule {
  field: string;
  op: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: string | number | string[];
}

interface SegmentCriteria {
  rules: SegmentRule[];
}

function buildWhereClause(rules: SegmentRule[]): { sql: string; params: (string | number)[] } {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  for (const rule of rules) {
    // Determine which table the field comes from
    const field = rule.field === 'total_xp' || rule.field === 'current_level' || rule.field === 'current_streak_days'
      ? `ux.${rule.field}`
      : `u.${rule.field}`;

    switch (rule.op) {
      case 'eq':
        conditions.push(`${field} = ?`);
        params.push(rule.value as string | number);
        break;
      case 'neq':
        conditions.push(`${field} != ?`);
        params.push(rule.value as string | number);
        break;
      case 'gt':
        conditions.push(`${field} > ?`);
        params.push(rule.value as number);
        break;
      case 'gte':
        conditions.push(`${field} >= ?`);
        params.push(rule.value as number);
        break;
      case 'lt':
        conditions.push(`${field} < ?`);
        params.push(rule.value as number);
        break;
      case 'lte':
        conditions.push(`${field} <= ?`);
        params.push(rule.value as number);
        break;
      case 'in': {
        const values = Array.isArray(rule.value) ? rule.value : [rule.value];
        conditions.push(`${field} IN (${values.map(() => '?').join(',')})`);
        params.push(...values.map(v => v as string | number));
        break;
      }
      case 'contains':
        conditions.push(`${field} LIKE ?`);
        params.push(`%${rule.value}%`);
        break;
    }
  }

  return {
    sql: conditions.length > 0 ? conditions.join(' AND ') : '1=1',
    params,
  };
}

// GET / — list all segments with member_count
router.get('/', (req: AuthRequest, res: Response) => {
  const segments = db.prepare(`
    SELECT * FROM segments ORDER BY created_at DESC
  `).all();

  res.json(segments);
});

// POST / — create segment
router.post('/', (req: AuthRequest, res: Response) => {
  const { name, description, criteria } = req.body;
  if (!name || !criteria) return res.status(400).json({ error: 'name and criteria are required' });

  const result = db.prepare(`
    INSERT INTO segments (name, description, criteria)
    VALUES (?, ?, ?)
  `).run(name, description || null, JSON.stringify(criteria));

  res.status(201).json({ id: result.lastInsertRowid, success: true });
});

// PUT /:id — update segment
router.put('/:id', (req: AuthRequest, res: Response) => {
  const { name, description, criteria } = req.body;

  db.prepare(`
    UPDATE segments SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      criteria = COALESCE(?, criteria),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    name || null,
    description !== undefined ? description : null,
    criteria ? JSON.stringify(criteria) : null,
    req.params.id
  );

  res.json({ success: true });
});

// DELETE /:id — delete segment + members
router.delete('/:id', (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM segment_members WHERE segment_id = ?').run(req.params.id);
  db.prepare('DELETE FROM segments WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// POST /:id/evaluate — re-evaluate segment criteria against all users
router.post('/:id/evaluate', (req: AuthRequest, res: Response) => {
  const segment = db.prepare('SELECT * FROM segments WHERE id = ?').get(req.params.id) as any;
  if (!segment) return res.status(404).json({ error: 'Segment not found' });

  const criteria: SegmentCriteria = JSON.parse(segment.criteria);
  const { sql, params } = buildWhereClause(criteria.rules);

  const matchingUsers = db.prepare(`
    SELECT u.id FROM users u
    LEFT JOIN user_xp ux ON u.id = ux.user_id
    WHERE u.role = 'runner' AND ${sql}
  `).all(...params) as any[];

  // Clear existing members and re-populate
  db.prepare('DELETE FROM segment_members WHERE segment_id = ?').run(req.params.id);

  const insertStmt = db.prepare('INSERT INTO segment_members (segment_id, user_id) VALUES (?, ?)');
  for (const user of matchingUsers) {
    insertStmt.run(req.params.id, user.id);
  }

  // Update member_count
  db.prepare('UPDATE segments SET member_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(matchingUsers.length, req.params.id);

  res.json({ success: true, member_count: matchingUsers.length });
});

// GET /:id/members — list users in a segment
router.get('/:id/members', (req: AuthRequest, res: Response) => {
  const members = db.prepare(`
    SELECT u.id, u.name, u.email, u.running_experience, u.fitness_level, u.created_at,
      ux.total_xp, ux.current_level
    FROM segment_members sm
    JOIN users u ON sm.user_id = u.id
    LEFT JOIN user_xp ux ON u.id = ux.user_id
    WHERE sm.segment_id = ?
    ORDER BY u.name ASC
  `).all(req.params.id);

  res.json(members);
});

export default router;
