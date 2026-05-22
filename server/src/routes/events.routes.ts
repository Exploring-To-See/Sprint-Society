import { Router, Response } from 'express';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createNotification } from './notifications.routes';

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

  res.json({
    events: events.map(e => ({
      ...e,
      is_recurring: !!e.is_recurring,
      is_full: e.max_attendees ? e.attendee_count >= e.max_attendees : false,
    })),
    page: pageNum,
    has_more: events.length === limitNum,
  });
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

  res.json({ success: true, already_checked_in: false, message: 'Checked in! +50 XP' });
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

export default router;
