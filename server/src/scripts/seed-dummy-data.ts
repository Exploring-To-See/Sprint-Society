import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/sprint-society.db');
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf-8');
db.exec(schema);

console.log('🌱 Seeding Sprint Society with dummy data...\n');

const passwordHash = bcrypt.hashSync('test123', 10);

// ===== ADMIN USER =====
const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@sprintsociety.com');
if (!adminExists) {
  db.prepare(`INSERT INTO users (name, email, password_hash, role, gender, age, height_cm, weight_kg, fitness_level, running_experience, injury_history)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    'Admin', 'admin@sprintsociety.com', passwordHash, 'admin', 'male', 30, 178, 75, 'active', 'advanced', '[]'
  );
  console.log('✓ Admin: admin@sprintsociety.com / test123');
}

// ===== DUMMY RUNNERS =====
const runners = [
  { name: 'Priya Sharma', email: 'priya@test.com', gender: 'female', age: 26, height: 162, weight: 55, fitness: 'active', exp: 'intermediate', injuries: '[]' },
  { name: 'Arjun Patel', email: 'arjun@test.com', gender: 'male', age: 31, height: 175, weight: 72, fitness: 'very_active', exp: 'advanced', injuries: '["knee"]' },
  { name: 'Sneha Reddy', email: 'sneha@test.com', gender: 'female', age: 24, height: 158, weight: 52, fitness: 'lightly_active', exp: 'beginner', injuries: '[]' },
  { name: 'Rahul Kumar', email: 'rahul@test.com', gender: 'male', age: 28, height: 180, weight: 78, fitness: 'active', exp: 'intermediate', injuries: '["shin"]' },
  { name: 'Ananya Gupta', email: 'ananya@test.com', gender: 'female', age: 22, height: 165, weight: 58, fitness: 'very_active', exp: 'intermediate', injuries: '[]' },
  { name: 'Vikram Singh', email: 'vikram@test.com', gender: 'male', age: 35, height: 182, weight: 85, fitness: 'active', exp: 'beginner', injuries: '["back"]' },
  { name: 'Meera Nair', email: 'meera@test.com', gender: 'female', age: 29, height: 160, weight: 54, fitness: 'active', exp: 'advanced', injuries: '[]' },
  { name: 'Karthik Rajan', email: 'karthik@test.com', gender: 'male', age: 27, height: 170, weight: 68, fitness: 'very_active', exp: 'advanced', injuries: '[]' },
  { name: 'Divya Iyer', email: 'divya@test.com', gender: 'female', age: 32, height: 155, weight: 50, fitness: 'lightly_active', exp: 'none', injuries: '[]' },
  { name: 'Rohan Desai', email: 'rohan@test.com', gender: 'male', age: 25, height: 176, weight: 70, fitness: 'active', exp: 'intermediate', injuries: '["ankle"]' },
];

const insertUser = db.prepare(`INSERT OR IGNORE INTO users (name, email, password_hash, role, gender, age, height_cm, weight_kg, fitness_level, running_experience, injury_history)
  VALUES (?, ?, ?, 'runner', ?, ?, ?, ?, ?, ?, ?)`);

const insertedRunners: number[] = [];

for (const r of runners) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(r.email) as any;
  if (existing) {
    insertedRunners.push(existing.id);
    continue;
  }
  const result = insertUser.run(r.name, r.email, passwordHash, r.gender, r.age, r.height, r.weight, r.fitness, r.exp, r.injuries);
  insertedRunners.push(result.lastInsertRowid as number);
  console.log(`✓ Runner: ${r.name} (${r.email} / test123)`);
}

// ===== DUMMY RUNS =====
const insertRun = db.prepare(`INSERT INTO activities (user_id, distance_meters, moving_time_seconds, elapsed_time_seconds, average_speed, average_pace_per_km, elevation_gain, start_date)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

function randomRun(userId: number, daysAgo: number, tier: 'beginner' | 'intermediate' | 'advanced') {
  const distances = { beginner: [2000, 3000, 4000, 5000], intermediate: [4000, 5000, 7000, 8000, 10000], advanced: [5000, 8000, 10000, 12000, 15000] };
  const paces = { beginner: [420, 390, 450, 480], intermediate: [330, 310, 350, 320], advanced: [280, 265, 290, 275] };

  const dist = distances[tier][Math.floor(Math.random() * distances[tier].length)] + Math.floor(Math.random() * 500);
  const pace = paces[tier][Math.floor(Math.random() * paces[tier].length)] + Math.floor(Math.random() * 20) - 10;
  const time = Math.round((dist / 1000) * pace);
  const speed = dist / time;
  const elevation = Math.floor(Math.random() * 80);
  const date = new Date(Date.now() - daysAgo * 86400000).toISOString();

  insertRun.run(userId, dist, time, time + 60, speed, pace, elevation, date);
}

console.log('\n📍 Adding runs...');

const tierMap: Record<string, 'beginner' | 'intermediate' | 'advanced'> = {
  'none': 'beginner', 'beginner': 'beginner', 'intermediate': 'intermediate', 'advanced': 'advanced'
};

for (let i = 0; i < insertedRunners.length; i++) {
  const userId = insertedRunners[i];
  const runner = runners[i];
  const tier = tierMap[runner.exp];
  const runCount = tier === 'advanced' ? 15 : tier === 'intermediate' ? 10 : 5;

  for (let j = 0; j < runCount; j++) {
    const daysAgo = Math.floor(Math.random() * 45) + 1;
    randomRun(userId, daysAgo, tier);
  }
  console.log(`  ${runner.name}: ${runCount} runs`);
}

// ===== XP & LEVELS =====
console.log('\n⚡ Setting up XP...');
const insertXP = db.prepare(`INSERT OR REPLACE INTO user_xp (user_id, total_xp, current_level, current_streak_days, longest_streak_days, last_activity_date)
  VALUES (?, ?, ?, ?, ?, ?)`);

const xpData = [
  { xp: 850, level: 5, streak: 8, longest: 14 },   // Priya
  { xp: 2200, level: 9, streak: 21, longest: 30 },  // Arjun
  { xp: 200, level: 2, streak: 3, longest: 5 },     // Sneha
  { xp: 1100, level: 6, streak: 12, longest: 12 },  // Rahul
  { xp: 1450, level: 7, streak: 15, longest: 20 },  // Ananya
  { xp: 350, level: 3, streak: 4, longest: 7 },     // Vikram
  { xp: 1900, level: 8, streak: 18, longest: 25 },  // Meera
  { xp: 2500, level: 10, streak: 25, longest: 32 }, // Karthik
  { xp: 100, level: 1, streak: 1, longest: 2 },     // Divya
  { xp: 900, level: 5, streak: 9, longest: 11 },    // Rohan
];

for (let i = 0; i < insertedRunners.length; i++) {
  const x = xpData[i];
  const today = new Date().toISOString().split('T')[0];
  insertXP.run(insertedRunners[i], x.xp, x.level, x.streak, x.longest, today);
}
console.log('  ✓ All runners have XP/levels');

// ===== TIER HISTORY =====
console.log('\n🏅 Setting tiers...');
const insertTier = db.prepare(`INSERT INTO tier_history (user_id, tier, estimated_vo2max, age_graded_percent, score)
  VALUES (?, ?, ?, ?, ?)`);

const tiers = [
  { tier: 'intermediate', vo2: 45.2, age: 62, score: 55 },
  { tier: 'advanced', vo2: 56.8, age: 78, score: 72 },
  { tier: 'beginner', vo2: 35.1, age: 42, score: 25 },
  { tier: 'intermediate', vo2: 47.5, age: 65, score: 58 },
  { tier: 'intermediate', vo2: 49.1, age: 68, score: 62 },
  { tier: 'beginner', vo2: 38.2, age: 48, score: 30 },
  { tier: 'advanced', vo2: 54.3, age: 75, score: 70 },
  { tier: 'advanced', vo2: 58.9, age: 82, score: 78 },
  { tier: 'beginner', vo2: 32.0, age: 38, score: 18 },
  { tier: 'intermediate', vo2: 46.0, age: 63, score: 54 },
];

for (let i = 0; i < insertedRunners.length; i++) {
  const t = tiers[i];
  insertTier.run(insertedRunners[i], t.tier, t.vo2, t.age, t.score);
}
console.log('  ✓ All runners have tier classifications');

// ===== ACHIEVEMENTS =====
console.log('\n🏆 Seeding achievements...');
const achievementCount = (db.prepare('SELECT COUNT(*) as count FROM achievements').get() as any).count;
if (achievementCount === 0) {
  const achievements = [
    { name: 'First Steps', description: 'Complete your first run', icon: '👟', category: 'running', req_type: 'total_runs', req_value: 1, xp: 100 },
    { name: 'Getting Started', description: 'Complete 5 runs', icon: '🏃', category: 'running', req_type: 'total_runs', req_value: 5, xp: 200 },
    { name: 'Dedicated', description: 'Complete 25 runs', icon: '💪', category: 'running', req_type: 'total_runs', req_value: 25, xp: 500 },
    { name: '5K Finisher', description: 'Complete a 5K run', icon: '🎯', category: 'distance', req_type: 'single_distance_km', req_value: 5, xp: 150 },
    { name: '10K Warrior', description: 'Complete a 10K run', icon: '⚡', category: 'distance', req_type: 'single_distance_km', req_value: 10, xp: 300 },
    { name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', category: 'streak', req_type: 'streak_days', req_value: 7, xp: 300 },
    { name: 'Speed Demon', description: 'Run a sub-5:00/km pace', icon: '💨', category: 'pace', req_type: 'best_pace_per_km', req_value: 300, xp: 400 },
  ];
  const insertAch = db.prepare('INSERT INTO achievements (name, description, icon, category, requirement_type, requirement_value, xp_reward) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const a of achievements) {
    insertAch.run(a.name, a.description, a.icon, a.category, a.req_type, a.req_value, a.xp);
  }
  console.log('  ✓ 7 achievements seeded');
}

// Grant some achievements to runners
const insertUserAch = db.prepare('INSERT OR IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)');
const allAchievements = db.prepare('SELECT id, requirement_value, requirement_type FROM achievements').all() as any[];

for (let i = 0; i < insertedRunners.length; i++) {
  const userId = insertedRunners[i];
  const runCount = db.prepare('SELECT COUNT(*) as c FROM activities WHERE user_id = ?').get(userId) as any;

  for (const ach of allAchievements) {
    if (ach.requirement_type === 'total_runs' && runCount.c >= ach.requirement_value) {
      insertUserAch.run(userId, ach.id);
    }
    if (ach.requirement_type === 'streak_days' && xpData[i].streak >= ach.requirement_value) {
      insertUserAch.run(userId, ach.id);
    }
  }
}
console.log('  ✓ Achievements granted based on data');

// ===== ANNOUNCEMENTS =====
const adminUser = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get() as any;
if (adminUser) {
  const announcementCount = (db.prepare('SELECT COUNT(*) as c FROM announcements').get() as any).c;
  if (announcementCount === 0) {
    db.prepare('INSERT INTO announcements (admin_id, title, body, pinned) VALUES (?, ?, ?, ?)').run(
      adminUser.id, 'Welcome to Sprint Society! 🏃', 'Hey everyone! Welcome to the club. Connect your Strava, complete challenges, and level up. See you on the track!', 1
    );
    db.prepare('INSERT INTO announcements (admin_id, title, body, pinned) VALUES (?, ?, ?, ?)').run(
      adminUser.id, 'Sunday Run: Marine Drive 5K', 'This Sunday at 6:30 AM. Meeting point: Marine Drive promenade. All levels welcome. Bring water!', 0
    );
    console.log('\n📢 2 announcements posted');
  }
}

// ===== CLUB SESSION =====
const sessionCount = (db.prepare('SELECT COUNT(*) as c FROM club_sessions').get() as any).c;
if (sessionCount === 0) {
  db.prepare('INSERT INTO club_sessions (title, description, target_distance_meters, session_date, location) VALUES (?, ?, ?, ?, ?)').run(
    'Sunday 5K — Marine Drive', 'Easy pace group run. All levels welcome.', 5000, new Date(Date.now() + 3 * 86400000).toISOString(), 'Marine Drive, Mumbai'
  );
  db.prepare('INSERT INTO club_sessions (title, description, target_distance_meters, session_date, location) VALUES (?, ?, ?, ?, ?)').run(
    'Wednesday Intervals — Track', 'Speed session. 8x400m with 90s recovery.', 7000, new Date(Date.now() + 5 * 86400000).toISOString(), 'Athletics Track, Andheri'
  );
  console.log('📅 2 club sessions created');
}

console.log('\n✅ Seed complete!\n');
console.log('Login credentials (all users):');
console.log('  Admin:  admin@sprintsociety.com / test123');
console.log('  Runner: priya@test.com / test123');
console.log('  Runner: arjun@test.com / test123');
console.log('  (all runners use password: test123)\n');

db.close();
