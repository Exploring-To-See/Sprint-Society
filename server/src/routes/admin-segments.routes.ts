import { Router, Response } from 'express';
import db from '../database/pg';
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

function buildWhereClause(rules: SegmentRule[], startIdx: number): { sql: string; params: (string | number)[] } {
  const conditions: string[] = [];
  const params: (string | number)[] = [];
  let paramIdx = startIdx;

  for (const rule of rules) {
    // Determine which table the field comes from
    const field = rule.field === 'total_xp' || rule.field === 'current_level' || rule.field === 'current_streak_days'
      ? `ux.${rule.field}`
      : `u.${rule.field}`;

    switch (rule.op) {
      case 'eq':
        conditions.push(`${field} = $${paramIdx++}`);
        params.push(rule.value as string | number);
        break;
      case 'neq':
        conditions.push(`${field} != $${paramIdx++}`);
        params.push(rule.value as string | number);
        break;
      case 'gt':
        conditions.push(`${field} > $${paramIdx++}`);
        params.push(rule.value as number);
        break;
      case 'gte':
        conditions.push(`${field} >= $${paramIdx++}`);
        params.push(rule.value as number);
        break;
      case 'lt':
        conditions.push(`${field} < $${paramIdx++}`);
        params.push(rule.value as number);
        break;
      case 'lte':
        conditions.push(`${field} <= $${paramIdx++}`);
        params.push(rule.value as number);
        break;
      case 'in': {
        const values = Array.isArray(rule.value) ? rule.value : [rule.value];
        const placeholders = values.map(() => `$${paramIdx++}`);
        conditions.push(`${field} IN (${placeholders.join(',')})`);
        params.push(...values.map(v => v as string | number));
        break;
      }
      case 'contains':
        conditions.push(`${field} LIKE $${paramIdx++}`);
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
router.get('/', async (req: AuthRequest, res: Response) => {
  const segments = await db.query(`
    SELECT * FROM segments ORDER BY created_at DESC
  `, []);

  res.json(segments);
});

// POST / — create segment
router.post('/', async (req: AuthRequest, res: Response) => {
  const { name, description, criteria } = req.body;
  if (!name || !criteria) return res.status(400).json({ error: 'name and criteria are required' });

  const result = await db.execute(`
    INSERT INTO segments (name, description, criteria)
    VALUES ($1, $2, $3) RETURNING id
  `, [name, description || null, JSON.stringify(criteria)]);

  res.status(201).json({ id: result.rows[0]?.id, success: true });
});

// PUT /:id — update segment
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { name, description, criteria } = req.body;

  await db.execute(`
    UPDATE segments SET
      name = COALESCE($1, name),
      description = COALESCE($2, description),
      criteria = COALESCE($3, criteria),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
  `, [
    name || null,
    description !== undefined ? description : null,
    criteria ? JSON.stringify(criteria) : null,
    req.params.id
  ]);

  res.json({ success: true });
});

// DELETE /:id — delete segment + members
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  await db.execute('DELETE FROM segment_members WHERE segment_id = $1', [req.params.id]);
  await db.execute('DELETE FROM segments WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// POST /:id/evaluate — re-evaluate segment criteria against all users
router.post('/:id/evaluate', async (req: AuthRequest, res: Response) => {
  const segment = await db.queryOne('SELECT * FROM segments WHERE id = $1', [req.params.id]) as any;
  if (!segment) return res.status(404).json({ error: 'Segment not found' });

  const criteria: SegmentCriteria = JSON.parse(segment.criteria);
  const { sql, params } = buildWhereClause(criteria.rules, 1);

  const matchingUsers = await db.query(`
    SELECT u.id FROM users u
    LEFT JOIN user_xp ux ON u.id = ux.user_id
    WHERE u.role = 'runner' AND ${sql}
  `, params) as any[];

  // Clear existing members and re-populate
  await db.execute('DELETE FROM segment_members WHERE segment_id = $1', [req.params.id]);

  for (const user of matchingUsers) {
    await db.execute('INSERT INTO segment_members (segment_id, user_id) VALUES ($1, $2)', [req.params.id, user.id]);
  }

  // Update member_count
  await db.execute('UPDATE segments SET member_count = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [matchingUsers.length, req.params.id]);

  res.json({ success: true, member_count: matchingUsers.length });
});

// GET /:id/members — list users in a segment
router.get('/:id/members', async (req: AuthRequest, res: Response) => {
  const members = await db.query(`
    SELECT u.id, u.name, u.email, u.running_experience, u.fitness_level, u.created_at,
      ux.total_xp, ux.current_level
    FROM segment_members sm
    JOIN users u ON sm.user_id = u.id
    LEFT JOIN user_xp ux ON u.id = ux.user_id
    WHERE sm.segment_id = $1
    ORDER BY u.name ASC
  `, [req.params.id]);

  res.json(members);
});

export default router;
