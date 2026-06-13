import db from '../database/pg';

interface UnlockedAchievement {
  id: number;
  name: string;
  icon: string;
  xpReward: number;
}

export async function checkAndUnlockAchievements(userId: number, context: {
  totalRuns: number;
  totalDistanceKm: number;
  currentStreakDays: number;
  latestRunDistanceKm: number;
  latestPacePerKm: number;
}): Promise<UnlockedAchievement[]> {
  const allAchievements = await db.query(`
    SELECT a.* FROM achievements a
    WHERE a.id NOT IN (SELECT achievement_id FROM user_achievements WHERE user_id = $1)
  `, [userId]) as any[];

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
      await db.execute('INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, achievement.id]);

      if (achievement.xp_reward > 0) {
        await db.execute('UPDATE user_xp SET total_xp = total_xp + $1 WHERE user_id = $2',
          [achievement.xp_reward, userId]);
        await db.execute('INSERT INTO xp_transactions (user_id, amount, source, description) VALUES ($1, $2, $3, $4)',
          [userId, achievement.xp_reward, 'achievement', `Unlocked: ${achievement.name}`]);
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
