import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import db from '../database/pg';
import { config } from '../config';
import { authenticate } from '../middleware/auth';
import { sendPasswordResetEmail } from '../services/email.service';

const router = Router();

const forgotSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({ token: z.string().min(1), password: z.string().min(6) });
const changeSchema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(6) });

router.post('/forgot-password', async (req: Request, res: Response) => {
  const parsed = forgotSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Valid email required' });

  const { email } = parsed.data;
  const user = await db.queryOne('SELECT id, name, email FROM users WHERE email = $1', [email]) as any;

  // Always return success to prevent email enumeration (with timing normalization)
  if (!user) {
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    return res.json({ message: 'If that email exists, a reset link has been sent.' });
  }

  // Rate limit: max 3 tokens per user per hour
  const recentTokens = await db.queryOne(
    `SELECT COUNT(*) as count FROM password_reset_tokens WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
    [user.id]
  ) as any;

  if (recentTokens.count >= 3) {
    return res.json({ message: 'If that email exists, a reset link has been sent.' });
  }

  // Generate token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  await db.execute('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)', [user.id, token, expiresAt]);

  const resetUrl = `${config.clientUrl}/reset-password/${token}`;
  await sendPasswordResetEmail(user.email, resetUrl, user.name);

  res.json({ message: 'If that email exists, a reset link has been sent.' });
});

router.post('/reset-password', async (req: Request, res: Response) => {
  const parsed = resetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Token and password (6+ chars) required' });

  const { token, password } = parsed.data;

  const record = await db.queryOne(
    `SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()`,
    [token]
  ) as any;

  if (!record) return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });

  const hash = bcrypt.hashSync(password, 10);
  await db.execute('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hash, record.user_id]);

  // Delete all tokens for this user
  await db.execute('DELETE FROM password_reset_tokens WHERE user_id = $1', [record.user_id]);

  res.json({ message: 'Password updated successfully. You can now log in.' });
});

router.put('/change-password', authenticate, async (req: any, res: Response) => {
  const parsed = changeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Current password and new password (6+ chars) required' });

  const { currentPassword, newPassword } = parsed.data;

  const user = await db.queryOne('SELECT password_hash FROM users WHERE id = $1', [req.userId]) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  await db.execute('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hash, req.userId]);

  res.json({ message: 'Password changed successfully' });
});

export default router;
