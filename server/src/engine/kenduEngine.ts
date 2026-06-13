import db from '../database/pg';

// ===== KENDU ECONOMY v2: 1 Kendu = 1 km of effort =====

// Earning constants
const DAILY_CAP = 50;
const POINTS_PER_KM = 1;
const COACH_MULTIPLIER = 1.5;
const PB_BONUS = 5;
const WORKOUT_COMPLETE_BONUS = 3;
const PLAN_COMPLETE_BONUS = 20;
const CONSISTENT_WEEK_BONUS = 5;
const STREAK_MILESTONE_BONUS = 10;
const EVENT_BONUS = 8;
const MIN_RUNS_TO_REDEEM = 5;

// Spending costs
const COST_CREATE_COMMUNITY = 1000;
const COST_HOST_EVENT = 75;
const COST_PRIORITY_RSVP = 15;
const COST_BOOST_POST = 10;
const COST_GROUP_CHALLENGE = 50;
const COST_AI_DEEP_DIVE = 30;
const COST_CARD_SKIN = 40;
const COST_SPONSOR_LEADERBOARD = 500;
const CHALLENGE_STAKE_MIN = 5;
const CHALLENGE_STAKE_MAX = 50;
const GIFT_MIN = 3;
const GIFT_FEE_PERCENT = 3;
const CHALLENGE_RAKE_PERCENT = 20;
const COMMUNITY_UPKEEP_MONTHLY = 20;

// IST timezone helper — all date calculations use IST (UTC+5:30) for Indian runners
function getISTDate(): Date {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + istOffset + now.getTimezoneOffset() * 60 * 1000);
}

function getISTDateString(): string {
  return getISTDate().toISOString().split('T')[0];
}

function getISTYesterday(): string {
  const ist = getISTDate();
  ist.setDate(ist.getDate() - 1);
  return ist.toISOString().split('T')[0];
}

function getISTMondayOfWeek(): string {
  const ist = getISTDate();
  const dayOfWeek = ist.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  ist.setDate(ist.getDate() - mondayOffset);
  return ist.toISOString().split('T')[0];
}

// Distance buckets for PB detection (meters)
const PB_DISTANCE_BUCKETS = [
  { label: '1K', min: 800, max: 1500 },
  { label: '3K', min: 2500, max: 3800 },
  { label: '5K', min: 4500, max: 5800 },
  { label: '10K', min: 9000, max: 11500 },
  { label: 'HM', min: 20000, max: 22500 },
  { label: 'Marathon', min: 40000, max: 44000 },
];

export interface KenduBreakdown {
  base: number;
  coachMultiplier?: number;
  personalBest?: number;
  workoutBonus?: number;
  streakBonus?: number;
  consistencyBonus?: number;
  eventBonus?: number;
}

export interface KenduEarnResult {
  pointsEarned: number;
  breakdown: KenduBreakdown;
  newBalance: number;
  streakDays: number;
  streakBonusAwarded: boolean;
  consistencyBonusAwarded: boolean;
  cappedToday: boolean;
}

async function ensureBalance(userId: number) {
  await db.execute('INSERT INTO kendu_balances (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [userId]);
}

async function insertLedgerEntry(userId: number, amount: number, type: 'credit' | 'debit', source: string, balanceAfter: number, metadata?: string) {
  await db.execute(`
    INSERT INTO kendu_ledger (user_id, amount, type, source, balance_after, metadata) VALUES ($1, $2, $3, $4, $5, $6)
  `, [userId, Math.abs(amount), type, source, balanceAfter, metadata || null]);
}

async function getDailyEarnedToday(userId: number): Promise<number> {
  const today = getISTDateString();
  const row = await db.queryOne(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM kendu_transactions
    WHERE user_id = $1 AND amount > 0 AND date(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = $2
  `, [userId, today]) as { total: number };
  return row.total;
}

async function awardKendu(userId: number, amount: number, source: string, metadata?: string): Promise<number> {
  await ensureBalance(userId);

  const alreadyEarned = await getDailyEarnedToday(userId);
  const remaining = Math.max(0, DAILY_CAP - alreadyEarned);
  const actual = Math.min(amount, remaining);

  if (actual <= 0) return 0;

  await db.execute(`
    INSERT INTO kendu_transactions (user_id, amount, source, metadata) VALUES ($1, $2, $3, $4)
  `, [userId, actual, source, metadata || null]);

  await db.execute(`
    UPDATE kendu_balances
    SET spendable_balance = spendable_balance + $1, lifetime_earned = lifetime_earned + $2, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $3
  `, [actual, actual, userId]);

  // Append to immutable ledger
  const bal = await db.queryOne('SELECT spendable_balance FROM kendu_balances WHERE user_id = $1', [userId]) as { spendable_balance: number };
  await insertLedgerEntry(userId, actual, 'credit', source, bal.spendable_balance, metadata);

  return actual;
}

export async function detectPersonalBest(userId: number, distanceMeters: number, pacePerKm: number): Promise<{ isPacePB: boolean; isDistancePB: boolean }> {
  // Check if this is the user's first run (no PB bonus for first run — no baseline to beat)
  const runCount = await db.queryOne('SELECT COUNT(*) as count FROM activities WHERE user_id = $1', [userId]) as { count: number };
  if (runCount.count <= 1) {
    return { isPacePB: false, isDistancePB: false };
  }

  // Distance PB: overall longest run ever
  const longestRun = await db.queryOne(`
    SELECT MAX(distance_meters) as longest FROM activities WHERE user_id = $1
  `, [userId]) as { longest: number | null };
  const isDistancePB = longestRun.longest !== null && distanceMeters > longestRun.longest;

  // Pace PB: bucketed by distance range, only compare against same bucket (90-day window)
  let isPacePB = false;
  if (pacePerKm > 0) {
    const bucket = PB_DISTANCE_BUCKETS.find(b => distanceMeters >= b.min && distanceMeters <= b.max);
    if (bucket) {
      const bestInBucket = await db.queryOne(`
        SELECT MIN(average_pace_per_km) as best_pace FROM activities
        WHERE user_id = $1 AND distance_meters >= $2 AND distance_meters <= $3
          AND average_pace_per_km > 0
          AND start_date >= CURRENT_DATE - INTERVAL '90 days'
      `, [userId, bucket.min, bucket.max]) as { best_pace: number | null };

      if (bestInBucket.best_pace !== null && pacePerKm < bestInBucket.best_pace) {
        isPacePB = true;
      }
    } else {
      // Doesn't fit a bucket — compare against all runs within ±20% distance range
      const lower = distanceMeters * 0.8;
      const upper = distanceMeters * 1.2;
      const bestSimilar = await db.queryOne(`
        SELECT MIN(average_pace_per_km) as best_pace FROM activities
        WHERE user_id = $1 AND distance_meters >= $2 AND distance_meters <= $3
          AND average_pace_per_km > 0
          AND start_date >= CURRENT_DATE - INTERVAL '90 days'
      `, [userId, lower, upper]) as { best_pace: number | null };

      if (bestSimilar.best_pace !== null && pacePerKm < bestSimilar.best_pace) {
        isPacePB = true;
      }
    }
  }

  return { isPacePB, isDistancePB };
}

export async function updateKenduStreak(userId: number): Promise<{ streakDays: number; bonusAwarded: boolean }> {
  await ensureBalance(userId);

  const today = getISTDateString();
  const yesterday = getISTYesterday();
  const balance = await db.queryOne('SELECT * FROM kendu_balances WHERE user_id = $1', [userId]) as any;

  const lastDate = balance.last_run_date;

  let newStreak: number;

  if (lastDate === today) {
    return { streakDays: balance.current_streak_days, bonusAwarded: false };
  } else if (lastDate === yesterday) {
    newStreak = balance.current_streak_days + 1;
  } else {
    newStreak = 1;
  }

  await db.execute(`
    UPDATE kendu_balances SET current_streak_days = $1, last_run_date = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3
  `, [newStreak, today, userId]);

  let bonusAwarded = false;
  if (newStreak > 0 && newStreak % 7 === 0) {
    const awarded = await awardKendu(userId, STREAK_MILESTONE_BONUS, 'streak_bonus', JSON.stringify({ streak_days: newStreak }));
    bonusAwarded = awarded > 0;
  }

  return { streakDays: newStreak, bonusAwarded };
}

export async function checkWeeklyConsistency(userId: number): Promise<boolean> {
  const mondayStr = getISTMondayOfWeek();

  const count = await db.queryOne(`
    SELECT COUNT(*) as runs FROM activities WHERE user_id = $1 AND date(start_date) >= $2
  `, [userId, mondayStr]) as { runs: number };

  if (count.runs >= 4) {
    const alreadyAwarded = await db.queryOne(`
      SELECT id FROM kendu_transactions
      WHERE user_id = $1 AND source = 'consistent_week' AND date(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') >= $2
    `, [userId, mondayStr]);

    if (!alreadyAwarded) {
      await awardKendu(userId, CONSISTENT_WEEK_BONUS, 'consistent_week', JSON.stringify({ week_start: mondayStr, runs: count.runs }));
      return true;
    }
  }

  return false;
}

export async function verifyCoachAssigned(userId: number): Promise<boolean> {
  // Coach-assigned = user did a pre_run AI check-in within last 24 hours
  // This means the AI coach gave them a specific session to do
  const checkin = await db.queryOne(`
    SELECT id FROM ai_checkins
    WHERE user_id = $1 AND type = 'pre_run'
      AND created_at >= NOW() - INTERVAL '24 hours'
    LIMIT 1
  `, [userId]);

  if (checkin) return true;

  // Also count club sessions they attended today
  const today = getISTDateString();
  const session = await db.queryOne(`
    SELECT sa.id FROM session_attendance sa
    JOIN club_sessions cs ON cs.id = sa.session_id
    WHERE sa.user_id = $1 AND date(cs.session_date) = $2
    LIMIT 1
  `, [userId, today]);

  return !!session;
}

export async function calculateKenduForRun(
  userId: number,
  km: number,
  wasCoachAssigned: boolean,
  isPersonalBest: boolean
): Promise<KenduEarnResult> {
  await ensureBalance(userId);

  const breakdown: KenduBreakdown = { base: 0 };
  let total = 0;

  const base = Math.floor(km) * POINTS_PER_KM;
  breakdown.base = base;

  let runPoints = base;
  if (wasCoachAssigned) {
    runPoints = Math.floor(base * COACH_MULTIPLIER);
    breakdown.coachMultiplier = runPoints - base;
  }
  total += runPoints;

  if (isPersonalBest) {
    breakdown.personalBest = PB_BONUS;
    total += PB_BONUS;
  }

  const awarded = await awardKendu(userId, total, 'run_distance', JSON.stringify({
    km,
    wasCoachAssigned,
    isPersonalBest,
    breakdown
  }));

  const { streakDays, bonusAwarded: streakBonusAwarded } = await updateKenduStreak(userId);
  if (streakBonusAwarded) {
    breakdown.streakBonus = STREAK_MILESTONE_BONUS;
  }

  const consistencyBonusAwarded = await checkWeeklyConsistency(userId);
  if (consistencyBonusAwarded) {
    breakdown.consistencyBonus = CONSISTENT_WEEK_BONUS;
  }

  const totalEarned = awarded + (streakBonusAwarded ? STREAK_MILESTONE_BONUS : 0) + (consistencyBonusAwarded ? CONSISTENT_WEEK_BONUS : 0);

  const balance = await db.queryOne('SELECT spendable_balance FROM kendu_balances WHERE user_id = $1', [userId]) as { spendable_balance: number };

  return {
    pointsEarned: totalEarned,
    breakdown,
    newBalance: balance.spendable_balance,
    streakDays,
    streakBonusAwarded,
    consistencyBonusAwarded,
    cappedToday: await getDailyEarnedToday(userId) >= DAILY_CAP
  };
}

export async function awardKenduForEvent(userId: number, eventId: number): Promise<number> {
  return awardKendu(userId, EVENT_BONUS, 'community_event', JSON.stringify({ eventId }));
}

export async function awardKenduForWorkout(userId: number, sessionId?: number): Promise<number> {
  return awardKendu(userId, WORKOUT_COMPLETE_BONUS, 'coach_workout', JSON.stringify({ sessionId }));
}

export async function awardKenduForPlan(userId: number, planId?: number): Promise<number> {
  return awardKendu(userId, PLAN_COMPLETE_BONUS, 'training_plan', JSON.stringify({ planId }));
}

export async function awardWelcomeBonus(userId: number): Promise<number> {
  // Only award once — check if user already has a welcome_bonus transaction
  const existing = await db.queryOne(
    "SELECT id FROM kendu_transactions WHERE user_id = $1 AND source = 'welcome_bonus' LIMIT 1", [userId]
  );
  if (existing) return 0;

  await ensureBalance(userId);
  const amount = 25;
  const metadata = JSON.stringify({ reason: 'New user starter Kendu' });
  await db.execute('INSERT INTO kendu_transactions (user_id, amount, source, metadata) VALUES ($1, $2, $3, $4)',
    [userId, amount, 'welcome_bonus', metadata]);
  await db.execute('UPDATE kendu_balances SET spendable_balance = spendable_balance + $1, lifetime_earned = lifetime_earned + $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3',
    [amount, amount, userId]);

  // Append to immutable ledger
  const bal = await db.queryOne('SELECT spendable_balance FROM kendu_balances WHERE user_id = $1', [userId]) as { spendable_balance: number };
  await insertLedgerEntry(userId, amount, 'credit', 'welcome_bonus', bal.spendable_balance, metadata);

  return amount;
}

export async function awardKenduForChallenge(userId: number, challengeId: number): Promise<number> {
  return awardKendu(userId, WORKOUT_COMPLETE_BONUS, 'challenge_complete', JSON.stringify({ challengeId }));
}

export async function getKenduBalance(userId: number) {
  await ensureBalance(userId);
  const bal = await db.queryOne('SELECT * FROM kendu_balances WHERE user_id = $1', [userId]) as any;
  return {
    spendable_balance: bal.spendable_balance,
    lifetime_earned: bal.lifetime_earned,
    current_streak_days: bal.current_streak_days,
    current_level: calculateLevel(bal.lifetime_earned),
    level_progress_percent: calculateLevelProgress(bal.lifetime_earned),
  };
}

export function calculateLevel(lifetimeKendu: number): number {
  let level = 1;
  let xpNeeded = 10;
  let totalNeeded = 0;
  while (totalNeeded + xpNeeded <= lifetimeKendu) {
    totalNeeded += xpNeeded;
    level++;
    xpNeeded = Math.floor(10 * Math.pow(1.5, level - 1));
  }
  return level;
}

function calculateLevelProgress(lifetimeKendu: number): number {
  let level = 1;
  let xpNeeded = 10;
  let totalNeeded = 0;
  while (totalNeeded + xpNeeded <= lifetimeKendu) {
    totalNeeded += xpNeeded;
    level++;
    xpNeeded = Math.floor(10 * Math.pow(1.5, level - 1));
  }
  const currentLevelXp = lifetimeKendu - totalNeeded;
  return Math.floor((currentLevelXp / xpNeeded) * 100);
}

export async function canRedeem(userId: number): Promise<{ eligible: boolean; reason?: string }> {
  const runCount = await db.queryOne('SELECT COUNT(*) as count FROM activities WHERE user_id = $1', [userId]) as { count: number };
  if (runCount.count < MIN_RUNS_TO_REDEEM) {
    return { eligible: false, reason: `Complete at least ${MIN_RUNS_TO_REDEEM} runs before redeeming (you have ${runCount.count})` };
  }
  return { eligible: true };
}

export async function redeemOffer(userId: number, offerId: number): Promise<{ success: boolean; couponCode?: string; newBalance?: number; error?: string }> {
  const eligibility = await canRedeem(userId);
  if (!eligibility.eligible) {
    return { success: false, error: eligibility.reason };
  }

  await ensureBalance(userId);
  const balance = await db.queryOne('SELECT spendable_balance FROM kendu_balances WHERE user_id = $1', [userId]) as { spendable_balance: number };
  const offer = await db.queryOne('SELECT * FROM kendu_offers WHERE id = $1 AND active = 1', [offerId]) as any;

  if (!offer) {
    return { success: false, error: 'Offer not found or inactive' };
  }

  if (offer.expires_at && new Date(offer.expires_at) < new Date()) {
    return { success: false, error: 'Offer has expired' };
  }

  if (offer.remaining_quantity <= 0) {
    return { success: false, error: 'Offer is out of stock' };
  }

  if (balance.spendable_balance < offer.kendu_cost) {
    return { success: false, error: `Insufficient balance. Need ${offer.kendu_cost - balance.spendable_balance} more Kendu` };
  }

  const existingRedemption = await db.queryOne(`
    SELECT COUNT(*) as count FROM kendu_redemptions WHERE user_id = $1 AND offer_id = $2
  `, [userId, offerId]) as { count: number };

  if (existingRedemption.count >= offer.max_per_user) {
    return { success: false, error: 'You have already redeemed this offer' };
  }

  const coupon = await db.queryOne(`
    SELECT * FROM kendu_coupon_codes WHERE offer_id = $1 AND is_used = 0 LIMIT 1
  `, [offerId]) as any;

  if (!coupon) {
    return { success: false, error: 'No coupon codes available' };
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('UPDATE kendu_coupon_codes SET is_used = 1, used_by_user_id = $1, used_at = CURRENT_TIMESTAMP WHERE id = $2',
      [userId, coupon.id]);

    await client.query('UPDATE kendu_offers SET remaining_quantity = remaining_quantity - 1 WHERE id = $1',
      [offerId]);

    await client.query('INSERT INTO kendu_redemptions (user_id, offer_id, kendu_spent, coupon_code) VALUES ($1, $2, $3, $4)',
      [userId, offerId, offer.kendu_cost, coupon.code]);

    await client.query('UPDATE kendu_balances SET spendable_balance = spendable_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [offer.kendu_cost, userId]);

    await client.query('INSERT INTO kendu_transactions (user_id, amount, source, metadata) VALUES ($1, $2, $3, $4)',
      [userId, -offer.kendu_cost, 'redemption', JSON.stringify({ offerId, offerTitle: offer.offer_title, couponCode: coupon.code })]);

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  const newBal = await db.queryOne('SELECT spendable_balance FROM kendu_balances WHERE user_id = $1', [userId]) as { spendable_balance: number };

  return { success: true, couponCode: coupon.code, newBalance: newBal.spendable_balance };
}

export async function migrateXpToKendu() {
  const users = await db.query(`
    SELECT user_id, total_xp, current_streak_days, last_activity_date
    FROM user_xp WHERE user_id NOT IN (SELECT user_id FROM kendu_balances)
  `) as any[];

  for (const user of users) {
    await db.execute(`
      INSERT INTO kendu_balances (user_id, spendable_balance, lifetime_earned, current_streak_days, last_run_date)
      VALUES ($1, $2, $3, $4, $5)
    `, [user.user_id, user.total_xp, user.total_xp, user.current_streak_days, user.last_activity_date]);

    if (user.total_xp > 0) {
      await db.execute(`
        INSERT INTO kendu_transactions (user_id, amount, source, metadata) VALUES ($1, $2, 'migration', $3)
      `, [user.user_id, user.total_xp, JSON.stringify({ migrated_from: 'user_xp', original_xp: user.total_xp })]);
    }
  }
}

// ===== KENDU SPENDING ECONOMY =====

export interface SpendResult {
  success: boolean;
  amountSpent: number;
  fee: number;
  newBalance: number;
  error?: string;
}

async function deductKendu(userId: number, amount: number, source: string, metadata?: string): Promise<SpendResult> {
  await ensureBalance(userId);
  const bal = await db.queryOne('SELECT spendable_balance FROM kendu_balances WHERE user_id = $1', [userId]) as { spendable_balance: number };

  if (bal.spendable_balance < amount) {
    return { success: false, amountSpent: 0, fee: 0, newBalance: bal.spendable_balance, error: `Need ${amount} Kendu, have ${bal.spendable_balance}` };
  }

  await db.execute('UPDATE kendu_balances SET spendable_balance = spendable_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
    [amount, userId]);

  await db.execute('INSERT INTO kendu_transactions (user_id, amount, source, metadata) VALUES ($1, $2, $3, $4)',
    [userId, -amount, source, metadata || null]);

  const newBal = await db.queryOne('SELECT spendable_balance FROM kendu_balances WHERE user_id = $1', [userId]) as { spendable_balance: number };

  // Append to immutable ledger
  await insertLedgerEntry(userId, amount, 'debit', source, newBal.spendable_balance, metadata);

  return { success: true, amountSpent: amount, fee: 0, newBalance: newBal.spendable_balance };
}

export async function spendToCreateCommunity(userId: number, communityName: string): Promise<SpendResult> {
  return deductKendu(userId, COST_CREATE_COMMUNITY, 'spend_create_community', JSON.stringify({ communityName }));
}

export async function spendToHostEvent(userId: number, eventTitle: string): Promise<SpendResult> {
  return deductKendu(userId, COST_HOST_EVENT, 'spend_host_event', JSON.stringify({ eventTitle }));
}

export async function spendForChallenge(userId: number, stakeAmount: number, challengeId: number): Promise<SpendResult> {
  if (stakeAmount < CHALLENGE_STAKE_MIN || stakeAmount > CHALLENGE_STAKE_MAX) {
    return { success: false, amountSpent: 0, fee: 0, newBalance: 0, error: `Stake must be ${CHALLENGE_STAKE_MIN}-${CHALLENGE_STAKE_MAX} Kendu` };
  }
  return deductKendu(userId, stakeAmount, 'spend_challenge_stake', JSON.stringify({ challengeId, stakeAmount }));
}

export async function awardChallengeWinner(winnerId: number, totalPot: number, challengeId: number): Promise<number> {
  const rake = Math.floor(totalPot * CHALLENGE_RAKE_PERCENT / 100);
  const winnings = totalPot - rake;
  await ensureBalance(winnerId);

  await db.execute('UPDATE kendu_balances SET spendable_balance = spendable_balance + $1 WHERE user_id = $2',
    [winnings, winnerId]);

  const metadata = JSON.stringify({ challengeId, totalPot, rake });
  await db.execute('INSERT INTO kendu_transactions (user_id, amount, source, metadata) VALUES ($1, $2, $3, $4)',
    [winnerId, winnings, 'challenge_winnings', metadata]);

  // Append to immutable ledger
  const bal = await db.queryOne('SELECT spendable_balance FROM kendu_balances WHERE user_id = $1', [winnerId]) as { spendable_balance: number };
  await insertLedgerEntry(winnerId, winnings, 'credit', 'challenge_winnings', bal.spendable_balance, metadata);

  return winnings;
}

export async function spendForPriorityRSVP(userId: number, eventId: number): Promise<SpendResult> {
  return deductKendu(userId, COST_PRIORITY_RSVP, 'spend_priority_rsvp', JSON.stringify({ eventId }));
}

export async function giftKendu(fromUserId: number, toUserId: number, amount: number, message?: string): Promise<SpendResult> {
  if (amount < GIFT_MIN) {
    return { success: false, amountSpent: 0, fee: 0, newBalance: 0, error: `Minimum gift is ${GIFT_MIN} Kendu` };
  }
  if (fromUserId === toUserId) {
    return { success: false, amountSpent: 0, fee: 0, newBalance: 0, error: 'Cannot gift yourself' };
  }

  const fee = Math.ceil(amount * GIFT_FEE_PERCENT / 100);
  const totalCost = amount + fee;

  await ensureBalance(fromUserId);
  const bal = await db.queryOne('SELECT spendable_balance FROM kendu_balances WHERE user_id = $1', [fromUserId]) as { spendable_balance: number };

  if (bal.spendable_balance < totalCost) {
    return { success: false, amountSpent: 0, fee, newBalance: bal.spendable_balance, error: `Need ${totalCost} Kendu (${amount} + ${fee} fee)` };
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('UPDATE kendu_balances SET spendable_balance = spendable_balance - $1 WHERE user_id = $2',
      [totalCost, fromUserId]);
    await client.query('INSERT INTO kendu_transactions (user_id, amount, source, metadata) VALUES ($1, $2, $3, $4)',
      [fromUserId, -totalCost, 'spend_gift_sent', JSON.stringify({ toUserId, amount, fee, message })]);

    // Ensure recipient balance exists
    await client.query('INSERT INTO kendu_balances (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [toUserId]);
    await client.query('UPDATE kendu_balances SET spendable_balance = spendable_balance + $1 WHERE user_id = $2',
      [amount, toUserId]);
    await client.query('INSERT INTO kendu_transactions (user_id, amount, source, metadata) VALUES ($1, $2, $3, $4)',
      [toUserId, amount, 'gift_received', JSON.stringify({ fromUserId, amount, message })]);

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  const newBal = await db.queryOne('SELECT spendable_balance FROM kendu_balances WHERE user_id = $1', [fromUserId]) as { spendable_balance: number };
  const recipientBal = await db.queryOne('SELECT spendable_balance FROM kendu_balances WHERE user_id = $1', [toUserId]) as { spendable_balance: number };

  // Ledger entries for both sides
  await insertLedgerEntry(fromUserId, totalCost, 'debit', 'spend_gift_sent', newBal.spendable_balance, JSON.stringify({ toUserId, amount, fee, message }));
  await insertLedgerEntry(toUserId, amount, 'credit', 'gift_received', recipientBal.spendable_balance, JSON.stringify({ fromUserId, amount, message }));

  return { success: true, amountSpent: totalCost, fee, newBalance: newBal.spendable_balance };
}

export async function spendForCardSkin(userId: number, skinId: string): Promise<SpendResult> {
  const existing = await db.queryOne(`
    SELECT id FROM kendu_transactions
    WHERE user_id = $1 AND source = 'spend_card_skin' AND metadata LIKE $2
  `, [userId, `%"skinId":"${skinId}"%`]);

  if (existing) {
    return { success: false, amountSpent: 0, fee: 0, newBalance: 0, error: 'Skin already unlocked' };
  }
  return deductKendu(userId, COST_CARD_SKIN, 'spend_card_skin', JSON.stringify({ skinId }));
}

export async function spendToBoostPost(userId: number, postId: number): Promise<SpendResult> {
  return deductKendu(userId, COST_BOOST_POST, 'spend_boost_post', JSON.stringify({ postId }));
}

export async function spendToCreateGroupChallenge(userId: number, challengeTitle: string): Promise<SpendResult> {
  return deductKendu(userId, COST_GROUP_CHALLENGE, 'spend_group_challenge', JSON.stringify({ challengeTitle }));
}

export async function spendForAIDeepDive(userId: number): Promise<SpendResult> {
  return deductKendu(userId, COST_AI_DEEP_DIVE, 'spend_ai_deep_dive', JSON.stringify({ date: getISTDateString() }));
}

export async function spendToSponsorLeaderboard(userId: number, communityId: number): Promise<SpendResult> {
  return deductKendu(userId, COST_SPONSOR_LEADERBOARD, 'spend_sponsor_leaderboard', JSON.stringify({ communityId, durationDays: 7 }));
}

// ===== COMMUNITY UPKEEP SYSTEM =====

export async function createCommunitySubscription(userId: number, communityId: number): Promise<void> {
  const nextDue = new Date(getISTDate().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await db.execute(`
    INSERT INTO kendu_subscriptions (user_id, entity_type, entity_id, next_due_at)
    VALUES ($1, 'community', $2, $3)
  `, [userId, communityId, nextDue]);
}

export async function processUpkeepDue(subscriptionId: number): Promise<{ paid: boolean; dormant: boolean }> {
  const sub = await db.queryOne('SELECT * FROM kendu_subscriptions WHERE id = $1 AND is_active = 1', [subscriptionId]) as any;
  if (!sub) return { paid: false, dormant: false };

  const now = new Date();
  if (new Date(sub.next_due_at) > now) return { paid: false, dormant: false };

  await ensureBalance(sub.user_id);
  const bal = await db.queryOne('SELECT spendable_balance FROM kendu_balances WHERE user_id = $1', [sub.user_id]) as { spendable_balance: number };

  if (bal.spendable_balance >= COMMUNITY_UPKEEP_MONTHLY) {
    await deductKendu(sub.user_id, COMMUNITY_UPKEEP_MONTHLY, 'spend_community_upkeep', JSON.stringify({ communityId: sub.entity_id, subscriptionId }));
    const nextDue = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await db.execute('UPDATE kendu_subscriptions SET last_paid_at = CURRENT_TIMESTAMP, next_due_at = $1 WHERE id = $2',
      [nextDue, subscriptionId]);
    return { paid: true, dormant: false };
  } else {
    await db.execute('UPDATE kendu_subscriptions SET is_active = 0 WHERE id = $1', [subscriptionId]);
    return { paid: false, dormant: true };
  }
}

export async function reactivateCommunity(userId: number, subscriptionId: number): Promise<SpendResult> {
  const result = await deductKendu(userId, COMMUNITY_UPKEEP_MONTHLY, 'spend_community_reactivate', JSON.stringify({ subscriptionId }));
  if (result.success) {
    const nextDue = new Date(getISTDate().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await db.execute('UPDATE kendu_subscriptions SET is_active = 1, last_paid_at = CURRENT_TIMESTAMP, next_due_at = $1 WHERE id = $2',
      [nextDue, subscriptionId]);
  }
  return result;
}

export async function checkAllUpkeepDue(): Promise<{ processed: number; dormant: number }> {
  const overdue = await db.query(`
    SELECT id FROM kendu_subscriptions WHERE is_active = 1 AND next_due_at <= NOW()
  `) as { id: number }[];

  let processed = 0;
  let dormant = 0;
  for (const sub of overdue) {
    const result = await processUpkeepDue(sub.id);
    if (result.paid) processed++;
    if (result.dormant) dormant++;
  }
  return { processed, dormant };
}

// ===== ECONOMY STATS (Admin) =====

export async function getEconomyStats() {
  const totalInCirculation = await db.queryOne('SELECT COALESCE(SUM(spendable_balance), 0) as total FROM kendu_balances') as { total: number };
  const totalLifetime = await db.queryOne('SELECT COALESCE(SUM(lifetime_earned), 0) as total FROM kendu_balances') as { total: number };
  const totalBurned = await db.queryOne(`
    SELECT COALESCE(SUM(ABS(amount)), 0) as total FROM kendu_transactions
    WHERE source IN ('spend_gift_sent', 'spend_community_upkeep', 'spend_community_reactivate') OR
          (source = 'challenge_winnings' AND amount > 0)
  `) as { total: number };
  const activeSubscriptions = await db.queryOne('SELECT COUNT(*) as count FROM kendu_subscriptions WHERE is_active = 1') as { count: number };
  const dormantSubscriptions = await db.queryOne('SELECT COUNT(*) as count FROM kendu_subscriptions WHERE is_active = 0') as { count: number };

  return {
    totalInCirculation: totalInCirculation.total,
    totalLifetimeEarned: totalLifetime.total,
    totalBurned: totalBurned.total,
    activeSubscriptions: activeSubscriptions.count,
    dormantCommunities: dormantSubscriptions.count,
  };
}

export async function getEconomyHealth() {
  const totalInCirculation = (await db.queryOne('SELECT COALESCE(SUM(spendable_balance), 0) as total FROM kendu_balances') as { total: number }).total;

  const dailyVelocity = (await db.queryOne(`
    SELECT COALESCE(SUM(amount), 0) as total FROM kendu_transactions
    WHERE amount > 0 AND created_at >= NOW() - INTERVAL '1 day'
  `) as { total: number }).total;

  const userCount = (await db.queryOne('SELECT COUNT(*) as count FROM kendu_balances WHERE spendable_balance > 0') as { count: number }).count;
  const avgBalance = userCount > 0 ? Math.round(totalInCirculation / userCount) : 0;

  const inflationFlag = dailyVelocity > 500 ? 'high_inflation' : 'healthy';

  return {
    total_in_circulation: totalInCirculation,
    daily_velocity: dailyVelocity,
    avg_balance_per_user: avgBalance,
    active_users: userCount,
    status: inflationFlag,
  };
}

// ===== CHALLENGE AUTO-RESOLUTION =====

interface ChallengeRow {
  id: number;
  challenger_id: number;
  opponent_id: number;
  stake_amount: number;
  metric: string;
  deadline: string;
  created_at: string;
  status: string;
}

async function getMetricValue(userId: number, metric: string, since: string): Promise<number> {
  switch (metric) {
    case 'distance': {
      const row = await db.queryOne(`
        SELECT COALESCE(SUM(distance_meters), 0) as total FROM activities
        WHERE user_id = $1 AND start_date >= $2
      `, [userId, since]) as { total: number };
      return row.total / 1000;
    }
    case 'pace': {
      const row = await db.queryOne(`
        SELECT MIN(CASE WHEN distance_meters > 0 THEN moving_time * 1.0 / (distance_meters / 1000.0) ELSE NULL END) as best_pace
        FROM activities WHERE user_id = $1 AND start_date >= $2 AND distance_meters >= 1000
      `, [userId, since]) as { best_pace: number | null };
      return row.best_pace ?? 999;
    }
    case 'runs_count': {
      const row = await db.queryOne(`
        SELECT COUNT(*) as count FROM activities
        WHERE user_id = $1 AND start_date >= $2
      `, [userId, since]) as { count: number };
      return row.count;
    }
    case 'streak': {
      const row = await db.queryOne('SELECT current_streak_days FROM kendu_balances WHERE user_id = $1', [userId]) as { current_streak_days: number } | undefined;
      return row?.current_streak_days ?? 0;
    }
    default:
      return 0;
  }
}

export async function resolveExpiredChallenges(): Promise<{ resolved: number; expired: number; winners: number[] }> {
  const expired = await db.query(`
    SELECT * FROM kendu_challenges WHERE status = 'active' AND deadline <= NOW()
  `) as ChallengeRow[];

  let resolved = 0;
  let expiredCount = 0;
  const winners: number[] = [];

  for (const c of expired) {
    const challengerScore = await getMetricValue(c.challenger_id, c.metric, c.created_at);
    const opponentScore = await getMetricValue(c.opponent_id, c.metric, c.created_at);

    const totalPot = c.stake_amount * 2;
    let winnerId: number | null = null;

    if (c.metric === 'pace') {
      // Lower pace = faster = winner (but 999 means no runs)
      if (challengerScore < opponentScore && challengerScore < 999) winnerId = c.challenger_id;
      else if (opponentScore < challengerScore && opponentScore < 999) winnerId = c.opponent_id;
    } else {
      // Higher = better for distance, runs_count, streak
      if (challengerScore > opponentScore) winnerId = c.challenger_id;
      else if (opponentScore > challengerScore) winnerId = c.opponent_id;
    }

    if (winnerId) {
      await awardChallengeWinner(winnerId, totalPot, c.id);
      await db.execute("UPDATE kendu_challenges SET status = 'completed', winner_id = $1 WHERE id = $2", [winnerId, c.id]);
      winners.push(winnerId);
    } else {
      // Tie or both inactive — refund 80% each (20% burned)
      const refundEach = Math.floor(c.stake_amount * 0.8);
      await ensureBalance(c.challenger_id);
      await ensureBalance(c.opponent_id);

      await db.execute('UPDATE kendu_balances SET spendable_balance = spendable_balance + $1 WHERE user_id = $2',
        [refundEach, c.challenger_id]);
      await db.execute('INSERT INTO kendu_transactions (user_id, amount, source, metadata) VALUES ($1, $2, $3, $4)',
        [c.challenger_id, refundEach, 'challenge_refund_expired', JSON.stringify({ challengeId: c.id })]);

      await db.execute('UPDATE kendu_balances SET spendable_balance = spendable_balance + $1 WHERE user_id = $2',
        [refundEach, c.opponent_id]);
      await db.execute('INSERT INTO kendu_transactions (user_id, amount, source, metadata) VALUES ($1, $2, $3, $4)',
        [c.opponent_id, refundEach, 'challenge_refund_expired', JSON.stringify({ challengeId: c.id })]);

      await db.execute("UPDATE kendu_challenges SET status = 'expired' WHERE id = $1", [c.id]);
      expiredCount++;
    }
    resolved++;
  }

  // Also expire pending challenges past deadline (refund challenger fully)
  const pendingExpired = await db.query(`
    SELECT * FROM kendu_challenges WHERE status = 'pending' AND deadline <= NOW()
  `) as ChallengeRow[];

  for (const c of pendingExpired) {
    await ensureBalance(c.challenger_id);
    await db.execute('UPDATE kendu_balances SET spendable_balance = spendable_balance + $1 WHERE user_id = $2',
      [c.stake_amount, c.challenger_id]);
    await db.execute('INSERT INTO kendu_transactions (user_id, amount, source, metadata) VALUES ($1, $2, $3, $4)',
      [c.challenger_id, c.stake_amount, 'challenge_refund', JSON.stringify({ challengeId: c.id, reason: 'expired_pending' })]);
    await db.execute("UPDATE kendu_challenges SET status = 'expired' WHERE id = $1", [c.id]);
    expiredCount++;
    resolved++;
  }

  return { resolved, expired: expiredCount, winners };
}
