import { Router, Response } from 'express';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

// ===== ALL RUNNERS =====

router.get('/runners', (req: AuthRequest, res: Response) => {
  const runners = db.prepare(`
    SELECT u.id, u.name, u.email, u.gender, u.age, u.fitness_level, u.running_experience, u.created_at,
      ux.total_xp, ux.current_level, ux.current_streak_days,
      (SELECT tier FROM tier_history WHERE user_id = u.id ORDER BY calculated_at DESC LIMIT 1) as current_tier,
      (SELECT COUNT(*) FROM activities WHERE user_id = u.id) as total_runs,
      (SELECT COALESCE(SUM(distance_meters), 0) FROM activities WHERE user_id = u.id) as total_distance,
      (SELECT COALESCE(AVG(average_pace_per_km), 0) FROM activities WHERE user_id = u.id) as avg_pace
    FROM users u
    LEFT JOIN user_xp ux ON u.id = ux.user_id
    WHERE u.role = 'runner'
    ORDER BY ux.total_xp DESC
  `).all();

  res.json(runners);
});

router.get('/runners/:id', (req: AuthRequest, res: Response) => {
  const runner = db.prepare(`
    SELECT u.*, ux.total_xp, ux.current_level, ux.current_streak_days, ux.longest_streak_days
    FROM users u LEFT JOIN user_xp ux ON u.id = ux.user_id
    WHERE u.id = ? AND u.role = 'runner'
  `).get(req.params.id) as any;

  if (!runner) return res.status(404).json({ error: 'Runner not found' });

  const recentRuns = db.prepare(`
    SELECT * FROM activities WHERE user_id = ? ORDER BY start_date DESC LIMIT 10
  `).all(req.params.id);

  const tierHistory = db.prepare(`
    SELECT * FROM tier_history WHERE user_id = ? ORDER BY calculated_at DESC LIMIT 5
  `).all(req.params.id);

  delete runner.password_hash;
  runner.injury_history = JSON.parse(runner.injury_history || '[]');
  res.json({ ...runner, recent_runs: recentRuns, tier_history: tierHistory });
});

// ===== CLUB SESSIONS =====

router.get('/sessions', (req: AuthRequest, res: Response) => {
  const sessions = db.prepare(`
    SELECT cs.*,
      (SELECT COUNT(*) FROM session_attendance WHERE session_id = cs.id AND attended = 1) as attendee_count
    FROM club_sessions cs ORDER BY session_date DESC
  `).all();
  res.json(sessions);
});

router.post('/sessions', (req: AuthRequest, res: Response) => {
  const { title, description, target_distance_meters, session_date, location } = req.body;
  if (!title || !target_distance_meters || !session_date) {
    return res.status(400).json({ error: 'Title, distance, and date are required' });
  }

  const result = db.prepare(`
    INSERT INTO club_sessions (title, description, target_distance_meters, session_date, location)
    VALUES (?, ?, ?, ?, ?)
  `).run(title, description || '', target_distance_meters, session_date, location || '');

  res.status(201).json({ id: result.lastInsertRowid, success: true });
});

router.put('/sessions/:id', (req: AuthRequest, res: Response) => {
  const { title, description, target_distance_meters, session_date, location } = req.body;
  db.prepare(`
    UPDATE club_sessions SET title = COALESCE(?, title), description = COALESCE(?, description),
    target_distance_meters = COALESCE(?, target_distance_meters), session_date = COALESCE(?, session_date),
    location = COALESCE(?, location) WHERE id = ?
  `).run(title, description, target_distance_meters, session_date, location, req.params.id);
  res.json({ success: true });
});

router.delete('/sessions/:id', (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM club_sessions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.post('/sessions/:id/attendance', (req: AuthRequest, res: Response) => {
  const { user_ids } = req.body;
  if (!Array.isArray(user_ids)) return res.status(400).json({ error: 'user_ids array required' });

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO session_attendance (user_id, session_id, attended) VALUES (?, ?, 1)
  `);
  for (const uid of user_ids) {
    stmt.run(uid, req.params.id);
  }
  res.json({ success: true, marked: user_ids.length });
});

// ===== ANNOUNCEMENTS =====

router.get('/announcements', (req: AuthRequest, res: Response) => {
  const announcements = db.prepare(`
    SELECT a.*, u.name as author_name FROM announcements a
    JOIN users u ON a.admin_id = u.id ORDER BY a.pinned DESC, a.created_at DESC
  `).all();
  res.json(announcements);
});

router.post('/announcements', (req: AuthRequest, res: Response) => {
  const { title, body, pinned } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'Title and body required' });

  const result = db.prepare(`
    INSERT INTO announcements (admin_id, title, body, pinned) VALUES (?, ?, ?, ?)
  `).run(req.userId, title, body, pinned ? 1 : 0);

  res.status(201).json({ id: result.lastInsertRowid, success: true });
});

router.delete('/announcements/:id', (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ===== CLUB STATS =====

router.get('/stats', (req: AuthRequest, res: Response) => {
  const totalRunners = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'runner'").get() as any;
  const totalRuns = db.prepare('SELECT COUNT(*) as count FROM activities').get() as any;
  const totalDistance = db.prepare('SELECT COALESCE(SUM(distance_meters), 0) as total FROM activities').get() as any;
  const totalSessions = db.prepare('SELECT COUNT(*) as count FROM club_sessions').get() as any;

  const tierBreakdown = db.prepare(`
    SELECT tier, COUNT(*) as count FROM (
      SELECT user_id, tier FROM tier_history WHERE id IN (
        SELECT MAX(id) FROM tier_history GROUP BY user_id
      )
    ) GROUP BY tier
  `).all();

  const thisWeekRuns = db.prepare(`
    SELECT COUNT(*) as count FROM activities WHERE start_date >= datetime('now', '-7 days')
  `).get() as any;

  res.json({
    total_runners: totalRunners.count,
    total_runs: totalRuns.count,
    total_distance_km: Math.round(totalDistance.total / 1000),
    total_sessions: totalSessions.count,
    runs_this_week: thisWeekRuns.count,
    tier_breakdown: tierBreakdown,
  });
});

export default router;
