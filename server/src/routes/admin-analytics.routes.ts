import { Router, Response } from 'express';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

// GET /dashboard — key metrics snapshot
router.get('/dashboard', (req: AuthRequest, res: Response) => {
  const today = new Date().toISOString().split('T')[0];

  const dau = (db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count FROM activities
    WHERE date(start_date) = date('now')
  `).get() as any).count;

  const mau = (db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count FROM activities
    WHERE start_date >= datetime('now', '-30 days')
  `).get() as any).count;

  const newUsersToday = (db.prepare(`
    SELECT COUNT(*) as count FROM users
    WHERE date(created_at) = date('now') AND role = 'runner'
  `).get() as any).count;

  const newUsersWeek = (db.prepare(`
    SELECT COUNT(*) as count FROM users
    WHERE created_at >= datetime('now', '-7 days') AND role = 'runner'
  `).get() as any).count;

  const activeRunnersToday = (db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count FROM activities
    WHERE date(start_date) = date('now')
  `).get() as any).count;

  const totalRunsToday = (db.prepare(`
    SELECT COUNT(*) as count FROM activities
    WHERE date(start_date) = date('now')
  `).get() as any).count;

  const totalDistanceToday = (db.prepare(`
    SELECT COALESCE(SUM(distance_meters), 0) as total FROM activities
    WHERE date(start_date) = date('now')
  `).get() as any).total;

  const avgSessionDuration = (db.prepare(`
    SELECT COALESCE(AVG(elapsed_time_seconds), 0) as avg_duration FROM activities
    WHERE date(start_date) = date('now')
  `).get() as any).avg_duration;

  res.json({
    date: today,
    dau,
    mau,
    new_users_today: newUsersToday,
    new_users_week: newUsersWeek,
    active_runners_today: activeRunnersToday,
    total_runs_today: totalRunsToday,
    total_distance_today: totalDistanceToday,
    avg_session_duration: Math.round(avgSessionDuration),
  });
});

// GET /metrics — last 30 days from daily_metrics table
router.get('/metrics', (req: AuthRequest, res: Response) => {
  const metrics = db.prepare(`
    SELECT * FROM daily_metrics
    ORDER BY date DESC
    LIMIT 30
  `).all();

  res.json(metrics);
});

// GET /events — recent analytics_events (last 100), with optional ?event_type filter
router.get('/events', (req: AuthRequest, res: Response) => {
  const { event_type } = req.query;

  let events;
  if (event_type) {
    events = db.prepare(`
      SELECT ae.*, u.name as user_name
      FROM analytics_events ae
      LEFT JOIN users u ON ae.user_id = u.id
      WHERE ae.event_type = ?
      ORDER BY ae.created_at DESC
      LIMIT 100
    `).all(event_type);
  } else {
    events = db.prepare(`
      SELECT ae.*, u.name as user_name
      FROM analytics_events ae
      LEFT JOIN users u ON ae.user_id = u.id
      ORDER BY ae.created_at DESC
      LIMIT 100
    `).all();
  }

  res.json(events);
});

// POST /track — insert into analytics_events (admin-triggered events)
router.post('/track', (req: AuthRequest, res: Response) => {
  const { event_type, event_name, properties, user_id, session_id } = req.body;
  if (!event_type || !event_name) {
    return res.status(400).json({ error: 'event_type and event_name are required' });
  }

  const result = db.prepare(`
    INSERT INTO analytics_events (user_id, event_type, event_name, properties, session_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    user_id || null,
    event_type,
    event_name,
    properties ? JSON.stringify(properties) : '{}',
    session_id || null
  );

  res.status(201).json({ id: result.lastInsertRowid, success: true });
});

export default router;
