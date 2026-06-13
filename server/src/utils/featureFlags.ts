import db from '../database/pg';

export async function isFlagEnabled(key: string, userId?: number): Promise<boolean> {
  const flag = await db.queryOne('SELECT * FROM feature_flags WHERE key = $1', [key]);
  if (!flag) return false;

  // Check user-specific override
  if (userId) {
    const override = await db.queryOne(
      'SELECT enabled FROM feature_flag_overrides WHERE flag_id = $1 AND user_id = $2',
      [flag.id, userId]
    );
    if (override) return !!override.enabled;
  }

  if (!flag.enabled) return false;

  // Rollout percentage check
  if (flag.rollout_percentage < 100 && userId) {
    const hash = (userId * 2654435761) % 100;
    return hash < flag.rollout_percentage;
  }

  return true;
}

export async function getAllFlags(userId?: number): Promise<Record<string, boolean>> {
  const flags = await db.query('SELECT * FROM feature_flags', []);
  const result: Record<string, boolean> = {};

  for (const flag of flags) {
    let enabled = !!flag.enabled;

    if (userId) {
      const override = await db.queryOne(
        'SELECT enabled FROM feature_flag_overrides WHERE flag_id = $1 AND user_id = $2',
        [flag.id, userId]
      );
      if (override) {
        enabled = !!override.enabled;
        result[flag.key] = enabled;
        continue;
      }
    }

    if (!flag.enabled) {
      result[flag.key] = false;
      continue;
    }

    if (flag.rollout_percentage < 100 && userId) {
      const hash = (userId * 2654435761) % 100;
      result[flag.key] = hash < flag.rollout_percentage;
    } else {
      result[flag.key] = true;
    }
  }

  return result;
}
