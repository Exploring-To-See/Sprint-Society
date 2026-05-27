import db from '../database/db';

interface UnlockedAchievement {
  id: number;
  name: string;
  icon: string;
  xpReward: number;
}

export function checkAndUnlockAchievements(userId: number, context: {
  totalRuns: number;
  totalDistanceKm: number;
  currentStreakDays: number;
  latestRunDistanceKm: number;
  latestPacePerKm: number;
}): UnlockedAchievement[] {
  const allAchievements = db.prepare(`
    SELECT a.* FROM achievements a
    WHERE a.id NOT IN (SELECT achievement_id FROM user_achievements WHERE user_id = ?)
  `).all(userId) as any[];

  const unlocked: UnlockedAchievement[] = [];

  for (const achievement of allAchievements) {
    let earned = false;

    switch (achievement.requirement_type) {
      case 'total_runs':
        earned = context.totalRuns >= achievement.requirement_value;
        break;
      case 'total_distance_km':
        earned = context.totalDistanceKm >= achievement.requirement_value;
        break;
      case 'single_distance_km':
        earned = context.latestRunDistanceKm >= achievement.requirement_value;
        break;
      case 'streak_days':
        earned = context.currentStreakDays >= achievement.requirement_value;
        break;
      case 'best_pace_per_km':
        earned = context.latestPacePerKm > 0 && context.latestPacePerKm <= achievement.requirement_value;
        break;
    }

    if (earned) {
      db.prepare('INSERT OR IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)')
        .run(userId, achievement.id);

      if (achievement.xp_reward > 0) {
        db.prepare('UPDATE user_xp SET total_xp = total_xp + ? WHERE user_id = ?')
          .run(achievement.xp_reward, userId);
        db.prepare('INSERT INTO xp_transactions (user_id, amount, source, description) VALUES (?, ?, ?, ?)')
          .run(userId, achievement.xp_reward, 'achievement', `Unlocked: ${achievement.name}`);
      }

      unlocked.push({
        id: achievement.id,
        name: achievement.name,
        icon: achievement.icon,
        xpReward: achievement.xp_reward,
      });
    }
  }

  return unlocked;
}
