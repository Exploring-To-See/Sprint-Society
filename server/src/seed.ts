/**
 * Seed Sprint Society with demo data.
 * Usage: npx tsx src/seed.ts
 *
 * Connects to Postgres via DATABASE_URL (reads from .env),
 * applies the schema, then populates demo users, runs, XP, events, etc.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool, query, queryOne, execute, initializeDatabase, closePool } from './database/pg';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Aborting.');
    process.exit(1);
  }

  await initializeDatabase();
  console.log('Seeding Sprint Society with demo data...\n');

  // ===== ADMIN USER =====
  const adminHash = bcrypt.hashSync('admin123', 10);
  let admin = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", ['admin@sprintsociety.com']);
  if (!admin) {
    admin = await queryOne<{ id: number }>(`
      INSERT INTO users (name, email, phone, password_hash, role, gender, age, height_cm, weight_kg, fitness_level, running_experience, injury_history)
      VALUES ($1, $2, $3, $4, 'admin', 'male', 28, 178, 72, 'very_active', 'advanced', '[]')
      RETURNING id
    `, ['Ishan (Admin)', 'admin@sprintsociety.com', '+919999999999', adminHash]);
  }
  const adminId = admin!.id;
  console.log(`Admin: admin@sprintsociety.com / admin123 (id: ${adminId})`);

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
    let user = await queryOne<{ id: number }>('SELECT id FROM users WHERE email = $1', [r.email]);
    if (!user) {
      user = await queryOne<{ id: number }>(`
        INSERT INTO users (name, email, phone, password_hash, role, gender, age, height_cm, weight_kg, fitness_level, running_experience, injury_history)
        VALUES ($1, $2, $3, $4, 'runner', $5, $6, $7, $8, $9, $10, '[]')
        RETURNING id
      `, [r.name, r.email, '0000000000', userHash, r.gender, r.age, r.height, r.weight, r.fitness, r.exp]);
    }
    userIds.push(user!.id);
  }
  console.log(`${runners.length} demo runners created (password: runner123)`);

  // ===== XP & LEVELS =====
  const xpValues = [1200, 2500, 350, 1800, 900, 3200, 150, 1100];
  for (let i = 0; i < userIds.length; i++) {
    const level = Math.floor(xpValues[i] / 300) + 1;
    const streak = Math.floor(Math.random() * 14);
    await execute(
      'INSERT INTO user_xp (user_id, total_xp, current_level, current_streak_days, longest_streak_days) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (user_id) DO NOTHING',
      [userIds[i], xpValues[i], level, streak, streak + Math.floor(Math.random() * 10)]
    );
  }
  await execute(
    'INSERT INTO user_xp (user_id, total_xp, current_level, current_streak_days, longest_streak_days) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (user_id) DO NOTHING',
    [adminId, 5000, 12, 21, 45]
  );
  console.log('XP and levels assigned');

  // ===== ACTIVITIES (runs) =====
  const now = Date.now();
  let stravaId = 100000;
  for (let i = 0; i < userIds.length; i++) {
    const numRuns = 5 + Math.floor(Math.random() * 15);
    for (let j = 0; j < numRuns; j++) {
      const daysAgo = Math.floor(Math.random() * 60);
      const distance = 3000 + Math.random() * 12000;
      const pace = 280 + Math.random() * 180;
      const movingTime = Math.round((distance / 1000) * pace);
      await execute(`
        INSERT INTO activities (user_id, strava_activity_id, distance_meters, moving_time_seconds, elapsed_time_seconds, average_speed, average_pace_per_km, elevation_gain, start_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        userIds[i], stravaId++, Math.round(distance), movingTime, movingTime + 60,
        distance / movingTime, pace, Math.random() * 100,
        new Date(now - daysAgo * 86400000).toISOString()
      ]);
    }
  }
  console.log('Activities seeded (5-20 runs per user)');

  // ===== TIER HISTORY =====
  const tiers = ['beginner', 'intermediate', 'intermediate', 'intermediate', 'intermediate', 'advanced', 'beginner', 'intermediate'];
  for (let i = 0; i < userIds.length; i++) {
    await execute(
      'INSERT INTO tier_history (user_id, tier, estimated_vo2max, score) VALUES ($1, $2, $3, $4)',
      [userIds[i], tiers[i], 35 + Math.random() * 25, Math.random() * 100]
    );
  }
  await execute('INSERT INTO tier_history (user_id, tier, estimated_vo2max, score) VALUES ($1, $2, $3, $4)', [adminId, 'advanced', 55, 85]);
  console.log('Tier history seeded');

  // ===== FOLLOWS (social graph) =====
  for (let i = 0; i < userIds.length; i++) {
    for (let j = 0; j < userIds.length; j++) {
      if (i !== j && Math.random() > 0.5) {
        await execute('INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userIds[i], userIds[j]]);
      }
    }
    await execute('INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userIds[i], adminId]);
  }
  console.log('Follow relationships created');

  // ===== EVENTS (admin-created) =====
  const events = [
    { title: 'Saturday Morning Run', type: 'group_run', date: getFutureDate(2), time: '06:30', duration: 60, location: 'Cubbon Park, Bangalore', desc: 'Easy 5K followed by coffee. All levels welcome.' },
    { title: 'Coffee & Conversations', type: 'coffee_meetup', date: getFutureDate(4), time: '10:00', duration: 90, location: 'Third Wave Coffee, Indiranagar', desc: 'Monthly coffee meetup. Talk running, life, goals. No agenda, just vibes.' },
    { title: 'Interval Training Session', type: 'workout', date: getFutureDate(6), time: '05:45', duration: 45, location: 'Kanteerava Stadium Track', desc: '800m repeats with 400m recovery. Bring water.' },
    { title: 'Sprint Society Social', type: 'social', date: getFutureDate(9), time: '18:00', duration: 120, location: 'Toit Brewpub, 100ft Road', desc: 'End of month celebration. Good food, good people, great stories.' },
    { title: 'Long Run Sunday', type: 'group_run', date: getFutureDate(3), time: '05:30', duration: 120, location: 'Nandi Hills Base', desc: '15K trail run. Intermediate+ pace. Carpool available.' },
  ];

  for (const e of events) {
    await execute(`
      INSERT INTO events (creator_id, title, description, event_type, date, time, duration_minutes, location_name, visibility, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'public', 'upcoming')
    `, [adminId, e.title, e.desc, e.type, e.date, e.time, e.duration, e.location]);
  }
  console.log(`${events.length} events created`);

  // RSVP some users to events
  const eventRows = await query<{ id: number }>('SELECT id FROM events');
  for (const event of eventRows) {
    const numRsvps = 3 + Math.floor(Math.random() * 5);
    const shuffled = [...userIds].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(numRsvps, shuffled.length); i++) {
      await execute(
        'INSERT INTO event_rsvps (event_id, user_id, status) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [event.id, shuffled[i], Math.random() > 0.3 ? 'going' : 'maybe']
      );
    }
  }
  console.log('Event RSVPs added');

  // ===== COMMUNITIES =====
  const communities = [
    { name: 'Morning Runners BLR', cat: 'run_club', desc: 'Bangalore early birds. 5:30 AM gang. Rain or shine.' },
    { name: 'Marathon Training', cat: 'training', desc: 'Structured training plans for half and full marathon. Science-backed.' },
    { name: 'Runner Nutrition', cat: 'nutrition', desc: 'What to eat, when to eat, how to fuel. Evidence-based nutrition for runners.' },
    { name: 'Yoga for Runners', cat: 'wellness', desc: 'Flexibility, recovery, injury prevention. 15-min daily flows.' },
    { name: 'Sprint Social Club', cat: 'social', desc: 'The after-run hangout. Movies, food, travel, life beyond running.' },
  ];

  for (const c of communities) {
    const ownerId = userIds[Math.floor(Math.random() * 3) + 3];
    const existing = await queryOne<{ id: number }>('SELECT id FROM communities WHERE name = $1', [c.name]);
    if (existing) continue;

    const result = await execute(
      'INSERT INTO communities (owner_id, name, description, category, member_count) VALUES ($1, $2, $3, $4, 1) RETURNING id',
      [ownerId, c.name, c.desc, c.cat]
    );
    const cid = result.rows[0]?.id;
    if (!cid) continue;

    await execute('INSERT INTO community_members (community_id, user_id, role) VALUES ($1, $2, $3)', [cid, ownerId, 'owner']);

    const shuffled = [...userIds, adminId].sort(() => Math.random() - 0.5);
    let memberCount = 1;
    for (let i = 0; i < 5; i++) {
      if (shuffled[i] !== ownerId) {
        await execute(
          'INSERT INTO community_members (community_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [cid, shuffled[i], 'member']
        );
        memberCount++;
      }
    }
    await execute('UPDATE communities SET member_count = $1 WHERE id = $2', [memberCount, cid]);

    const posts = [
      'Great run this morning! The weather was perfect.',
      'Anyone up for a trail run this weekend?',
      'Just hit a new PR on my 5K! Feeling amazing.',
      'Recovery day today. Foam rolling and stretching.',
      'The group energy yesterday was incredible. Love this community!',
    ];
    for (let i = 0; i < 3; i++) {
      const authorId = shuffled[Math.floor(Math.random() * 4)];
      await execute(
        'INSERT INTO community_posts (community_id, author_id, body) VALUES ($1, $2, $3)',
        [cid, authorId, posts[Math.floor(Math.random() * posts.length)]]
      );
    }
  }
  console.log(`${communities.length} communities with members and posts`);

  // ===== NOTIFICATIONS =====
  await execute(`INSERT INTO user_notifications (user_id, type, title, body, actor_id) VALUES ($1, 'kudos', 'Priya gave you kudos', 'On your morning run', $2)`, [adminId, userIds[0]]);
  await execute(`INSERT INTO user_notifications (user_id, type, title, body, actor_id) VALUES ($1, 'follow', 'Arjun started following you', NULL, $2)`, [adminId, userIds[1]]);
  await execute(`INSERT INTO user_notifications (user_id, type, title, body, actor_id) VALUES ($1, 'event_rsvp', 'Neha is going to your event', 'Saturday Morning Run', $2)`, [adminId, userIds[2]]);
  await execute(`INSERT INTO user_notifications (user_id, type, title, body, actor_id) VALUES ($1, 'community_join', 'Rohan joined Morning Runners BLR', NULL, $2)`, [adminId, userIds[3]]);
  console.log('Sample notifications created');

  // ===== SEED ACHIEVEMENTS =====
  const achievementSeeds = [
    { name: 'First Steps', description: 'Complete your first run', icon: '👟', category: 'running', requirement_type: 'total_runs', requirement_value: 1, xp_reward: 100 },
    { name: 'Getting Started', description: 'Complete 5 runs', icon: '🏃', category: 'running', requirement_type: 'total_runs', requirement_value: 5, xp_reward: 200 },
    { name: 'Dedicated', description: 'Complete 25 runs', icon: '💪', category: 'running', requirement_type: 'total_runs', requirement_value: 25, xp_reward: 500 },
  ];
  const existingCount = await queryOne<{ c: string }>('SELECT COUNT(*) as c FROM achievements');
  if (!existingCount || parseInt(existingCount.c, 10) === 0) {
    for (const a of achievementSeeds) {
      await execute(
        'INSERT INTO achievements (name, description, icon, category, requirement_type, requirement_value, xp_reward) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [a.name, a.description, a.icon, a.category, a.requirement_type, a.requirement_value, a.xp_reward]
      );
    }
  }

  // ===== SUBSCRIPTION PLANS =====
  const planCount = await queryOne<{ c: string }>('SELECT COUNT(*) as c FROM subscription_plans');
  if (!planCount || parseInt(planCount.c, 10) === 0) {
    await execute(
      "INSERT INTO subscription_plans (key, name, price_inr, duration_days, features) VALUES ('base', 'Base', 9, 30, $1)",
      [JSON.stringify(['Track runs', 'Join events', 'Join communities', 'Social feed', 'Leaderboard', 'AI training plan (auto-adjusts)', 'Pace zones', 'Weekly AI summary', 'HR zones'])]
    );
    await execute(
      "INSERT INTO subscription_plans (key, name, price_inr, duration_days, features) VALUES ('pro', 'Pro', 99, 30, $1)",
      [JSON.stringify(['Everything in Base', 'AI chat coach (Sonnet)', 'Pre/post run check-ins', 'AI memory (coach remembers you)', 'Personal records', 'Adaptive training engine', 'Transformation plans', 'Weekly challenges', 'Create communities'])]
    );
  }

  console.log('\n---');
  console.log('  Seed Complete!');
  console.log('---');
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
  console.log('---');

  await closePool();
}

function getFutureDate(daysFromNow: number): string {
  return new Date(Date.now() + daysFromNow * 86400000).toISOString().split('T')[0];
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
