import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/sprint-society.db');

const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initializeDatabase() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  db.exec(schema);
  seedAchievements();
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
  ];

  const stmt = db.prepare(`INSERT INTO achievements (name, description, icon, category, requirement_type, requirement_value, xp_reward) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  for (const a of achievements) {
    stmt.run(a.name, a.description, a.icon, a.category, a.requirement_type, a.requirement_value, a.xp_reward);
  }
}

export default db;
