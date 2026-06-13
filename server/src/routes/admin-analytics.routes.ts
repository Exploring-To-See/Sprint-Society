import { Router, Response } from 'express';
import db from '../database/pg';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

// GET /dashboard — key metrics snapshot
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  const today = new Date().toISOString().split('T')[0];

  const dau = (await db.queryOne(`
    SELECT COUNT(DISTINCT user_id) as count FROM activities
    WHERE date(start_date) = CURRENT_DATE
  `, []) as any).count;

  const mau = (await db.queryOne(`
    SELECT COUNT(DISTINCT user_id) as count FROM activities
    WHERE start_date >= NOW() - INTERVAL '30 days'
  `, []) as any).count;

  const newUsersToday = (await db.queryOne(`
    SELECT COUNT(*) as count FROM users
    WHERE date(created_at) = CURRENT_DATE AND role = 'runner'
  `, []) as any).count;

  const newUsersWeek = (await db.queryOne(`
    SELECT COUNT(*) as count FROM users
    WHERE created_at >= NOW() - INTERVAL '7 days' AND role = 'runner'
  `, []) as any).count;

  const activeRunnersToday = (await db.queryOne(`
    SELECT COUNT(DISTINCT user_id) as count FROM activities
    WHERE date(start_date) = CURRENT_DATE
  `, []) as any).count;

  const totalRunsToday = (await db.queryOne(`
    SELECT COUNT(*) as count FROM activities
    WHERE date(start_date) = CURRENT_DATE
  `, []) as any).count;

  const totalDistanceToday = (await db.queryOne(`
    SELECT COALESCE(SUM(distance_meters), 0) as total FROM activities
    WHERE date(start_date) = CURRENT_DATE
  `, []) as any).total;

  const avgSessionDuration = (await db.queryOne(`
    SELECT COALESCE(AVG(elapsed_time_seconds), 0) as avg_duration FROM activities
    WHERE date(start_date) = CURRENT_DATE
  `, []) as any).avg_duration;

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
router.get('/metrics', async (req: AuthRequest, res: Response) => {
  const metrics = await db.query(`
    SELECT * FROM daily_metrics
    ORDER BY date DESC
    LIMIT 30
  `, []);

  res.json(metrics);
});

// GET /events — recent analytics_events (last 100), with optional ?event_type filter
router.get('/events', async (req: AuthRequest, res: Response) => {
  const { event_type } = req.query;

  let events;
  if (event_type) {
    events = await db.query(`
      SELECT ae.*, u.name as user_name
      FROM analytics_events ae
      LEFT JOIN users u ON ae.user_id = u.id
      WHERE ae.event_type = $1
      ORDER BY ae.created_at DESC
      LIMIT 100
    `, [event_type]);
  } else {
    events = await db.query(`
      SELECT ae.*, u.name as user_name
      FROM analytics_events ae
      LEFT JOIN users u ON ae.user_id = u.id
      ORDER BY ae.created_at DESC
      LIMIT 100
    `, []);
  }

  res.json(events);
});

// POST /track — insert into analytics_events (admin-triggered events)
router.post('/track', async (req: AuthRequest, res: Response) => {
  const { event_type, event_name, properties, user_id, session_id } = req.body;
  if (!event_type || !event_name) {
    return res.status(400).json({ error: 'event_type and event_name are required' });
  }

  const result = await db.execute(`
    INSERT INTO analytics_events (user_id, event_type, event_name, properties, session_id)
    VALUES ($1, $2, $3, $4, $5) RETURNING id
  `, [
    user_id || null,
    event_type,
    event_name,
    properties ? JSON.stringify(properties) : '{}',
    session_id || null
  ]);

  res.status(201).json({ id: result.rows[0]?.id, success: true });
});

// GET /engagement — engagement metrics for P2 features
router.get('/engagement', async (req: AuthRequest, res: Response) => {
  const totalBadgesEarned = (await db.queryOne('SELECT COUNT(*) as count FROM user_achievements', []) as any).count;
  const uniqueBadgeHolders = (await db.queryOne('SELECT COUNT(DISTINCT user_id) as count FROM user_achievements', []) as any).count;
  const totalReactions = (await db.queryOne('SELECT COUNT(*) as count FROM kudos', []) as any).count;

  const reactionBreakdown = await db.query(`
    SELECT COALESCE(reaction_type, 'high_five') as type, COUNT(*) as count
    FROM kudos GROUP BY reaction_type ORDER BY count DESC
  `, []) as any[];

  const topStreaks = await db.query(`
    SELECT u.name, ux.current_streak_days as streak
    FROM user_xp ux JOIN users u ON u.id = ux.user_id
    WHERE ux.current_streak_days > 0
    ORDER BY ux.current_streak_days DESC LIMIT 5
  `, []) as any[];

  const communitiesWithActivity = (await db.queryOne(`
    SELECT COUNT(DISTINCT cm.community_id) as count
    FROM community_members cm
    JOIN activities a ON a.user_id = cm.user_id AND a.start_date > NOW() - INTERVAL '7 days'
  `, []) as any).count;

  res.json({
    badges: { total_earned: totalBadgesEarned, unique_holders: uniqueBadgeHolders },
    reactions: { total: totalReactions, breakdown: reactionBreakdown },
    streaks: { top: topStreaks },
    communities: { active_this_week: communitiesWithActivity },
  });
});

export default router;
