import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import db from '../database/db';
import { signToken } from '../utils/jwt';
import { authenticate, AuthRequest } from '../middleware/auth';
import { awardWelcomeBonus } from '../engine/kenduEngine';
import { createNotification } from './notifications.routes';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  password: z.string().min(6).max(72),
  invite_code: z.string().optional(),
  gender: z.enum(['male', 'female', 'non-binary']).optional(),
  age: z.number().int().min(13).max(100).optional(),
  height_cm: z.number().min(100).max(250).optional(),
  weight_kg: z.number().min(30).max(250).optional(),
  fitness_level: z.enum(['sedentary', 'lightly_active', 'active', 'very_active']).optional(),
  running_experience: z.enum(['none', 'beginner', 'intermediate', 'advanced']).optional(),
  injury_history: z.array(z.string()).default([]),
  profile_photo: z.string().optional(),
});

router.post('/register', async (req, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    // Validate invite code (optional — used for referral tracking)
    let code: any = null;
    if (data.invite_code) {
      code = db.prepare(`
        SELECT * FROM invite_codes WHERE code = ? AND active = 1
      `).get(data.invite_code.toUpperCase().trim()) as any;

      if (code) {
        if (code.expires_at && new Date(code.expires_at) < new Date()) {
          code = null;
        } else if (code.max_uses && code.used_count >= code.max_uses) {
          code = null;
        }
      }
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const result = db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, gender, age, height_cm, weight_kg, fitness_level, running_experience, injury_history, invite_code_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.name, data.email, data.phone, passwordHash,
      data.gender || 'male', data.age || 25,
      data.height_cm || 170, data.weight_kg || 70,
      data.fitness_level || 'active', data.running_experience || 'beginner',
      JSON.stringify(data.injury_history), code?.id || null
    );

    const userId = result.lastInsertRowid as number;

    if (data.profile_photo && data.profile_photo.startsWith('data:image/')) {
      db.prepare('UPDATE users SET profile_image_url = ? WHERE id = ?').run(data.profile_photo, userId);
    }

    if (code) {
      db.prepare('UPDATE invite_codes SET used_count = used_count + 1 WHERE id = ?').run(code.id);
      db.prepare('INSERT INTO invite_code_usage (code_id, user_id) VALUES (?, ?)').run(code.id, userId);
    }

    db.prepare('INSERT INTO user_xp (user_id, total_xp, current_level) VALUES (?, 0, 1)').run(userId);

    // Auto-join Sprint Social Club (mandatory community)
    const socialClub = db.prepare("SELECT id FROM communities WHERE name = 'Sprint Social Club'").get() as any;
    if (socialClub) {
      db.prepare('INSERT OR IGNORE INTO community_members (community_id, user_id, role) VALUES (?, ?, ?)').run(socialClub.id, userId, 'member');
      db.prepare('UPDATE communities SET member_count = member_count + 1 WHERE id = ?').run(socialClub.id);
    }

    // Award 25 starter Kendu + welcome notification
    awardWelcomeBonus(userId);
    createNotification(userId, 'welcome', 'Welcome to Sprint Society!', 'You received 25 starter Kendu. Start running to earn more!');

    const token = signToken(userId);
    res.status(201).json({ token, user: { id: userId, name: data.name, email: data.email } });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    throw err;
  }
});

router.post('/login', async (req, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email/phone and password required' });
  }

  if (typeof email !== 'string' || email.length > 255) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  if (typeof password !== 'string' || password.length > 72) {
    return res.status(400).json({ error: 'Password too long (max 72 characters)' });
  }

  const identifier = email.trim();
  const isPhone = /^[6-9]\d{9}$/.test(identifier.replace(/[\s+\-]/g, '').replace(/^(\+91|91)/, ''));
  const cleanPhone = identifier.replace(/[\s+\-]/g, '').replace(/^(\+91|91)/, '');

  const user = isPhone
    ? db.prepare('SELECT id, name, email, role, password_hash FROM users WHERE phone = ? OR phone = ?').get(cleanPhone, `+91${cleanPhone}`) as any
    : db.prepare('SELECT id, name, email, role, password_hash FROM users WHERE email = ?').get(identifier) as any;

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken(user.id);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  const user = db.prepare(`
    SELECT id, name, email, role, gender, age, height_cm, weight_kg, fitness_level, running_experience, injury_history, profile_image_url, created_at
    FROM users WHERE id = ?
  `).get(req.userId) as any;

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.injury_history = JSON.parse(user.injury_history || '[]');
  res.json(user);
});

router.put('/profile', authenticate, (req: AuthRequest, res: Response) => {
  const updates = req.body;
  const allowed = ['name', 'age', 'height_cm', 'weight_kg', 'fitness_level', 'running_experience', 'injury_history'];
  const fields: string[] = [];
  const values: any[] = [];

  for (const key of allowed) {
    if (updates[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(key === 'injury_history' ? JSON.stringify(updates[key]) : updates[key]);
    }
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  values.push(req.userId);
  db.prepare(`UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values);
  res.json({ success: true });
});

export default router;
