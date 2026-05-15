import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
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

// ===== ADMIN RESET PASSWORD =====

router.put('/runners/:id/reset-password', (req: AuthRequest, res: Response) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be 6+ characters' });
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hash, req.params.id);

  res.json({ message: 'Password reset successfully' });
});

// ===== USER MANAGEMENT =====

router.put('/runners/:id/disable', (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(req.params.id) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'admin') return res.status(400).json({ error: 'Cannot disable admin accounts' });

  db.prepare('UPDATE users SET role = ? WHERE id = ?').run('disabled', req.params.id);
  res.json({ message: 'User disabled' });
});

router.put('/runners/:id/enable', (req: AuthRequest, res: Response) => {
  db.prepare("UPDATE users SET role = 'runner' WHERE id = ?").run(req.params.id);
  res.json({ message: 'User re-enabled' });
});

router.put('/runners/:id/xp', (req: AuthRequest, res: Response) => {
  const { amount, reason } = req.body;
  if (!amount || !reason) return res.status(400).json({ error: 'Amount and reason required' });

  const xp = db.prepare('SELECT * FROM user_xp WHERE user_id = ?').get(req.params.id) as any;
  if (!xp) return res.status(404).json({ error: 'User XP record not found' });

  const newTotal = Math.max(0, xp.total_xp + amount);
  db.prepare('UPDATE user_xp SET total_xp = ? WHERE user_id = ?').run(newTotal, req.params.id);
  db.prepare('INSERT INTO xp_transactions (user_id, amount, source, description) VALUES (?, ?, ?, ?)').run(
    req.params.id, amount, 'admin_adjustment', reason
  );

  res.json({ message: `XP adjusted by ${amount}`, new_total: newTotal });
});

router.put('/runners/:id/tier', (req: AuthRequest, res: Response) => {
  const { tier } = req.body;
  if (!['beginner', 'intermediate', 'advanced'].includes(tier)) {
    return res.status(400).json({ error: 'Invalid tier. Must be beginner, intermediate, or advanced' });
  }

  db.prepare('INSERT INTO tier_history (user_id, tier, score) VALUES (?, ?, ?)').run(req.params.id, tier, 0);
  res.json({ message: `Tier overridden to ${tier}` });
});

router.delete('/runners/:id', (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(req.params.id) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'admin') return res.status(400).json({ error: 'Cannot delete admin accounts' });

  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ message: 'User and all associated data deleted' });
});

// ===== DATA EXPORT =====

router.get('/export/runners', (req: AuthRequest, res: Response) => {
  const data = db.prepare(`
    SELECT u.id, u.name, u.email, u.gender, u.age, u.height_cm, u.weight_kg,
      u.fitness_level, u.running_experience, u.created_at,
      ux.total_xp, ux.current_level, ux.current_streak_days,
      (SELECT tier FROM tier_history WHERE user_id = u.id ORDER BY calculated_at DESC LIMIT 1) as current_tier,
      (SELECT COUNT(*) FROM activities WHERE user_id = u.id) as total_runs,
      (SELECT COALESCE(SUM(distance_meters), 0) FROM activities WHERE user_id = u.id) as total_distance_meters
    FROM users u
    LEFT JOIN user_xp ux ON u.id = ux.user_id
    WHERE u.role = 'runner'
    ORDER BY u.created_at DESC
  `).all();

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=sprint-society-runners.json');
  res.json(data);
});

router.get('/export/activities', (req: AuthRequest, res: Response) => {
  const data = db.prepare(`
    SELECT a.*, u.name as runner_name
    FROM activities a JOIN users u ON a.user_id = u.id
    ORDER BY a.start_date DESC
    LIMIT 1000
  `).all();

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=sprint-society-activities.json');
  res.json(data);
});

// ===== SYSTEM HEALTH =====

router.get('/health', (req: AuthRequest, res: Response) => {
  const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
  const runCount = (db.prepare('SELECT COUNT(*) as c FROM activities').get() as any).c;
  const lastRun = db.prepare('SELECT start_date FROM activities ORDER BY start_date DESC LIMIT 1').get() as any;
  const lastSignup = db.prepare('SELECT created_at FROM users ORDER BY created_at DESC LIMIT 1').get() as any;

  res.json({
    status: 'healthy',
    database: { users: userCount, activities: runCount },
    last_activity: lastRun?.start_date || null,
    last_signup: lastSignup?.created_at || null,
    server_time: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime()),
  });
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
