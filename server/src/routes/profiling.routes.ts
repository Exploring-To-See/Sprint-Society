import { Router, Response } from 'express';
import db from '../database/pg';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateRunnerDNA, ProfilingInput } from '../engine/ai-profiler';
import {
  normalizePerformance, normalizeVolume, normalizeConsistency,
  normalizeRecovery, normalizeVO2max, normalizePaceCompliance,
  calculateRunnerLevel, checkSafetyRails, tierDisplayName,
} from '../engine/classification-engine';
import type { Gender, BestTimes, RecoveryData, CalibrationInput } from '../engine/classification-engine';

const router = Router();
router.use(authenticate);

// POST /profiling/generate — generate runner DNA from profiling answers
router.post('/generate', async (req: AuthRequest, res: Response) => {
  const { dream_race, running_why, run_feeling, bad_run_response, preferred_time, training_days, recent_5k_time } = req.body;

  // Get user's basic info
  const user = await db.queryOne('SELECT * FROM users WHERE id = $1', [req.userId]) as any;
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
  await db.execute(`
    INSERT INTO runner_profiles (
      user_id, dream_race, dream_race_distance_km, running_why, run_feeling,
      bad_run_response, preferred_time, training_days_per_week, coach_style,
      estimated_vo2max, estimated_5k_time_sec, personality_tags, ai_coach_name,
      profiling_complete, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 1, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id) DO UPDATE SET
      dream_race = EXCLUDED.dream_race, dream_race_distance_km = EXCLUDED.dream_race_distance_km,
      running_why = EXCLUDED.running_why, run_feeling = EXCLUDED.run_feeling,
      bad_run_response = EXCLUDED.bad_run_response, preferred_time = EXCLUDED.preferred_time,
      training_days_per_week = EXCLUDED.training_days_per_week, coach_style = EXCLUDED.coach_style,
      estimated_vo2max = EXCLUDED.estimated_vo2max, estimated_5k_time_sec = EXCLUDED.estimated_5k_time_sec,
      personality_tags = EXCLUDED.personality_tags, ai_coach_name = EXCLUDED.ai_coach_name,
      profiling_complete = 1, updated_at = CURRENT_TIMESTAMP
  `, [
    req.userId, dream_race, dna.weekly_volume_km, running_why, run_feeling,
    bad_run_response, preferred_time, training_days, dna.coach_style,
    dna.estimated_vo2max, dna.estimated_5k_sec, JSON.stringify(dna.personality_tags),
    dna.ai_coach_name
  ]);

  // Also update tier_history
  await db.execute('INSERT INTO tier_history (user_id, tier, estimated_vo2max, score) VALUES ($1, $2, $3, $4)', [
    req.userId, dna.tier, dna.estimated_vo2max, dna.estimated_vo2max
  ]);

  res.json(dna);
});

// GET /profiling/status — check if profiling is complete
router.get('/status', async (req: AuthRequest, res: Response) => {
  const profile = await db.queryOne('SELECT profiling_complete FROM runner_profiles WHERE user_id = $1', [req.userId]) as any;
  res.json({ complete: !!profile?.profiling_complete });
});

// GET /profiling/dna — get stored runner DNA
router.get('/dna', async (req: AuthRequest, res: Response) => {
  const profile = await db.queryOne('SELECT * FROM runner_profiles WHERE user_id = $1', [req.userId]) as any;
  if (!profile || !profile.profiling_complete) {
    return res.status(404).json({ error: 'Profiling not complete' });
  }

  const user = await db.queryOne('SELECT * FROM users WHERE id = $1', [req.userId]) as any;
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

// PUT /profiling/coach — switch AI coach
router.put('/coach', async (req: AuthRequest, res: Response) => {
  const { ai_coach_name } = req.body;
  const validCoaches = ['The Scientist', 'The Energizer', 'The Warrior', 'The Sage'];

  if (!ai_coach_name || !validCoaches.includes(ai_coach_name)) {
    return res.status(400).json({ error: 'Invalid coach. Choose: ' + validCoaches.join(', ') });
  }

  const existing = await db.queryOne('SELECT id FROM runner_profiles WHERE user_id = $1', [req.userId]) as any;
  if (existing) {
    await db.execute('UPDATE runner_profiles SET ai_coach_name = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2', [ai_coach_name, req.userId]);
  } else {
    await db.execute('INSERT INTO runner_profiles (user_id, ai_coach_name, profiling_complete) VALUES ($1, $2, 0)', [req.userId, ai_coach_name]);
  }

  res.json({ success: true, ai_coach_name });
});

// GET /profiling/classification — get current V2 classification level
router.get('/classification', async (req: AuthRequest, res: Response) => {
  const user = await db.queryOne('SELECT * FROM users WHERE id = $1', [req.userId]) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  const profile = await db.queryOne('SELECT * FROM runner_profiles WHERE user_id = $1', [req.userId]) as any;

  // Get run data for performance + volume + consistency
  const runs = await db.query(`
    SELECT distance_meters, moving_time_seconds, average_pace_per_km, average_heartrate, start_date
    FROM activities WHERE user_id = $1 ORDER BY start_date DESC LIMIT 50
  `, [req.userId]) as any[];

  // Best times from PRs
  const prs = await db.query('SELECT category, value FROM personal_records WHERE user_id = $1', [req.userId]) as any[];
  const bestTimes: BestTimes = {};
  for (const pr of prs) {
    if (pr.category === '5k') bestTimes.fiveK = pr.value;
    else if (pr.category === '10k') bestTimes.tenK = pr.value;
    else if (pr.category === 'half_marathon') bestTimes.halfM = pr.value;
    else if (pr.category === 'marathon') bestTimes.marathon = pr.value;
  }

  // If no PR but has runs, estimate 5K from best pace
  if (!bestTimes.fiveK && runs.length > 0) {
    const bestPace = Math.min(...runs.filter(r => r.distance_meters >= 3000).map(r => r.average_pace_per_km || 999));
    if (bestPace < 999) bestTimes.fiveK = Math.round(bestPace * 5);
  }

  // Calculate volume (avg weekly km over last 4 weeks)
  const fourWeeksAgo = new Date(Date.now() - 28 * 86400000).toISOString();
  const recentRuns = runs.filter(r => r.start_date >= fourWeeksAgo);
  const totalDistanceLast4Weeks = recentRuns.reduce((s, r) => s + (r.distance_meters || 0), 0) / 1000;
  const avgWeeklyKm = totalDistanceLast4Weeks / 4;

  // Consistency: how many of last 12 weeks had runs
  const twelveWeeksAgo = new Date(Date.now() - 84 * 86400000).toISOString();
  const allRecentRuns = await db.query('SELECT start_date FROM activities WHERE user_id = $1 AND start_date >= $2', [req.userId, twelveWeeksAgo]) as any[];
  const activeWeeks = new Set(allRecentRuns.map(r => {
    const d = new Date(r.start_date);
    return `${d.getFullYear()}-W${Math.ceil((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 604800000)}`;
  })).size;

  // Recovery: rest days from activity pattern
  const runDatesLast4Weeks = recentRuns.map(r => new Date(r.start_date).toDateString());
  const uniqueRunDays = new Set(runDatesLast4Weeks).size;
  const avgRestDaysPerWeek = Math.max(0, 7 - (uniqueRunDays / 4));

  const recoveryData: RecoveryData = {
    avgRestDaysPerWeek,
    avgRPE: undefined,
    avgSleepHours: undefined,
  };

  // VO2max from profile or estimation
  const vo2max = profile?.estimated_vo2max || (bestTimes.fiveK ? (120.8 - 3.12 * (bestTimes.fiveK / 60) + 0.032 * Math.pow(bestTimes.fiveK / 60, 2)) : 35);

  // Platform age
  const createdAt = new Date(user.created_at || Date.now());
  const totalWeeksOnPlatform = Math.max(1, Math.round((Date.now() - createdAt.getTime()) / 604800000));

  // Detect if user has verified race results (Strava race activities or manual race PRs)
  const raceActivity = await db.queryOne(
    `SELECT id FROM activities WHERE user_id = $1 AND workout_type = 1 LIMIT 1`,
    [req.userId]
  ) as any;
  const hasRaceResult = !!raceActivity || prs.some((pr: any) => pr.source === 'race');

  // Normalize all factors
  const gender: Gender = user.gender === 'female' ? 'female' : 'male';
  const performanceScore = normalizePerformance(bestTimes, user.age || 25, gender);
  const volumeScore = normalizeVolume(avgWeeklyKm, gender);
  const consistencyScore = normalizeConsistency(activeWeeks, totalWeeksOnPlatform);
  const recoveryScore = normalizeRecovery(recoveryData);
  const vo2maxScore = normalizeVO2max(vo2max, gender, profile?.updated_at ? new Date(profile.updated_at) : undefined);
  const complianceScore = 20; // Neutral until we have prescribed zone data

  const factors = {
    performance: performanceScore,
    volume: volumeScore,
    consistency: consistencyScore,
    recovery: recoveryScore,
    vo2max: vo2maxScore,
    paceCompliance: complianceScore,
  };

  const calibration: CalibrationInput = {
    weeksOnPlatform: totalWeeksOnPlatform,
    hasRaceResult,
  };

  const level = calculateRunnerLevel(factors, calibration);

  // Safety rails
  const acuteLoad = recentRuns.filter(r => {
    const d = new Date(r.start_date);
    return d.getTime() > Date.now() - 7 * 86400000;
  }).reduce((s, r) => s + r.distance_meters / 1000, 0);
  const chronicLoad = totalDistanceLast4Weeks / 4;

  const safetyStatus = checkSafetyRails({
    acuteLoad7day: acuteLoad,
    chronicLoad28day: chronicLoad,
    currentWeekVolume: acuteLoad,
    avg4WeekVolume: chronicLoad,
    weeksSinceLastRun: runs.length > 0 ? Math.round((Date.now() - new Date(runs[0].start_date).getTime()) / 604800000) : 52,
  });

  // Next level requirements (simplified)
  const nextLevel = level.rawScore < 40 ? Math.ceil(level.rawScore) + 1 : 40;
  const currentPerf = bestTimes.fiveK ? Math.round(bestTimes.fiveK / 60) + ':' + (bestTimes.fiveK % 60).toString().padStart(2, '0') : 'No race data';

  res.json({
    tier: level.tier,
    tierName: tierDisplayName(level.tier),
    subLevel: level.subLevel,
    rawScore: Math.round(level.rawScore * 100) / 100,
    status: level.status,
    statusLabel: level.status === 'calibrating'
      ? `Calibrating (${3 - totalWeeksOnPlatform} week${3 - totalWeeksOnPlatform === 1 ? '' : 's'} remaining)`
      : level.status === 'validated' ? 'Validated (Race verified)' : 'Provisional (Training data only)',
    display: `${tierDisplayName(level.tier)} ${level.subLevel}`,
    factors: {
      performance: Math.round(performanceScore * 10) / 10,
      volume: Math.round(volumeScore * 10) / 10,
      consistency: Math.round(consistencyScore * 10) / 10,
      recovery: Math.round(recoveryScore * 10) / 10,
      vo2max: Math.round(vo2maxScore * 10) / 10,
      paceCompliance: Math.round(complianceScore * 10) / 10,
    },
    safetyRails: safetyStatus,
    stats: {
      avgWeeklyKm: Math.round(avgWeeklyKm * 10) / 10,
      activeWeeksLast12: activeWeeks,
      totalRuns: runs.length,
      bestFiveK: bestTimes.fiveK,
      vo2max: Math.round(vo2max * 10) / 10,
    },
    nextMilestone: {
      targetLevel: nextLevel,
      currentPerformance: currentPerf,
      weeklyKmNeeded: Math.round((avgWeeklyKm * 1.1) * 10) / 10,
    },
  });
});

export default router;
