import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../database/pg';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

async function awardXP(userId: number, amount: number, source: string, description: string) {
  await db.execute('INSERT INTO user_xp (user_id, total_xp, current_level) VALUES ($1, 0, 1) ON CONFLICT DO NOTHING', [userId]);
  await db.execute('UPDATE user_xp SET total_xp = total_xp + $1 WHERE user_id = $2', [amount, userId]);
  await db.execute('INSERT INTO xp_transactions (user_id, amount, source, description) VALUES ($1, $2, $3, $4)', [userId, amount, source, description]);
}

// ===== ALL RUNNERS =====

router.get('/runners', async (req: AuthRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  const offset = (page - 1) * limit;
  const search = (req.query.search as string || '').trim();

  let totalCount: number;
  let runners: any[];

  if (search) {
    const like = `%${search}%`;
    const countResult = await db.queryOne("SELECT COUNT(*) as c FROM users WHERE role = 'runner' AND (name LIKE $1 OR email LIKE $2)", [like, like]);
    totalCount = countResult.c;
    runners = await db.query(`
      SELECT u.id, u.name, u.email, u.gender, u.age, u.fitness_level, u.running_experience, u.created_at,
        ux.total_xp, ux.current_level, ux.current_streak_days,
        th.tier as current_tier,
        COALESCE(ast.total_runs, 0) as total_runs,
        COALESCE(ast.total_distance, 0) as total_distance,
        COALESCE(ast.avg_pace, 0) as avg_pace
      FROM users u
      LEFT JOIN user_xp ux ON u.id = ux.user_id
      LEFT JOIN (SELECT user_id, tier, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY calculated_at DESC) as rn FROM tier_history) th ON th.user_id = u.id AND th.rn = 1
      LEFT JOIN (SELECT user_id, COUNT(*) as total_runs, SUM(distance_meters) as total_distance, AVG(average_pace_per_km) as avg_pace FROM activities GROUP BY user_id) ast ON ast.user_id = u.id
      WHERE u.role = 'runner' AND (u.name LIKE $1 OR u.email LIKE $2)
      ORDER BY ux.total_xp DESC LIMIT $3 OFFSET $4
    `, [like, like, limit, offset]);
  } else {
    const countResult = await db.queryOne("SELECT COUNT(*) as c FROM users WHERE role = 'runner'", []);
    totalCount = countResult.c;
    runners = await db.query(`
      SELECT u.id, u.name, u.email, u.gender, u.age, u.fitness_level, u.running_experience, u.created_at,
        ux.total_xp, ux.current_level, ux.current_streak_days,
        th.tier as current_tier,
        COALESCE(ast.total_runs, 0) as total_runs,
        COALESCE(ast.total_distance, 0) as total_distance,
        COALESCE(ast.avg_pace, 0) as avg_pace
      FROM users u
      LEFT JOIN user_xp ux ON u.id = ux.user_id
      LEFT JOIN (SELECT user_id, tier, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY calculated_at DESC) as rn FROM tier_history) th ON th.user_id = u.id AND th.rn = 1
      LEFT JOIN (SELECT user_id, COUNT(*) as total_runs, SUM(distance_meters) as total_distance, AVG(average_pace_per_km) as avg_pace FROM activities GROUP BY user_id) ast ON ast.user_id = u.id
      WHERE u.role = 'runner'
      ORDER BY ux.total_xp DESC LIMIT $1 OFFSET $2
    `, [limit, offset]);
  }

  res.json({ runners, total: totalCount, page, limit, pages: Math.ceil(totalCount / limit) });
});

router.get('/runners/:id', async (req: AuthRequest, res: Response) => {
  const runner = await db.queryOne(`
    SELECT u.*, ux.total_xp, ux.current_level, ux.current_streak_days, ux.longest_streak_days
    FROM users u LEFT JOIN user_xp ux ON u.id = ux.user_id
    WHERE u.id = $1 AND u.role = 'runner'
  `, [req.params.id]) as any;

  if (!runner) return res.status(404).json({ error: 'Runner not found' });

  const recentRuns = await db.query(`
    SELECT * FROM activities WHERE user_id = $1 ORDER BY start_date DESC LIMIT 10
  `, [req.params.id]);

  const tierHistory = await db.query(`
    SELECT * FROM tier_history WHERE user_id = $1 ORDER BY calculated_at DESC LIMIT 5
  `, [req.params.id]);

  delete runner.password_hash;
  runner.injury_history = JSON.parse(runner.injury_history || '[]');
  res.json({ ...runner, recent_runs: recentRuns, tier_history: tierHistory });
});

// ===== INVITE CODES =====

router.get('/invite-codes', async (req: AuthRequest, res: Response) => {
  const codes = await db.query(`
    SELECT ic.*, u.name as created_by_name,
      (SELECT COUNT(*) FROM invite_code_usage WHERE code_id = ic.id) as actual_uses
    FROM invite_codes ic
    JOIN users u ON ic.created_by = u.id
    ORDER BY ic.created_at DESC
  `, []);
  res.json(codes);
});

router.post('/invite-codes', async (req: AuthRequest, res: Response) => {
  const { code, name, max_uses, source, expires_at } = req.body;
  if (!code || !name) return res.status(400).json({ error: 'Code and name are required' });

  const upperCode = code.toUpperCase().trim();
  const existing = await db.queryOne('SELECT id FROM invite_codes WHERE code = $1', [upperCode]);
  if (existing) return res.status(409).json({ error: 'Code already exists' });

  const result = await db.execute(`
    INSERT INTO invite_codes (code, name, max_uses, source, expires_at, created_by)
    VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
  `, [upperCode, name, max_uses || 50, source || null, expires_at || null, req.userId]);

  res.status(201).json({ id: result.rows[0]?.id, code: upperCode, name, success: true });
});

router.patch('/invite-codes/:id', async (req: AuthRequest, res: Response) => {
  const { active, max_uses, expires_at } = req.body;
  await db.execute(`
    UPDATE invite_codes SET active = COALESCE($1, active), max_uses = COALESCE($2, max_uses), expires_at = COALESCE($3, expires_at) WHERE id = $4
  `, [active !== undefined ? (active ? 1 : 0) : null, max_uses || null, expires_at || null, req.params.id]);
  res.json({ success: true });
});

router.delete('/invite-codes/:id', async (req: AuthRequest, res: Response) => {
  await db.execute('UPDATE invite_codes SET active = 0 WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

router.get('/invite-codes/:id/usage', async (req: AuthRequest, res: Response) => {
  const usage = await db.query(`
    SELECT icu.*, u.name, u.email, u.phone, u.created_at as joined_at
    FROM invite_code_usage icu
    JOIN users u ON icu.user_id = u.id
    WHERE icu.code_id = $1
    ORDER BY icu.used_at DESC
  `, [req.params.id]);
  res.json(usage);
});

// ===== EVENTS (Admin-only creation) =====

router.get('/events', async (req: AuthRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  const offset = (page - 1) * limit;

  const countResult = await db.queryOne('SELECT COUNT(*) as c FROM events', []);
  const totalCount = countResult.c;
  const events = await db.query(`
    SELECT e.*,
      (SELECT COUNT(*) FROM event_rsvps WHERE event_id = e.id AND status = 'going') as attendee_count
    FROM events e ORDER BY e.date DESC
    LIMIT $1 OFFSET $2
  `, [limit, offset]);
  res.json({ events, total: totalCount, page, limit, pages: Math.ceil(totalCount / limit) });
});

router.post('/events', async (req: AuthRequest, res: Response) => {
  const { title, description, event_type, date, time, duration_minutes, location_name, latitude, longitude, max_attendees, visibility } = req.body;
  if (!title || !event_type || !date || !time) {
    return res.status(400).json({ error: 'Title, event_type, date, and time are required' });
  }

  const result = await db.execute(`
    INSERT INTO events (creator_id, title, description, event_type, date, time, duration_minutes, location_name, latitude, longitude, max_attendees, visibility)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id
  `, [
    req.userId, title, description || null, event_type, date, time,
    duration_minutes || 60, location_name || null, latitude || null, longitude || null,
    max_attendees || null, visibility || 'public'
  ]);

  res.status(201).json({ id: result.rows[0]?.id, success: true });
});

router.put('/events/:id', async (req: AuthRequest, res: Response) => {
  const { title, description, event_type, date, time, duration_minutes, location_name, max_attendees, status, visibility } = req.body;
  await db.execute(`
    UPDATE events SET
      title = COALESCE($1, title), description = COALESCE($2, description),
      event_type = COALESCE($3, event_type), date = COALESCE($4, date), time = COALESCE($5, time),
      duration_minutes = COALESCE($6, duration_minutes), location_name = COALESCE($7, location_name),
      max_attendees = COALESCE($8, max_attendees), status = COALESCE($9, status),
      visibility = COALESCE($10, visibility), updated_at = CURRENT_TIMESTAMP
    WHERE id = $11
  `, [title, description, event_type, date, time, duration_minutes, location_name, max_attendees, status, visibility, req.params.id]);
  res.json({ success: true });
});

router.delete('/events/:id', async (req: AuthRequest, res: Response) => {
  await db.execute("UPDATE events SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [req.params.id]);
  res.json({ success: true });
});

// Set check-in code + go live
router.post('/events/:id/go-live', async (req: AuthRequest, res: Response) => {
  const { check_in_code } = req.body;
  if (!check_in_code) return res.status(400).json({ error: 'Check-in code required' });

  await db.execute("UPDATE events SET status = 'live', check_in_code = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
    [check_in_code.toUpperCase(), req.params.id]);
  res.json({ success: true, message: `Event is LIVE. Code: ${check_in_code.toUpperCase()}` });
});

// Complete event + generate smart awards
router.post('/events/:id/complete', async (req: AuthRequest, res: Response) => {
  const eventId = parseInt(req.params.id);

  // PostgreSQL doesn't have db.transaction() like better-sqlite3, use BEGIN/COMMIT
  try {
    await db.execute('BEGIN', []);

    await db.execute("UPDATE events SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [eventId]);

    const checkins = await db.query('SELECT user_id FROM event_checkins WHERE event_id = $1', [eventId]) as any[];

    for (const c of checkins) {
      await awardXP(c.user_id, 100, 'event_completed', 'Completed an event');
    }

    const event = await db.queryOne('SELECT * FROM events WHERE id = $1', [eventId]) as any;
    if (event && checkins.length > 0) {
      const userIds = checkins.map((c: any) => c.user_id);
      const eventDate = event.date;

      const placeholders = userIds.map((_: any, i: number) => `$${i + 1}`).join(',');
      const activities = await db.query(`
        SELECT a.*, u.name as runner_name FROM activities a
        JOIN users u ON a.user_id = u.id
        WHERE a.user_id IN (${placeholders})
        AND date(a.start_date) = $${userIds.length + 1}
        ORDER BY a.average_pace_per_km ASC
      `, [...userIds, eventDate]) as any[];

      if (activities.length > 0) {
        for (let i = 0; i < Math.min(3, activities.length); i++) {
          const a = activities[i];
          const icons = ['🥇', '🥈', '🥉'];
          const titles = ['Gold — Fastest Runner', 'Silver — Second Fastest', 'Bronze — Third Fastest'];
          await db.execute('INSERT INTO event_awards (event_id, user_id, award_type, award_title, award_icon, rank_position, stat_value) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [eventId, a.user_id, 'podium', titles[i], icons[i], i + 1, `${Math.floor(a.average_pace_per_km / 60)}:${String(Math.round(a.average_pace_per_km % 60)).padStart(2, '0')}/km`]);
        }

        const longest = [...activities].sort((a, b) => b.distance_meters - a.distance_meters)[0];
        if (longest) {
          await db.execute('INSERT INTO event_awards (event_id, user_id, award_type, award_title, award_icon, stat_value) VALUES ($1, $2, $3, $4, $5, $6)',
            [eventId, longest.user_id, 'special', 'Distance King', '👑', `${(longest.distance_meters / 1000).toFixed(1)}km`]);
        }

        for (const uid of userIds) {
          const hasActivity = activities.find((a: any) => a.user_id === uid);
          if (!hasActivity) {
            await db.execute('INSERT INTO event_awards (event_id, user_id, award_type, award_title, award_icon, stat_value) VALUES ($1, $2, $3, $4, $5, $6)',
              [eventId, uid, 'participant', 'Showed Up', '🏃', 'Checked in']);
          }
        }
      } else {
        for (const uid of userIds) {
          await db.execute('INSERT INTO event_awards (event_id, user_id, award_type, award_title, award_icon, stat_value) VALUES ($1, $2, $3, $4, $5, $6)',
            [eventId, uid, 'participant', 'Beta Runner', '⚡', 'Founding event']);
        }
      }

      for (const uid of userIds) {
        await db.execute("INSERT INTO user_notifications (user_id, type, title, body, target_type, target_id) VALUES ($1, 'achievement', $2, $3, 'event', $4)",
          [uid, `${event.title} — Complete!`, 'Check your awards and share your results', eventId]);
      }
    }

    await db.execute('COMMIT', []);
    res.json({ success: true, message: `Event completed. ${checkins.length} runners awarded 100 XP + smart awards generated.` });
  } catch (err) {
    await db.execute('ROLLBACK', []);
    throw err;
  }
});

router.post('/events/:id/hosts', async (req: AuthRequest, res: Response) => {
  const { user_id, role_label } = req.body;
  if (!user_id || !role_label) return res.status(400).json({ error: 'user_id and role_label required' });

  try {
    await db.execute('INSERT INTO event_hosts (event_id, user_id, role_label) VALUES ($1, $2, $3)', [
      parseInt(req.params.id), user_id, role_label
    ]);
    res.status(201).json({ success: true });
  } catch (e: any) {
    if (e.message?.includes('unique') || e.code === '23505') return res.status(409).json({ error: 'Host already added' });
    throw e;
  }
});

router.delete('/events/:id/hosts/:userId', async (req: AuthRequest, res: Response) => {
  await db.execute('DELETE FROM event_hosts WHERE event_id = $1 AND user_id = $2', [
    parseInt(req.params.id), parseInt(req.params.userId)
  ]);
  res.json({ success: true });
});

// ===== CLUB SESSIONS =====

router.get('/sessions', async (req: AuthRequest, res: Response) => {
  const sessions = await db.query(`
    SELECT cs.*,
      (SELECT COUNT(*) FROM session_attendance WHERE session_id = cs.id AND attended = 1) as attendee_count
    FROM club_sessions cs ORDER BY session_date DESC
  `, []);
  res.json(sessions);
});

router.post('/sessions', async (req: AuthRequest, res: Response) => {
  const { title, description, target_distance_meters, session_date, location } = req.body;
  if (!title || !target_distance_meters || !session_date) {
    return res.status(400).json({ error: 'Title, distance, and date are required' });
  }

  const result = await db.execute(`
    INSERT INTO club_sessions (title, description, target_distance_meters, session_date, location)
    VALUES ($1, $2, $3, $4, $5) RETURNING id
  `, [title, description || '', target_distance_meters, session_date, location || '']);

  res.status(201).json({ id: result.rows[0]?.id, success: true });
});

router.put('/sessions/:id', async (req: AuthRequest, res: Response) => {
  const { title, description, target_distance_meters, session_date, location } = req.body;
  await db.execute(`
    UPDATE club_sessions SET title = COALESCE($1, title), description = COALESCE($2, description),
    target_distance_meters = COALESCE($3, target_distance_meters), session_date = COALESCE($4, session_date),
    location = COALESCE($5, location) WHERE id = $6
  `, [title, description, target_distance_meters, session_date, location, req.params.id]);
  res.json({ success: true });
});

router.delete('/sessions/:id', async (req: AuthRequest, res: Response) => {
  await db.execute('DELETE FROM club_sessions WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

router.post('/sessions/:id/attendance', async (req: AuthRequest, res: Response) => {
  const { user_ids } = req.body;
  if (!Array.isArray(user_ids)) return res.status(400).json({ error: 'user_ids array required' });

  for (const uid of user_ids) {
    await db.execute(`
      INSERT INTO session_attendance (user_id, session_id, attended) VALUES ($1, $2, 1)
      ON CONFLICT (user_id, session_id) DO UPDATE SET attended = 1
    `, [uid, req.params.id]);
  }
  res.json({ success: true, marked: user_ids.length });
});

// ===== ANNOUNCEMENTS =====

router.get('/announcements', async (req: AuthRequest, res: Response) => {
  const announcements = await db.query(`
    SELECT a.*, u.name as author_name FROM announcements a
    JOIN users u ON a.admin_id = u.id ORDER BY a.pinned DESC, a.created_at DESC
  `, []);
  res.json(announcements);
});

router.post('/announcements', async (req: AuthRequest, res: Response) => {
  const { title, body, pinned } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'Title and body required' });

  const result = await db.execute(`
    INSERT INTO announcements (admin_id, title, body, pinned) VALUES ($1, $2, $3, $4) RETURNING id
  `, [req.userId, title, body, pinned ? 1 : 0]);

  res.status(201).json({ id: result.rows[0]?.id, success: true });
});

router.delete('/announcements/:id', async (req: AuthRequest, res: Response) => {
  await db.execute('DELETE FROM announcements WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// ===== ADMIN RESET PASSWORD =====

router.put('/runners/:id/reset-password', async (req: AuthRequest, res: Response) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be 6+ characters' });
  }

  const user = await db.queryOne('SELECT id FROM users WHERE id = $1', [req.params.id]) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  const hash = bcrypt.hashSync(newPassword, 10);
  await db.execute('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hash, req.params.id]);

  res.json({ message: 'Password reset successfully' });
});

// ===== USER MANAGEMENT =====

router.put('/runners/:id/disable', async (req: AuthRequest, res: Response) => {
  const user = await db.queryOne('SELECT id, role FROM users WHERE id = $1', [req.params.id]) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'admin') return res.status(400).json({ error: 'Cannot disable admin accounts' });

  await db.execute('UPDATE users SET role = $1 WHERE id = $2', ['disabled', req.params.id]);
  res.json({ message: 'User disabled' });
});

router.put('/runners/:id/enable', async (req: AuthRequest, res: Response) => {
  await db.execute("UPDATE users SET role = 'runner' WHERE id = $1", [req.params.id]);
  res.json({ message: 'User re-enabled' });
});

router.put('/runners/:id/xp', async (req: AuthRequest, res: Response) => {
  const { amount, reason } = req.body;
  if (!amount || !reason) return res.status(400).json({ error: 'Amount and reason required' });

  const xp = await db.queryOne('SELECT * FROM user_xp WHERE user_id = $1', [req.params.id]) as any;
  if (!xp) return res.status(404).json({ error: 'User XP record not found' });

  const newTotal = Math.max(0, xp.total_xp + amount);
  await db.execute('UPDATE user_xp SET total_xp = $1 WHERE user_id = $2', [newTotal, req.params.id]);
  await db.execute('INSERT INTO xp_transactions (user_id, amount, source, description) VALUES ($1, $2, $3, $4)', [
    req.params.id, amount, 'admin_adjustment', reason
  ]);

  res.json({ message: `XP adjusted by ${amount}`, new_total: newTotal });
});

router.put('/runners/:id/tier', async (req: AuthRequest, res: Response) => {
  const { tier } = req.body;
  if (!['beginner', 'intermediate', 'advanced'].includes(tier)) {
    return res.status(400).json({ error: 'Invalid tier. Must be beginner, intermediate, or advanced' });
  }

  await db.execute('INSERT INTO tier_history (user_id, tier, score) VALUES ($1, $2, $3)', [req.params.id, tier, 0]);
  res.json({ message: `Tier overridden to ${tier}` });
});

router.delete('/runners/:id', async (req: AuthRequest, res: Response) => {
  const user = await db.queryOne('SELECT id, role FROM users WHERE id = $1', [req.params.id]) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'admin') return res.status(400).json({ error: 'Cannot delete admin accounts' });

  await db.execute('DELETE FROM users WHERE id = $1', [req.params.id]);
  res.json({ message: 'User and all associated data deleted' });
});

// ===== COMMUNITIES =====

router.get('/communities', async (req: AuthRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  const offset = (page - 1) * limit;

  const countResult = await db.queryOne('SELECT COUNT(*) as c FROM communities', []);
  const totalCount = countResult.c;
  const communities = await db.query(`
    SELECT c.*, u.name as owner_name
    FROM communities c
    JOIN users u ON c.owner_id = u.id
    ORDER BY c.member_count DESC
    LIMIT $1 OFFSET $2
  `, [limit, offset]);
  res.json({ communities, total: totalCount, page, limit, pages: Math.ceil(totalCount / limit) });
});

router.put('/communities/:id', async (req: AuthRequest, res: Response) => {
  const { name, description, category, is_verified } = req.body;
  await db.execute(`
    UPDATE communities SET
      name = COALESCE($1, name), description = COALESCE($2, description),
      category = COALESCE($3, category), is_verified = COALESCE($4, is_verified),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $5
  `, [name, description, category, is_verified !== undefined ? (is_verified ? 1 : 0) : null, req.params.id]);
  res.json({ success: true });
});

router.delete('/communities/:id', async (req: AuthRequest, res: Response) => {
  await db.execute('DELETE FROM communities WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// ===== DATA EXPORT =====

router.get('/export/runners', async (req: AuthRequest, res: Response) => {
  const data = await db.query(`
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
  `, []);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=sprint-society-runners.json');
  res.json(data);
});

router.get('/export/activities', async (req: AuthRequest, res: Response) => {
  const data = await db.query(`
    SELECT a.*, u.name as runner_name
    FROM activities a JOIN users u ON a.user_id = u.id
    ORDER BY a.start_date DESC
    LIMIT 1000
  `, []);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=sprint-society-activities.json');
  res.json(data);
});

// ===== SYSTEM HEALTH =====

router.get('/health', async (req: AuthRequest, res: Response) => {
  const userCount = (await db.queryOne('SELECT COUNT(*) as c FROM users', []) as any).c;
  const runCount = (await db.queryOne('SELECT COUNT(*) as c FROM activities', []) as any).c;
  const lastRun = await db.queryOne('SELECT start_date FROM activities ORDER BY start_date DESC LIMIT 1', []) as any;
  const lastSignup = await db.queryOne('SELECT created_at FROM users ORDER BY created_at DESC LIMIT 1', []) as any;

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

router.get('/stats', async (req: AuthRequest, res: Response) => {
  const totalRunners = await db.queryOne("SELECT COUNT(*) as count FROM users WHERE role = 'runner'", []) as any;
  const totalRuns = await db.queryOne('SELECT COUNT(*) as count FROM activities', []) as any;
  const totalDistance = await db.queryOne('SELECT COALESCE(SUM(distance_meters), 0) as total FROM activities', []) as any;
  const totalSessions = await db.queryOne('SELECT COUNT(*) as count FROM club_sessions', []) as any;

  const tierBreakdown = await db.query(`
    SELECT tier, COUNT(*) as count FROM (
      SELECT user_id, tier FROM tier_history WHERE id IN (
        SELECT MAX(id) FROM tier_history GROUP BY user_id
      )
    ) sub GROUP BY tier
  `, []);

  const thisWeekRuns = await db.queryOne(`
    SELECT COUNT(*) as count FROM activities WHERE start_date >= NOW() - INTERVAL '7 days'
  `, []) as any;

  res.json({
    total_runners: totalRunners.count,
    total_runs: totalRuns.count,
    total_distance_km: Math.round(totalDistance.total / 1000),
    total_sessions: totalSessions.count,
    runs_this_week: thisWeekRuns.count,
    tier_breakdown: tierBreakdown,
  });
});

// ===== STREAK HEALTH =====

router.get('/streak-health', async (req: AuthRequest, res: Response) => {
  const activeStreaks = await db.queryOne(`
    SELECT COUNT(*) as count FROM user_xp WHERE current_streak_days > 0
  `, []) as any;

  const atRiskRunners = await db.query(`
    SELECT u.id, u.name, ux.current_streak_days as streak
    FROM user_xp ux
    JOIN users u ON u.id = ux.user_id
    WHERE ux.current_streak_days >= 3
    AND NOT EXISTS (
      SELECT 1 FROM activities a WHERE a.user_id = ux.user_id AND a.start_date > NOW() - INTERVAL '1 day'
    )
    ORDER BY ux.current_streak_days DESC
    LIMIT 10
  `, []) as any[];

  const lostToday = await db.queryOne(`
    SELECT COUNT(*) as count FROM user_xp
    WHERE current_streak_days = 0
    AND longest_streak_days > 0
    AND user_id IN (
      SELECT user_id FROM xp_transactions
      WHERE source = 'streak_broken' AND created_at > NOW() - INTERVAL '1 day'
    )
  `, []) as any;

  res.json({
    active_streaks: activeStreaks.count,
    at_risk: atRiskRunners.length,
    at_risk_runners: atRiskRunners,
    lost_today: lostToday?.count || 0,
  });
});

// ===== ANALYTICS DASHBOARD =====

router.get('/analytics', async (req: AuthRequest, res: Response) => {
  const signupsPerDay = await db.query(`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM users WHERE role = 'runner'
    GROUP BY DATE(created_at)
    ORDER BY date DESC LIMIT 30
  `, []);

  const activeUsersLast7 = (await db.queryOne(`
    SELECT COUNT(DISTINCT user_id) as count FROM activities
    WHERE start_date >= NOW() - INTERVAL '7 days'
  `, []) as any).count;

  const activeUsersLast30 = (await db.queryOne(`
    SELECT COUNT(DISTINCT user_id) as count FROM activities
    WHERE start_date >= NOW() - INTERVAL '30 days'
  `, []) as any).count;

  const totalRunners = (await db.queryOne("SELECT COUNT(*) as c FROM users WHERE role = 'runner'", []) as any).c;

  const chatUsage = (await db.queryOne(`
    SELECT COUNT(DISTINCT user_id) as users, COUNT(*) as messages
    FROM chat_messages WHERE created_at >= NOW() - INTERVAL '7 days'
  `, []) as any);

  const retentionWeek1 = await db.queryOne(`
    SELECT COUNT(DISTINCT a.user_id) as retained
    FROM activities a JOIN users u ON a.user_id = u.id
    WHERE u.created_at <= NOW() - INTERVAL '7 days'
    AND a.start_date >= NOW() - INTERVAL '7 days'
  `, []) as any;

  const usersOlderThan7Days = (await db.queryOne(`
    SELECT COUNT(*) as c FROM users
    WHERE role = 'runner' AND created_at <= NOW() - INTERVAL '7 days'
  `, []) as any).c;

  res.json({
    signups_per_day: signupsPerDay,
    active_users: { last_7_days: activeUsersLast7, last_30_days: activeUsersLast30 },
    total_runners: totalRunners,
    retention_7day: usersOlderThan7Days > 0
      ? Math.round((retentionWeek1.retained / usersOlderThan7Days) * 100)
      : 0,
    chat_usage_7day: { unique_users: chatUsage.users, total_messages: chatUsage.messages },
  });
});

// ===== DOWNLOAD DATABASE (disabled in production) =====

router.get('/download-db', (req: AuthRequest, res: Response) => {
  // Not applicable for PostgreSQL — use pg_dump instead
  return res.status(403).json({ error: 'Database download not supported for PostgreSQL. Use pg_dump.' });
});

// ===== WAITLIST =====

router.get('/waitlist', async (req: AuthRequest, res: Response) => {
  const entries = await db.query(`
    SELECT * FROM waitlist ORDER BY created_at DESC
  `, []);
  res.json(entries);
});

router.delete('/waitlist/:id', async (req: AuthRequest, res: Response) => {
  await db.execute('DELETE FROM waitlist WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// ===== FEEDBACK =====

router.get('/feedback', async (req: AuthRequest, res: Response) => {
  const feedback = await db.query(`
    SELECT f.*, u.name as user_name
    FROM feedback f
    LEFT JOIN users u ON f.user_id = u.id
    ORDER BY f.created_at DESC
  `, []);
  res.json(feedback);
});

router.patch('/feedback/:id', async (req: AuthRequest, res: Response) => {
  const { status, admin_notes } = req.body;

  if (status) {
    const validStatuses = ['new', 'reviewed', 'resolved', 'wontfix'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
  }

  if (!status && admin_notes === undefined) {
    return res.status(400).json({ error: 'Provide status or admin_notes to update' });
  }

  const existing = await db.queryOne('SELECT id FROM feedback WHERE id = $1', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Feedback not found' });

  if (status && admin_notes !== undefined) {
    await db.execute('UPDATE feedback SET status = $1, admin_notes = $2 WHERE id = $3',
      [status, admin_notes, req.params.id]);
  } else if (status) {
    await db.execute('UPDATE feedback SET status = $1 WHERE id = $2',
      [status, req.params.id]);
  } else {
    await db.execute('UPDATE feedback SET admin_notes = $1 WHERE id = $2',
      [admin_notes, req.params.id]);
  }

  res.json({ success: true });
});

// ===== STREAK NUDGES =====

router.post('/send-streak-nudges', async (req: AuthRequest, res: Response) => {
  const today = new Date().toISOString().split('T')[0];

  const atRiskUsers = await db.query(`
    SELECT ux.user_id, ux.current_streak_days, u.name
    FROM user_xp ux
    JOIN users u ON ux.user_id = u.id
    WHERE ux.current_streak_days >= 3
    AND u.id NOT IN (
      SELECT user_id FROM activities WHERE DATE(start_date) = $1
    )
  `, [today]) as any[];

  let sent = 0;
  for (const user of atRiskUsers) {
    await db.execute(`
      INSERT INTO user_notifications (user_id, type, title, body)
      VALUES ($1, 'ai_insight', $2, $3)
    `, [
      user.user_id,
      `Don't lose your ${user.current_streak_days}-day streak!`,
      `Even a quick walk counts. Keep the fire going.`
    ]);
    sent++;
  }

  res.json({ sent, total_at_risk: atRiskUsers.length });
});

export default router;
