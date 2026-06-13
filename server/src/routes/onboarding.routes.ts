import { Router, Response } from 'express';
import { z } from 'zod';
import db from '../database/pg';
import { authenticate, AuthRequest } from '../middleware/auth';
import { detectRunnerProfile } from '../engine/autoDetection';

const router = Router();
router.use(authenticate);

// GET /onboarding/status — Smart status that tells frontend exactly what to show
router.get('/status', async (req: AuthRequest, res: Response) => {
  const user = await db.queryOne('SELECT * FROM users WHERE id = $1', [req.userId]) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  const runCount = (await db.queryOne('SELECT COUNT(*) as c FROM activities WHERE user_id = $1', [req.userId]) as any).c;
  const profile = await db.queryOne('SELECT * FROM user_profiles WHERE user_id = $1', [req.userId]) as any;
  const hasPlan = !!(await db.queryOne('SELECT id FROM transformation_plans WHERE user_id = $1 LIMIT 1', [req.userId]));

  // Determine what step the user is at
  let step: 'track_run' | 'analyzing' | 'smart_questions' | 'generating_plan' | 'complete';

  if (runCount === 0) {
    step = 'track_run';
  } else if (runCount > 0 && !profile?.primary_goal) {
    step = 'smart_questions'; // Have data, need goals/preferences
  } else if (runCount > 0 && profile?.primary_goal && !hasPlan) {
    step = 'generating_plan';
  } else {
    step = 'complete';
  }

  // Auto-detect runner profile from existing data
  let detectedProfile = null;
  if (runCount > 0) {
    const runs = await db.query(
      `SELECT distance_meters, moving_time_seconds, average_pace_per_km, average_heartrate, start_date
       FROM activities WHERE user_id = $1 ORDER BY start_date DESC LIMIT 50`,
      [req.userId]
    ) as any[];
    detectedProfile = detectRunnerProfile(runs);
  }

  res.json({
    step,
    run_count: runCount,
    has_plan: hasPlan,
    detected_profile: detectedProfile,
    profile_complete: !!(profile?.primary_goal && profile?.available_days),
  });
});

// GET /onboarding/detect — Auto-detect runner profile from activity data
router.get('/detect', async (req: AuthRequest, res: Response) => {
  const runs = await db.query(
    `SELECT id, user_id, distance_meters, moving_time_seconds, average_pace_per_km, average_heartrate, max_heartrate, elevation_gain, start_date
     FROM activities WHERE user_id = $1 ORDER BY start_date DESC LIMIT 100`,
    [req.userId]
  ) as any[];

  if (runs.length === 0) {
    return res.json({
      has_data: false,
      message: 'No run data yet. Use the GPS tracker to log your first run.',
    });
  }

  const profile = detectRunnerProfile(runs);

  res.json({
    has_data: true,
    profile,
    data_summary: {
      total_runs: runs.length,
      first_run_date: runs[runs.length - 1]?.start_date,
      last_run_date: runs[0]?.start_date,
      data_span_days: Math.round((Date.now() - new Date(runs[runs.length - 1]?.start_date).getTime()) / 86400000),
    },
  });
});

// POST /onboarding/smart-profile — Only ask what data CAN'T tell us
const smartProfileSchema = z.object({
  // Goal — only the AI can't guess
  primary_goal: z.enum(['speed', 'endurance', 'weight_loss', 'race_finish', 'consistency', 'general_fitness']),

  // Schedule — data shows WHEN you run, but not when you WANT to run
  available_days: z.number().min(2).max(7),
  preferred_time: z.enum(['morning', 'afternoon', 'evening', 'flexible']).optional(),

  // Race goal (optional but powerful)
  target_race_distance: z.number().optional(), // meters
  target_race_date: z.string().optional(),

  // Injury — critical, can't be detected
  current_injuries: z.array(z.string()).optional(),

  // Lifestyle — affects recovery/plan
  work_type: z.enum(['desk_job', 'standing', 'physical', 'mixed']).optional(),
  sleep_hours: z.number().min(3).max(12).optional(),
});

router.post('/smart-profile', async (req: AuthRequest, res: Response) => {
  const parsed = smartProfileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid data', details: parsed.error.issues });

  const data = parsed.data;
  const existing = await db.queryOne('SELECT user_id FROM user_profiles WHERE user_id = $1', [req.userId]);

  const fields: Record<string, any> = {
    primary_goal: data.primary_goal,
    available_days: data.available_days,
    preferred_time: data.preferred_time || 'flexible',
    target_race_distance: data.target_race_distance,
    target_race_date: data.target_race_date,
    medical_conditions: JSON.stringify(data.current_injuries || []),
    work_type: data.work_type,
    sleep_hours: data.sleep_hours,
  };

  if (existing) {
    const definedEntries = Object.entries(fields).filter(([_, v]) => v !== undefined);
    const setClauses = definedEntries.map(([k], i) => `${k} = $${i + 1}`).join(', ');
    const values = definedEntries.map(([_, v]) => v);
    await db.execute(
      `UPDATE user_profiles SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE user_id = $${values.length + 1}`,
      [...values, req.userId]
    );
  } else {
    const definedFields = Object.entries(fields).filter(([_, v]) => v !== undefined);
    const cols = ['user_id', ...definedFields.map(([k]) => k)].join(', ');
    const placeholders = Array.from({ length: definedFields.length + 1 }, (_, i) => `$${i + 1}`).join(', ');
    const values = [req.userId, ...definedFields.map(([_, v]) => v)];
    await db.execute(`INSERT INTO user_profiles (${cols}) VALUES (${placeholders})`, values);
  }

  // Auto-update user's running_experience based on detected profile
  const runs = await db.query(
    `SELECT distance_meters, moving_time_seconds, average_pace_per_km, average_heartrate, start_date
     FROM activities WHERE user_id = $1 ORDER BY start_date DESC LIMIT 50`,
    [req.userId]
  ) as any[];

  if (runs.length > 0) {
    const detected = detectRunnerProfile(runs);
    if (detected.estimated_level !== 'none') {
      await db.execute('UPDATE users SET running_experience = $1 WHERE id = $2', [detected.estimated_level, req.userId]);
    }
  }

  res.json({ message: 'Profile saved. Your plan is being generated.' });
});

// Legacy endpoint kept for backward compatibility
router.get('/profile', async (req: AuthRequest, res: Response) => {
  const profile = await db.queryOne('SELECT * FROM user_profiles WHERE user_id = $1', [req.userId]) as any;
  if (!profile) return res.json({});
  if (profile.medical_conditions) profile.medical_conditions = JSON.parse(profile.medical_conditions);
  if (profile.previous_sports) profile.previous_sports = JSON.parse(profile.previous_sports);
  res.json(profile);
});

router.post('/profile', (req: AuthRequest, res: Response) => {
  // Redirect to smart-profile
  const smartProfileHandler = router.stack.find(r => r.route?.path === '/smart-profile');
  if (smartProfileHandler) {
    return res.redirect(307, '/api/onboarding/smart-profile');
  }
  res.status(400).json({ error: 'Use /api/onboarding/smart-profile instead' });
});

export default router;
