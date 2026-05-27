import { Router, Response } from 'express';
import db from '../database/db';
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

// POST /kendu/earn — Award Kendu after a run
router.post('/earn', (req: AuthRequest, res: Response) => {
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
router.get('/history', (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  const transactions = db.prepare(`
    SELECT id, amount, source, metadata, created_at
    FROM kendu_transactions
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.userId, limit, offset);

  const total = db.prepare('SELECT COUNT(*) as count FROM kendu_transactions WHERE user_id = ?').get(req.userId) as { count: number };

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
router.get('/offers', (req: AuthRequest, res: Response) => {
  const eventId = req.query.eventId ? parseInt(req.query.eventId as string) : null;

  let query = `
    SELECT * FROM kendu_offers
    WHERE active = 1 AND (expires_at IS NULL OR expires_at > datetime('now'))
  `;
  const params: any[] = [];

  if (eventId) {
    query += ' AND event_id = ?';
    params.push(eventId);
  }

  query += ' ORDER BY kendu_cost ASC';

  const offers = db.prepare(query).all(...params);

  const userRedemptions = db.prepare(`
    SELECT offer_id, COUNT(*) as count FROM kendu_redemptions WHERE user_id = ? GROUP BY offer_id
  `).all(req.userId) as { offer_id: number; count: number }[];

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
router.get('/leaderboard', (req: AuthRequest, res: Response) => {
  const eventId = req.query.eventId ? parseInt(req.query.eventId as string) : null;
  const limit = parseInt(req.query.limit as string) || 10;

  let leaders;

  if (eventId) {
    leaders = db.prepare(`
      SELECT kt.user_id, u.name, u.profile_image_url, SUM(kt.amount) as total_earned
      FROM kendu_transactions kt
      JOIN users u ON u.id = kt.user_id
      WHERE kt.amount > 0 AND kt.metadata LIKE ?
      GROUP BY kt.user_id
      ORDER BY total_earned DESC
      LIMIT ?
    `).all(`%"eventId":${eventId}%`, limit);
  } else {
    leaders = db.prepare(`
      SELECT kb.user_id, u.name, u.profile_image_url, kb.lifetime_earned as total_earned, kb.current_streak_days
      FROM kendu_balances kb
      JOIN users u ON u.id = kb.user_id
      ORDER BY kb.lifetime_earned DESC
      LIMIT ?
    `).all(limit);
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
router.post('/admin/offers', (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.userId) as any;
  if (user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const { brand_name, offer_title, description, kendu_cost, rupee_value, total_quantity, expires_at, event_id, max_per_user } = req.body;

  if (!brand_name || !offer_title || !kendu_cost || !total_quantity) {
    return res.status(400).json({ error: 'brand_name, offer_title, kendu_cost, and total_quantity are required' });
  }

  const result = db.prepare(`
    INSERT INTO kendu_offers (brand_name, offer_title, description, kendu_cost, rupee_value, total_quantity, remaining_quantity, expires_at, event_id, max_per_user)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(brand_name, offer_title, description || null, kendu_cost, rupee_value || null, total_quantity, total_quantity, expires_at || null, event_id || null, max_per_user || 1);

  res.status(201).json({ id: result.lastInsertRowid, message: 'Offer created' });
});

// PUT /kendu/admin/offers/:id — Update an offer
router.put('/admin/offers/:id', (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.userId) as any;
  if (user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const offerId = parseInt(req.params.id);
  const { brand_name, offer_title, description, kendu_cost, rupee_value, total_quantity, remaining_quantity, active, expires_at, event_id, max_per_user } = req.body;

  const existing = db.prepare('SELECT * FROM kendu_offers WHERE id = ?').get(offerId) as any;
  if (!existing) return res.status(404).json({ error: 'Offer not found' });

  db.prepare(`
    UPDATE kendu_offers SET
      brand_name = ?, offer_title = ?, description = ?, kendu_cost = ?, rupee_value = ?,
      total_quantity = ?, remaining_quantity = ?, active = ?, expires_at = ?, event_id = ?, max_per_user = ?
    WHERE id = ?
  `).run(
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
  );

  res.json({ message: 'Offer updated' });
});

// DELETE /kendu/admin/offers/:id — Deactivate an offer
router.delete('/admin/offers/:id', (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.userId) as any;
  if (user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const offerId = parseInt(req.params.id);
  db.prepare('UPDATE kendu_offers SET active = 0 WHERE id = ?').run(offerId);
  res.json({ message: 'Offer deactivated' });
});

// POST /kendu/admin/offers/:id/codes — Bulk upload coupon codes
router.post('/admin/offers/:id/codes', (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.userId) as any;
  if (user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const offerId = parseInt(req.params.id);
  const { codes } = req.body;

  if (!codes || !Array.isArray(codes) || codes.length === 0) {
    return res.status(400).json({ error: 'codes array is required' });
  }

  const offer = db.prepare('SELECT id FROM kendu_offers WHERE id = ?').get(offerId);
  if (!offer) return res.status(404).json({ error: 'Offer not found' });

  const stmt = db.prepare('INSERT INTO kendu_coupon_codes (offer_id, code) VALUES (?, ?)');
  const insertMany = db.transaction((codeList: string[]) => {
    for (const code of codeList) {
      stmt.run(offerId, code.trim());
    }
  });

  insertMany(codes);

  db.prepare('UPDATE kendu_offers SET total_quantity = total_quantity + ?, remaining_quantity = remaining_quantity + ? WHERE id = ?')
    .run(codes.length, codes.length, offerId);

  res.json({ message: `${codes.length} codes uploaded`, offerId });
});

// GET /kendu/admin/stats — Dashboard stats
router.get('/admin/stats', (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.userId) as any;
  if (user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const totalInCirculation = db.prepare('SELECT COALESCE(SUM(spendable_balance), 0) as total FROM kendu_balances').get() as { total: number };
  const totalLifetimeEarned = db.prepare('SELECT COALESCE(SUM(lifetime_earned), 0) as total FROM kendu_balances').get() as { total: number };
  const totalRedemptions = db.prepare('SELECT COUNT(*) as count FROM kendu_redemptions').get() as { count: number };
  const totalKenduSpent = db.prepare('SELECT COALESCE(SUM(kendu_spent), 0) as total FROM kendu_redemptions').get() as { total: number };
  const activeOffers = db.prepare("SELECT COUNT(*) as count FROM kendu_offers WHERE active = 1 AND (expires_at IS NULL OR expires_at > datetime('now'))").get() as { count: number };
  const topEarner = db.prepare(`
    SELECT kb.user_id, u.name, kb.lifetime_earned
    FROM kendu_balances kb JOIN users u ON u.id = kb.user_id
    ORDER BY kb.lifetime_earned DESC LIMIT 1
  `).get() as any;

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
router.get('/admin/redemptions', (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.userId) as any;
  if (user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = (page - 1) * limit;

  const redemptions = db.prepare(`
    SELECT kr.*, u.name as user_name, ko.offer_title, ko.brand_name
    FROM kendu_redemptions kr
    JOIN users u ON u.id = kr.user_id
    JOIN kendu_offers ko ON ko.id = kr.offer_id
    ORDER BY kr.redeemed_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  const total = db.prepare('SELECT COUNT(*) as count FROM kendu_redemptions').get() as { count: number };

  res.json({ redemptions, page, limit, total: total.count });
});

// GET /kendu/admin/economy — Economy health metrics
router.get('/admin/economy', (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.userId) as any;
  if (user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const stats = getEconomyStats();

  const weeklyEarned = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM kendu_transactions
    WHERE amount > 0 AND created_at >= datetime('now', '-7 days')
  `).get() as { total: number };

  const weeklySpent = db.prepare(`
    SELECT COALESCE(SUM(ABS(amount)), 0) as total FROM kendu_transactions
    WHERE amount < 0 AND created_at >= datetime('now', '-7 days')
  `).get() as { total: number };

  const activeChallenges = db.prepare(`
    SELECT COUNT(*) as count FROM kendu_challenges WHERE status IN ('pending', 'accepted', 'active')
  `).get() as { count: number };

  const totalPotValue = db.prepare(`
    SELECT COALESCE(SUM(stake_amount * 2), 0) as total FROM kendu_challenges WHERE status IN ('accepted', 'active')
  `).get() as { total: number };

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
router.post('/admin/process-upkeep', (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.userId) as any;
  if (user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const result = checkAllUpkeepDue();
  res.json(result);
});

// POST /kendu/admin/resolve-challenges — Manually trigger challenge resolution
router.post('/admin/resolve-challenges', (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.userId) as any;
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
router.post('/spend/challenge', (req: AuthRequest, res: Response) => {
  const { opponentId, stakeAmount, metric, deadline } = req.body;
  if (!opponentId || !stakeAmount || !metric || !deadline) {
    return res.status(400).json({ error: 'opponentId, stakeAmount, metric, deadline required' });
  }

  const stakeResult = spendForChallenge(req.userId!, stakeAmount, 0);
  if (!stakeResult.success) return res.status(402).json({ error: stakeResult.error });

  const challenge = db.prepare(`
    INSERT INTO kendu_challenges (challenger_id, opponent_id, stake_amount, metric, deadline)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.userId, opponentId, stakeAmount, metric, deadline);

  res.status(201).json({
    challengeId: challenge.lastInsertRowid,
    staked: stakeAmount,
    newBalance: stakeResult.newBalance,
  });
});

// POST /kendu/challenge/accept — Accept a challenge (stake deducted)
router.post('/challenge/accept', (req: AuthRequest, res: Response) => {
  const { challengeId } = req.body;
  if (!challengeId) return res.status(400).json({ error: 'challengeId required' });

  const challenge = db.prepare(`
    SELECT * FROM kendu_challenges WHERE id = ? AND opponent_id = ? AND status = 'pending'
  `).get(challengeId, req.userId) as any;

  if (!challenge) return res.status(404).json({ error: 'Challenge not found or not pending' });

  const stakeResult = spendForChallenge(req.userId!, challenge.stake_amount, challengeId);
  if (!stakeResult.success) return res.status(402).json({ error: stakeResult.error });

  db.prepare("UPDATE kendu_challenges SET status = 'active' WHERE id = ?").run(challengeId);

  res.json({ message: 'Challenge accepted', staked: challenge.stake_amount, newBalance: stakeResult.newBalance });
});

// POST /kendu/challenge/decline — Decline a challenge (challenger refunded)
router.post('/challenge/decline', (req: AuthRequest, res: Response) => {
  const { challengeId } = req.body;
  if (!challengeId) return res.status(400).json({ error: 'challengeId required' });

  const challenge = db.prepare(`
    SELECT * FROM kendu_challenges WHERE id = ? AND opponent_id = ? AND status = 'pending'
  `).get(challengeId, req.userId) as any;

  if (!challenge) return res.status(404).json({ error: 'Challenge not found or not pending' });

  // Refund challenger
  db.prepare('UPDATE kendu_balances SET spendable_balance = spendable_balance + ? WHERE user_id = ?')
    .run(challenge.stake_amount, challenge.challenger_id);
  db.prepare('INSERT INTO kendu_transactions (user_id, amount, source, metadata) VALUES (?, ?, ?, ?)')
    .run(challenge.challenger_id, challenge.stake_amount, 'challenge_refund', JSON.stringify({ challengeId }));

  db.prepare("UPDATE kendu_challenges SET status = 'declined' WHERE id = ?").run(challengeId);

  res.json({ message: 'Challenge declined, challenger refunded' });
});

// GET /kendu/challenges — My active/pending challenges (auto-resolves expired on access)
router.get('/challenges', (req: AuthRequest, res: Response) => {
  resolveExpiredChallenges();

  const challenges = db.prepare(`
    SELECT kc.*,
      u1.name as challenger_name, u1.profile_image_url as challenger_image,
      u2.name as opponent_name, u2.profile_image_url as opponent_image
    FROM kendu_challenges kc
    JOIN users u1 ON u1.id = kc.challenger_id
    JOIN users u2 ON u2.id = kc.opponent_id
    WHERE (kc.challenger_id = ? OR kc.opponent_id = ?)
      AND kc.status IN ('pending', 'accepted', 'active', 'completed', 'expired')
    ORDER BY kc.created_at DESC
    LIMIT 20
  `).all(req.userId, req.userId);

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
router.get('/skins', (req: AuthRequest, res: Response) => {
  db.prepare(`CREATE TABLE IF NOT EXISTS user_skins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    skin_id TEXT NOT NULL,
    purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, skin_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`).run();

  const skins = db.prepare('SELECT skin_id FROM user_skins WHERE user_id = ?').all(req.userId) as { skin_id: string }[];
  res.json(skins.map(s => s.skin_id));
});

// POST /kendu/spend/card-skin — Unlock a premium card skin
router.post('/spend/card-skin', (req: AuthRequest, res: Response) => {
  const { skinId } = req.body;
  if (!skinId) return res.status(400).json({ error: 'skinId required' });

  db.prepare(`CREATE TABLE IF NOT EXISTS user_skins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    skin_id TEXT NOT NULL,
    purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, skin_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`).run();

  const existing = db.prepare('SELECT id FROM user_skins WHERE user_id = ? AND skin_id = ?').get(req.userId, skinId);
  if (existing) return res.status(400).json({ error: 'Skin already owned' });

  const result = spendForCardSkin(req.userId!, skinId);
  if (!result.success) return res.status(402).json({ error: result.error });

  db.prepare('INSERT INTO user_skins (user_id, skin_id) VALUES (?, ?)').run(req.userId, skinId);
  res.json(result);
});

// POST /kendu/spend/boost-post — Boost a community post (pins for 24h)
router.post('/spend/boost-post', (req: AuthRequest, res: Response) => {
  const { postId } = req.body;
  if (!postId) return res.status(400).json({ error: 'postId required' });

  const post = db.prepare('SELECT * FROM community_posts WHERE id = ? AND user_id = ?').get(postId, req.userId) as any;
  if (!post) return res.status(404).json({ error: 'Post not found or not yours' });

  const result = spendToBoostPost(req.userId!, postId);
  if (!result.success) return res.status(402).json({ error: result.error });

  db.prepare('UPDATE community_posts SET pinned = 1 WHERE id = ?').run(postId);

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
router.get('/subscriptions', (req: AuthRequest, res: Response) => {
  const subs = db.prepare(`
    SELECT ks.*, c.name as community_name
    FROM kendu_subscriptions ks
    LEFT JOIN communities c ON c.id = ks.entity_id AND ks.entity_type = 'community'
    WHERE ks.user_id = ?
    ORDER BY ks.is_active DESC, ks.next_due_at ASC
  `).all(req.userId);

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

export default router;
