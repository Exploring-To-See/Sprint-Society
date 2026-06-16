import { Router, Response } from 'express';
import db from '../database/pg';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createNotification } from './notifications.routes';
import { spendToCreateCommunity, createCommunitySubscription } from '../engine/kenduEngine';

const router = Router();
router.use(authenticate);

// community_requests table is created by schema.sql during initializeDatabase()

const MIN_LEVEL_TO_CREATE = 5;
const MIN_XP_TO_CREATE = 500;

async function awardXP(userId: number, amount: number, source: string, description: string) {
  await db.execute('INSERT INTO user_xp (user_id, total_xp, current_level) VALUES ($1, 0, 1) ON CONFLICT DO NOTHING', [userId]);
  await db.execute('UPDATE user_xp SET total_xp = total_xp + $1 WHERE user_id = $2', [amount, userId]);
  await db.execute('INSERT INTO xp_transactions (user_id, amount, source, description) VALUES ($1, $2, $3, $4)', [userId, amount, source, description]);
}

async function canCreateCommunity(userId: number): Promise<boolean> {
  const xp = await db.queryOne('SELECT total_xp, current_level FROM user_xp WHERE user_id = $1', [userId]) as any;
  if (!xp) return false;
  return xp.current_level >= MIN_LEVEL_TO_CREATE || xp.total_xp >= MIN_XP_TO_CREATE;
}

// GET /communities — browse all
router.get('/', async (req: AuthRequest, res: Response) => {
  const { category, search, page = '1', limit = '20' } = req.query;
  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 20;
  const offset = (pageNum - 1) * limitNum;

  let where = 'WHERE c.deleted_at IS NULL';
  const params: any[] = [req.userId];
  let paramIndex = 2;

  if (category && category !== 'all') {
    where += ` AND c.category = $${paramIndex++}`;
    params.push(category);
  }
  if (search) {
    where += ` AND (c.name LIKE $${paramIndex} OR c.description LIKE $${paramIndex + 1})`;
    params.push(`%${search}%`, `%${search}%`);
    paramIndex += 2;
  }

  params.push(limitNum, offset);

  const communities = await db.query(`
    SELECT c.*,
      u.name as owner_name, u.profile_image_url as owner_image,
      (SELECT role FROM community_members WHERE community_id = c.id AND user_id = $1) as user_role
    FROM communities c
    JOIN users u ON c.owner_id = u.id
    ${where}
    ORDER BY c.member_count DESC, c.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `, params) as any[];

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
router.get('/my', async (req: AuthRequest, res: Response) => {
  const communities = await db.query(`
    SELECT c.*, cm.role as user_role, u.name as owner_name
    FROM community_members cm
    JOIN communities c ON cm.community_id = c.id
    JOIN users u ON c.owner_id = u.id
    WHERE cm.user_id = $1
    ORDER BY cm.joined_at DESC
  `, [req.userId]) as any[];

  res.json(communities.map(c => ({ ...c, is_verified: !!c.is_verified, is_member: true })));
});

// GET /communities/discover — suggested (not yet joined)
router.get('/discover', async (req: AuthRequest, res: Response) => {
  const communities = await db.query(`
    SELECT c.*, u.name as owner_name, u.profile_image_url as owner_image
    FROM communities c
    JOIN users u ON c.owner_id = u.id
    WHERE c.id NOT IN (SELECT community_id FROM community_members WHERE user_id = $1)
    ORDER BY c.member_count DESC
    LIMIT 10
  `, [req.userId]) as any[];

  res.json(communities.map(c => ({ ...c, is_verified: !!c.is_verified, is_member: false })));
});

// GET /communities/:id — community detail + recent posts
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const communityId = parseInt(req.params.id);

  const community = await db.queryOne(`
    SELECT c.*, u.name as owner_name, u.profile_image_url as owner_image,
      (SELECT role FROM community_members WHERE community_id = c.id AND user_id = $1) as user_role
    FROM communities c
    JOIN users u ON c.owner_id = u.id
    WHERE c.id = $2
  `, [req.userId, communityId]) as any;

  if (!community) return res.status(404).json({ error: 'Community not found' });

  const recentPosts = await db.query(`
    SELECT cp.*, u.name as author_name, u.profile_image_url as author_image,
      (SELECT COUNT(*) FROM community_post_likes WHERE post_id = cp.id) as likes_count,
      (SELECT COUNT(*) FROM community_post_likes WHERE post_id = cp.id AND user_id = $1) as user_liked
    FROM community_posts cp
    JOIN users u ON cp.author_id = u.id
    WHERE cp.community_id = $2
    ORDER BY cp.pinned DESC, cp.created_at DESC
    LIMIT 20
  `, [req.userId, communityId]) as any[];

  res.json({
    ...community,
    is_verified: !!community.is_verified,
    is_member: !!community.user_role,
    recent_posts: recentPosts.map(p => ({ ...p, pinned: !!p.pinned, user_liked: p.user_liked > 0 })),
  });
});

// POST /communities — admin-only community creation
router.post('/', async (req: AuthRequest, res: Response) => {
  const user = await db.queryOne('SELECT role FROM users WHERE id = $1', [req.userId]) as any;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Community creation is admin-only. Submit a request via the form and it will be reviewed.' });
  }

  const { name, description, category } = req.body;
  if (!name || name.trim().length === 0) return res.status(400).json({ error: 'Name is required' });
  if (name.length > 100) return res.status(400).json({ error: 'Name too long (max 100 chars)' });

  const validCategories = ['run_club', 'training', 'nutrition', 'wellness', 'social', 'brand', 'custom'];
  const cat = validCategories.includes(category) ? category : 'custom';

  const result = await db.execute(`
    INSERT INTO communities (owner_id, name, description, category, member_count)
    VALUES ($1, $2, $3, $4, 1)
    RETURNING id
  `, [req.userId, name.trim(), description?.trim() || null, cat]);

  const communityId = result.rows[0]?.id;

  await db.execute('INSERT INTO community_members (community_id, user_id, role) VALUES ($1, $2, $3)', [communityId, req.userId, 'owner']);

  await awardXP(req.userId!, 25, 'community_created', `Created community: ${name.trim()}`);

  const community = await db.queryOne('SELECT * FROM communities WHERE id = $1', [communityId]);
  res.status(201).json(community);
});

// PUT /communities/:id — edit community (owner/admin only)
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const communityId = parseInt(req.params.id);
  const member = await db.queryOne('SELECT role FROM community_members WHERE community_id = $1 AND user_id = $2', [communityId, req.userId]) as any;

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return res.status(403).json({ error: 'Only owners and admins can edit' });
  }

  const { name, description, category } = req.body;
  await db.execute(`
    UPDATE communities SET
      name = COALESCE($1, name),
      description = COALESCE($2, description),
      category = COALESCE($3, category),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
  `, [name || null, description || null, category || null, communityId]);

  res.json({ success: true });
});

// POST /communities/:id/join — join community
router.post('/:id/join', async (req: AuthRequest, res: Response) => {
  const communityId = parseInt(req.params.id);

  const community = await db.queryOne('SELECT id, name FROM communities WHERE id = $1', [communityId]) as any;
  if (!community) return res.status(404).json({ error: 'Community not found' });

  try {
    await db.execute('INSERT INTO community_members (community_id, user_id, role) VALUES ($1, $2, $3)', [communityId, req.userId, 'member']);
    await db.execute('UPDATE communities SET member_count = member_count + 1 WHERE id = $1', [communityId]);
    await awardXP(req.userId!, 5, 'community_joined', `Joined: ${community.name}`);
    const ownerIdRow = await db.queryOne('SELECT owner_id FROM communities WHERE id = $1', [communityId]) as any;
    if (ownerIdRow) {
      const actorName = ((await db.queryOne('SELECT name FROM users WHERE id = $1', [req.userId])) as any)?.name || 'Someone';
      createNotification(ownerIdRow.owner_id, 'community_join', `${actorName} joined ${community.name}`, undefined, req.userId, 'community', communityId);
    }
    res.json({ success: true, is_member: true });
  } catch (e: any) {
    if (e.message?.includes('unique') || e.code === '23505') {
      return res.json({ success: true, is_member: true, already_member: true });
    }
    throw e;
  }
});

// DELETE /communities/:id/leave — leave community (cannot leave Sprint Social Club)
router.delete('/:id/leave', async (req: AuthRequest, res: Response) => {
  const communityId = parseInt(req.params.id);

  const community = await db.queryOne('SELECT name FROM communities WHERE id = $1', [communityId]) as any;
  if (community?.name === 'Sprint Social Club') {
    return res.status(403).json({ error: 'Sprint Social Club is mandatory — everyone stays in the crew.' });
  }

  const member = await db.queryOne('SELECT role FROM community_members WHERE community_id = $1 AND user_id = $2', [communityId, req.userId]) as any;
  if (!member) return res.json({ success: true, is_member: false });
  if (member.role === 'owner') return res.status(400).json({ error: 'Owners cannot leave. Transfer ownership first.' });

  await db.execute('DELETE FROM community_members WHERE community_id = $1 AND user_id = $2', [communityId, req.userId]);
  await db.execute('UPDATE communities SET member_count = GREATEST(0, member_count - 1) WHERE id = $1', [communityId]);

  res.json({ success: true, is_member: false });
});

// GET /communities/:id/posts — paginated posts
router.get('/:id/posts', async (req: AuthRequest, res: Response) => {
  const communityId = parseInt(req.params.id);
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  const posts = await db.query(`
    SELECT cp.*, u.name as author_name, u.profile_image_url as author_image,
      (SELECT COUNT(*) FROM community_post_likes WHERE post_id = cp.id) as likes_count,
      (SELECT COUNT(*) FROM community_post_likes WHERE post_id = cp.id AND user_id = $1) as user_liked
    FROM community_posts cp
    JOIN users u ON cp.author_id = u.id
    WHERE cp.community_id = $2
    ORDER BY cp.pinned DESC, cp.created_at DESC
    LIMIT $3 OFFSET $4
  `, [req.userId, communityId, limit, offset]) as any[];

  res.json({
    posts: posts.map(p => ({ ...p, pinned: !!p.pinned, user_liked: p.user_liked > 0 })),
    page,
    has_more: posts.length === limit,
  });
});

// POST /communities/:id/posts — create post (members only)
router.post('/:id/posts', async (req: AuthRequest, res: Response) => {
  const communityId = parseInt(req.params.id);
  const { body, image_url } = req.body;

  if (!body || body.trim().length === 0) return res.status(400).json({ error: 'Post cannot be empty' });
  if (body.length > 2000) return res.status(400).json({ error: 'Post too long (max 2000 chars)' });

  const member = await db.queryOne('SELECT role FROM community_members WHERE community_id = $1 AND user_id = $2', [communityId, req.userId]) as any;
  if (!member) return res.status(403).json({ error: 'You must join this community to post' });

  const result = await db.execute('INSERT INTO community_posts (community_id, author_id, body, image_url) VALUES ($1, $2, $3, $4) RETURNING id', [
    communityId, req.userId, body.trim(), image_url || null
  ]);

  const postId = result.rows[0]?.id;
  const post = await db.queryOne(`
    SELECT cp.*, u.name as author_name, u.profile_image_url as author_image
    FROM community_posts cp JOIN users u ON cp.author_id = u.id WHERE cp.id = $1
  `, [postId]) as any;

  res.status(201).json({ ...post, pinned: false, likes_count: 0, user_liked: false });
});

// POST /communities/:id/posts/:postId/like — like a post
router.post('/:id/posts/:postId/like', async (req: AuthRequest, res: Response) => {
  const postId = parseInt(req.params.postId);

  try {
    await db.execute('INSERT INTO community_post_likes (post_id, user_id) VALUES ($1, $2)', [postId, req.userId]);
    const countRow = await db.queryOne('SELECT COUNT(*) as c FROM community_post_likes WHERE post_id = $1', [postId]) as any;
    res.json({ success: true, likes_count: parseInt(countRow.c), user_liked: true });
  } catch (e: any) {
    if (e.message?.includes('unique') || e.code === '23505') {
      // Unlike
      await db.execute('DELETE FROM community_post_likes WHERE post_id = $1 AND user_id = $2', [postId, req.userId]);
      const countRow = await db.queryOne('SELECT COUNT(*) as c FROM community_post_likes WHERE post_id = $1', [postId]) as any;
      return res.json({ success: true, likes_count: parseInt(countRow.c), user_liked: false });
    }
    throw e;
  }
});

// GET /communities/:id/members — member list
router.get('/:id/members', async (req: AuthRequest, res: Response) => {
  const communityId = parseInt(req.params.id);

  const members = await db.query(`
    SELECT u.id as user_id, u.name, u.profile_image_url, cm.role, cm.joined_at
    FROM community_members cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.community_id = $1
    ORDER BY CASE cm.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, cm.joined_at ASC
  `, [communityId]) as any[];

  res.json(members);
});

// POST /communities/:id/posts/:postId/react — emoji reaction
router.post('/:id/posts/:postId/react', async (req: AuthRequest, res: Response) => {
  const postId = parseInt(req.params.postId);
  const { emoji } = req.body;
  const validEmojis = ['🏃', '🔥', '💪', '👏', '❤️', '😂'];
  if (!emoji || !validEmojis.includes(emoji)) return res.status(400).json({ error: 'Invalid emoji' });

  try {
    await db.execute('INSERT INTO community_post_reactions (post_id, user_id, emoji) VALUES ($1, $2, $3)', [postId, req.userId, emoji]);
  } catch (e: any) {
    if (e.message?.includes('unique') || e.code === '23505') {
      await db.execute('DELETE FROM community_post_reactions WHERE post_id = $1 AND user_id = $2 AND emoji = $3', [postId, req.userId, emoji]);
    }
  }

  const reactions = await db.query('SELECT emoji, COUNT(*) as count FROM community_post_reactions WHERE post_id = $1 GROUP BY emoji', [postId]) as any[];
  const userReactions = await db.query('SELECT emoji FROM community_post_reactions WHERE post_id = $1 AND user_id = $2', [postId, req.userId]) as any[];
  res.json({ reactions, user_reactions: userReactions.map((r: any) => r.emoji) });
});

// POST /communities/:id/posts/:postId/pin — toggle pin (owner/admin only)
router.post('/:id/posts/:postId/pin', async (req: AuthRequest, res: Response) => {
  const communityId = parseInt(req.params.id);
  const postId = parseInt(req.params.postId);

  const member = await db.queryOne('SELECT role FROM community_members WHERE community_id = $1 AND user_id = $2', [communityId, req.userId]) as any;
  if (!member || !['owner', 'admin'].includes(member.role)) {
    return res.status(403).json({ error: 'Only owners/admins can pin posts' });
  }

  const post = await db.queryOne('SELECT pinned FROM community_posts WHERE id = $1 AND community_id = $2', [postId, communityId]) as any;
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const newPinned = post.pinned ? false : true;
  await db.execute('UPDATE community_posts SET pinned = $1 WHERE id = $2', [newPinned, postId]);
  res.json({ success: true, pinned: newPinned });
});

// POST /communities/:id/polls — create poll
router.post('/:id/polls', async (req: AuthRequest, res: Response) => {
  const communityId = parseInt(req.params.id);
  const { question, options, closes_at } = req.body;

  if (!question || !options || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ error: 'Question and at least 2 options required' });
  }

  const member = await db.queryOne('SELECT role FROM community_members WHERE community_id = $1 AND user_id = $2', [communityId, req.userId]) as any;
  if (!member) return res.status(403).json({ error: 'Must be a member to create polls' });

  const result = await db.execute('INSERT INTO community_polls (community_id, author_id, question, options, closes_at) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [communityId, req.userId, question, JSON.stringify(options), closes_at || null]);

  res.status(201).json({ id: result.rows[0]?.id, success: true });
});

// GET /communities/:id/polls — list polls
router.get('/:id/polls', async (req: AuthRequest, res: Response) => {
  const communityId = parseInt(req.params.id);
  const polls = await db.query(`
    SELECT p.*, u.name as author_name,
      (SELECT option_index FROM community_poll_votes WHERE poll_id = p.id AND user_id = $1) as user_vote
    FROM community_polls p
    JOIN users u ON p.author_id = u.id
    WHERE p.community_id = $2
    ORDER BY p.created_at DESC LIMIT 10
  `, [req.userId, communityId]) as any[];

  const pollsWithResults = [];
  for (const p of polls) {
    const votes = await db.query('SELECT option_index, COUNT(*) as count FROM community_poll_votes WHERE poll_id = $1 GROUP BY option_index', [p.id]) as any[];
    const totalVotes = votes.reduce((sum: number, v: any) => sum + parseInt(v.count), 0);
    pollsWithResults.push({
      ...p,
      options: typeof p.options === 'string' ? JSON.parse(p.options) : p.options,
      votes,
      total_votes: totalVotes,
      user_vote: p.user_vote !== null ? p.user_vote : null,
    });
  }

  res.json(pollsWithResults);
});

// POST /communities/:id/polls/:pollId/vote — vote on poll
router.post('/:id/polls/:pollId/vote', async (req: AuthRequest, res: Response) => {
  const pollId = parseInt(req.params.pollId);
  const { option_index } = req.body;

  if (option_index === undefined || option_index < 0) return res.status(400).json({ error: 'option_index required' });

  try {
    await db.execute('INSERT INTO community_poll_votes (poll_id, user_id, option_index) VALUES ($1, $2, $3)', [pollId, req.userId, option_index]);
    res.json({ success: true });
  } catch (e: any) {
    if (e.message?.includes('unique') || e.code === '23505') return res.status(409).json({ error: 'Already voted' });
    throw e;
  }
});

// POST /communities/:id/broadcasts — send broadcast (owner/admin only)
router.post('/:id/broadcasts', async (req: AuthRequest, res: Response) => {
  const communityId = parseInt(req.params.id);
  const { body } = req.body;

  if (!body || body.trim().length === 0) return res.status(400).json({ error: 'Broadcast cannot be empty' });

  const member = await db.queryOne('SELECT role FROM community_members WHERE community_id = $1 AND user_id = $2', [communityId, req.userId]) as any;
  if (!member || !['owner', 'admin'].includes(member.role)) {
    return res.status(403).json({ error: 'Only owners/admins can broadcast' });
  }

  await db.execute('INSERT INTO community_broadcasts (community_id, author_id, body) VALUES ($1, $2, $3)', [communityId, req.userId, body.trim()]);

  // Notify non-muted members
  const community = await db.queryOne('SELECT name FROM communities WHERE id = $1', [communityId]) as any;
  const members = await db.query(`
    SELECT user_id FROM community_members WHERE community_id = $1 AND user_id != $2
    AND user_id NOT IN (SELECT user_id FROM community_mutes WHERE community_id = $1)
  `, [communityId, req.userId]) as any[];

  for (const m of members) {
    await db.execute("INSERT INTO user_notifications (user_id, type, title, body, actor_id, target_type, target_id) VALUES ($1, 'community_post', $2, $3, $4, 'community', $5)",
      [m.user_id, `📢 ${community.name}`, body.trim().slice(0, 100), req.userId, communityId]);
  }

  res.json({ success: true, notified: members.length });
});

// GET /communities/:id/broadcasts — list broadcasts
router.get('/:id/broadcasts', async (req: AuthRequest, res: Response) => {
  const broadcasts = await db.query(`
    SELECT b.*, u.name as author_name, u.profile_image_url as author_image
    FROM community_broadcasts b
    JOIN users u ON b.author_id = u.id
    WHERE b.community_id = $1
    ORDER BY b.created_at DESC LIMIT 20
  `, [parseInt(req.params.id)]) as any[];
  res.json(broadcasts);
});

// POST /communities/:id/mute — toggle mute
router.post('/:id/mute', async (req: AuthRequest, res: Response) => {
  const communityId = parseInt(req.params.id);

  const existing = await db.queryOne('SELECT id FROM community_mutes WHERE community_id = $1 AND user_id = $2', [communityId, req.userId]) as any;
  if (existing) {
    await db.execute('DELETE FROM community_mutes WHERE community_id = $1 AND user_id = $2', [communityId, req.userId]);
    res.json({ success: true, muted: false });
  } else {
    await db.execute('INSERT INTO community_mutes (community_id, user_id) VALUES ($1, $2)', [communityId, req.userId]);
    res.json({ success: true, muted: true });
  }
});

// GET /communities/:id/mute — check mute status
router.get('/:id/mute', async (req: AuthRequest, res: Response) => {
  const muted = !!(await db.queryOne('SELECT id FROM community_mutes WHERE community_id = $1 AND user_id = $2', [parseInt(req.params.id), req.userId]) as any);
  res.json({ muted });
});

// POST /communities/request — submit request for admin approval
router.post('/request', async (req: AuthRequest, res: Response) => {
  const { name, purpose, category, leader_name, contact } = req.body;

  if (!name || !purpose || !leader_name || !contact) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  await db.execute(`
    INSERT INTO community_requests (user_id, name, purpose, category, leader_name, contact)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [req.userId, name, purpose, category || 'custom', leader_name, contact]);

  res.json({ success: true, message: 'Request submitted for review' });
});

// GET /communities/requests — Admin: list pending community requests
router.get('/requests', async (req: AuthRequest, res: Response) => {
  const user = await db.queryOne('SELECT role FROM users WHERE id = $1', [req.userId]) as any;
  if (user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const requests = await db.query(`
    SELECT cr.*, u.name as user_name, u.email as user_email,
      (SELECT spendable_balance FROM kendu_balances WHERE user_id = cr.user_id) as user_balance
    FROM community_requests cr
    JOIN users u ON u.id = cr.user_id
    WHERE cr.status = 'pending'
    ORDER BY cr.created_at DESC
  `, []);

  res.json(requests);
});

// POST /communities/requests/:id/approve — Admin approves, charges Kendu, creates community
router.post('/requests/:id/approve', async (req: AuthRequest, res: Response) => {
  const user = await db.queryOne('SELECT role FROM users WHERE id = $1', [req.userId]) as any;
  if (user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const requestId = parseInt(req.params.id);
  const request = await db.queryOne('SELECT * FROM community_requests WHERE id = $1 AND status = $2', [requestId, 'pending']) as any;
  if (!request) return res.status(404).json({ error: 'Request not found or already processed' });

  const spendResult = await spendToCreateCommunity(request.user_id, request.name);
  if (!spendResult.success) {
    return res.status(402).json({ error: `User doesn't have enough Kendu (needs 1000). Balance: ${spendResult.newBalance}` });
  }

  const validCategories = ['run_club', 'training', 'nutrition', 'wellness', 'social', 'brand', 'custom'];
  const cat = validCategories.includes(request.category) ? request.category : 'custom';

  const result = await db.execute(`
    INSERT INTO communities (owner_id, name, description, category, member_count)
    VALUES ($1, $2, $3, $4, 1)
    RETURNING id
  `, [request.user_id, request.name, request.purpose, cat]);

  const communityId = result.rows[0]?.id as number;
  await db.execute('INSERT INTO community_members (community_id, user_id, role) VALUES ($1, $2, $3)', [communityId, request.user_id, 'owner']);
  createCommunitySubscription(request.user_id, communityId);

  await db.execute("UPDATE community_requests SET status = 'approved', reviewed_at = NOW() WHERE id = $1", [requestId]);
  res.json({ message: 'Approved', communityId, kenduCharged: 1000 });
});

// POST /communities/requests/:id/reject — Admin rejects (no charge)
router.post('/requests/:id/reject', async (req: AuthRequest, res: Response) => {
  const user = await db.queryOne('SELECT role FROM users WHERE id = $1', [req.userId]) as any;
  if (user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const requestId = parseInt(req.params.id);
  const request = await db.queryOne('SELECT * FROM community_requests WHERE id = $1 AND status = $2', [requestId, 'pending']) as any;
  if (!request) return res.status(404).json({ error: 'Request not found or already processed' });

  await db.execute("UPDATE community_requests SET status = 'rejected', reviewed_at = NOW() WHERE id = $1", [requestId]);
  res.json({ message: 'Rejected, no Kendu charged' });
});

// GET /communities/:id/chat — chat message history
router.get('/:id/chat', async (req: AuthRequest, res: Response) => {
  const communityId = parseInt(req.params.id);
  const limit = parseInt(req.query.limit as string) || 50;
  const before = req.query.before as string;

  let query = `
    SELECT m.id, m.body, m.created_at, m.user_id, u.name as user_name, u.profile_image_url
    FROM community_chat_messages m
    JOIN users u ON m.user_id = u.id
    WHERE m.community_id = $1
  `;
  const params: any[] = [communityId];
  let paramIndex = 2;

  if (before) {
    query += ` AND m.id < $${paramIndex++}`;
    params.push(parseInt(before));
  }

  query += ` ORDER BY m.id DESC LIMIT $${paramIndex}`;
  params.push(limit);

  const messages = await db.query(query, params) as any[];

  res.json({ messages: messages.reverse(), has_more: messages.length === limit });
});

// GET /communities/:id/leaderboard — weekly leaderboard for community members
router.get('/:id/leaderboard', async (req: AuthRequest, res: Response) => {
  const communityId = parseInt(req.params.id);
  const period = (req.query.period as string) || 'week';
  const dateInterval = period === 'month' ? '30 days' : '7 days';

  const leaderboard = await db.query(`
    SELECT u.id, u.name, u.profile_image_url,
      COALESCE(SUM(a.distance_meters), 0) as total_distance,
      COUNT(a.id) as total_runs,
      MIN(a.average_pace_per_km) as best_pace,
      ux.current_streak_days as streak
    FROM community_members cm
    JOIN users u ON cm.user_id = u.id
    LEFT JOIN activities a ON a.user_id = u.id AND a.start_date > NOW() - INTERVAL '${dateInterval}'
    LEFT JOIN user_xp ux ON ux.user_id = u.id
    WHERE cm.community_id = $1
    GROUP BY u.id, u.name, u.profile_image_url, ux.current_streak_days
    HAVING COUNT(a.id) > 0
    ORDER BY total_distance DESC
    LIMIT 20
  `, [communityId]) as any[];

  const myRank = leaderboard.findIndex(r => r.id === req.userId) + 1;

  res.json({
    leaderboard: leaderboard.map((r, i) => ({
      rank: i + 1,
      user_id: r.id,
      name: r.name,
      profile_image_url: r.profile_image_url,
      total_distance_km: Math.round(r.total_distance / 100) / 10,
      total_runs: parseInt(r.total_runs),
      best_pace: r.best_pace,
      streak: r.streak || 0,
    })),
    my_rank: myRank || null,
    period,
  });
});

// GET /communities/:id/digest — auto-generated weekly summary
router.get('/:id/digest', async (req: AuthRequest, res: Response) => {
  const communityId = parseInt(req.params.id);

  const stats = await db.queryOne(`
    SELECT
      COUNT(DISTINCT a.user_id) as active_members,
      COUNT(a.id) as total_runs,
      COALESCE(SUM(a.distance_meters), 0) as total_distance,
      COALESCE(AVG(a.average_pace_per_km), 0) as avg_pace
    FROM community_members cm
    JOIN activities a ON a.user_id = cm.user_id AND a.start_date > NOW() - INTERVAL '7 days'
    WHERE cm.community_id = $1
  `, [communityId]) as any;

  const topRunner = await db.queryOne(`
    SELECT u.name, SUM(a.distance_meters) as dist
    FROM community_members cm
    JOIN users u ON cm.user_id = u.id
    JOIN activities a ON a.user_id = u.id AND a.start_date > NOW() - INTERVAL '7 days'
    WHERE cm.community_id = $1
    GROUP BY u.id, u.name ORDER BY dist DESC LIMIT 1
  `, [communityId]) as any;

  const memberCount = ((await db.queryOne('SELECT member_count FROM communities WHERE id = $1', [communityId])) as any)?.member_count || 0;

  res.json({
    period: 'This week',
    active_members: parseInt(stats?.active_members) || 0,
    total_members: memberCount,
    total_runs: parseInt(stats?.total_runs) || 0,
    total_distance_km: Math.round((stats?.total_distance || 0) / 1000),
    avg_pace: stats?.avg_pace || 0,
    top_runner: topRunner ? { name: topRunner.name, distance_km: Math.round(topRunner.dist / 1000) } : null,
  });
});

export default router;
