// Email verification (non-blocking). Mounted at /api/auth.
//   GET  /api/auth/verify-email?token=...   (public) — confirm a token, flip email_verified
//   POST /api/auth/resend-verification       (auth)   — re-issue + resend (rate-limited)
// createAndSendVerification() is called from register + google-auth + resend.
import { Router, Request, Response } from 'express';
import * as crypto from 'crypto';
import db from '../database/pg';
import { config } from '../config';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendVerificationEmail } from '../services/email.service';

const router = Router();

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h

/** Issue a fresh verification token and email it. Safe to call fire-and-forget (returns bool). */
export async function createAndSendVerification(userId: number, email: string, name: string): Promise<boolean> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
  await db.execute('INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [userId, token, expiresAt]);
  const verifyUrl = `${config.clientUrl}/verify-email?token=${token}`;
  return sendVerificationEmail(email, verifyUrl, name || 'there');
}

// Public: confirm a token.
router.get('/verify-email', async (req: Request, res: Response) => {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  if (!token) return res.status(400).json({ error: 'Missing verification token.' });

  const record = await db.queryOne(
    `SELECT user_id FROM email_verification_tokens WHERE token = $1 AND expires_at > NOW()`,
    [token]
  ) as { user_id: number } | null;

  if (!record) return res.status(400).json({ error: 'Invalid or expired verification link. Request a new one from the app.' });

  await db.execute('UPDATE users SET email_verified = 1 WHERE id = $1', [record.user_id]);
  await db.execute('DELETE FROM email_verification_tokens WHERE user_id = $1', [record.user_id]);

  res.json({ message: 'Email verified. You’re all set.', verified: true });
});

// Auth: resend to the logged-in user (rate-limited 3/hour).
router.post('/resend-verification', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await db.queryOne('SELECT id, name, email, email_verified FROM users WHERE id = $1', [req.userId]) as
    { id: number; name: string; email: string; email_verified: number } | null;
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.email_verified) return res.json({ message: 'Your email is already verified.', verified: true });

  const recent = await db.queryOne(
    `SELECT COUNT(*) as count FROM email_verification_tokens WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
    [user.id]
  ) as { count: number };
  if (Number(recent.count) >= 3) {
    return res.status(429).json({ error: 'Too many requests. Try again in an hour.' });
  }

  await createAndSendVerification(user.id, user.email, user.name);
  res.json({ message: 'Verification email sent. Check your inbox.' });
});

export default router;
