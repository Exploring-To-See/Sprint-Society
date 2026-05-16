import { Router, Response } from 'express';
import { z } from 'zod';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { detectRunnerProfile } from '../engine/autoDetection';

const router = Router();
router.use(authenticate);

// GET /onboarding/status — Smart status that tells frontend exactly what to show
router.get('/status', (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  const stravaConnected = !!db.prepare('SELECT id FROM strava_tokens WHERE user_id = ?').get(req.userId);
  const runCount = (db.prepare('SELECT COUNT(*) as c FROM activities WHERE user_id = ?').get(req.userId) as any).c;
  const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(req.userId) as any;
  const hasPlan = !!db.prepare('SELECT id FROM transformation_plans WHERE user_id = ? LIMIT 1').get(req.userId);

  // Determine what step the user is at
  let step: 'connect_strava' | 'analyzing' | 'smart_questions' | 'generating_plan' | 'complete';

  if (!stravaConnected && runCount === 0) {
    step = 'connect_strava';
  } else if (stravaConnected && runCount === 0) {
    step = 'analyzing'; // Strava connected but no sync yet
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
    const runs = db.prepare(
      `SELECT distance_meters, moving_time_seconds, average_pace_per_km, average_heartrate, start_date
       FROM activities WHERE user_id = ? ORDER BY start_date DESC LIMIT 50`
    ).all(req.userId) as any[];
    detectedProfile = detectRunnerProfile(runs);
  }

  res.json({
    step,
    strava_connected: stravaConnected,
    run_count: runCount,
    has_plan: hasPlan,
    detected_profile: detectedProfile,
    profile_complete: !!(profile?.primary_goal && profile?.available_days),
  });
});

// GET /onboarding/detect — Auto-detect everything from Strava data
router.get('/detect', (req: AuthRequest, res: Response) => {
  const runs = db.prepare(
    `SELECT id, user_id, distance_meters, moving_time_seconds, average_pace_per_km, average_heartrate, max_heartrate, elevation_gain, start_date
     FROM activities WHERE user_id = ? ORDER BY start_date DESC LIMIT 100`
  ).all(req.userId) as any[];

  if (runs.length === 0) {
    return res.json({
      has_data: false,
      message: 'No run data yet. Connect Strava or complete your first run.',
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

router.post('/smart-profile', (req: AuthRequest, res: Response) => {
  const parsed = smartProfileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid data', details: parsed.error.issues });

  const data = parsed.data;
  const existing = db.prepare('SELECT user_id FROM user_profiles WHERE user_id = ?').get(req.userId);

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
    const updates = Object.entries(fields)
      .filter(([_, v]) => v !== undefined)
      .map(([k]) => `${k} = ?`).join(', ');
    const values = Object.entries(fields)
      .filter(([_, v]) => v !== undefined)
      .map(([_, v]) => v);
    db.prepare(`UPDATE user_profiles SET ${updates}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`)
      .run(...values, req.userId);
  } else {
    const definedFields = Object.entries(fields).filter(([_, v]) => v !== undefined);
    const cols = ['user_id', ...definedFields.map(([k]) => k)].join(', ');
    const placeholders = ['?', ...definedFields.map(() => '?')].join(', ');
    const values = [req.userId, ...definedFields.map(([_, v]) => v)];
    db.prepare(`INSERT INTO user_profiles (${cols}) VALUES (${placeholders})`).run(...values);
  }

  // Auto-update user's running_experience based on detected profile
  const runs = db.prepare(
    `SELECT distance_meters, moving_time_seconds, average_pace_per_km, average_heartrate, start_date
     FROM activities WHERE user_id = ? ORDER BY start_date DESC LIMIT 50`
  ).all(req.userId) as any[];

  if (runs.length > 0) {
    const detected = detectRunnerProfile(runs);
    if (detected.estimated_level !== 'none') {
      db.prepare('UPDATE users SET running_experience = ? WHERE id = ?').run(detected.estimated_level, req.userId);
    }
  }

  res.json({ message: 'Profile saved. Your plan is being generated.' });
});

// Legacy endpoint kept for backward compatibility
router.get('/profile', (req: AuthRequest, res: Response) => {
  const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(req.userId) as any;
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
