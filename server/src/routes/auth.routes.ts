import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import db from '../database/pg';
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
    // Normalize email so lookups are case-insensitive (mobile keyboards often
    // auto-capitalize, which otherwise makes a later login fail to match).
    data.email = data.email.trim().toLowerCase();

    // Validate invite code (optional — used for referral tracking)
    let code: any = null;
    if (data.invite_code) {
      code = await db.queryOne(
        `SELECT * FROM invite_codes WHERE code = $1 AND active = 1`,
        [data.invite_code.toUpperCase().trim()]
      );

      if (code) {
        if (code.expires_at && new Date(code.expires_at) < new Date()) {
          code = null;
        } else if (code.max_uses && code.used_count >= code.max_uses) {
          code = null;
        }
      }
    }

    const existing = await db.queryOne('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [data.email]);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const result = await db.queryOne(`
      INSERT INTO users (name, email, phone, password_hash, gender, age, height_cm, weight_kg, fitness_level, running_experience, injury_history, invite_code_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `, [
      data.name, data.email, data.phone, passwordHash,
      data.gender || 'male', data.age || 25,
      data.height_cm || 170, data.weight_kg || 70,
      data.fitness_level || 'active', data.running_experience || 'beginner',
      JSON.stringify(data.injury_history), code?.id || null
    ]);

    const userId = result.id as number;

    if (data.profile_photo && data.profile_photo.startsWith('data:image/')) {
      await db.execute('UPDATE users SET profile_image_url = $1 WHERE id = $2', [data.profile_photo, userId]);
    }

    if (code) {
      await db.execute('UPDATE invite_codes SET used_count = used_count + 1 WHERE id = $1', [code.id]);
      await db.execute('INSERT INTO invite_code_usage (code_id, user_id) VALUES ($1, $2)', [code.id, userId]);
    }

    await db.execute('INSERT INTO user_xp (user_id, total_xp, current_level) VALUES ($1, 0, 1)', [userId]);

    // Auto-join Sprint Social Club (mandatory community)
    const socialClub = await db.queryOne("SELECT id FROM communities WHERE name = 'Sprint Social Club'", []);
    if (socialClub) {
      await db.execute('INSERT INTO community_members (community_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [socialClub.id, userId, 'member']);
      await db.execute('UPDATE communities SET member_count = member_count + 1 WHERE id = $1', [socialClub.id]);
    }

    // Award 25 starter Kendu + welcome notification. Awaited (not fire-and-forget)
    // so they actually persist on serverless, where the function freezes the moment
    // the response is sent; guarded so a bonus/notification failure never blocks signup.
    try {
      await awardWelcomeBonus(userId);
      await createNotification(userId, 'welcome', 'Welcome to Sprint Society!', 'You received 25 starter Kendu. Start running to earn more!');
    } catch (e) {
      console.error('[Register] welcome bonus/notification failed (non-fatal):', e);
    }

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
    ? await db.queryOne('SELECT id, name, email, role, password_hash FROM users WHERE phone = $1 OR phone = $2', [cleanPhone, `+91${cleanPhone}`])
    : await db.queryOne('SELECT id, name, email, role, password_hash FROM users WHERE LOWER(email) = LOWER($1)', [identifier]);

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

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await db.queryOne(`
    SELECT id, name, email, role, gender, age, height_cm, weight_kg, fitness_level, running_experience, injury_history, profile_image_url, timezone, created_at
    FROM users WHERE id = $1
  `, [req.userId]);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.injury_history = JSON.parse(user.injury_history || '[]');
  res.json(user);
});

router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  const updates = req.body;
  const allowed = ['name', 'age', 'height_cm', 'weight_kg', 'fitness_level', 'running_experience', 'injury_history', 'timezone'];
  const numericFields: Record<string, { min: number; max: number }> = {
    age: { min: 13, max: 100 },
    height_cm: { min: 100, max: 250 },
    weight_kg: { min: 30, max: 250 },
  };
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const key of allowed) {
    if (updates[key] !== undefined) {
      if (key in numericFields) {
        const num = Number(updates[key]);
        const { min, max } = numericFields[key];
        if (isNaN(num) || num < min || num > max) {
          return res.status(400).json({ error: `${key} must be a number between ${min} and ${max}` });
        }
        fields.push(`${key} = $${paramIndex++}`);
        values.push(Math.round(key === 'weight_kg' ? num * 10 : num) / (key === 'weight_kg' ? 10 : 1));
      } else if (key === 'injury_history') {
        fields.push(`${key} = $${paramIndex++}`);
        values.push(JSON.stringify(updates[key]));
      } else if (key === 'name') {
        const name = String(updates[key]).trim();
        if (name.length < 2 || name.length > 100) {
          return res.status(400).json({ error: 'Name must be 2-100 characters' });
        }
        fields.push(`${key} = $${paramIndex++}`);
        values.push(name);
      } else {
        fields.push(`${key} = $${paramIndex++}`);
        values.push(String(updates[key]).slice(0, 100));
      }
    }
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  values.push(req.userId);
  await db.execute(`UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex}`, values);
  res.json({ success: true });
});

export default router;
