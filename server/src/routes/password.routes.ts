import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from '../database/db';
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
  const user = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email) as any;

  // Always return success to prevent email enumeration
  if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });

  // Rate limit: max 3 tokens per user per hour
  const recentTokens = db.prepare(
    `SELECT COUNT(*) as count FROM password_reset_tokens WHERE user_id = ? AND created_at > datetime('now', '-1 hour')`
  ).get(user.id) as any;

  if (recentTokens.count >= 3) {
    return res.json({ message: 'If that email exists, a reset link has been sent.' });
  }

  // Generate token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  db.prepare('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)').run(user.id, token, expiresAt);

  const resetUrl = `${config.clientUrl}/reset-password/${token}`;
  await sendPasswordResetEmail(user.email, resetUrl, user.name);

  res.json({ message: 'If that email exists, a reset link has been sent.' });
});

router.post('/reset-password', (req: Request, res: Response) => {
  const parsed = resetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Token and password (6+ chars) required' });

  const { token, password } = parsed.data;

  const record = db.prepare(
    `SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > datetime('now')`
  ).get(token) as any;

  if (!record) return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });

  const hash = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hash, record.user_id);

  // Delete all tokens for this user
  db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(record.user_id);

  res.json({ message: 'Password updated successfully. You can now log in.' });
});

router.put('/change-password', authenticate, (req: any, res: Response) => {
  const parsed = changeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Current password and new password (6+ chars) required' });

  const { currentPassword, newPassword } = parsed.data;

  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hash, req.userId);

  res.json({ message: 'Password changed successfully' });
});

export default router;
