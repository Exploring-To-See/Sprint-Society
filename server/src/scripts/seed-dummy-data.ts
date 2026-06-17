/**
 * Seed dummy data into Postgres for development.
 * Usage: npm run seed   (or: npx tsx src/scripts/seed-dummy-data.ts)
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { query, queryOne, execute, initializeDatabase, closePool } from '../database/pg';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Aborting.');
    process.exit(1);
  }

  await initializeDatabase();
  console.log('Seeding Sprint Society with dummy data...\n');

  const passwordHash = bcrypt.hashSync('test123', 10);

  // ===== ADMIN USER =====
  let adminUser = await queryOne<{ id: number }>('SELECT id FROM users WHERE email = $1', ['admin@sprintsociety.com']);
  if (!adminUser) {
    adminUser = await queryOne<{ id: number }>(`
      INSERT INTO users (name, email, phone, password_hash, role, gender, age, height_cm, weight_kg, fitness_level, running_experience, injury_history)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `, ['Admin', 'admin@sprintsociety.com', '+910000000000', passwordHash, 'admin', 'male', 30, 178, 75, 'active', 'advanced', '[]']);
    console.log('Admin: admin@sprintsociety.com / test123');
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

  const insertedRunners: number[] = [];

  for (const r of runners) {
    let user = await queryOne<{ id: number }>('SELECT id FROM users WHERE email = $1', [r.email]);
    if (user) {
      insertedRunners.push(user.id);
      continue;
    }
    user = await queryOne<{ id: number }>(`
      INSERT INTO users (name, email, phone, password_hash, role, gender, age, height_cm, weight_kg, fitness_level, running_experience, injury_history)
      VALUES ($1, $2, $3, $4, 'runner', $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [r.name, r.email, '0000000000', passwordHash, r.gender, r.age, r.height, r.weight, r.fitness, r.exp, r.injuries]);
    insertedRunners.push(user!.id);
    console.log(`Runner: ${r.name} (${r.email} / test123)`);
  }

  // ===== DUMMY RUNS =====
  const tierMap: Record<string, 'beginner' | 'intermediate' | 'advanced'> = {
    'none': 'beginner', 'beginner': 'beginner', 'intermediate': 'intermediate', 'advanced': 'advanced'
  };

  let stravaId = 200000;
  console.log('\nAdding runs...');
  for (let i = 0; i < insertedRunners.length; i++) {
    const userId = insertedRunners[i];
    const runner = runners[i];
    const tier = tierMap[runner.exp];
    const runCount = tier === 'advanced' ? 15 : tier === 'intermediate' ? 10 : 5;

    for (let j = 0; j < runCount; j++) {
      const distances = { beginner: [2000, 3000, 4000, 5000], intermediate: [4000, 5000, 7000, 8000, 10000], advanced: [5000, 8000, 10000, 12000, 15000] };
      const paces = { beginner: [420, 390, 450, 480], intermediate: [330, 310, 350, 320], advanced: [280, 265, 290, 275] };

      const dist = distances[tier][Math.floor(Math.random() * distances[tier].length)] + Math.floor(Math.random() * 500);
      const pace = paces[tier][Math.floor(Math.random() * paces[tier].length)] + Math.floor(Math.random() * 20) - 10;
      const time = Math.round((dist / 1000) * pace);
      const speed = dist / time;
      const elevation = Math.floor(Math.random() * 80);
      const daysAgo = Math.floor(Math.random() * 45) + 1;
      const date = new Date(Date.now() - daysAgo * 86400000).toISOString();

      await execute(`
        INSERT INTO activities (user_id, strava_activity_id, distance_meters, moving_time_seconds, elapsed_time_seconds, average_speed, average_pace_per_km, elevation_gain, start_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [userId, stravaId++, dist, time, time + 60, speed, pace, elevation, date]);
    }
    console.log(`  ${runner.name}: ${runCount} runs`);
  }

  // ===== XP & LEVELS =====
  console.log('\nSetting up XP...');
  const xpData = [
    { xp: 850, level: 5, streak: 8, longest: 14 },
    { xp: 2200, level: 9, streak: 21, longest: 30 },
    { xp: 200, level: 2, streak: 3, longest: 5 },
    { xp: 1100, level: 6, streak: 12, longest: 12 },
    { xp: 1450, level: 7, streak: 15, longest: 20 },
    { xp: 350, level: 3, streak: 4, longest: 7 },
    { xp: 1900, level: 8, streak: 18, longest: 25 },
    { xp: 2500, level: 10, streak: 25, longest: 32 },
    { xp: 100, level: 1, streak: 1, longest: 2 },
    { xp: 900, level: 5, streak: 9, longest: 11 },
  ];

  for (let i = 0; i < insertedRunners.length; i++) {
    const x = xpData[i];
    const today = new Date().toISOString().split('T')[0];
    await execute(
      'INSERT INTO user_xp (user_id, total_xp, current_level, current_streak_days, longest_streak_days, last_activity_date) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (user_id) DO NOTHING',
      [insertedRunners[i], x.xp, x.level, x.streak, x.longest, today]
    );
  }
  console.log('  All runners have XP/levels');

  // ===== TIER HISTORY =====
  console.log('\nSetting tiers...');
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
    await execute(
      'INSERT INTO tier_history (user_id, tier, estimated_vo2max, age_graded_percent, score) VALUES ($1, $2, $3, $4, $5)',
      [insertedRunners[i], t.tier, t.vo2, t.age, t.score]
    );
  }
  console.log('  All runners have tier classifications');

  // ===== ACHIEVEMENTS =====
  console.log('\nSeeding achievements...');
  const achievementCount = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM achievements');
  if (!achievementCount || parseInt(achievementCount.count, 10) === 0) {
    const achievements = [
      { name: 'First Steps', description: 'Complete your first run', icon: '👟', category: 'running', req_type: 'total_runs', req_value: 1, xp: 100 },
      { name: 'Getting Started', description: 'Complete 5 runs', icon: '🏃', category: 'running', req_type: 'total_runs', req_value: 5, xp: 200 },
      { name: 'Dedicated', description: 'Complete 25 runs', icon: '💪', category: 'running', req_type: 'total_runs', req_value: 25, xp: 500 },
      { name: '5K Finisher', description: 'Complete a 5K run', icon: '🎯', category: 'distance', req_type: 'single_distance_km', req_value: 5, xp: 150 },
      { name: '10K Warrior', description: 'Complete a 10K run', icon: '⚡', category: 'distance', req_type: 'single_distance_km', req_value: 10, xp: 300 },
      { name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', category: 'streak', req_type: 'streak_days', req_value: 7, xp: 300 },
      { name: 'Speed Demon', description: 'Run a sub-5:00/km pace', icon: '💨', category: 'pace', req_type: 'best_pace_per_km', req_value: 300, xp: 400 },
    ];
    for (const a of achievements) {
      await execute(
        'INSERT INTO achievements (name, description, icon, category, requirement_type, requirement_value, xp_reward) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [a.name, a.description, a.icon, a.category, a.req_type, a.req_value, a.xp]
      );
    }
    console.log('  7 achievements seeded');
  }

  // Grant some achievements to runners
  const allAchievements = await query<{ id: number; requirement_value: number; requirement_type: string }>(
    'SELECT id, requirement_value, requirement_type FROM achievements'
  );
  for (let i = 0; i < insertedRunners.length; i++) {
    const userId = insertedRunners[i];
    const runCount = await queryOne<{ c: string }>('SELECT COUNT(*) as c FROM activities WHERE user_id = $1', [userId]);
    const runs = parseInt(runCount?.c || '0', 10);

    for (const ach of allAchievements) {
      if (ach.requirement_type === 'total_runs' && runs >= ach.requirement_value) {
        await execute('INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, ach.id]);
      }
      if (ach.requirement_type === 'streak_days' && xpData[i].streak >= ach.requirement_value) {
        await execute('INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, ach.id]);
      }
    }
  }
  console.log('  Achievements granted based on data');

  // ===== ANNOUNCEMENTS =====
  const announcementCount = await queryOne<{ c: string }>('SELECT COUNT(*) as c FROM announcements');
  if (!announcementCount || parseInt(announcementCount.c, 10) === 0) {
    await execute(
      'INSERT INTO announcements (admin_id, title, body, pinned) VALUES ($1, $2, $3, $4)',
      [adminUser!.id, 'Welcome to Sprint Society!', 'Hey everyone! Welcome to the club. Connect your Strava, complete challenges, and level up. See you on the track!', true]
    );
    await execute(
      'INSERT INTO announcements (admin_id, title, body, pinned) VALUES ($1, $2, $3, $4)',
      [adminUser!.id, 'Sunday Run: Marine Drive 5K', 'This Sunday at 6:30 AM. Meeting point: Marine Drive promenade. All levels welcome. Bring water!', false]
    );
    console.log('\n2 announcements posted');
  }

  // ===== CLUB SESSION =====
  const sessionCount = await queryOne<{ c: string }>('SELECT COUNT(*) as c FROM club_sessions');
  if (!sessionCount || parseInt(sessionCount.c, 10) === 0) {
    await execute(
      'INSERT INTO club_sessions (title, description, target_distance_meters, session_date, location) VALUES ($1, $2, $3, $4, $5)',
      ['Sunday 5K -- Marine Drive', 'Easy pace group run. All levels welcome.', 5000, new Date(Date.now() + 3 * 86400000).toISOString(), 'Marine Drive, Mumbai']
    );
    await execute(
      'INSERT INTO club_sessions (title, description, target_distance_meters, session_date, location) VALUES ($1, $2, $3, $4, $5)',
      ['Wednesday Intervals -- Track', 'Speed session. 8x400m with 90s recovery.', 7000, new Date(Date.now() + 5 * 86400000).toISOString(), 'Athletics Track, Andheri']
    );
    console.log('2 club sessions created');
  }

  console.log('\nSeed complete!');
  console.log('Login credentials (all users):');
  console.log('  Admin:  admin@sprintsociety.com / test123');
  console.log('  Runner: priya@test.com / test123');
  console.log('  (all runners use password: test123)\n');

  await closePool();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
