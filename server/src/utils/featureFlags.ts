import db from '../database/db';

export function isFlagEnabled(key: string, userId?: number): boolean {
  const flag = db.prepare('SELECT * FROM feature_flags WHERE key = ?').get(key) as any;
  if (!flag) return false;

  // Check user-specific override
  if (userId) {
    const override = db.prepare(
      'SELECT enabled FROM feature_flag_overrides WHERE flag_id = ? AND user_id = ?'
    ).get(flag.id, userId) as any;
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

export function getAllFlags(userId?: number): Record<string, boolean> {
  const flags = db.prepare('SELECT * FROM feature_flags').all() as any[];
  const result: Record<string, boolean> = {};

  for (const flag of flags) {
    let enabled = !!flag.enabled;

    if (userId) {
      const override = db.prepare(
        'SELECT enabled FROM feature_flag_overrides WHERE flag_id = ? AND user_id = ?'
      ).get(flag.id, userId) as any;
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
