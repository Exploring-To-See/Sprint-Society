import { Router, Request, Response } from 'express';
import db from '../database/db';
import { config } from '../config';
import { authenticate, AuthRequest } from '../middleware/auth';
import * as stravaService from '../services/strava.service';

const router = Router();

router.get('/auth', authenticate, (req: AuthRequest, res: Response) => {
  const state = String(req.userId);
  const url = stravaService.getAuthorizeUrl(state);
  res.json({ url });
});

router.post('/callback', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Authorization code required' });

    const data = await stravaService.exchangeCode(code);

    db.prepare(`
      INSERT OR REPLACE INTO strava_tokens (user_id, strava_athlete_id, access_token, refresh_token, expires_at, scope)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.userId, data.athlete.id, data.access_token, data.refresh_token, data.expires_at, 'read,activity:read_all');

    const synced = await stravaService.syncRecentActivities(req.userId!);
    res.json({ success: true, athlete: data.athlete, activities_synced: synced });
  } catch (err: any) {
    console.error('Strava callback error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to connect Strava' });
  }
});

router.get('/status', authenticate, (req: AuthRequest, res: Response) => {
  const token = db.prepare('SELECT strava_athlete_id, expires_at FROM strava_tokens WHERE user_id = ?').get(req.userId) as any;
  if (!token) {
    return res.json({ connected: false });
  }
  res.json({ connected: true, athlete_id: token.strava_athlete_id });
});

router.post('/sync', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const synced = await stravaService.syncRecentActivities(req.userId!);
    res.json({ success: true, activities_synced: synced });
  } catch (err: any) {
    res.status(500).json({ error: 'Sync failed' });
  }
});

router.delete('/disconnect', authenticate, (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM strava_tokens WHERE user_id = ?').run(req.userId);
  res.json({ success: true });
});

router.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.strava.webhookVerifyToken) {
    res.json({ 'hub.challenge': challenge });
  } else {
    res.status(403).json({ error: 'Verification failed' });
  }
});

router.post('/webhook', async (req: Request, res: Response) => {
  const { object_type, aspect_type, object_id, owner_id } = req.body;

  res.status(200).send('OK');

  if (object_type === 'activity' && aspect_type === 'create') {
    try {
      const token = db.prepare('SELECT user_id FROM strava_tokens WHERE strava_athlete_id = ?').get(owner_id) as any;
      if (!token) return;

      const activity = await stravaService.fetchActivity(token.user_id, object_id);
      if (activity.type === 'Run') {
        stravaService.storeActivity(token.user_id, activity);
        autoProcessActivity(token.user_id);
      }
    } catch (err) {
      console.error('Webhook processing error:', err);
    }
  }
});

function autoProcessActivity(userId: number) {
  try {
    const { processNewActivity } = require('../engine/autoDetection');

    const latestActivity = db.prepare(
      `SELECT * FROM activities WHERE user_id = ? ORDER BY start_date DESC LIMIT 1`
    ).get(userId) as any;
    if (!latestActivity) return;

    // Get current week's planned sessions
    const plan = db.prepare(
      `SELECT plan_data, generated_at FROM transformation_plans WHERE user_id = ? ORDER BY generated_at DESC LIMIT 1`
    ).get(userId) as any;

    let weekSessions: any[] = [];
    if (plan?.plan_data) {
      const planData = JSON.parse(plan.plan_data);
      const weeksSinceStart = Math.floor((Date.now() - new Date(plan.generated_at).getTime()) / (7 * 86400000));
      const currentWeek = planData.weeks?.[Math.min(weeksSinceStart, (planData.weeks?.length || 1) - 1)];
      weekSessions = currentWeek?.sessions || [];
    }

    // Get active challenges
    const challenges = db.prepare(
      `SELECT * FROM challenges WHERE user_id = ? AND completed = 0`
    ).all(userId) as any[];

    // Get recent activities for challenge checking
    const recentActivities = db.prepare(
      `SELECT * FROM activities WHERE user_id = ? AND start_date > datetime('now', '-7 days') ORDER BY start_date DESC`
    ).all(userId) as any[];

    const result = processNewActivity(latestActivity, weekSessions, challenges, recentActivities);

    // Award XP
    if (result.xp_earned > 0) {
      const xp = db.prepare('SELECT * FROM user_xp WHERE user_id = ?').get(userId) as any;
      if (xp) {
        db.prepare('UPDATE user_xp SET total_xp = total_xp + ?, last_activity_date = date("now") WHERE user_id = ?')
          .run(result.xp_earned, userId);
        db.prepare('INSERT INTO xp_transactions (user_id, amount, source, description) VALUES (?, ?, ?, ?)')
          .run(userId, result.xp_earned, 'auto_run_sync', result.summary);
      }
    }

    // Auto-complete challenges
    for (const challengeId of result.challenges_completed) {
      db.prepare('UPDATE challenges SET completed = 1, completed_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?')
        .run(challengeId, userId);
    }

    // Update streak
    const lastActivityDate = db.prepare('SELECT last_activity_date FROM user_xp WHERE user_id = ?').get(userId) as any;
    if (lastActivityDate) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];
      if (lastActivityDate.last_activity_date === yesterday || lastActivityDate.last_activity_date === today) {
        db.prepare('UPDATE user_xp SET current_streak_days = current_streak_days + 1 WHERE user_id = ? AND last_activity_date != ?')
          .run(userId, today);
      } else if (lastActivityDate.last_activity_date !== today) {
        db.prepare('UPDATE user_xp SET current_streak_days = 1 WHERE user_id = ?').run(userId);
      }
      db.prepare('UPDATE user_xp SET longest_streak_days = MAX(longest_streak_days, current_streak_days) WHERE user_id = ?').run(userId);
    }
  } catch (err) {
    console.error('[AutoProcess] Error:', err);
  }
}

export default router;
