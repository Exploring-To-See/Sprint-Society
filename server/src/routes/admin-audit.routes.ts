import { Router, Response } from 'express';
import db from '../database/pg';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

// Helper function — exported for use by other admin routes
export async function logAuditAction(
  adminId: number,
  action: string,
  targetType: string | null,
  targetId: number | null,
  details: string | null
): Promise<void> {
  await db.execute(
    'INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)',
    [adminId, action, targetType, targetId, details]
  );
}

// GET / — list audit log entries (last 200), with optional ?action filter
router.get('/', async (req: AuthRequest, res: Response) => {
  const { action } = req.query;

  let entries;
  if (action) {
    entries = await db.query(`
      SELECT al.*, u.name as admin_name
      FROM admin_audit_log al
      JOIN users u ON al.admin_id = u.id
      WHERE al.action = $1
      ORDER BY al.created_at DESC
      LIMIT 200
    `, [action]);
  } else {
    entries = await db.query(`
      SELECT al.*, u.name as admin_name
      FROM admin_audit_log al
      JOIN users u ON al.admin_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 200
    `, []);
  }

  res.json(entries);
});

// POST / — record an audit entry
router.post('/', async (req: AuthRequest, res: Response) => {
  const { action, target_type, target_id, details } = req.body;
  if (!action) return res.status(400).json({ error: 'action is required' });

  await logAuditAction(
    req.userId as number,
    action,
    target_type || null,
    target_id || null,
    details ? JSON.stringify(details) : null
  );

  res.status(201).json({ success: true });
});

export default router;
