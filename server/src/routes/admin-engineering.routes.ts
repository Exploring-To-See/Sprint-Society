import { Router, Response } from 'express';
import db from '../database/pg';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';
import { config } from '../config';
import { sendEmailDiagnostic, sendCustomEmail } from '../services/email.service';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

// GET /email-config — confirm the email env vars are actually present in THIS
// production runtime (common gotcha: set in Vercel but not redeployed). No secrets.
router.get('/email-config', (_req: AuthRequest, res: Response) => {
  const provider = (process.env.EMAIL_PROVIDER || 'resend').trim().toLowerCase() === 'gmail' ? 'gmail' : 'resend';
  res.json({
    provider,
    // gmail
    gmail_user_set: !!process.env.GMAIL_USER,
    gmail_app_password_set: !!process.env.GMAIL_APP_PASSWORD,
    email_from_name: process.env.EMAIL_FROM_NAME || null,
    // resend
    resend_api_key_set: !!process.env.RESEND_API_KEY,
    email_from: process.env.EMAIL_FROM || null,
    using_fallback_sender: provider === 'resend'
      && (process.env.EMAIL_FROM || 'Sprint Society <onboarding@resend.dev>') === 'Sprint Society <onboarding@resend.dev>',
    // shared — app_url is what password-reset / notification email links use.
    email_reply_to: process.env.EMAIL_REPLY_TO || null,
    app_url: config.appUrl,
    client_url: config.clientUrl,
    app_url_is_admin: /(^|[.-])admin([.-]|$)/.test(config.appUrl),
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

// POST /email-send { to, subject, message } — custom email OUTREACH. `to` may be a
// single address or a comma/space/semicolon-separated list (max 25 per request to
// respect the Gmail SMTP daily cap). Admin-only. Sends via the active provider.
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
router.post('/email-send', async (req: AuthRequest, res: Response) => {
  const raw = String(req.body?.to || '').trim();
  const subject = String(req.body?.subject || '').trim();
  const message = String(req.body?.message || '').trim();
  if (!subject) return res.status(400).json({ error: 'Subject is required' });
  if (!message) return res.status(400).json({ error: 'Message is required' });

  const parts = raw.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
  const recipients = [...new Set(parts.filter(e => EMAIL_RE.test(e)))];
  const invalid = parts.filter(e => !EMAIL_RE.test(e));
  if (recipients.length === 0) return res.status(400).json({ error: 'At least one valid recipient email is required', invalid });
  if (recipients.length > 25) return res.status(400).json({ error: 'Max 25 recipients per send (Gmail daily-cap safety)' });

  const results: { to: string; ok: boolean; error?: string }[] = [];
  let provider = 'resend';
  for (const to of recipients) {
    const r = await sendCustomEmail(to, subject, message);
    provider = r.provider;
    results.push({ to, ok: r.ok, error: r.error });
  }
  const sent = results.filter(r => r.ok).length;
  res.status(sent > 0 ? 200 : 502).json({ provider, requested: recipients.length, sent, failed: recipients.length - sent, invalid, results });
});

// GET /outreach/recipients — users with an email, for the outreach picker.
router.get('/outreach/recipients', async (_req: AuthRequest, res: Response) => {
  const rows = await db.query(
    `SELECT id, name, email FROM users
     WHERE email IS NOT NULL AND email <> '' AND role = 'runner'
     ORDER BY name NULLS LAST LIMIT 500`,
    []
  );
  res.json({ recipients: rows, count: rows.length });
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
