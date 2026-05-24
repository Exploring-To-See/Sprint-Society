import Database, { type Database as DatabaseType } from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/sprint-society.db');

const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db: DatabaseType = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initializeDatabase() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  db.exec(schema);
  runMigrations();
  seedAdmin();
  seedSprintSocialClub();
  seedAchievements();
  seedSubscriptionPlans();
  seedInviteCodes();
}

function seedInviteCodes() {
  const adminId = (db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get() as any)?.id;
  if (!adminId) return;

  const codes = [
    { code: 'SPRINT50', name: 'Beta Launch — First 50', max_uses: 50 },
    { code: 'KENDU', name: 'Kendu VIP — Unlimited', max_uses: 9999 },
    { code: 'FOUNDERS', name: 'Founding Members', max_uses: 10 },
  ];

  for (const c of codes) {
    const existing = db.prepare('SELECT id FROM invite_codes WHERE code = ?').get(c.code);
    if (existing) continue;
    db.prepare('INSERT INTO invite_codes (code, name, max_uses, created_by, active) VALUES (?, ?, ?, ?, 1)')
      .run(c.code, c.name, c.max_uses, adminId);
  }
}

function runMigrations() {
  const activityCols = db.prepare("PRAGMA table_info(activities)").all() as any[];
  if (!activityCols.find((c: any) => c.name === 'activity_type')) {
    db.exec("ALTER TABLE activities ADD COLUMN activity_type TEXT DEFAULT 'Run'");
  }

  const kudosCols = db.prepare("PRAGMA table_info(kudos)").all() as any[];
  if (!kudosCols.find((c: any) => c.name === 'reaction_type')) {
    db.exec("ALTER TABLE kudos ADD COLUMN reaction_type TEXT DEFAULT 'high_five'");
  }
}

function seedAdmin() {
  const existing = db.prepare("SELECT id FROM users WHERE email = 'admin@sprintsociety.com'").get() as any;
  if (existing) return;

  const hash = bcrypt.hashSync('kendusprintsociety', 10);
  db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, role, gender, age, height_cm, weight_kg, fitness_level, running_experience, injury_history)
    VALUES (?, ?, ?, ?, 'admin', 'male', 28, 178, 72, 'very_active', 'advanced', '[]')
  `).run('Ishan (Admin)', 'admin@sprintsociety.com', '+919999999999', hash);

  const adminId = (db.prepare("SELECT id FROM users WHERE email = 'admin@sprintsociety.com'").get() as any).id;
  db.prepare('INSERT OR IGNORE INTO user_xp (user_id, total_xp, current_level, current_streak_days, longest_streak_days) VALUES (?, ?, ?, ?, ?)').run(adminId, 5000, 12, 21, 45);
}

function seedSprintSocialClub() {
  const existing = db.prepare("SELECT id FROM communities WHERE name = 'Sprint Social Club'").get() as any;
  if (existing) return;

  const admin = db.prepare("SELECT id FROM users WHERE email = 'admin@sprintsociety.com'").get() as any;
  if (!admin) return;

  const result = db.prepare(`
    INSERT INTO communities (owner_id, name, description, category, is_verified, member_count)
    VALUES (?, 'Sprint Social Club', 'The official Sprint Society community. Everyone''s in. Announcements, events, vibes.', 'social', 1, 1)
  `).run(admin.id);

  db.prepare('INSERT INTO community_members (community_id, user_id, role) VALUES (?, ?, ?)')
    .run(result.lastInsertRowid, admin.id, 'owner');
}

function seedSubscriptionPlans() {
  const count = db.prepare('SELECT COUNT(*) as count FROM subscription_plans').get() as { count: number };

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

  if (count.count > 0) {
    db.prepare('DELETE FROM subscription_plans').run();
  }

  const stmt = db.prepare('INSERT INTO subscription_plans (key, name, price_inr, duration_days, features) VALUES (?, ?, ?, ?, ?)');
  for (const p of plans) {
    stmt.run(p.key, p.name, p.price_inr, p.duration_days, p.features);
  }
}

function seedAchievements() {
  const count = db.prepare('SELECT COUNT(*) as count FROM achievements').get() as { count: number };
  if (count.count > 0) return;

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

  const stmt = db.prepare(`INSERT INTO achievements (name, description, icon, category, requirement_type, requirement_value, xp_reward) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  for (const a of achievements) {
    stmt.run(a.name, a.description, a.icon, a.category, a.requirement_type, a.requirement_value, a.xp_reward);
  }
}

export default db;
