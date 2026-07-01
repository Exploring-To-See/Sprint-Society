// First-party product analytics ingest from the client (page views + events).
// Distinct from admin-analytics (which is admin-gated and read/aggregate-only).
// Consent-gated on the client (lib/consent); tied to the authenticated user here.
import { Router, Response } from 'express';
import db from '../database/pg';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/analytics/track — record one event. Body: { event_name, event_type?, properties?, session_id? }
router.post('/track', authenticate, async (req: AuthRequest, res: Response) => {
  const { event_type, event_name, properties, session_id } = req.body || {};
  if (!event_name || typeof event_name !== 'string') {
    return res.status(400).json({ error: 'event_name required' });
  }
  await db.execute(
    `INSERT INTO analytics_events (user_id, event_type, event_name, properties, session_id) VALUES ($1, $2, $3, $4, $5)`,
    [
      req.userId || null,
      String(event_type || 'app').slice(0, 40),
      event_name.slice(0, 80),
      properties && typeof properties === 'object' ? JSON.stringify(properties).slice(0, 2000) : '{}',
      session_id ? String(session_id).slice(0, 64) : null,
    ]
  );
  res.status(201).json({ success: true });
});

export default router;
