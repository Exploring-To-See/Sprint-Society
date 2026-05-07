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
      }
    } catch (err) {
      console.error('Webhook processing error:', err);
    }
  }
});

export default router;
