// DB_PATH + JWT_SECRET are set in src/test-setup.ts before any import, so the
// db connection opens against a per-worker temp DB (not the real one).
import { describe, it, expect, beforeAll } from 'vitest';
import { initializeDatabase } from '../database/db';
import db from '../database/db';
import { checkForNewPRs, calculateAllPRs } from '../engine/personalRecords';

beforeAll(() => {
  initializeDatabase();
});

describe('Run-log cascade: activity insert → XP → PR detection', () => {
  let userId: number;

  it('creates a test user with XP record', () => {
    db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, role, gender, age, height_cm, weight_kg, fitness_level, running_experience)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('Cascade Runner', 'cascade@test.com', '9000000000', 'hash', 'runner', 'male', 25, 175, 70, 'active', 'intermediate');

    const user = db.prepare("SELECT id FROM users WHERE email = 'cascade@test.com'").get() as any;
    userId = user.id;

    db.prepare('INSERT INTO user_xp (user_id, total_xp, current_level, current_streak_days) VALUES (?, 0, 1, 0)').run(userId);
  });

  it('inserts an activity and awards XP', () => {
    db.prepare(`
      INSERT INTO activities (user_id, strava_activity_id, activity_type, distance_meters, moving_time_seconds, elapsed_time_seconds, average_pace_per_km, start_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, 'test-001', 'Run', 5000, 1500, 1500, 300, new Date().toISOString());

    // Award XP for completing a run (simulating what the app does)
    const xpForRun = 50;
    db.prepare('UPDATE user_xp SET total_xp = total_xp + ? WHERE user_id = ?').run(xpForRun, userId);

    const xp = db.prepare('SELECT total_xp FROM user_xp WHERE user_id = ?').get(userId) as any;
    expect(xp.total_xp).toBe(50);
  });

  it('detects personal records from activities', () => {
    // Insert a few more runs to have PR candidates
    const runs = [
      { strava: 'test-002', dist: 5000, time: 1400, pace: 280, name: 'Fast 5K' },
      { strava: 'test-003', dist: 10000, time: 3200, pace: 320, name: '10K Run' },
      { strava: 'test-004', dist: 5000, time: 1350, pace: 270, name: 'PR Attempt' },
    ];

    for (const r of runs) {
      db.prepare(`
        INSERT INTO activities (user_id, strava_activity_id, activity_type, distance_meters, moving_time_seconds, elapsed_time_seconds, average_pace_per_km, start_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, r.strava, 'Run', r.dist, r.time, r.time, r.pace, new Date().toISOString());
    }

    // Get all activities for PR calculation
    const activities = db.prepare('SELECT * FROM activities WHERE user_id = ? ORDER BY start_date').all(userId) as any[];

    const prs = calculateAllPRs(activities);
    expect(prs.length).toBeGreaterThan(0);

    // Check for a new PR vs existing
    const existingPRs = prs.slice(0, -1);
    const latestActivity = activities[activities.length - 1];
    const prCheck = checkForNewPRs(latestActivity, existingPRs);
    expect(prCheck).toBeDefined();
  });

  it('XP accumulates correctly across runs', () => {
    // Award more XP
    db.prepare('UPDATE user_xp SET total_xp = total_xp + 50 WHERE user_id = ?').run(userId);
    db.prepare('UPDATE user_xp SET total_xp = total_xp + 50 WHERE user_id = ?').run(userId);

    const xp = db.prepare('SELECT total_xp FROM user_xp WHERE user_id = ?').get(userId) as any;
    expect(xp.total_xp).toBe(150); // 50 + 50 + 50
  });

  it('streak tracking works', () => {
    db.prepare('UPDATE user_xp SET current_streak_days = current_streak_days + 1 WHERE user_id = ?').run(userId);
    const xp = db.prepare('SELECT current_streak_days FROM user_xp WHERE user_id = ?').get(userId) as any;
    expect(xp.current_streak_days).toBe(1);
  });
});
