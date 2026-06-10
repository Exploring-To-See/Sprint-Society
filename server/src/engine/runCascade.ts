import db from '../database/db';
import { RunCompletedPayload, CascadeResult } from './eventBus';
import { checkAndUnlockAchievements } from './achievementEngine';
import { calculateKenduForRun } from './kenduEngine';
import { validateRunData } from './gpsValidation';

function xpNeededForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

function totalXpToReachLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpNeededForLevel(i);
  }
  return total;
}

function calculateCurrentLevel(totalXp: number): number {
  let level = 1;
  let cumulative = 0;
  while (cumulative + xpNeededForLevel(level) <= totalXp) {
    cumulative += xpNeededForLevel(level);
    level++;
  }
  return level;
}

function createNotification(userId: number, type: string, title: string, body: string) {
  db.prepare(`
    INSERT INTO user_notifications (user_id, type, title, body)
    VALUES (?, ?, ?, ?)
  `).run(userId, type, title, body);
}

export function executeRunCascade(payload: RunCompletedPayload): CascadeResult {
  const { userId, activityId, distanceMeters, movingTimeSeconds, pacePerKm } = payload;
  const distanceKm = distanceMeters / 1000;

  // --- 0. GPS FRAUD DETECTION ---
  const activity = db.prepare('SELECT splits, elevation_gain FROM activities WHERE id = ?').get(activityId) as any;
  const validation = validateRunData({
    distanceMeters,
    movingTimeSeconds,
    pacePerKm,
    splits: activity?.splits || null,
    elevationGain: payload.elevationGain,
  });

  if (validation.suspicious) {
    db.prepare('UPDATE activities SET suspicious = 1 WHERE id = ?').run(activityId);
  }

  // --- 1. STREAK (unified — using user_xp as source of truth) ---
  const today = new Date().toISOString().split('T')[0];
  const xpBefore = db.prepare('SELECT * FROM user_xp WHERE user_id = ?').get(userId) as any;

  let streakExtended = false;
  let currentStreak = 1;
  let longestStreak = 1;

  if (xpBefore) {
    const lastDate = xpBefore.last_activity_date;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (lastDate === yesterday) {
      currentStreak = xpBefore.current_streak_days + 1;
      longestStreak = Math.max(xpBefore.longest_streak_days, currentStreak);
      streakExtended = true;
      db.prepare('UPDATE user_xp SET current_streak_days = ?, longest_streak_days = ?, last_activity_date = ? WHERE user_id = ?')
        .run(currentStreak, longestStreak, today, userId);
    } else if (lastDate !== today) {
      currentStreak = 1;
      longestStreak = xpBefore.longest_streak_days;
      db.prepare('UPDATE user_xp SET current_streak_days = 1, last_activity_date = ? WHERE user_id = ?')
        .run(today, userId);
    } else {
      currentStreak = xpBefore.current_streak_days;
      longestStreak = xpBefore.longest_streak_days;
    }
  }

  // --- 2. XP AWARD ---
  const baseXp = 25;
  const previousLevel = xpBefore?.current_level || 1;
  const previousTotalXp = xpBefore?.total_xp || 0;

  db.prepare('UPDATE user_xp SET total_xp = total_xp + ? WHERE user_id = ?').run(baseXp, userId);
  db.prepare('INSERT INTO xp_transactions (user_id, amount, source, description) VALUES (?, ?, ?, ?)')
    .run(userId, baseXp, 'run_completed', `${distanceKm.toFixed(1)}km run`);

  // --- 3. KENDU EARN ---
  const kenduResult = calculateKenduForRun(userId, distanceKm, false, false);

  // --- 4. PERSONAL BEST CHECK ---
  let isPB = false;
  let pbType: string | null = null;
  let previousBest: number | null = null;

  const bestPace = db.prepare(`
    SELECT MIN(average_pace_per_km) as best_pace FROM activities
    WHERE user_id = ? AND id != ? AND average_pace_per_km > 0
  `).get(userId, activityId) as any;

  const bestDistance = db.prepare(`
    SELECT MAX(distance_meters) as best_distance FROM activities
    WHERE user_id = ? AND id != ?
  `).get(userId, activityId) as any;

  if (bestPace?.best_pace && pacePerKm < bestPace.best_pace && pacePerKm > 0) {
    isPB = true;
    pbType = 'pace';
    previousBest = bestPace.best_pace;
  } else if (bestDistance?.best_distance && distanceMeters > bestDistance.best_distance) {
    isPB = true;
    pbType = 'distance';
    previousBest = bestDistance.best_distance;
  }

  // If PB, award bonus Kendu (already handled in kenduEngine if flagged, but we detect here)
  if (isPB) {
    createNotification(userId, 'achievement', 'New Personal Best!',
      pbType === 'pace'
        ? `You ran your fastest pace: ${formatPace(pacePerKm)}/km`
        : `New longest run: ${distanceKm.toFixed(1)}km`
    );
  }

  // --- 5. ACHIEVEMENTS ---
  const stats = db.prepare(`
    SELECT COUNT(*) as total_runs, COALESCE(SUM(distance_meters)/1000, 0) as total_km
    FROM activities WHERE user_id = ?
  `).get(userId) as any;

  const achievementsUnlocked = checkAndUnlockAchievements(userId, {
    totalRuns: stats.total_runs,
    totalDistanceKm: stats.total_km,
    currentStreakDays: currentStreak,
    latestRunDistanceKm: distanceKm,
    latestPacePerKm: pacePerKm,
  });

  // --- 5b. GOAL PROGRESS CHECK ---
  let goalsCompleted: string[] = [];
  const activeGoals = db.prepare(
    `SELECT * FROM user_goals WHERE user_id = ? AND status = 'active'`
  ).all(userId) as any[];

  for (const goal of activeGoals) {
    let completed = false;

    if (goal.type === 'volume' && goal.target_km) {
      const periodDays = goal.target_period === 'week' ? 7 : 30;
      const periodKm = db.prepare(`
        SELECT COALESCE(SUM(distance_meters), 0) / 1000.0 as km
        FROM activities WHERE user_id = ? AND start_date >= datetime('now', '-${periodDays} days') AND deleted_at IS NULL
      `).get(userId) as any;
      if (periodKm.km >= goal.target_km) completed = true;
    } else if (goal.type === 'pace' && goal.target_pace_per_km && pacePerKm > 0) {
      if (pacePerKm <= goal.target_pace_per_km && distanceMeters >= (goal.distance_meters || 3000)) {
        completed = true;
      }
    } else if (goal.type === 'race' && goal.target_time_seconds && goal.distance_meters) {
      if (distanceMeters >= goal.distance_meters * 0.95 && movingTimeSeconds <= goal.target_time_seconds) {
        completed = true;
      }
    }

    if (completed) {
      db.prepare('UPDATE user_goals SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run('completed', goal.id);
      createNotification(userId, 'goal_completed', 'Goal Achieved!', `You hit ${goal.name || 'your goal'}!`);
      goalsCompleted.push(goal.name || goal.type);
    }
  }

  // --- 6. LEVEL-UP CHECK (after all XP awarded including achievements) ---
  const xpAfter = db.prepare('SELECT total_xp FROM user_xp WHERE user_id = ?').get(userId) as any;
  const newTotalXp = xpAfter?.total_xp || 0;
  const newLevel = calculateCurrentLevel(newTotalXp);
  const leveledUp = newLevel > previousLevel;

  if (leveledUp) {
    db.prepare('UPDATE user_xp SET current_level = ? WHERE user_id = ?').run(newLevel, userId);
    createNotification(userId, 'level_up', `Level ${newLevel}!`, `You've reached level ${newLevel}. Keep pushing!`);
  }

  // --- 7. NOTIFICATIONS for achievements ---
  let notificationsCreated = isPB ? 1 : 0;
  if (leveledUp) notificationsCreated++;

  for (const a of achievementsUnlocked) {
    createNotification(userId, 'achievement', `${a.icon} ${a.name}`, `Achievement unlocked! +${a.xpReward} XP`);
    notificationsCreated++;
  }

  // --- 8. RUN XP notification (always) ---
  createNotification(userId, 'xp_award', `+${baseXp} XP`,
    `Earned for your ${distanceKm.toFixed(1)}km run`);
  notificationsCreated++;

  return {
    xp: {
      awarded: baseXp + achievementsUnlocked.reduce((sum, a) => sum + a.xpReward, 0),
      total: newTotalXp,
      level: newLevel,
      leveledUp,
      previousLevel,
    },
    kendu: {
      awarded: kenduResult.pointsEarned || 0,
      breakdown: kenduResult.breakdown || {},
      balance: kenduResult.newBalance || 0,
      capped: kenduResult.cappedToday || false,
      streak: kenduResult.streakDays || currentStreak,
    },
    achievements: { unlocked: achievementsUnlocked },
    notifications: { created: notificationsCreated },
    streak: { current: currentStreak, longest: longestStreak, extended: streakExtended },
    personalBest: { isPB, type: pbType, previousBest },
    goals: { completed: goalsCompleted },
    validation: {
      suspicious: validation.suspicious,
      flags: validation.flags,
      confidence: validation.confidence,
    },
  };
}

function formatPace(secondsPerKm: number): string {
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
