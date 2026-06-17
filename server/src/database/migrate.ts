/**
 * Migration script for Sprint Society PostgreSQL (Supabase).
 * Usage: npx tsx src/database/migrate.ts
 *
 * Reads DATABASE_URL from .env, applies schema.pg.sql, then seeds
 * admin user, Sprint Social Club, achievements, subscription plans, and invite codes.
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { pool, query, queryOne, execute } from './pg';

async function applySchema(): Promise<void> {
  const schemaPath = path.join(__dirname, 'schema.pg.sql');
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`schema.pg.sql not found at ${schemaPath}`);
  }
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  await pool.query(schema);
  console.log('[MIGRATE] Schema applied.');
}

async function seedAdmin(): Promise<void> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.warn('[SEED] ADMIN_PASSWORD env var not set — skipping admin seed.');
    return;
  }

  const hash = bcrypt.hashSync(adminPassword, 10);
  const existing = await queryOne<{ id: number }>(
    "SELECT id FROM users WHERE email = $1",
    ['admin@sprintsociety.com']
  );

  if (existing) {
    await execute(
      'UPDATE users SET password_hash = $1, role = $2 WHERE id = $3',
      [hash, 'admin', existing.id]
    );
    console.log('[SEED] Admin password updated.');
    return;
  }

  await execute(`
    INSERT INTO users (name, email, phone, password_hash, role, gender, age, height_cm, weight_kg, fitness_level, running_experience, injury_history)
    VALUES ($1, $2, $3, $4, 'admin', 'male', 28, 178, 72, 'very_active', 'advanced', '[]')
  `, ['Ishan (Admin)', 'admin@sprintsociety.com', '+919999999999', hash]);

  const admin = await queryOne<{ id: number }>(
    "SELECT id FROM users WHERE email = $1",
    ['admin@sprintsociety.com']
  );
  if (admin) {
    await execute(
      'INSERT INTO user_xp (user_id, total_xp, current_level, current_streak_days, longest_streak_days) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (user_id) DO NOTHING',
      [admin.id, 5000, 12, 21, 45]
    );
  }
  console.log('[SEED] Admin user created.');
}

async function seedSprintSocialClub(): Promise<void> {
  const existing = await queryOne<{ id: number }>(
    "SELECT id FROM communities WHERE name = $1",
    ['Sprint Social Club']
  );
  if (existing) {
    console.log('[SEED] Sprint Social Club already exists.');
    return;
  }

  const admin = await queryOne<{ id: number }>(
    "SELECT id FROM users WHERE email = $1",
    ['admin@sprintsociety.com']
  );
  if (!admin) {
    console.warn('[SEED] Admin not found — skipping Sprint Social Club seed.');
    return;
  }

  const result = await execute(`
    INSERT INTO communities (owner_id, name, description, category, is_verified, member_count)
    VALUES ($1, 'Sprint Social Club', 'The official Sprint Society community. Everyone''s in. Announcements, events, vibes.', 'social', 1, 1)
    RETURNING id
  `, [admin.id]);

  const communityId = result.rows[0]?.id;
  if (communityId) {
    await execute(
      'INSERT INTO community_members (community_id, user_id, role) VALUES ($1, $2, $3)',
      [communityId, admin.id, 'owner']
    );
  }
  console.log('[SEED] Sprint Social Club created.');
}

async function seedAchievements(): Promise<void> {
  const count = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM achievements');
  if (count && parseInt(count.count, 10) > 0) {
    console.log('[SEED] Achievements already seeded.');
    return;
  }

  const achievements = [
    { name: 'First Steps', description: 'Complete your first run', icon: '👟', category: 'running', requirement_type: 'total_runs', requirement_value: 1, xp_reward: 100 },
    { name: 'Getting Started', description: 'Complete 5 runs', icon: '🏃', category: 'running', requirement_type: 'total_runs', requirement_value: 5, xp_reward: 200 },
    { name: 'Dedicated', description: 'Complete 25 runs', icon: '💪', category: 'running', requirement_type: 'total_runs', requirement_value: 25, xp_reward: 500 },
    { name: 'Centurion', description: 'Complete 100 runs', icon: '🏆', category: 'running', requirement_type: 'total_runs', requirement_value: 100, xp_reward: 1000 },
    { name: '5K Finisher', description: 'Complete a 5K run', icon: '🎯', category: 'distance', requirement_type: 'single_distance_km', requirement_value: 5, xp_reward: 150 },
    { name: '10K Warrior', description: 'Complete a 10K run', icon: '⚡', category: 'distance', requirement_type: 'single_distance_km', requirement_value: 10, xp_reward: 300 },
    { name: 'Half Marathon Hero', description: 'Complete a half marathon', icon: '🦸', category: 'distance', requirement_type: 'single_distance_km', requirement_value: 21.1, xp_reward: 750 },
    { name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', category: 'streak', requirement_type: 'streak_days', requirement_value: 7, xp_reward: 300 },
    { name: 'Month Master', description: 'Maintain a 30-day streak', icon: '🌟', category: 'streak', requirement_type: 'streak_days', requirement_value: 30, xp_reward: 1000 },
    { name: 'Speed Demon', description: 'Run a sub-5:00/km pace', icon: '💨', category: 'pace', requirement_type: 'best_pace_per_km', requirement_value: 300, xp_reward: 400 },
    { name: 'Lightning', description: 'Run a sub-4:00/km pace', icon: '⚡', category: 'pace', requirement_type: 'best_pace_per_km', requirement_value: 240, xp_reward: 800 },
    { name: 'Challenge Crusher', description: 'Complete 10 challenges', icon: '✅', category: 'challenges', requirement_type: 'challenges_completed', requirement_value: 10, xp_reward: 300 },
    { name: 'Level Up', description: 'Reach Intermediate tier', icon: '📈', category: 'tier', requirement_type: 'tier_reached', requirement_value: 2, xp_reward: 500 },
    { name: 'Elite', description: 'Reach Advanced tier', icon: '👑', category: 'tier', requirement_type: 'tier_reached', requirement_value: 3, xp_reward: 1000 },
    { name: '50K Total', description: 'Run 50km total distance', icon: '🗺️', category: 'distance', requirement_type: 'total_distance_km', requirement_value: 50, xp_reward: 250 },
    { name: '100K Club', description: 'Run 100km total distance', icon: '🌍', category: 'distance', requirement_type: 'total_distance_km', requirement_value: 100, xp_reward: 500 },
    { name: 'Event Goer', description: 'Attend your first event', icon: '🎉', category: 'social', requirement_type: 'events_attended', requirement_value: 1, xp_reward: 100 },
    { name: 'Social Butterfly', description: 'Attend 5 events', icon: '🦋', category: 'social', requirement_type: 'events_attended', requirement_value: 5, xp_reward: 300 },
    { name: 'Regular', description: 'Attend 20 events', icon: '🏠', category: 'social', requirement_type: 'events_attended', requirement_value: 20, xp_reward: 750 },
    { name: 'Community Builder', description: 'Create a community', icon: '🏘️', category: 'social', requirement_type: 'communities_created', requirement_value: 1, xp_reward: 500 },
    { name: 'Community Leader', description: 'Grow a community to 50 members', icon: '👑', category: 'social', requirement_type: 'community_members', requirement_value: 50, xp_reward: 1000 },
  ];

  for (const a of achievements) {
    await execute(
      `INSERT INTO achievements (name, description, icon, category, requirement_type, requirement_value, xp_reward)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [a.name, a.description, a.icon, a.category, a.requirement_type, a.requirement_value, a.xp_reward]
    );
  }
  console.log('[SEED] Achievements seeded.');
}

async function seedSubscriptionPlans(): Promise<void> {
  const plans = [
    {
      key: 'base', name: 'Base', price_inr: 9, duration_days: 30,
      features: JSON.stringify(['Track runs', 'Join events', 'Join communities', 'Social feed', 'Leaderboard', 'AI training plan (auto-adjusts)', 'Pace zones', 'Weekly AI summary', 'HR zones']),
    },
    {
      key: 'pro', name: 'Pro', price_inr: 99, duration_days: 30,
      features: JSON.stringify(['Everything in Base', 'AI chat coach (Sonnet)', 'Pre/post run check-ins', 'AI memory (coach remembers you)', 'Personal records', 'Adaptive training engine', 'Transformation plans', 'Weekly challenges', 'Create communities']),
    },
  ];

  // Upsert: delete existing and re-insert to keep plans current
  await execute('DELETE FROM subscription_plans');

  for (const p of plans) {
    await execute(
      'INSERT INTO subscription_plans (key, name, price_inr, duration_days, features) VALUES ($1, $2, $3, $4, $5)',
      [p.key, p.name, p.price_inr, p.duration_days, p.features]
    );
  }
  console.log('[SEED] Subscription plans seeded.');
}

async function seedInviteCodes(): Promise<void> {
  const admin = await queryOne<{ id: number }>(
    "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
  );
  if (!admin) {
    console.warn('[SEED] No admin user — skipping invite codes.');
    return;
  }

  const codes = [
    { code: 'SPRINT50', name: 'Beta Launch — First 50', max_uses: 50 },
    { code: 'KENDU', name: 'Kendu VIP — Unlimited', max_uses: 9999 },
    { code: 'FOUNDERS', name: 'Founding Members', max_uses: 10 },
  ];

  for (const c of codes) {
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM invite_codes WHERE code = $1',
      [c.code]
    );
    if (existing) continue;

    await execute(
      'INSERT INTO invite_codes (code, name, max_uses, created_by, active) VALUES ($1, $2, $3, $4, 1)',
      [c.code, c.name, c.max_uses, admin.id]
    );
  }
  console.log('[SEED] Invite codes seeded.');
}

async function seedFeatureFlags(): Promise<void> {
  const flagsToSeed = [
    { key: 'ai_chat', name: 'AI Chat Coach', description: 'Sonnet-powered chat coaching (Pro only)', enabled: false },
    { key: 'ai_voice', name: 'AI Voice Coach', description: 'Voice-based run coaching (future)', enabled: false },
    { key: 'ai_generation', name: 'AI Plan Generation', description: 'AI-generated training plans (future)', enabled: false },
    { key: 'social_feed', name: 'Social Feed', description: 'Activity feed with kudos and comments', enabled: true },
    { key: 'live_events', name: 'Live Events', description: 'Event creation and RSVPs', enabled: true },
    { key: 'communities', name: 'Communities', description: 'Community creation and chat', enabled: true },
    { key: 'razorpay_payments', name: 'Razorpay Payments', description: 'Subscription payment processing', enabled: true },
    { key: 'strava_sync', name: 'Strava Sync', description: 'Strava OAuth + webhook sync', enabled: true },
  ];

  for (const f of flagsToSeed) {
    await execute(
      `INSERT INTO feature_flags (key, name, description, enabled, rollout_percentage)
       VALUES ($1, $2, $3, $4, 100)
       ON CONFLICT (key) DO NOTHING`,
      [f.key, f.name, f.description, f.enabled]
    );
  }
  console.log('[SEED] Feature flags seeded.');
}

async function main(): Promise<void> {
  console.log('[MIGRATE] Starting Sprint Society PostgreSQL migration...');
  console.log('[MIGRATE] Target:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@') || 'NOT SET');

  if (!process.env.DATABASE_URL) {
    console.error('[MIGRATE] DATABASE_URL is not set. Aborting.');
    process.exit(1);
  }

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('[MIGRATE] Connected to PostgreSQL.');

    await applySchema();
    await seedAdmin();
    await seedSprintSocialClub();
    await seedAchievements();
    await seedSubscriptionPlans();
    await seedInviteCodes();
    await seedFeatureFlags();

    console.log('[MIGRATE] All migrations and seeds completed successfully.');
  } catch (err: any) {
    console.error('[MIGRATE] Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
