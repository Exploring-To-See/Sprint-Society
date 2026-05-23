import { Router, Response } from 'express';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

// GET /sprints — list sprint_history entries
router.get('/sprints', (req: AuthRequest, res: Response) => {
  const sprints = db.prepare(`
    SELECT * FROM sprint_history ORDER BY sprint_date DESC
  `).all();

  res.json(sprints);
});

// POST /sprints — record a sprint
router.post('/sprints', (req: AuthRequest, res: Response) => {
  const { sprint_date, proposed, built, auto_fixed, status } = req.body;
  if (!sprint_date || !proposed) {
    return res.status(400).json({ error: 'sprint_date and proposed are required' });
  }

  const result = db.prepare(`
    INSERT INTO sprint_history (sprint_date, proposed, built, auto_fixed, status)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    sprint_date,
    proposed,
    built || null,
    auto_fixed || null,
    status || 'proposed'
  );

  res.status(201).json({ id: result.lastInsertRowid, success: true });
});

// GET /git-log — return last 20 commits (placeholder)
router.get('/git-log', (req: AuthRequest, res: Response) => {
  // Cannot run git on Railway without exec, returning placeholder
  const placeholder = [
    { hash: 'placeholder', message: 'Git log not available in production', date: new Date().toISOString() },
  ];

  res.json(placeholder);
});

// GET /backlog — return static summary of TASKS.md items
router.get('/backlog', (req: AuthRequest, res: Response) => {
  const backlog = [
    { id: 'TASK-001', title: 'Web push notifications', status: 'planned' },
    { id: 'TASK-002', title: 'Run-to-Earn brand collabs', status: 'planned' },
    { id: 'TASK-003', title: 'Advanced route mapping', status: 'planned' },
    { id: 'TASK-004', title: 'Social leaderboards v2', status: 'in_progress' },
    { id: 'TASK-005', title: 'Premium subscription features', status: 'in_progress' },
  ];

  res.json(backlog);
});

export default router;
