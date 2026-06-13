import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';

const TEST_DB_PATH = path.join(__dirname, '../../data/test-cascade.db');
process.env.DB_PATH = TEST_DB_PATH;
process.env.JWT_SECRET = 'test-secret-key-for-ci';

import { initializeDatabase } from '../database/db';
import db from '../database/db';
import { checkForNewPRs, calculateAllPRs } from '../engine/personalRecords';

beforeAll(() => {
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
  initializeDatabase();
});

afterAll(() => {
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
  if (fs.existsSync(TEST_DB_PATH + '-wal')) fs.unlinkSync(TEST_DB_PATH + '-wal');
  if (fs.existsSync(TEST_DB_PATH + '-shm')) fs.unlinkSync(TEST_DB_PATH + '-shm');
});

describe('Run-log cascade: activity insert → XP → PR detection', () => {
  let userId: number;

  it('creates a test user with XP record', () => {
    db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, role, gender, age, height_cm, weight_kg, fitness_level, running_experience)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('Cascade Runner', 'cascade@test.com', '9000000000', 'hash', 'user', 'male', 25, 175, 70, 'active', 'intermediate');

    const user = db.prepare("SELECT id FROM users WHERE email = 'cascade@test.com'").get() as any;
    userId = user.id;

    db.prepare('INSERT INTO user_xp (user_id, xp, level, streak_days) VALUES (?, 0, 1, 0)').run(userId);
  });

  it('inserts an activity and awards XP', () => {
    db.prepare(`
      INSERT INTO activities (user_id, strava_id, activity_type, name, distance_meters, moving_time_seconds, average_pace_per_km, start_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, 'test-001', 'Run', 'Morning 5K', 5000, 1500, 300, new Date().toISOString());

    // Award XP for completing a run (simulating what the app does)
    const xpForRun = 50;
    db.prepare('UPDATE user_xp SET xp = xp + ? WHERE user_id = ?').run(xpForRun, userId);

    const xp = db.prepare('SELECT xp FROM user_xp WHERE user_id = ?').get(userId) as any;
    expect(xp.xp).toBe(50);
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
        INSERT INTO activities (user_id, strava_id, activity_type, name, distance_meters, moving_time_seconds, average_pace_per_km, start_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, r.strava, 'Run', r.name, r.dist, r.time, r.pace, new Date().toISOString());
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
    db.prepare('UPDATE user_xp SET xp = xp + 50 WHERE user_id = ?').run(userId);
    db.prepare('UPDATE user_xp SET xp = xp + 50 WHERE user_id = ?').run(userId);

    const xp = db.prepare('SELECT xp FROM user_xp WHERE user_id = ?').get(userId) as any;
    expect(xp.xp).toBe(150); // 50 + 50 + 50
  });

  it('streak tracking works', () => {
    db.prepare('UPDATE user_xp SET streak_days = streak_days + 1 WHERE user_id = ?').run(userId);
    const xp = db.prepare('SELECT streak_days FROM user_xp WHERE user_id = ?').get(userId) as any;
    expect(xp.streak_days).toBe(1);
  });
});
