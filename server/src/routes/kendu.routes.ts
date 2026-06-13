import { Router, Response } from 'express';
import db from '../database/pg';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  calculateKenduForRun,
  detectPersonalBest,
  awardKenduForEvent,
  awardKenduForWorkout,
  awardKenduForPlan,
  getKenduBalance,
  redeemOffer,
  calculateLevel,
  spendToCreateCommunity,
  spendToHostEvent,
  spendForChallenge,
  awardChallengeWinner,
  spendForPriorityRSVP,
  giftKendu,
  spendForCardSkin,
  spendToBoostPost,
  spendToCreateGroupChallenge,
  spendForAIDeepDive,
  spendToSponsorLeaderboard,
  createCommunitySubscription,
  reactivateCommunity,
  checkAllUpkeepDue,
  getEconomyStats,
  resolveExpiredChallenges,
} from '../engine/kenduEngine';

const router = Router();
router.use(authenticate);

// user_skins table is created by schema.sql during initializeDatabase()

// POST /kendu/earn — Award Kendu after a run (admin only — normal earning happens via runCascade)
router.post('/earn', async (req: AuthRequest, res: Response) => {
  const user = await db.queryOne('SELECT role FROM users WHERE id = $1', [req.userId]) as any;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Kendu earning is handled automatically. This endpoint is admin-only.' });
  }

  const { km, wasCoachAssigned, isPersonalBest } = req.body;

  if (!km || km <= 0) {
    return res.status(400).json({ error: 'km is required and must be positive' });
  }

  const result = calculateKenduForRun(
    req.userId!,
    km,
    wasCoachAssigned || false,
    isPersonalBest || false
  );

  res.json(result);
});

// POST /kendu/earn-event — Award Kendu for community event
router.post('/earn-event', (req: AuthRequest, res: Response) => {
  const { eventId } = req.body;
  if (!eventId) return res.status(400).json({ error: 'eventId required' });

  const awarded = awardKenduForEvent(req.userId!, eventId);
  const balance = getKenduBalance(req.userId!);

  res.json({ pointsEarned: awarded, newBalance: balance.spendable_balance });
});

// POST /kendu/earn-plan — Award Kendu for completing training plan
router.post('/earn-plan', (req: AuthRequest, res: Response) => {
  const { planId } = req.body;

  const awarded = awardKenduForPlan(req.userId!, planId);
  const balance = getKenduBalance(req.userId!);

  res.json({ pointsEarned: awarded, newBalance: balance.spendable_balance });
});

// POST /kendu/earn-workout — Award Kendu for completing a coach workout
router.post('/earn-workout', (req: AuthRequest, res: Response) => {
  const { sessionId } = req.body;

  const awarded = awardKenduForWorkout(req.userId!, sessionId);
  const balance = getKenduBalance(req.userId!);

  res.json({ pointsEarned: awarded, newBalance: balance.spendable_balance });
});

// GET /kendu/balance — Get current user's balance
router.get('/balance', (req: AuthRequest, res: Response) => {
  const balance = getKenduBalance(req.userId!);
  res.json(balance);
});

// GET /kendu/balance/:userId — Get specific user's balance (public info)
router.get('/balance/:userId', (req: AuthRequest, res: Response) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) return res.status(400).json({ error: 'Invalid userId' });

  const balance = getKenduBalance(userId);
  res.json(balance);
});

// GET /kendu/history — Paginated transaction log
router.get('/history', async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  const transactions = await db.query(`
    SELECT id, amount, source, metadata, created_at
    FROM kendu_transactions
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `, [req.userId, limit, offset]);

  const total = await db.queryOne('SELECT COUNT(*) as count FROM kendu_transactions WHERE user_id = $1', [req.userId]) as { count: number };

  res.json({
    transactions: transactions.map((t: any) => ({
      ...t,
      metadata: t.metadata ? JSON.parse(t.metadata) : null,
    })),
    page,
    limit,
    total: total.count,
    totalPages: Math.ceil(total.count / limit),
  });
});

// GET /kendu/offers — List active offers
router.get('/offers', async (req: AuthRequest, res: Response) => {
  const eventId = req.query.eventId ? parseInt(req.query.eventId as string) : null;

  let query = `
    SELECT * FROM kendu_offers
    WHERE active = 1 AND (expires_at IS NULL OR expires_at > NOW())
  `;
  const params: any[] = [];
  let paramIndex = 1;

  if (eventId) {
    query += ` AND event_id = $${paramIndex}`;
    params.push(eventId);
    paramIndex++;
  }

  query += ' ORDER BY kendu_cost ASC';

  const offers = await db.query(query, params);

  const userRedemptions = await db.query(`
    SELECT offer_id, COUNT(*) as count FROM kendu_redemptions WHERE user_id = $1 GROUP BY offer_id
  `, [req.userId]) as { offer_id: number; count: number }[];

  const redemptionMap = new Map(userRedemptions.map(r => [r.offer_id, r.count]));

  res.json(offers.map((o: any) => ({
    ...o,
    active: !!o.active,
    user_redeemed: (redemptionMap.get(o.id) || 0) >= o.max_per_user,
  })));
});

// POST /kendu/redeem — Redeem an offer
router.post('/redeem', (req: AuthRequest, res: Response) => {
  const { offerId } = req.body;
  if (!offerId) return res.status(400).json({ error: 'offerId required' });

  const result = redeemOffer(req.userId!, offerId);

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({ couponCode: result.couponCode, newBalance: result.newBalance });
});

// GET /kendu/leaderboard — Top earners
router.get('/leaderboard', async (req: AuthRequest, res: Response) => {
  const eventId = req.query.eventId ? parseInt(req.query.eventId as string) : null;
  const limit = parseInt(req.query.limit as string) || 10;

  let leaders;

  if (eventId) {
    leaders = await db.query(`
      SELECT kt.user_id, u.name, u.profile_image_url, SUM(kt.amount) as total_earned
      FROM kendu_transactions kt
      JOIN users u ON u.id = kt.user_id
      WHERE kt.amount > 0 AND kt.metadata LIKE $1
      GROUP BY kt.user_id, u.name, u.profile_image_url
      ORDER BY total_earned DESC
      LIMIT $2
    `, [`%"eventId":${eventId}%`, limit]);
  } else {
    leaders = await db.query(`
      SELECT kb.user_id, u.name, u.profile_image_url, kb.lifetime_earned as total_earned, kb.current_streak_days
      FROM kendu_balances kb
      JOIN users u ON u.id = kb.user_id
      ORDER BY kb.lifetime_earned DESC
      LIMIT $1
    `, [limit]);
  }

  res.json(leaders.map((l: any, i: number) => ({
    rank: i + 1,
    user_id: l.user_id,
    name: l.name,
    profile_image_url: l.profile_image_url,
    total_earned: l.total_earned,
    current_streak_days: l.current_streak_days || 0,
    level: calculateLevel(l.total_earned),
  })));
});

// ===== ADMIN ENDPOINTS =====

// POST /kendu/admin/offers — Create a new offer
router.post('/admin/offers', async (req: AuthRequest, res: Response) => {
  const user = await db.queryOne('SELECT role FROM users WHERE id = $1', [req.userId]) as any;
  if (user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const { brand_name, offer_title, description, kendu_cost, rupee_value, total_quantity, expires_at, event_id, max_per_user } = req.body;

  if (!brand_name || !offer_title || !kendu_cost || !total_quantity) {
    return res.status(400).json({ error: 'brand_name, offer_title, kendu_cost, and total_quantity are required' });
  }

  const result = await db.execute(`
    INSERT INTO kendu_offers (brand_name, offer_title, description, kendu_cost, rupee_value, total_quantity, remaining_quantity, expires_at, event_id, max_per_user)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id
  `, [brand_name, offer_title, description || null, kendu_cost, rupee_value || null, total_quantity, total_quantity, expires_at || null, event_id || null, max_per_user || 1]);

  res.status(201).json({ id: result.rows[0]?.id, message: 'Offer created' });
});

// PUT /kendu/admin/offers/:id — Update an offer
router.put('/admin/offers/:id', async (req: AuthRequest, res: Response) => {
  const user = await db.queryOne('SELECT role FROM users WHERE id = $1', [req.userId]) as any;
  if (user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const offerId = parseInt(req.params.id);
  const { brand_name, offer_title, description, kendu_cost, rupee_value, total_quantity, remaining_quantity, active, expires_at, event_id, max_per_user } = req.body;

  const existing = await db.queryOne('SELECT * FROM kendu_offers WHERE id = $1', [offerId]) as any;
  if (!existing) return res.status(404).json({ error: 'Offer not found' });

  await db.execute(`
    UPDATE kendu_offers SET
      brand_name = $1, offer_title = $2, description = $3, kendu_cost = $4, rupee_value = $5,
      total_quantity = $6, remaining_quantity = $7, active = $8, expires_at = $9, event_id = $10, max_per_user = $11
    WHERE id = $12
  `, [
    brand_name ?? existing.brand_name,
    offer_title ?? existing.offer_title,
    description ?? existing.description,
    kendu_cost ?? existing.kendu_cost,
    rupee_value ?? existing.rupee_value,
    total_quantity ?? existing.total_quantity,
    remaining_quantity ?? existing.remaining_quantity,
    active !== undefined ? (active ? 1 : 0) : existing.active,
    expires_at ?? existing.expires_at,
    event_id ?? existing.event_id,
    max_per_user ?? existing.max_per_user,
    offerId
  ]);

  res.json({ message: 'Offer updated' });
});

// DELETE /kendu/admin/offers/:id — Deactivate an offer
router.delete('/admin/offers/:id', async (req: AuthRequest, res: Response) => {
  const user = await db.queryOne('SELECT role FROM users WHERE id = $1', [req.userId]) as any;
  if (user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const offerId = parseInt(req.params.id);
  await db.execute('UPDATE kendu_offers SET active = 0 WHERE id = $1', [offerId]);
  res.json({ message: 'Offer deactivated' });
});

// POST /kendu/admin/offers/:id/codes — Bulk upload coupon codes
router.post('/admin/offers/:id/codes', async (req: AuthRequest, res: Response) => {
  const user = await db.queryOne('SELECT role FROM users WHERE id = $1', [req.userId]) as any;
  if (user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const offerId = parseInt(req.params.id);
  const { codes } = req.body;

  if (!codes || !Array.isArray(codes) || codes.length === 0) {
    return res.status(400).json({ error: 'codes array is required' });
  }

  const offer = await db.queryOne('SELECT id FROM kendu_offers WHERE id = $1', [offerId]);
  if (!offer) return res.status(404).json({ error: 'Offer not found' });

  for (const code of codes) {
    await db.execute('INSERT INTO kendu_coupon_codes (offer_id, code) VALUES ($1, $2)', [offerId, code.trim()]);
  }

  await db.execute('UPDATE kendu_offers SET total_quantity = total_quantity + $1, remaining_quantity = remaining_quantity + $2 WHERE id = $3',
    [codes.length, codes.length, offerId]);

  res.json({ message: `${codes.length} codes uploaded`, offerId });
});

// GET /kendu/admin/stats — Dashboard stats
router.get('/admin/stats', async (req: AuthRequest, res: Response) => {
  const user = await db.queryOne('SELECT role FROM users WHERE id = $1', [req.userId]) as any;
  if (user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const totalInCirculation = await db.queryOne('SELECT COALESCE(SUM(spendable_balance), 0) as total FROM kendu_balances') as { total: number };
  const totalLifetimeEarned = await db.queryOne('SELECT COALESCE(SUM(lifetime_earned), 0) as total FROM kendu_balances') as { total: number };
  const totalRedemptions = await db.queryOne('SELECT COUNT(*) as count FROM kendu_redemptions') as { count: number };
  const totalKenduSpent = await db.queryOne('SELECT COALESCE(SUM(kendu_spent), 0) as total FROM kendu_redemptions') as { total: number };
  const activeOffers = await db.queryOne("SELECT COUNT(*) as count FROM kendu_offers WHERE active = 1 AND (expires_at IS NULL OR expires_at > NOW())") as { count: number };
  const topEarner = await db.queryOne(`
    SELECT kb.user_id, u.name, kb.lifetime_earned
    FROM kendu_balances kb JOIN users u ON u.id = kb.user_id
    ORDER BY kb.lifetime_earned DESC LIMIT 1
  `) as any;

  res.json({
    total_in_circulation: totalInCirculation.total,
    total_lifetime_earned: totalLifetimeEarned.total,
    total_redemptions: totalRedemptions.count,
    total_kendu_spent: totalKenduSpent.total,
    active_offers: activeOffers.count,
    top_earner: topEarner || null,
  });
});

// GET /kendu/admin/redemptions — All redemptions
router.get('/admin/redemptions', async (req: AuthRequest, res: Response) => {
  const user = await db.queryOne('SELECT role FROM users WHERE id = $1', [req.userId]) as any;
  if (user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = (page - 1) * limit;

  const redemptions = await db.query(`
    SELECT kr.*, u.name as user_name, ko.offer_title, ko.brand_name
    FROM kendu_redemptions kr
    JOIN users u ON u.id = kr.user_id
    JOIN kendu_offers ko ON ko.id = kr.offer_id
    ORDER BY kr.redeemed_at DESC
    LIMIT $1 OFFSET $2
  `, [limit, offset]);

  const total = await db.queryOne('SELECT COUNT(*) as count FROM kendu_redemptions') as { count: number };

  res.json({ redemptions, page, limit, total: total.count });
});

// GET /kendu/admin/economy — Economy health metrics
router.get('/admin/economy', async (req: AuthRequest, res: Response) => {
  const user = await db.queryOne('SELECT role FROM users WHERE id = $1', [req.userId]) as any;
  if (user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const stats = getEconomyStats();

  const weeklyEarned = await db.queryOne(`
    SELECT COALESCE(SUM(amount), 0) as total FROM kendu_transactions
    WHERE amount > 0 AND created_at >= NOW() - INTERVAL '7 days'
  `) as { total: number };

  const weeklySpent = await db.queryOne(`
    SELECT COALESCE(SUM(ABS(amount)), 0) as total FROM kendu_transactions
    WHERE amount < 0 AND created_at >= NOW() - INTERVAL '7 days'
  `) as { total: number };

  const activeChallenges = await db.queryOne(`
    SELECT COUNT(*) as count FROM kendu_challenges WHERE status IN ('pending', 'accepted', 'active')
  `) as { count: number };

  const totalPotValue = await db.queryOne(`
    SELECT COALESCE(SUM(stake_amount * 2), 0) as total FROM kendu_challenges WHERE status IN ('accepted', 'active')
  `) as { total: number };

  res.json({
    ...stats,
    weekly_earned: weeklyEarned.total,
    weekly_spent: weeklySpent.total,
    net_flow_ratio: weeklyEarned.total > 0 ? (weeklySpent.total / weeklyEarned.total).toFixed(2) : '0',
    active_challenges: activeChallenges.count,
    total_challenge_pot: totalPotValue.total,
  });
});

// POST /kendu/admin/process-upkeep — Manually trigger upkeep processing
router.post('/admin/process-upkeep', async (req: AuthRequest, res: Response) => {
  const user = await db.queryOne('SELECT role FROM users WHERE id = $1', [req.userId]) as any;
  if (user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const result = checkAllUpkeepDue();
  res.json(result);
});

// POST /kendu/admin/resolve-challenges — Manually trigger challenge resolution
router.post('/admin/resolve-challenges', async (req: AuthRequest, res: Response) => {
  const user = await db.queryOne('SELECT role FROM users WHERE id = $1', [req.userId]) as any;
  if (user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const result = resolveExpiredChallenges();
  res.json(result);
});

// ===== SPENDING ENDPOINTS =====

// POST /kendu/spend/community — Spend Kendu to create a community
router.post('/spend/community', (req: AuthRequest, res: Response) => {
  const { communityName } = req.body;
  if (!communityName) return res.status(400).json({ error: 'communityName required' });

  const result = spendToCreateCommunity(req.userId!, communityName);
  if (!result.success) return res.status(402).json({ error: result.error });
  res.json(result);
});

// POST /kendu/spend/event — Spend Kendu to host an event
router.post('/spend/event', (req: AuthRequest, res: Response) => {
  const { eventTitle } = req.body;
  if (!eventTitle) return res.status(400).json({ error: 'eventTitle required' });

  const result = spendToHostEvent(req.userId!, eventTitle);
  if (!result.success) return res.status(402).json({ error: result.error });
  res.json(result);
});

// POST /kendu/spend/challenge — Stake Kendu for a 1v1 challenge
router.post('/spend/challenge', async (req: AuthRequest, res: Response) => {
  const { opponentId, stakeAmount, metric, deadline } = req.body;
  if (!opponentId || !stakeAmount || !metric || !deadline) {
    return res.status(400).json({ error: 'opponentId, stakeAmount, metric, deadline required' });
  }

  const stakeResult = spendForChallenge(req.userId!, stakeAmount, 0);
  if (!stakeResult.success) return res.status(402).json({ error: stakeResult.error });

  const challenge = await db.execute(`
    INSERT INTO kendu_challenges (challenger_id, opponent_id, stake_amount, metric, deadline)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `, [req.userId, opponentId, stakeAmount, metric, deadline]);

  res.status(201).json({
    challengeId: challenge.rows[0]?.id,
    staked: stakeAmount,
    newBalance: stakeResult.newBalance,
  });
});

// POST /kendu/challenge/accept — Accept a challenge (stake deducted)
router.post('/challenge/accept', async (req: AuthRequest, res: Response) => {
  const { challengeId } = req.body;
  if (!challengeId) return res.status(400).json({ error: 'challengeId required' });

  const challenge = await db.queryOne(`
    SELECT * FROM kendu_challenges WHERE id = $1 AND opponent_id = $2 AND status = 'pending'
  `, [challengeId, req.userId]) as any;

  if (!challenge) return res.status(404).json({ error: 'Challenge not found or not pending' });

  const stakeResult = spendForChallenge(req.userId!, challenge.stake_amount, challengeId);
  if (!stakeResult.success) return res.status(402).json({ error: stakeResult.error });

  await db.execute("UPDATE kendu_challenges SET status = 'active' WHERE id = $1", [challengeId]);

  res.json({ message: 'Challenge accepted', staked: challenge.stake_amount, newBalance: stakeResult.newBalance });
});

// POST /kendu/challenge/decline — Decline a challenge (challenger refunded)
router.post('/challenge/decline', async (req: AuthRequest, res: Response) => {
  const { challengeId } = req.body;
  if (!challengeId) return res.status(400).json({ error: 'challengeId required' });

  const challenge = await db.queryOne(`
    SELECT * FROM kendu_challenges WHERE id = $1 AND opponent_id = $2 AND status = 'pending'
  `, [challengeId, req.userId]) as any;

  if (!challenge) return res.status(404).json({ error: 'Challenge not found or not pending' });

  // Refund challenger
  await db.execute('UPDATE kendu_balances SET spendable_balance = spendable_balance + $1 WHERE user_id = $2',
    [challenge.stake_amount, challenge.challenger_id]);
  await db.execute('INSERT INTO kendu_transactions (user_id, amount, source, metadata) VALUES ($1, $2, $3, $4)',
    [challenge.challenger_id, challenge.stake_amount, 'challenge_refund', JSON.stringify({ challengeId })]);

  await db.execute("UPDATE kendu_challenges SET status = 'declined' WHERE id = $1", [challengeId]);

  res.json({ message: 'Challenge declined, challenger refunded' });
});

// GET /kendu/challenges — My active/pending challenges
router.get('/challenges', async (req: AuthRequest, res: Response) => {

  const challenges = await db.query(`
    SELECT kc.*,
      u1.name as challenger_name, u1.profile_image_url as challenger_image,
      u2.name as opponent_name, u2.profile_image_url as opponent_image
    FROM kendu_challenges kc
    JOIN users u1 ON u1.id = kc.challenger_id
    JOIN users u2 ON u2.id = kc.opponent_id
    WHERE (kc.challenger_id = $1 OR kc.opponent_id = $2)
      AND kc.status IN ('pending', 'accepted', 'active', 'completed', 'expired')
    ORDER BY kc.created_at DESC
    LIMIT 20
  `, [req.userId, req.userId]);

  res.json(challenges);
});

// POST /kendu/spend/rsvp — Priority RSVP for an event
router.post('/spend/rsvp', (req: AuthRequest, res: Response) => {
  const { eventId } = req.body;
  if (!eventId) return res.status(400).json({ error: 'eventId required' });

  const result = spendForPriorityRSVP(req.userId!, eventId);
  if (!result.success) return res.status(402).json({ error: result.error });
  res.json(result);
});

// POST /kendu/spend/gift — Gift Kendu to another runner
router.post('/spend/gift', (req: AuthRequest, res: Response) => {
  const { toUserId, amount, message } = req.body;
  if (!toUserId || !amount) return res.status(400).json({ error: 'toUserId and amount required' });

  const result = giftKendu(req.userId!, toUserId, amount, message);
  if (!result.success) return res.status(402).json({ error: result.error });
  res.json(result);
});

// GET /kendu/skins — Get user's owned premium skins
router.get('/skins', async (req: AuthRequest, res: Response) => {
  const skins = await db.query('SELECT skin_id FROM user_skins WHERE user_id = $1', [req.userId]) as { skin_id: string }[];
  res.json(skins.map(s => s.skin_id));
});

// POST /kendu/spend/card-skin — Unlock a premium card skin
router.post('/spend/card-skin', async (req: AuthRequest, res: Response) => {
  const { skinId } = req.body;
  if (!skinId) return res.status(400).json({ error: 'skinId required' });

  const existing = await db.queryOne('SELECT id FROM user_skins WHERE user_id = $1 AND skin_id = $2', [req.userId, skinId]);
  if (existing) return res.status(400).json({ error: 'Skin already owned' });

  const result = spendForCardSkin(req.userId!, skinId);
  if (!result.success) return res.status(402).json({ error: result.error });

  await db.execute('INSERT INTO user_skins (user_id, skin_id) VALUES ($1, $2)', [req.userId, skinId]);
  res.json(result);
});

// POST /kendu/spend/boost-post — Boost a community post (pins for 24h)
router.post('/spend/boost-post', async (req: AuthRequest, res: Response) => {
  const { postId } = req.body;
  if (!postId) return res.status(400).json({ error: 'postId required' });

  const post = await db.queryOne('SELECT * FROM community_posts WHERE id = $1 AND user_id = $2', [postId, req.userId]) as any;
  if (!post) return res.status(404).json({ error: 'Post not found or not yours' });

  const result = spendToBoostPost(req.userId!, postId);
  if (!result.success) return res.status(402).json({ error: result.error });

  await db.execute('UPDATE community_posts SET pinned = 1 WHERE id = $1', [postId]);

  res.json(result);
});

// POST /kendu/spend/group-challenge — Create a group challenge
router.post('/spend/group-challenge', (req: AuthRequest, res: Response) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });

  const result = spendToCreateGroupChallenge(req.userId!, title);
  if (!result.success) return res.status(402).json({ error: result.error });
  res.json(result);
});

// POST /kendu/spend/ai-deep-dive — Pay for extended AI session
router.post('/spend/ai-deep-dive', (req: AuthRequest, res: Response) => {
  const result = spendForAIDeepDive(req.userId!);
  if (!result.success) return res.status(402).json({ error: result.error });
  res.json(result);
});

// POST /kendu/spend/sponsor — Sponsor a community leaderboard
router.post('/spend/sponsor', (req: AuthRequest, res: Response) => {
  const { communityId } = req.body;
  if (!communityId) return res.status(400).json({ error: 'communityId required' });

  const result = spendToSponsorLeaderboard(req.userId!, communityId);
  if (!result.success) return res.status(402).json({ error: result.error });
  res.json(result);
});

// GET /kendu/subscriptions — My active subscriptions
router.get('/subscriptions', async (req: AuthRequest, res: Response) => {
  const subs = await db.query(`
    SELECT ks.*, c.name as community_name
    FROM kendu_subscriptions ks
    LEFT JOIN communities c ON c.id = ks.entity_id AND ks.entity_type = 'community'
    WHERE ks.user_id = $1
    ORDER BY ks.is_active DESC, ks.next_due_at ASC
  `, [req.userId]);

  res.json(subs);
});

// POST /kendu/upkeep/reactivate — Reactivate a dormant community
router.post('/upkeep/reactivate', (req: AuthRequest, res: Response) => {
  const { subscriptionId } = req.body;
  if (!subscriptionId) return res.status(400).json({ error: 'subscriptionId required' });

  const result = reactivateCommunity(req.userId!, subscriptionId);
  if (!result.success) return res.status(402).json({ error: result.error });
  res.json(result);
});

// Resolve expired challenges every 5 minutes (instead of on every GET request)
// Delayed start to allow initializeDatabase() to complete first
setTimeout(() => {
  try { resolveExpiredChallenges(); } catch {}
  setInterval(() => {
    try { resolveExpiredChallenges(); } catch {}
  }, 5 * 60 * 1000);
}, 5000);

export default router;
