import { Router, Response } from 'express';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateRunnerDNA, ProfilingInput } from '../engine/ai-profiler';

const router = Router();
router.use(authenticate);

// POST /profiling/generate — generate runner DNA from profiling answers
router.post('/generate', (req: AuthRequest, res: Response) => {
  const { dream_race, running_why, run_feeling, bad_run_response, preferred_time, training_days, recent_5k_time } = req.body;

  // Get user's basic info
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  const input: ProfilingInput = {
    age: user.age,
    gender: user.gender,
    weight_kg: user.weight_kg,
    height_cm: user.height_cm,
    fitness_level: user.fitness_level,
    running_experience: user.running_experience,
    dream_race: dream_race || '',
    running_why: running_why || '',
    run_feeling: run_feeling || '',
    bad_run_response: bad_run_response || '',
    preferred_time: preferred_time || 'morning',
    training_days: training_days || 3,
    recent_5k_time: recent_5k_time || undefined,
  };

  const dna = generateRunnerDNA(input);

  // Store in runner_profiles
  db.prepare(`
    INSERT OR REPLACE INTO runner_profiles (
      user_id, dream_race, dream_race_distance_km, running_why, run_feeling,
      bad_run_response, preferred_time, training_days_per_week, coach_style,
      estimated_vo2max, estimated_5k_time_sec, personality_tags, ai_coach_name,
      profiling_complete, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
  `).run(
    req.userId, dream_race, dna.weekly_volume_km, running_why, run_feeling,
    bad_run_response, preferred_time, training_days, dna.coach_style,
    dna.estimated_vo2max, dna.estimated_5k_sec, JSON.stringify(dna.personality_tags),
    dna.ai_coach_name
  );

  // Also update tier_history
  db.prepare('INSERT INTO tier_history (user_id, tier, estimated_vo2max, score) VALUES (?, ?, ?, ?)').run(
    req.userId, dna.tier, dna.estimated_vo2max, dna.estimated_vo2max
  );

  res.json(dna);
});

// GET /profiling/status — check if profiling is complete
router.get('/status', (req: AuthRequest, res: Response) => {
  const profile = db.prepare('SELECT profiling_complete FROM runner_profiles WHERE user_id = ?').get(req.userId) as any;
  res.json({ complete: !!profile?.profiling_complete });
});

// GET /profiling/dna — get stored runner DNA
router.get('/dna', (req: AuthRequest, res: Response) => {
  const profile = db.prepare('SELECT * FROM runner_profiles WHERE user_id = ?').get(req.userId) as any;
  if (!profile || !profile.profiling_complete) {
    return res.status(404).json({ error: 'Profiling not complete' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as any;
  const input: ProfilingInput = {
    age: user.age, gender: user.gender, weight_kg: user.weight_kg, height_cm: user.height_cm,
    fitness_level: user.fitness_level, running_experience: user.running_experience,
    dream_race: profile.dream_race || '', running_why: profile.running_why || '',
    run_feeling: profile.run_feeling || '', bad_run_response: profile.bad_run_response || '',
    preferred_time: profile.preferred_time || 'morning', training_days: profile.training_days_per_week || 3,
  };

  const dna = generateRunnerDNA(input);
  res.json(dna);
});

export default router;
