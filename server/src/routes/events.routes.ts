import { Router, Response } from 'express';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createNotification } from './notifications.routes';
import { awardKenduForEvent } from '../engine/kenduEngine';

const router = Router();
router.use(authenticate);

function awardXP(userId: number, amount: number, source: string, description: string) {
  db.prepare('INSERT OR IGNORE INTO user_xp (user_id, total_xp, current_level) VALUES (?, 0, 1)').run(userId);
  db.prepare('UPDATE user_xp SET total_xp = total_xp + ? WHERE user_id = ?').run(amount, userId);
  db.prepare('INSERT INTO xp_transactions (user_id, amount, source, description) VALUES (?, ?, ?, ?)').run(userId, amount, source, description);
}

// GET /events — list upcoming events
router.get('/', (req: AuthRequest, res: Response) => {
  const { type, from, to, page = '1', limit = '20' } = req.query;
  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 20;
  const offset = (pageNum - 1) * limitNum;

  let where = `WHERE e.status IN ('upcoming', 'live')`;
  const params: any[] = [];

  if (type && type !== 'all') {
    where += ` AND e.event_type = ?`;
    params.push(type);
  }
  if (from) {
    where += ` AND e.date >= ?`;
    params.push(from);
  }
  if (to) {
    where += ` AND e.date <= ?`;
    params.push(to);
  }

  // Visibility filter: public events + followers_only from people user follows
  where += ` AND (e.visibility = 'public' OR (e.visibility = 'followers_only' AND e.creator_id IN (SELECT following_id FROM follows WHERE follower_id = ?)))`;
  params.push(req.userId);

  const events = db.prepare(`
    SELECT e.*,
      u.name as creator_name, u.profile_image_url as creator_image,
      (SELECT COUNT(*) FROM event_rsvps WHERE event_id = e.id AND status = 'going') as attendee_count,
      (SELECT COUNT(*) FROM event_rsvps WHERE event_id = e.id AND status = 'maybe') as maybe_count,
      (SELECT status FROM event_rsvps WHERE event_id = e.id AND user_id = ?) as user_rsvp
    FROM events e
    JOIN users u ON e.creator_id = u.id
    ${where}
    ORDER BY e.date ASC, e.time ASC
    LIMIT ? OFFSET ?
  `).all(req.userId, ...params, limitNum, offset) as any[];

  const friendsGoingStmt = db.prepare(`
    SELECT u.id, u.name, u.profile_image_url
    FROM event_rsvps er
    JOIN users u ON er.user_id = u.id
    JOIN follows f ON f.following_id = er.user_id AND f.follower_id = ?
    WHERE er.event_id = ? AND er.status = 'going'
    LIMIT 5
  `);

  res.json({
    events: events.map(e => {
      const friends_going = friendsGoingStmt.all(req.userId, e.id) as any[];
      return {
        ...e,
        is_recurring: !!e.is_recurring,
        is_full: e.max_attendees ? e.attendee_count >= e.max_attendees : false,
        friends_going,
        friends_going_count: friends_going.length,
      };
    }),
    page: pageNum,
    has_more: events.length === limitNum,
  });
});

// GET /events/nearby — events within radius (haversine)
router.get('/nearby', (req: AuthRequest, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const radiusKm = parseFloat(req.query.radius as string) || 10;

  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

  const events = db.prepare(`
    SELECT e.*, u.name as creator_name,
      (SELECT COUNT(*) FROM event_rsvps WHERE event_id = e.id AND status = 'going') as attendee_count
    FROM events e
    JOIN users u ON e.creator_id = u.id
    WHERE e.status IN ('upcoming', 'live') AND e.latitude IS NOT NULL AND e.longitude IS NOT NULL
    ORDER BY e.date ASC
  `).all() as any[];

  const nearby = events.filter(e => {
    const dLat = (parseFloat(e.latitude) - lat) * Math.PI / 180;
    const dLng = (parseFloat(e.longitude) - lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(parseFloat(e.latitude) * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    const distance = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    (e as any).distance_km = Math.round(distance * 10) / 10;
    return distance <= radiusKm;
  });

  res.json({ events: nearby, radius_km: radiusKm });
});

// GET /events/my — events user is attending or hosting
router.get('/my', (req: AuthRequest, res: Response) => {
  const attending = db.prepare(`
    SELECT e.*, u.name as creator_name,
      (SELECT COUNT(*) FROM event_rsvps WHERE event_id = e.id AND status = 'going') as attendee_count,
      er.status as user_rsvp
    FROM event_rsvps er
    JOIN events e ON er.event_id = e.id
    JOIN users u ON e.creator_id = u.id
    WHERE er.user_id = ? AND er.status IN ('going', 'maybe') AND e.status IN ('upcoming', 'live')
    ORDER BY e.date ASC
  `).all(req.userId) as any[];

  res.json({ attending });
});

// GET /events/:id — event detail
router.get('/:id', (req: AuthRequest, res: Response) => {
  const event = db.prepare(`
    SELECT e.*,
      u.name as creator_name, u.profile_image_url as creator_image,
      (SELECT COUNT(*) FROM event_rsvps WHERE event_id = e.id AND status = 'going') as attendee_count,
      (SELECT COUNT(*) FROM event_rsvps WHERE event_id = e.id AND status = 'maybe') as maybe_count,
      (SELECT status FROM event_rsvps WHERE event_id = e.id AND user_id = ?) as user_rsvp
    FROM events e
    JOIN users u ON e.creator_id = u.id
    WHERE e.id = ?
  `).get(req.userId, parseInt(req.params.id)) as any;

  if (!event) return res.status(404).json({ error: 'Event not found' });

  const attendees = db.prepare(`
    SELECT u.id as user_id, u.name, u.profile_image_url, er.status as rsvp_status
    FROM event_rsvps er
    JOIN users u ON er.user_id = u.id
    WHERE er.event_id = ? AND er.status IN ('going', 'maybe')
    ORDER BY er.rsvped_at ASC
    LIMIT 50
  `).all(event.id) as any[];

  const hosts = db.prepare(`
    SELECT u.id as user_id, u.name, u.profile_image_url, eh.role_label
    FROM event_hosts eh
    JOIN users u ON eh.user_id = u.id
    WHERE eh.event_id = ?
  `).all(event.id) as any[];

  res.json({
    ...event,
    is_recurring: !!event.is_recurring,
    is_full: event.max_attendees ? event.attendee_count >= event.max_attendees : false,
    attendees,
    hosts,
  });
});

// POST /events/:id/rsvp — RSVP to event
router.post('/:id/rsvp', (req: AuthRequest, res: Response) => {
  const eventId = parseInt(req.params.id);
  const { status } = req.body;

  if (!status || !['going', 'maybe'].includes(status)) {
    return res.status(400).json({ error: 'Status must be going or maybe' });
  }

  const event = db.prepare('SELECT * FROM events WHERE id = ? AND status != ?').get(eventId, 'cancelled') as any;
  if (!event) return res.status(404).json({ error: 'Event not found or cancelled' });

  if (status === 'going' && event.max_attendees) {
    const currentCount = (db.prepare('SELECT COUNT(*) as c FROM event_rsvps WHERE event_id = ? AND status = ?').get(eventId, 'going') as any).c;
    if (currentCount >= event.max_attendees) {
      return res.status(409).json({ error: 'Event is full' });
    }
  }

  const existing = db.prepare('SELECT * FROM event_rsvps WHERE event_id = ? AND user_id = ?').get(eventId, req.userId) as any;
  const wasGoing = existing?.status === 'going';

  db.prepare('INSERT OR REPLACE INTO event_rsvps (event_id, user_id, status) VALUES (?, ?, ?)').run(eventId, req.userId, status);

  // Award XP on first time going (not for changing from maybe to going etc)
  if (status === 'going' && !wasGoing) {
    awardXP(req.userId!, 15, 'event_rsvp', `RSVP'd to: ${event.title}`);
    const actorName = (db.prepare('SELECT name FROM users WHERE id = ?').get(req.userId) as any)?.name || 'Someone';
    createNotification(event.creator_id, 'event_rsvp', `${actorName} is going to your event`, event.title, req.userId, 'event', eventId);
  }

  const attendee_count = (db.prepare('SELECT COUNT(*) as c FROM event_rsvps WHERE event_id = ? AND status = ?').get(eventId, 'going') as any).c;
  res.json({ success: true, attendee_count, user_rsvp: status });
});

// DELETE /events/:id/rsvp — cancel RSVP
router.delete('/:id/rsvp', (req: AuthRequest, res: Response) => {
  const eventId = parseInt(req.params.id);
  db.prepare('DELETE FROM event_rsvps WHERE event_id = ? AND user_id = ?').run(eventId, req.userId);
  const attendee_count = (db.prepare('SELECT COUNT(*) as c FROM event_rsvps WHERE event_id = ? AND status = ?').get(eventId, 'going') as any).c;
  res.json({ success: true, attendee_count, user_rsvp: null });
});

// GET /events/:id/comments — event comments
router.get('/:id/comments', (req: AuthRequest, res: Response) => {
  const comments = db.prepare(`
    SELECT ec.*, u.name as user_name, u.profile_image_url
    FROM event_comments ec
    JOIN users u ON ec.user_id = u.id
    WHERE ec.event_id = ?
    ORDER BY ec.created_at ASC
  `).all(parseInt(req.params.id)) as any[];

  res.json(comments);
});

// POST /events/:id/comments — add comment
router.post('/:id/comments', (req: AuthRequest, res: Response) => {
  const { body } = req.body;
  if (!body || body.trim().length === 0) return res.status(400).json({ error: 'Comment cannot be empty' });
  if (body.length > 500) return res.status(400).json({ error: 'Comment too long (max 500 chars)' });

  const eventId = parseInt(req.params.id);
  const event = db.prepare('SELECT id FROM events WHERE id = ?').get(eventId) as any;
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const result = db.prepare('INSERT INTO event_comments (event_id, user_id, body) VALUES (?, ?, ?)').run(eventId, req.userId, body.trim());

  const comment = db.prepare(`
    SELECT ec.*, u.name as user_name, u.profile_image_url
    FROM event_comments ec JOIN users u ON ec.user_id = u.id WHERE ec.id = ?
  `).get(result.lastInsertRowid) as any;

  res.json(comment);
});

// GET /events/:id/my-awards — user's awards from this event
router.get('/:id/my-awards', (req: AuthRequest, res: Response) => {
  const awards = db.prepare(`
    SELECT * FROM event_awards WHERE event_id = ? AND user_id = ? ORDER BY rank_position ASC NULLS LAST
  `).all(parseInt(req.params.id), req.userId) as any[];

  const activity = db.prepare(`
    SELECT * FROM activities WHERE user_id = ? AND date(start_date) = (SELECT date FROM events WHERE id = ?)
    ORDER BY distance_meters DESC LIMIT 1
  `).get(req.userId, parseInt(req.params.id)) as any;

  res.json({ awards, activity });
});

// POST /events/:id/checkin — check in with organizer code
router.post('/:id/checkin', (req: AuthRequest, res: Response) => {
  const eventId = parseInt(req.params.id);
  const { code } = req.body;

  if (!code) return res.status(400).json({ error: 'Check-in code required' });

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as any;
  if (!event) return res.status(404).json({ error: 'Event not found' });
  if (event.status !== 'live') return res.status(400).json({ error: 'Event is not live yet' });
  if (!event.check_in_code) return res.status(400).json({ error: 'Check-in not enabled for this event' });
  if (code.toUpperCase() !== event.check_in_code.toUpperCase()) {
    return res.status(403).json({ error: 'Invalid check-in code' });
  }

  const existing = db.prepare('SELECT id FROM event_checkins WHERE event_id = ? AND user_id = ?').get(eventId, req.userId) as any;
  if (existing) return res.json({ success: true, already_checked_in: true, message: 'Already checked in!' });

  db.prepare('INSERT INTO event_checkins (event_id, user_id) VALUES (?, ?)').run(eventId, req.userId);
  awardXP(req.userId!, 50, 'event_checkin', `Checked in at: ${event.title}`);

  // Award Kendu for event attendance
  const kenduEarned = awardKenduForEvent(req.userId!, eventId);
  if (kenduEarned > 0) {
    createNotification(req.userId!, 'kendu_earned', `You earned ${kenduEarned} Kendu for attending ${event.title}!`, `+${kenduEarned} Kendu`);
  }

  // Award 10 XP for attendance (on top of check-in XP)
  awardXP(req.userId!, 10, 'event_attendance', `Attended: ${event.title}`);

  res.json({ success: true, already_checked_in: false, message: `Checked in! +50 XP +${kenduEarned} Kendu` });
});

// GET /events/:id/checkins — list checked-in users
router.get('/:id/checkins', (req: AuthRequest, res: Response) => {
  const checkins = db.prepare(`
    SELECT ec.*, u.name, u.profile_image_url
    FROM event_checkins ec
    JOIN users u ON ec.user_id = u.id
    WHERE ec.event_id = ?
    ORDER BY ec.checked_in_at ASC
  `).all(parseInt(req.params.id)) as any[];

  res.json(checkins);
});

// GET /events/:id/recap — post-event recap with stats
router.get('/:id/recap', (req: AuthRequest, res: Response) => {
  const eventId = parseInt(req.params.id);
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as any;
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const attendees = db.prepare(`
    SELECT u.id, u.name, u.profile_image_url
    FROM event_checkins ec
    JOIN users u ON ec.user_id = u.id
    WHERE ec.event_id = ?
  `).all(eventId) as any[];

  const attendeeIds = attendees.map((a: any) => a.id);
  if (attendeeIds.length === 0) {
    return res.json({ event_title: event.title, attendees: [], stats: null, leaderboard: [] });
  }

  const placeholders = attendeeIds.map(() => '?').join(',');
  const eventDate = event.date;

  const runs = db.prepare(`
    SELECT a.user_id, u.name, u.profile_image_url, a.distance_meters, a.moving_time_seconds, a.average_pace_per_km
    FROM activities a
    JOIN users u ON a.user_id = u.id
    WHERE a.user_id IN (${placeholders})
    AND DATE(a.start_date) = ?
    ORDER BY a.average_pace_per_km ASC
  `).all(...attendeeIds, eventDate) as any[];

  const totalDistance = runs.reduce((s: number, r: any) => s + r.distance_meters, 0);
  const avgPace = runs.length > 0 ? runs.reduce((s: number, r: any) => s + r.average_pace_per_km, 0) / runs.length : 0;

  const leaderboard = runs.map((r: any, i: number) => ({
    rank: i + 1,
    name: r.name,
    profile_image_url: r.profile_image_url,
    distance_km: Math.round(r.distance_meters / 100) / 10,
    pace: r.average_pace_per_km,
  }));

  res.json({
    event_title: event.title,
    event_date: event.date,
    attendee_count: attendees.length,
    attendees: attendees.slice(0, 12),
    stats: {
      total_distance_km: Math.round(totalDistance / 1000),
      total_runs: runs.length,
      avg_pace: Math.round(avgPace),
      fastest_runner: leaderboard[0] || null,
    },
    leaderboard: leaderboard.slice(0, 10),
  });
});

export default router;
