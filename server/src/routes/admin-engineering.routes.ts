import { Router, Response } from 'express';
import db from '../database/pg';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';
import { config } from '../config';
import { sendEmailDiagnostic } from '../services/email.service';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

// GET /email-config — confirm the email env vars are actually present in THIS
// production runtime (common gotcha: set in Vercel but not redeployed). No secrets.
router.get('/email-config', (_req: AuthRequest, res: Response) => {
  const from = process.env.EMAIL_FROM || 'Sprint Society <onboarding@resend.dev>';
  res.json({
    resend_api_key_set: !!process.env.RESEND_API_KEY,
    email_from: process.env.EMAIL_FROM || null,
    email_reply_to: process.env.EMAIL_REPLY_TO || null,
    client_url: config.clientUrl,
    using_fallback_sender: from === 'Sprint Society <onboarding@resend.dev>',
  });
});

// POST /email-test { to } — send a real test email via Resend and return the exact
// result (provider id on success, the precise error on failure). Admin-only.
router.post('/email-test', async (req: AuthRequest, res: Response) => {
  const to = String(req.body?.to || '').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    return res.status(400).json({ error: 'A valid "to" email is required' });
  }
  const result = await sendEmailDiagnostic(to);
  res.status(result.sent ? 200 : 502).json(result);
});

// GET /sprints — list sprint_history entries
router.get('/sprints', async (req: AuthRequest, res: Response) => {
  const sprints = await db.query(`
    SELECT * FROM sprint_history ORDER BY sprint_date DESC
  `, []);

  res.json(sprints);
});

// POST /sprints — record a sprint
router.post('/sprints', async (req: AuthRequest, res: Response) => {
  const { sprint_date, proposed, built, auto_fixed, status } = req.body;
  if (!sprint_date || !proposed) {
    return res.status(400).json({ error: 'sprint_date and proposed are required' });
  }

  const result = await db.execute(`
    INSERT INTO sprint_history (sprint_date, proposed, built, auto_fixed, status)
    VALUES ($1, $2, $3, $4, $5) RETURNING id
  `, [
    sprint_date,
    proposed,
    built || null,
    auto_fixed || null,
    status || 'proposed'
  ]);

  res.status(201).json({ id: result.rows[0]?.id, success: true });
});

// GET /git-log — return last 20 commits (placeholder)
router.get('/git-log', async (req: AuthRequest, res: Response) => {
  // Cannot run git in the serverless runtime, returning placeholder
  const placeholder = [
    { hash: 'placeholder', message: 'Git log not available in production', date: new Date().toISOString() },
  ];

  res.json(placeholder);
});

// GET /backlog — return static summary of TASKS.md items
router.get('/backlog', async (req: AuthRequest, res: Response) => {
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
