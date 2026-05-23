import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import db from '../database/db';
import {
  getAIProfile,
  updateAIProfile,
  chatWithSonnet,
  evaluateTrainingWithHaiku,
  getTodayUsage,
  checkUsageLimit,
} from '../services/ai.service';

const router = Router();
router.use(authenticate);

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

// POST /api/ai/chat — send a message to Sonnet coach
router.post('/chat', async (req: AuthRequest, res: Response) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (message.length > 2000) {
    return res.status(400).json({ error: 'Message too long (max 2000 characters)' });
  }

  // Check subscription tier — only pro/premium get AI chat
  const subscription = db.prepare(`
    SELECT plan_key FROM user_subscriptions
    WHERE user_id = ? AND status = 'active' AND expires_at > datetime('now')
    ORDER BY created_at DESC LIMIT 1
  `).get(req.userId!) as any;

  const planKey = subscription?.plan_key || 'free';
  if (planKey === 'free') {
    return res.status(403).json({
      error: 'AI coaching requires a Pro or Premium subscription.',
      upgrade_required: true,
    });
  }

  // Get recent chat messages for context
  const recentMessages = db.prepare(`
    SELECT role, content FROM chat_messages
    WHERE user_id = ? ORDER BY created_at DESC LIMIT 10
  `).all(req.userId!) as any[];

  // Reverse to get chronological order
  recentMessages.reverse();

  try {
    const result = await chatWithSonnet(req.userId!, message.trim(), recentMessages);

    if (result.error === 'limit_reached') {
      return res.status(429).json({ error: result.response, limit_reached: true });
    }

    if (result.error === 'api_error') {
      return res.status(503).json({ error: result.response });
    }

    // Store messages in chat history
    const insertMsg = db.prepare('INSERT INTO chat_messages (user_id, role, content) VALUES (?, ?, ?)');
    insertMsg.run(req.userId!, 'user', message.trim());
    insertMsg.run(req.userId!, 'assistant', result.response);

    res.json({ response: result.response });
  } catch (err: any) {
    console.error('[AI Routes] Chat error:', err.message);
    res.status(500).json({ error: 'Coach had a moment — please try again.' });
  }
});

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
