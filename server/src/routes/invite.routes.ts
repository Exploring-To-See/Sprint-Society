import { Router, Request, Response } from 'express';
import db from '../database/db';

const router = Router();

interface InviteCode {
  id: number;
  code: string;
  name: string;
  max_uses: number;
  used_count: number;
  source: string | null;
  active: number;
  expires_at: string | null;
  created_by: number;
  created_at: string;
}

// Validate an invite code (public - no auth needed)
router.post('/validate', (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Code is required' });

  const invite = db.prepare(`
    SELECT * FROM invite_codes WHERE code = ? AND active = 1
  `).get(code.toUpperCase().trim()) as InviteCode | undefined;

  if (!invite) return res.status(404).json({ error: 'Invalid invite code' });
  if (invite.used_count >= invite.max_uses) return res.status(410).json({ error: 'This code has reached its limit' });
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) return res.status(410).json({ error: 'This code has expired' });

  res.json({
    valid: true,
    name: invite.name,
    spots_remaining: invite.max_uses - invite.used_count,
  });
});

// Join waitlist (public)
router.post('/waitlist', (req: Request, res: Response) => {
  const { email, phone, name } = req.body;
  if (!email && !phone) return res.status(400).json({ error: 'Email or phone required' });

  const existing = db.prepare(
    'SELECT id FROM waitlist WHERE email = ? OR phone = ?'
  ).get(email || null, phone || null) as { id: number } | undefined;

  if (existing) return res.json({ message: 'Already on the waitlist!', position: null });

  db.prepare(
    'INSERT INTO waitlist (email, phone, name) VALUES (?, ?, ?)'
  ).run(email || null, phone || null, name || null);

  const position = (db.prepare('SELECT COUNT(*) as c FROM waitlist').get() as { c: number }).c;

  res.json({ message: "You're on the list!", position });
});

export default router;
