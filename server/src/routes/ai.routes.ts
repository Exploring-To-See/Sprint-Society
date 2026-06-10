import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import db from '../database/db';
import {
  getAIProfile,
  updateAIProfile,
  evaluateTrainingWithHaiku,
  getTodayUsage,
  checkUsageLimit,
} from '../services/ai.service';

const router = Router();
router.use(authenticate);

// GET /api/ai/status — check if AI features are available
router.get('/status', (req: AuthRequest, res: Response) => {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  const subscription = db.prepare(`
    SELECT plan_key FROM user_subscriptions
    WHERE user_id = ? AND status = 'active' AND expires_at > datetime('now')
    ORDER BY created_at DESC LIMIT 1
  `).get(req.userId!) as any;

  const planKey = subscription?.plan_key || 'free';
  res.json({
    available: hasApiKey,
    chat_enabled: hasApiKey && planKey !== 'free',
    plan: planKey,
    message: hasApiKey ? undefined : 'AI Coach is coming soon. We\'re finalizing the setup — you\'ll be the first to know!',
  });
});

// GET /api/ai/daily-insight — rule-based coaching insight (no API key needed)
router.get('/daily-insight', (req: AuthRequest, res: Response) => {
  const user = db.prepare(`
    SELECT u.*, ux.total_xp, ux.current_level, ux.current_streak_days
    FROM users u LEFT JOIN user_xp ux ON u.id = ux.user_id WHERE u.id = ?
  `).get(req.userId!) as any;

  if (!user) return res.status(404).json({ error: 'User not found' });

  const recentRuns = db.prepare(`
    SELECT distance_meters, moving_time_seconds, average_pace_per_km, start_date
    FROM activities WHERE user_id = ? ORDER BY start_date DESC LIMIT 7
  `).all(req.userId!) as any[];

  const streak = user.current_streak_days || 0;
  const runsThisWeek = recentRuns.filter((r: any) => {
    const runDate = new Date(r.start_date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return runDate >= weekAgo;
  });

  const totalKmThisWeek = runsThisWeek.reduce((s: number, r: any) => s + (r.distance_meters / 1000), 0);
  const avgPace = runsThisWeek.length > 0
    ? runsThisWeek.reduce((s: number, r: any) => s + (r.average_pace_per_km || 0), 0) / runsThisWeek.length
    : 0;

  let insight = '';
  let type: 'motivation' | 'recovery' | 'progress' | 'challenge' = 'motivation';

  if (runsThisWeek.length === 0 && streak === 0) {
    insight = 'Ready to start? Even a 10-minute walk counts. Your body is built to move.';
    type = 'motivation';
  } else if (streak >= 7) {
    insight = `${streak}-day streak! Consistency is building your aerobic base. Keep showing up.`;
    type = 'progress';
  } else if (runsThisWeek.length >= 5) {
    insight = 'High training load this week. Consider an easy day or rest — recovery is where gains happen.';
    type = 'recovery';
  } else if (runsThisWeek.length >= 3) {
    insight = `Solid week — ${totalKmThisWeek.toFixed(1)}km logged. You're building momentum.`;
    type = 'progress';
  } else if (runsThisWeek.length >= 1) {
    insight = `${runsThisWeek.length} run this week. Can you fit one more? Aim for every other day.`;
    type = 'challenge';
  } else if (streak > 0) {
    insight = `${streak}-day streak alive! Don't break it — even a short easy run counts.`;
    type = 'motivation';
  } else {
    insight = 'Your next run doesn\'t have to be fast or long. Just get out there.';
    type = 'motivation';
  }

  res.json({ insight, type, runs_this_week: runsThisWeek.length, km_this_week: Math.round(totalKmThisWeek * 10) / 10, streak });
});

// GET /api/ai/profile — get user's AI profile (for My AI Profile page)
router.get('/profile', (req: AuthRequest, res: Response) => {
  try {
    const profile = getAIProfile(req.userId!);
    res.json(profile);
  } catch (err: any) {
    console.error('[AI Routes] Get profile error:', err.message);
    res.status(500).json({ error: 'Failed to load AI profile' });
  }
});

// PATCH /api/ai/profile — update a field in their profile
router.patch('/profile', (req: AuthRequest, res: Response) => {
  const { field, value } = req.body;

  if (!field || value === undefined) {
    return res.status(400).json({ error: 'Missing field or value' });
  }

  try {
    const success = updateAIProfile(req.userId!, field, value);
    if (!success) {
      return res.status(400).json({ error: 'Invalid field. Allowed: health_notes, goals, diet_preferences, personal_context' });
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error('[AI Routes] Update profile error:', err.message);
    res.status(500).json({ error: 'Failed to update AI profile' });
  }
});

// NOTE: Chat endpoint consolidated into /api/chat/message (chat.routes.ts)
// Use /api/chat/message for all AI chat interactions

// POST /api/ai/evaluate — trigger background Haiku evaluation (called after run sync)
router.post('/evaluate', async (req: AuthRequest, res: Response) => {
  try {
    const result = await evaluateTrainingWithHaiku(req.userId!);

    if (result.error) {
      return res.status(503).json({ error: result.error });
    }

    res.json(result);
  } catch (err: any) {
    console.error('[AI Routes] Evaluate error:', err.message);
    res.status(500).json({ error: 'Evaluation failed — try again later.' });
  }
});

// GET /api/ai/usage — get user's AI usage stats for today
router.get('/usage', (req: AuthRequest, res: Response) => {
  try {
    const usage = getTodayUsage(req.userId!);

    // Determine their tier
    const subscription = db.prepare(`
      SELECT plan_key FROM user_subscriptions
      WHERE user_id = ? AND status = 'active' AND expires_at > datetime('now')
      ORDER BY created_at DESC LIMIT 1
    `).get(req.userId!) as any;

    const planKey = subscription?.plan_key || 'free';
    const tier = (planKey === 'pro' || planKey === 'premium') ? 'pro' : 'base';
    const limits = checkUsageLimit(req.userId!, tier);

    res.json({
      ...usage,
      chat_limit: limits.limit,
      chat_remaining: limits.limit - limits.used,
      tier,
    });
  } catch (err: any) {
    console.error('[AI Routes] Usage error:', err.message);
    res.status(500).json({ error: 'Failed to load usage stats' });
  }
});

export default router;
