// One-way (Rs.9) AI coach HTTP surface.
//
// The coach is one-way: the runner never sends a message. These endpoints take
// the runner's plan + telemetry and return persona-voiced, grounded coaching.
// Pace zones are derived server-side from the authenticated user's profile (same
// path as /api/coaching), so the coach only ever voices engine-computed numbers.
//
// Live during-run cueing is best run on the device with the same engine
// (server/src/engine/coach is pure TS and can be shared to the client); the
// /run-cues endpoint scores a full or partial telemetry trace statelessly.

import { Router, Response } from 'express';
import db from '../database/pg';
import { authenticate, AuthRequest } from '../middleware/auth';
import { classifyTier } from '../engine/tierClassifier';
import { calculateIdealPace, PaceZones } from '../engine/paceCalculator';
import {
  preRunBrief, runCueStream, postRunReport,
  PERSONAS, Persona, RunSnapshot, PlannedRun, RunnerProfile, RunHistoryItem, analyzeRun,
} from '../engine/coach';

const router = Router();

function asPersona(value: unknown, fallback: string | undefined): Persona {
  const p = (typeof value === 'string' ? value : fallback) || 'energizer';
  return (PERSONAS as string[]).includes(p) ? (p as Persona) : 'energizer';
}

function asPlanned(body: any): PlannedRun {
  const types = ['easy', 'long', 'tempo', 'intervals', 'race'];
  const type = types.includes(body?.type) ? body.type : 'easy';
  return {
    type,
    target_distance_m: Number(body?.target_distance_m) || undefined,
    target_duration_s: Number(body?.target_duration_s) || undefined,
    target_pace_s_per_km: Number(body?.target_pace_s_per_km) || undefined,
  };
}

function asSamples(value: unknown): RunSnapshot[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(s => s && typeof s.t_s === 'number' && typeof s.dist_m === 'number')
    .map(s => ({
      t_s: Number(s.t_s),
      dist_m: Number(s.dist_m),
      cur_pace_s_per_km: s.cur_pace_s_per_km != null ? Number(s.cur_pace_s_per_km) : undefined,
      avg_pace_s_per_km: s.avg_pace_s_per_km != null ? Number(s.avg_pace_s_per_km) : undefined,
      hr: s.hr != null ? Number(s.hr) : undefined,
      cadence: s.cadence != null ? Number(s.cadence) : undefined,
      moving: s.moving !== false,
    }));
}

// Resolve the authenticated user's pace zones + coach profile (one DB round-trip set).
async function resolveContext(userId: number | undefined): Promise<{ zones: PaceZones; profile: RunnerProfile; coachStyle?: string } | null> {
  const user = await db.queryOne('SELECT * FROM users WHERE id = $1', [userId]);
  if (!user) return null;
  const runs = await db.query(
    'SELECT distance_meters, moving_time_seconds, start_date FROM activities WHERE user_id = $1 ORDER BY start_date DESC LIMIT 30',
    [userId]
  );
  const tier = classifyTier(user, runs);
  const zones = calculateIdealPace(user.age, user.gender, user.weight_kg, user.height_cm, user.fitness_level, tier.tier);
  const profile: RunnerProfile = {
    age: user.age, gender: user.gender, max_hr: user.max_hr ?? undefined, level: tier.tier,
  };
  return { zones, profile, coachStyle: user.coach_style };
}

// GET /api/coach/personas — the four selectable coach voices.
router.get('/personas', authenticate, (_req: AuthRequest, res: Response) => {
  res.json({ personas: PERSONAS });
});

// POST /api/coach/pre-run — { type, target_distance_m, target_pace_s_per_km?, persona? }
router.post('/pre-run', authenticate, async (req: AuthRequest, res: Response) => {
  const ctx = await resolveContext(req.userId);
  if (!ctx) return res.status(404).json({ error: 'User not found' });
  const planned = asPlanned(req.body);
  const persona = asPersona(req.body?.persona, ctx.coachStyle);
  // Return zones + profile too, so the client can run the live during-run cue
  // engine on-device (shared/coach) without another round-trip per GPS tick.
  res.json({ persona, brief: preRunBrief(planned, ctx.zones, ctx.profile, persona), zones: ctx.zones, profile: ctx.profile });
});

// POST /api/coach/run-cues — { planned fields, persona?, samples: RunSnapshot[] }
// Returns the timed cue stream for the supplied telemetry trace.
router.post('/run-cues', authenticate, async (req: AuthRequest, res: Response) => {
  const ctx = await resolveContext(req.userId);
  if (!ctx) return res.status(404).json({ error: 'User not found' });
  const planned = asPlanned(req.body);
  const persona = asPersona(req.body?.persona, ctx.coachStyle);
  const samples = asSamples(req.body?.samples);
  res.json({ persona, cues: runCueStream(planned, ctx.zones, ctx.profile, samples, persona) });
});

// POST /api/coach/post-run — { planned fields, persona?, samples, history? }
router.post('/post-run', authenticate, async (req: AuthRequest, res: Response) => {
  const ctx = await resolveContext(req.userId);
  if (!ctx) return res.status(404).json({ error: 'User not found' });
  const planned = asPlanned(req.body);
  const persona = asPersona(req.body?.persona, ctx.coachStyle);
  const samples = asSamples(req.body?.samples);
  const history: RunHistoryItem[] = Array.isArray(req.body?.history)
    ? req.body.history.filter((h: any) => h && typeof h.avg_pace_s_per_km === 'number')
    : [];
  res.json({
    persona,
    report: postRunReport(planned, samples, ctx.profile, history, persona),
    analysis: analyzeRun(planned, samples, history),
  });
});

export default router;
