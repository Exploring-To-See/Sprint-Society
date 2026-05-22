import { Router, Response } from 'express';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createNotification } from './notifications.routes';

const router = Router();
router.use(authenticate);

const MIN_LEVEL_TO_CREATE = 5;
const MIN_XP_TO_CREATE = 500;

function awardXP(userId: number, amount: number, source: string, description: string) {
  db.prepare('INSERT OR IGNORE INTO user_xp (user_id, total_xp, current_level) VALUES (?, 0, 1)').run(userId);
  db.prepare('UPDATE user_xp SET total_xp = total_xp + ? WHERE user_id = ?').run(amount, userId);
  db.prepare('INSERT INTO xp_transactions (user_id, amount, source, description) VALUES (?, ?, ?, ?)').run(userId, amount, source, description);
}

function canCreateCommunity(userId: number): boolean {
  const xp = db.prepare('SELECT total_xp, current_level FROM user_xp WHERE user_id = ?').get(userId) as any;
  if (!xp) return false;
  return xp.current_level >= MIN_LEVEL_TO_CREATE || xp.total_xp >= MIN_XP_TO_CREATE;
}

// GET /communities — browse all
router.get('/', (req: AuthRequest, res: Response) => {
  const { category, search, page = '1', limit = '20' } = req.query;
  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 20;
  const offset = (pageNum - 1) * limitNum;

  let where = 'WHERE 1=1';
  const params: any[] = [];

  if (category && category !== 'all') {
    where += ' AND c.category = ?';
    params.push(category);
  }
  if (search) {
    where += ' AND (c.name LIKE ? OR c.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  const communities = db.prepare(`
    SELECT c.*,
      u.name as owner_name, u.profile_image_url as owner_image,
      (SELECT role FROM community_members WHERE community_id = c.id AND user_id = ?) as user_role
    FROM communities c
    JOIN users u ON c.owner_id = u.id
    ${where}
    ORDER BY c.member_count DESC, c.created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.userId, ...params, limitNum, offset) as any[];

  res.json({
    communities: communities.map(c => ({
      ...c,
      is_verified: !!c.is_verified,
      is_member: !!c.user_role,
    })),
    page: pageNum,
    has_more: communities.length === limitNum,
  });
});

// GET /communities/my — communities user belongs to
router.get('/my', (req: AuthRequest, res: Response) => {
  const communities = db.prepare(`
    SELECT c.*, cm.role as user_role, u.name as owner_name
    FROM community_members cm
    JOIN communities c ON cm.community_id = c.id
    JOIN users u ON c.owner_id = u.id
    WHERE cm.user_id = ?
    ORDER BY cm.joined_at DESC
  `).all(req.userId) as any[];

  res.json(communities.map(c => ({ ...c, is_verified: !!c.is_verified, is_member: true })));
});

// GET /communities/discover — suggested (not yet joined)
router.get('/discover', (req: AuthRequest, res: Response) => {
  const communities = db.prepare(`
    SELECT c.*, u.name as owner_name, u.profile_image_url as owner_image
    FROM communities c
    JOIN users u ON c.owner_id = u.id
    WHERE c.id NOT IN (SELECT community_id FROM community_members WHERE user_id = ?)
    ORDER BY c.member_count DESC
    LIMIT 10
  `).all(req.userId) as any[];

  res.json(communities.map(c => ({ ...c, is_verified: !!c.is_verified, is_member: false })));
});

// GET /communities/:id — community detail + recent posts
router.get('/:id', (req: AuthRequest, res: Response) => {
  const communityId = parseInt(req.params.id);

  const community = db.prepare(`
    SELECT c.*, u.name as owner_name, u.profile_image_url as owner_image,
      (SELECT role FROM community_members WHERE community_id = c.id AND user_id = ?) as user_role
    FROM communities c
    JOIN users u ON c.owner_id = u.id
    WHERE c.id = ?
  `).get(req.userId, communityId) as any;

  if (!community) return res.status(404).json({ error: 'Community not found' });

  const recentPosts = db.prepare(`
    SELECT cp.*, u.name as author_name, u.profile_image_url as author_image,
      (SELECT COUNT(*) FROM community_post_likes WHERE post_id = cp.id) as likes_count,
      (SELECT COUNT(*) FROM community_post_likes WHERE post_id = cp.id AND user_id = ?) as user_liked
    FROM community_posts cp
    JOIN users u ON cp.author_id = u.id
    WHERE cp.community_id = ?
    ORDER BY cp.pinned DESC, cp.created_at DESC
    LIMIT 20
  `).all(req.userId, communityId) as any[];

  res.json({
    ...community,
    is_verified: !!community.is_verified,
    is_member: !!community.user_role,
    recent_posts: recentPosts.map(p => ({ ...p, pinned: !!p.pinned, user_liked: p.user_liked > 0 })),
  });
});

// POST /communities — admin-only community creation
router.post('/', (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.userId) as any;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Community creation is admin-only. Submit a request via the form and it will be reviewed.' });
  }

  const { name, description, category } = req.body;
  if (!name || name.trim().length === 0) return res.status(400).json({ error: 'Name is required' });
  if (name.length > 100) return res.status(400).json({ error: 'Name too long (max 100 chars)' });

  const validCategories = ['run_club', 'training', 'nutrition', 'wellness', 'social', 'brand', 'custom'];
  const cat = validCategories.includes(category) ? category : 'custom';

  const result = db.prepare(`
    INSERT INTO communities (owner_id, name, description, category, member_count)
    VALUES (?, ?, ?, ?, 1)
  `).run(req.userId, name.trim(), description?.trim() || null, cat);

  const communityId = result.lastInsertRowid;

  db.prepare('INSERT INTO community_members (community_id, user_id, role) VALUES (?, ?, ?)').run(communityId, req.userId, 'owner');

  awardXP(req.userId!, 25, 'community_created', `Created community: ${name.trim()}`);

  const community = db.prepare('SELECT * FROM communities WHERE id = ?').get(communityId);
  res.status(201).json(community);
});

// PUT /communities/:id — edit community (owner/admin only)
router.put('/:id', (req: AuthRequest, res: Response) => {
  const communityId = parseInt(req.params.id);
  const member = db.prepare('SELECT role FROM community_members WHERE community_id = ? AND user_id = ?').get(communityId, req.userId) as any;

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return res.status(403).json({ error: 'Only owners and admins can edit' });
  }

  const { name, description, category } = req.body;
  db.prepare(`
    UPDATE communities SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      category = COALESCE(?, category),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name || null, description || null, category || null, communityId);

  res.json({ success: true });
});

// POST /communities/:id/join — join community
router.post('/:id/join', (req: AuthRequest, res: Response) => {
  const communityId = parseInt(req.params.id);

  const community = db.prepare('SELECT id, name FROM communities WHERE id = ?').get(communityId) as any;
  if (!community) return res.status(404).json({ error: 'Community not found' });

  try {
    db.prepare('INSERT INTO community_members (community_id, user_id, role) VALUES (?, ?, ?)').run(communityId, req.userId, 'member');
    db.prepare('UPDATE communities SET member_count = member_count + 1 WHERE id = ?').run(communityId);
    awardXP(req.userId!, 5, 'community_joined', `Joined: ${community.name}`);
    const ownerIdRow = db.prepare('SELECT owner_id FROM communities WHERE id = ?').get(communityId) as any;
    if (ownerIdRow) {
      const actorName = (db.prepare('SELECT name FROM users WHERE id = ?').get(req.userId) as any)?.name || 'Someone';
      createNotification(ownerIdRow.owner_id, 'community_join', `${actorName} joined ${community.name}`, undefined, req.userId, 'community', communityId);
    }
    res.json({ success: true, is_member: true });
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) {
      return res.json({ success: true, is_member: true, already_member: true });
    }
    throw e;
  }
});

// DELETE /communities/:id/leave — leave community (cannot leave Sprint Social Club)
router.delete('/:id/leave', (req: AuthRequest, res: Response) => {
  const communityId = parseInt(req.params.id);

  const community = db.prepare('SELECT name FROM communities WHERE id = ?').get(communityId) as any;
  if (community?.name === 'Sprint Social Club') {
    return res.status(403).json({ error: 'Sprint Social Club is mandatory — everyone stays in the crew.' });
  }

  const member = db.prepare('SELECT role FROM community_members WHERE community_id = ? AND user_id = ?').get(communityId, req.userId) as any;
  if (!member) return res.json({ success: true, is_member: false });
  if (member.role === 'owner') return res.status(400).json({ error: 'Owners cannot leave. Transfer ownership first.' });

  db.prepare('DELETE FROM community_members WHERE community_id = ? AND user_id = ?').run(communityId, req.userId);
  db.prepare('UPDATE communities SET member_count = MAX(0, member_count - 1) WHERE id = ?').run(communityId);

  res.json({ success: true, is_member: false });
});

// GET /communities/:id/posts — paginated posts
router.get('/:id/posts', (req: AuthRequest, res: Response) => {
  const communityId = parseInt(req.params.id);
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  const posts = db.prepare(`
    SELECT cp.*, u.name as author_name, u.profile_image_url as author_image,
      (SELECT COUNT(*) FROM community_post_likes WHERE post_id = cp.id) as likes_count,
      (SELECT COUNT(*) FROM community_post_likes WHERE post_id = cp.id AND user_id = ?) as user_liked
    FROM community_posts cp
    JOIN users u ON cp.author_id = u.id
    WHERE cp.community_id = ?
    ORDER BY cp.pinned DESC, cp.created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.userId, communityId, limit, offset) as any[];

  res.json({
    posts: posts.map(p => ({ ...p, pinned: !!p.pinned, user_liked: p.user_liked > 0 })),
    page,
    has_more: posts.length === limit,
  });
});

// POST /communities/:id/posts — create post (members only)
router.post('/:id/posts', (req: AuthRequest, res: Response) => {
  const communityId = parseInt(req.params.id);
  const { body, image_url } = req.body;

  if (!body || body.trim().length === 0) return res.status(400).json({ error: 'Post cannot be empty' });
  if (body.length > 2000) return res.status(400).json({ error: 'Post too long (max 2000 chars)' });

  const member = db.prepare('SELECT role FROM community_members WHERE community_id = ? AND user_id = ?').get(communityId, req.userId) as any;
  if (!member) return res.status(403).json({ error: 'You must join this community to post' });

  const result = db.prepare('INSERT INTO community_posts (community_id, author_id, body, image_url) VALUES (?, ?, ?, ?)').run(
    communityId, req.userId, body.trim(), image_url || null
  );

  const post = db.prepare(`
    SELECT cp.*, u.name as author_name, u.profile_image_url as author_image
    FROM community_posts cp JOIN users u ON cp.author_id = u.id WHERE cp.id = ?
  `).get(result.lastInsertRowid) as any;

  res.status(201).json({ ...post, pinned: false, likes_count: 0, user_liked: false });
});

// POST /communities/:id/posts/:postId/like — like a post
router.post('/:id/posts/:postId/like', (req: AuthRequest, res: Response) => {
  const postId = parseInt(req.params.postId);

  try {
    db.prepare('INSERT INTO community_post_likes (post_id, user_id) VALUES (?, ?)').run(postId, req.userId);
    const count = (db.prepare('SELECT COUNT(*) as c FROM community_post_likes WHERE post_id = ?').get(postId) as any).c;
    res.json({ success: true, likes_count: count, user_liked: true });
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) {
      // Unlike
      db.prepare('DELETE FROM community_post_likes WHERE post_id = ? AND user_id = ?').run(postId, req.userId);
      const count = (db.prepare('SELECT COUNT(*) as c FROM community_post_likes WHERE post_id = ?').get(postId) as any).c;
      return res.json({ success: true, likes_count: count, user_liked: false });
    }
    throw e;
  }
});

// GET /communities/:id/members — member list
router.get('/:id/members', (req: AuthRequest, res: Response) => {
  const communityId = parseInt(req.params.id);

  const members = db.prepare(`
    SELECT u.id as user_id, u.name, u.profile_image_url, cm.role, cm.joined_at
    FROM community_members cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.community_id = ?
    ORDER BY CASE cm.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, cm.joined_at ASC
  `).all(communityId) as any[];

  res.json(members);
});

// POST /communities/request — submit request for admin approval
router.post('/request', (req: AuthRequest, res: Response) => {
  const { name, purpose, category, leader_name, contact } = req.body;

  if (!name || !purpose || !leader_name || !contact) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  db.prepare(`
    CREATE TABLE IF NOT EXISTS community_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      purpose TEXT NOT NULL,
      category TEXT DEFAULT 'custom',
      leader_name TEXT NOT NULL,
      contact TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      reviewed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `).run();

  db.prepare(`
    INSERT INTO community_requests (user_id, name, purpose, category, leader_name, contact)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.userId, name, purpose, category || 'custom', leader_name, contact);

  res.json({ success: true, message: 'Request submitted for review' });
});

export default router;
