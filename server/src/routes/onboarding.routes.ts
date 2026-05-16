import { Router, Response } from 'express';
import { z } from 'zod';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /onboarding/status — Check what profiling data we still need
router.get('/status', (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(req.userId) as any;
  const stravaConnected = db.prepare('SELECT id FROM strava_tokens WHERE user_id = ?').get(req.userId);
  const runCount = (db.prepare('SELECT COUNT(*) as c FROM activities WHERE user_id = ?').get(req.userId) as any).c;

  const completed: string[] = [];
  const pending: string[] = [];

  // Basic (from registration)
  completed.push('basics');

  // Strava
  if (stravaConnected) completed.push('strava');
  else pending.push('strava');

  // Extended profile
  if (profile?.sleep_hours) completed.push('sleep');
  else pending.push('sleep');

  if (profile?.available_days) completed.push('schedule');
  else pending.push('schedule');

  if (profile?.primary_goal) completed.push('goals');
  else pending.push('goals');

  if (profile?.diet_type) completed.push('nutrition');
  else pending.push('nutrition');

  if (profile?.work_type) completed.push('lifestyle');
  else pending.push('lifestyle');

  // Run data
  if (runCount >= 3) completed.push('run_history');
  else pending.push('run_history');

  const completionPercent = Math.round((completed.length / (completed.length + pending.length)) * 100);

  res.json({
    completion_percent: completionPercent,
    completed,
    pending,
    next_question: pending[0] || null,
    has_enough_for_plan: completed.includes('basics') && (runCount >= 1 || completed.includes('strava')),
  });
});

// POST /onboarding/profile — Save progressive profile data
const profileSchema = z.object({
  sleep_hours: z.number().min(3).max(14).optional(),
  sleep_quality: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
  available_days: z.number().min(1).max(7).optional(),
  preferred_time: z.enum(['morning', 'afternoon', 'evening', 'flexible']).optional(),
  primary_goal: z.enum(['weight_loss', 'speed', 'endurance', 'social', 'mental_health', 'race_finish', 'general_fitness']).optional(),
  target_race: z.string().optional(),
  target_race_date: z.string().optional(),
  target_race_distance: z.number().optional(),
  diet_type: z.enum(['vegetarian', 'vegan', 'non_vegetarian', 'eggetarian', 'flexible']).optional(),
  work_type: z.enum(['desk_job', 'standing', 'physical', 'mixed', 'remote']).optional(),
  stress_level: z.enum(['low', 'moderate', 'high', 'very_high']).optional(),
  has_gym_access: z.boolean().optional(),
  has_track_access: z.boolean().optional(),
  has_trail_access: z.boolean().optional(),
  medical_conditions: z.array(z.string()).optional(),
  previous_sports: z.array(z.string()).optional(),
  motivation_style: z.enum(['data_driven', 'social', 'streak_based', 'goal_oriented', 'exploratory']).optional(),
});

router.post('/profile', (req: AuthRequest, res: Response) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid profile data', details: parsed.error.issues });

  const data = parsed.data;
  const existing = db.prepare('SELECT user_id FROM user_profiles WHERE user_id = ?').get(req.userId);

  if (existing) {
    const updates = Object.entries(data)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => `${k} = ?`);
    const values = Object.entries(data)
      .filter(([_, v]) => v !== undefined)
      .map(([_, v]) => Array.isArray(v) ? JSON.stringify(v) : v);

    if (updates.length > 0) {
      db.prepare(`UPDATE user_profiles SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`)
        .run(...values, req.userId);
    }
  } else {
    const fields = ['user_id', ...Object.keys(data).filter(k => (data as any)[k] !== undefined)];
    const values = [req.userId, ...Object.entries(data).filter(([_, v]) => v !== undefined).map(([_, v]) => Array.isArray(v) ? JSON.stringify(v) : v)];
    const placeholders = fields.map(() => '?').join(', ');
    db.prepare(`INSERT INTO user_profiles (${fields.join(', ')}) VALUES (${placeholders})`).run(...values);
  }

  res.json({ message: 'Profile updated', data });
});

// GET /onboarding/profile — Get full extended profile
router.get('/profile', (req: AuthRequest, res: Response) => {
  const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(req.userId) as any;
  if (!profile) return res.json({});

  if (profile.medical_conditions) profile.medical_conditions = JSON.parse(profile.medical_conditions);
  if (profile.previous_sports) profile.previous_sports = JSON.parse(profile.previous_sports);

  res.json(profile);
});

export default router;
