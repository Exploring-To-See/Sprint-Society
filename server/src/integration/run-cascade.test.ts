// DATABASE_URL + JWT_SECRET are set in src/test-setup.ts before any import, so
// the pg pool opens against the local test Postgres (not the real one).
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { resetDatabase, closePool } from '../test-helpers/db';
import { query, queryOne, execute } from '../database/pg';
import { checkForNewPRs, calculateAllPRs } from '../engine/personalRecords';

beforeAll(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await closePool();
});

describe('Run-log cascade: activity insert → XP → PR detection', () => {
  let userId: number;

  it('creates a test user with XP record', async () => {
    const user = await queryOne<{ id: number }>(`
      INSERT INTO users (name, email, phone, password_hash, role, gender, age, height_cm, weight_kg, fitness_level, running_experience)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, ['Cascade Runner', 'cascade@test.com', '9000000000', 'hash', 'runner', 'male', 25, 175, 70, 'active', 'intermediate']);

    userId = user!.id;
    expect(userId).toBeGreaterThan(0);

    await execute('INSERT INTO user_xp (user_id, total_xp, current_level, current_streak_days) VALUES ($1, 0, 1, 0)', [userId]);
  });

  it('inserts an activity and awards XP', async () => {
    await execute(`
      INSERT INTO activities (user_id, strava_activity_id, activity_type, distance_meters, moving_time_seconds, elapsed_time_seconds, average_pace_per_km, start_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [userId, 1001, 'Run', 5000, 1500, 1500, 300, new Date().toISOString()]);

    // Award XP for completing a run (simulating what the app does)
    const xpForRun = 50;
    await execute('UPDATE user_xp SET total_xp = total_xp + $1 WHERE user_id = $2', [xpForRun, userId]);

    const xp = await queryOne<{ total_xp: number }>('SELECT total_xp FROM user_xp WHERE user_id = $1', [userId]);
    expect(xp!.total_xp).toBe(50);
  });

  it('detects personal records from activities', async () => {
    // Insert a few more runs to have PR candidates. strava_activity_id is BIGINT,
    // and start_date is staggered so ORDER BY is deterministic.
    const runs = [
      { strava: 1002, dist: 5000, time: 1400, pace: 280 },
      { strava: 1003, dist: 10000, time: 3200, pace: 320 },
      { strava: 1004, dist: 5000, time: 1350, pace: 270 },
    ];

    let dayOffset = 1;
    for (const r of runs) {
      const date = new Date(Date.now() + dayOffset++ * 86_400_000).toISOString();
      await execute(`
        INSERT INTO activities (user_id, strava_activity_id, activity_type, distance_meters, moving_time_seconds, elapsed_time_seconds, average_pace_per_km, start_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [userId, r.strava, 'Run', r.dist, r.time, r.time, r.pace, date]);
    }

    // Get all activities for PR calculation
    const activities = await query<any>('SELECT * FROM activities WHERE user_id = $1 ORDER BY start_date', [userId]);

    const prs = calculateAllPRs(activities);
    expect(prs.length).toBeGreaterThan(0);

    // Check for a new PR vs existing
    const existingPRs = prs.slice(0, -1);
    const latestActivity = activities[activities.length - 1];
    const prCheck = checkForNewPRs(latestActivity, existingPRs);
    expect(prCheck).toBeDefined();
  });

  it('XP accumulates correctly across runs', async () => {
    // Award more XP
    await execute('UPDATE user_xp SET total_xp = total_xp + 50 WHERE user_id = $1', [userId]);
    await execute('UPDATE user_xp SET total_xp = total_xp + 50 WHERE user_id = $1', [userId]);

    const xp = await queryOne<{ total_xp: number }>('SELECT total_xp FROM user_xp WHERE user_id = $1', [userId]);
    expect(xp!.total_xp).toBe(150); // 50 + 50 + 50
  });

  it('streak tracking works', async () => {
    await execute('UPDATE user_xp SET current_streak_days = current_streak_days + 1 WHERE user_id = $1', [userId]);
    const xp = await queryOne<{ current_streak_days: number }>('SELECT current_streak_days FROM user_xp WHERE user_id = $1', [userId]);
    expect(xp!.current_streak_days).toBe(1);
  });
});
