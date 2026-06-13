import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '../data/sprint-society.db');
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run schema
const schema = fs.readFileSync(path.join(__dirname, 'database/schema.sql'), 'utf-8');
db.exec(schema);

console.log('Seeding Sprint Society with demo data...\n');

// ===== ADMIN USER =====
const adminHash = bcrypt.hashSync('admin123', 10);
const adminResult = db.prepare(`
  INSERT OR IGNORE INTO users (name, email, password_hash, role, gender, age, height_cm, weight_kg, fitness_level, running_experience, injury_history)
  VALUES (?, ?, ?, 'admin', 'male', 28, 178, 72, 'very_active', 'advanced', '[]')
`).run('Ishan (Admin)', 'admin@sprintsociety.com', adminHash);
const adminId = adminResult.lastInsertRowid || (db.prepare("SELECT id FROM users WHERE email = 'admin@sprintsociety.com'").get() as any).id;
console.log(`✓ Admin: admin@sprintsociety.com / admin123 (id: ${adminId})`);

// ===== DEMO RUNNERS =====
const runners = [
  { name: 'Priya Sharma', email: 'priya@demo.com', gender: 'female', age: 26, height: 165, weight: 55, fitness: 'active', exp: 'intermediate' },
  { name: 'Arjun Mehta', email: 'arjun@demo.com', gender: 'male', age: 31, height: 175, weight: 70, fitness: 'very_active', exp: 'advanced' },
  { name: 'Neha Patel', email: 'neha@demo.com', gender: 'female', age: 24, height: 160, weight: 52, fitness: 'active', exp: 'beginner' },
  { name: 'Rohan Kumar', email: 'rohan@demo.com', gender: 'male', age: 29, height: 180, weight: 78, fitness: 'very_active', exp: 'intermediate' },
  { name: 'Ananya Singh', email: 'ananya@demo.com', gender: 'female', age: 27, height: 168, weight: 58, fitness: 'active', exp: 'intermediate' },
  { name: 'Vikram Rao', email: 'vikram@demo.com', gender: 'male', age: 34, height: 172, weight: 68, fitness: 'very_active', exp: 'advanced' },
  { name: 'Kavya Nair', email: 'kavya@demo.com', gender: 'female', age: 22, height: 162, weight: 50, fitness: 'lightly_active', exp: 'beginner' },
  { name: 'Aditya Joshi', email: 'aditya@demo.com', gender: 'male', age: 30, height: 176, weight: 74, fitness: 'active', exp: 'intermediate' },
];

const userHash = bcrypt.hashSync('runner123', 10);
const userIds: number[] = [];

for (const r of runners) {
  const res = db.prepare(`
    INSERT OR IGNORE INTO users (name, email, password_hash, role, gender, age, height_cm, weight_kg, fitness_level, running_experience, injury_history)
    VALUES (?, ?, ?, 'runner', ?, ?, ?, ?, ?, ?, '[]')
  `).run(r.name, r.email, userHash, r.gender, r.age, r.height, r.weight, r.fitness, r.exp);
  const uid = res.lastInsertRowid || (db.prepare('SELECT id FROM users WHERE email = ?').get(r.email) as any).id;
  userIds.push(uid as number);
}
console.log(`✓ ${runners.length} demo runners created (password: runner123)`);

// ===== XP & LEVELS =====
const xpValues = [1200, 2500, 350, 1800, 900, 3200, 150, 1100];
for (let i = 0; i < userIds.length; i++) {
  const level = Math.floor(xpValues[i] / 300) + 1;
  const streak = Math.floor(Math.random() * 14);
  db.prepare('INSERT OR IGNORE INTO user_xp (user_id, total_xp, current_level, current_streak_days, longest_streak_days) VALUES (?, ?, ?, ?, ?)').run(
    userIds[i], xpValues[i], level, streak, streak + Math.floor(Math.random() * 10)
  );
}
// Admin XP
db.prepare('INSERT OR IGNORE INTO user_xp (user_id, total_xp, current_level, current_streak_days, longest_streak_days) VALUES (?, ?, ?, ?, ?)').run(adminId, 5000, 12, 21, 45);
console.log('✓ XP and levels assigned');

// ===== ACTIVITIES (runs) =====
const now = Date.now();
for (let i = 0; i < userIds.length; i++) {
  const numRuns = 5 + Math.floor(Math.random() * 15);
  for (let j = 0; j < numRuns; j++) {
    const daysAgo = Math.floor(Math.random() * 60);
    const distance = 3000 + Math.random() * 12000;
    const pace = 280 + Math.random() * 180;
    const movingTime = Math.round((distance / 1000) * pace);
    db.prepare(`
      INSERT INTO activities (user_id, distance_meters, moving_time_seconds, elapsed_time_seconds, average_speed, average_pace_per_km, elevation_gain, start_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userIds[i], Math.round(distance), movingTime, movingTime + 60,
      distance / movingTime, pace, Math.random() * 100,
      new Date(now - daysAgo * 86400000).toISOString()
    );
  }
}
console.log('✓ Activities seeded (5-20 runs per user)');

// ===== TIER HISTORY =====
const tiers = ['beginner', 'intermediate', 'intermediate', 'intermediate', 'intermediate', 'advanced', 'beginner', 'intermediate'];
for (let i = 0; i < userIds.length; i++) {
  db.prepare('INSERT INTO tier_history (user_id, tier, estimated_vo2max, score) VALUES (?, ?, ?, ?)').run(
    userIds[i], tiers[i], 35 + Math.random() * 25, Math.random() * 100
  );
}
db.prepare('INSERT INTO tier_history (user_id, tier, estimated_vo2max, score) VALUES (?, ?, ?, ?)').run(adminId, 'advanced', 55, 85);
console.log('✓ Tier history seeded');

// ===== FOLLOWS (social graph) =====
for (let i = 0; i < userIds.length; i++) {
  for (let j = 0; j < userIds.length; j++) {
    if (i !== j && Math.random() > 0.5) {
      try { db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(userIds[i], userIds[j]); } catch {}
    }
  }
  // Everyone follows admin
  try { db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(userIds[i], adminId); } catch {}
}
console.log('✓ Follow relationships created');

// ===== EVENTS (admin-created) =====
const events = [
  { title: 'Saturday Morning Run', type: 'group_run', date: getFutureDate(2), time: '06:30', duration: 60, location: 'Cubbon Park, Bangalore', desc: 'Easy 5K followed by coffee. All levels welcome.' },
  { title: 'Coffee & Conversations', type: 'coffee_meetup', date: getFutureDate(4), time: '10:00', duration: 90, location: 'Third Wave Coffee, Indiranagar', desc: 'Monthly coffee meetup. Talk running, life, goals. No agenda, just vibes.' },
  { title: 'Interval Training Session', type: 'workout', date: getFutureDate(6), time: '05:45', duration: 45, location: 'Kanteerava Stadium Track', desc: '800m repeats with 400m recovery. Bring water.' },
  { title: 'Sprint Society Social', type: 'social', date: getFutureDate(9), time: '18:00', duration: 120, location: 'Toit Brewpub, 100ft Road', desc: 'End of month celebration. Good food, good people, great stories.' },
  { title: 'Long Run Sunday', type: 'group_run', date: getFutureDate(3), time: '05:30', duration: 120, location: 'Nandi Hills Base', desc: '15K trail run. Intermediate+ pace. Carpool available.' },
];

for (const e of events) {
  db.prepare(`
    INSERT INTO events (creator_id, title, description, event_type, date, time, duration_minutes, location_name, visibility, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'public', 'upcoming')
  `).run(adminId, e.title, e.desc, e.type, e.date, e.time, e.duration, e.location);
}
console.log(`✓ ${events.length} events created`);

// RSVP some users to events
const eventRows = db.prepare('SELECT id FROM events').all() as any[];
for (const event of eventRows) {
  const numRsvps = 3 + Math.floor(Math.random() * 5);
  const shuffled = [...userIds].sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(numRsvps, shuffled.length); i++) {
    try {
      db.prepare('INSERT INTO event_rsvps (event_id, user_id, status) VALUES (?, ?, ?)').run(
        event.id, shuffled[i], Math.random() > 0.3 ? 'going' : 'maybe'
      );
    } catch {}
  }
}
console.log('✓ Event RSVPs added');

// ===== COMMUNITIES =====
const communities = [
  { name: 'Morning Runners BLR', cat: 'run_club', desc: 'Bangalore early birds. 5:30 AM gang. Rain or shine.' },
  { name: 'Marathon Training', cat: 'training', desc: 'Structured training plans for half and full marathon. Science-backed.' },
  { name: 'Runner Nutrition', cat: 'nutrition', desc: 'What to eat, when to eat, how to fuel. Evidence-based nutrition for runners.' },
  { name: 'Yoga for Runners', cat: 'wellness', desc: 'Flexibility, recovery, injury prevention. 15-min daily flows.' },
  { name: 'Sprint Social Club', cat: 'social', desc: 'The after-run hangout. Movies, food, travel, life beyond running.' },
];

for (const c of communities) {
  const ownerId = userIds[Math.floor(Math.random() * 3) + 3]; // Use Level 5+ users
  const res = db.prepare('INSERT INTO communities (owner_id, name, description, category, member_count) VALUES (?, ?, ?, ?, 1)').run(
    ownerId, c.name, c.desc, c.cat
  );
  const cid = res.lastInsertRowid;
  db.prepare('INSERT INTO community_members (community_id, user_id, role) VALUES (?, ?, ?)').run(cid, ownerId, 'owner');

  // Add members
  const shuffled = [...userIds, adminId].sort(() => Math.random() - 0.5);
  let memberCount = 1;
  for (let i = 0; i < 5; i++) {
    if (shuffled[i] !== ownerId) {
      try {
        db.prepare('INSERT INTO community_members (community_id, user_id, role) VALUES (?, ?, ?)').run(cid, shuffled[i], 'member');
        memberCount++;
      } catch {}
    }
  }
  db.prepare('UPDATE communities SET member_count = ? WHERE id = ?').run(memberCount, cid);

  // Add a few posts
  for (let i = 0; i < 3; i++) {
    const authorId = shuffled[Math.floor(Math.random() * 4)];
    const posts = [
      'Great run this morning! The weather was perfect.',
      'Anyone up for a trail run this weekend?',
      'Just hit a new PR on my 5K! Feeling amazing.',
      'Recovery day today. Foam rolling and stretching.',
      'The group energy yesterday was incredible. Love this community!',
    ];
    db.prepare('INSERT INTO community_posts (community_id, author_id, body) VALUES (?, ?, ?)').run(
      cid, authorId, posts[Math.floor(Math.random() * posts.length)]
    );
  }
}
console.log(`✓ ${communities.length} communities with members and posts`);

// ===== NOTIFICATIONS =====
db.prepare(`INSERT INTO user_notifications (user_id, type, title, body, actor_id) VALUES (?, 'kudos', 'Priya gave you kudos', 'On your morning run', ?)`)
  .run(adminId, userIds[0]);
db.prepare(`INSERT INTO user_notifications (user_id, type, title, body, actor_id) VALUES (?, 'follow', 'Arjun started following you', NULL, ?)`)
  .run(adminId, userIds[1]);
db.prepare(`INSERT INTO user_notifications (user_id, type, title, body, actor_id) VALUES (?, 'event_rsvp', 'Neha is going to your event', 'Saturday Morning Run', ?)`)
  .run(adminId, userIds[2]);
db.prepare(`INSERT INTO user_notifications (user_id, type, title, body, actor_id) VALUES (?, 'community_join', 'Rohan joined Morning Runners BLR', NULL, ?)`)
  .run(adminId, userIds[3]);
console.log('✓ Sample notifications created');

// ===== SEED ACHIEVEMENTS =====
const achievementSeeds = [
  { name: 'First Steps', description: 'Complete your first run', icon: '👟', category: 'running', requirement_type: 'total_runs', requirement_value: 1, xp_reward: 100 },
  { name: 'Getting Started', description: 'Complete 5 runs', icon: '🏃', category: 'running', requirement_type: 'total_runs', requirement_value: 5, xp_reward: 200 },
  { name: 'Dedicated', description: 'Complete 25 runs', icon: '💪', category: 'running', requirement_type: 'total_runs', requirement_value: 25, xp_reward: 500 },
];
const existingCount = (db.prepare('SELECT COUNT(*) as c FROM achievements').get() as any).c;
if (existingCount === 0) {
  for (const a of achievementSeeds) {
    db.prepare('INSERT INTO achievements (name, description, icon, category, requirement_type, requirement_value, xp_reward) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      a.name, a.description, a.icon, a.category, a.requirement_type, a.requirement_value, a.xp_reward
    );
  }
}

// ===== SUBSCRIPTION PLANS =====
const planCount = (db.prepare('SELECT COUNT(*) as c FROM subscription_plans').get() as any).c;
if (planCount === 0) {
  db.prepare("INSERT INTO subscription_plans (key, name, price_inr, duration_days, features) VALUES ('base', 'Base', 9, 30, ?)").run(
    JSON.stringify(['Track runs', 'Join events', 'Join communities', 'Social feed', 'Leaderboard', 'AI training plan (auto-adjusts)', 'Pace zones', 'Weekly AI summary', 'HR zones'])
  );
  db.prepare("INSERT INTO subscription_plans (key, name, price_inr, duration_days, features) VALUES ('pro', 'Pro', 99, 30, ?)").run(
    JSON.stringify(['Everything in Base', 'AI chat coach (Sonnet)', 'Pre/post run check-ins', 'AI memory (coach remembers you)', 'Personal records', 'Adaptive training engine', 'Transformation plans', 'Weekly challenges', 'Create communities'])
  );
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Seed Complete!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('  Admin login:');
console.log('    Email: admin@sprintsociety.com');
console.log('    Pass:  admin123');
console.log('');
console.log('  Runner login (any):');
console.log('    Email: priya@demo.com');
console.log('    Pass:  runner123');
console.log('');
console.log('  Open: http://localhost:5173');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

function getFutureDate(daysFromNow: number): string {
  return new Date(Date.now() + daysFromNow * 86400000).toISOString().split('T')[0];
}
