import bcrypt from 'bcryptjs';
import { initializeDatabase } from './database/pg';
import db from './database/pg';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@sprintsociety.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'SprintAdmin2024!';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Sprint Society Admin';

async function setupAdmin() {
  await initializeDatabase();

  const existing = await db.queryOne('SELECT id FROM users WHERE email = $1', [ADMIN_EMAIL]);
  if (existing) {
    console.log(`Admin already exists with email: ${ADMIN_EMAIL}`);
    await db.execute('UPDATE users SET role = $1 WHERE email = $2', ['admin', ADMIN_EMAIL]);
    console.log('Role updated to admin.');
    return;
  }

  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const result = await db.queryOne(`
    INSERT INTO users (name, email, password_hash, role, gender, age, height_cm, weight_kg, fitness_level, running_experience)
    VALUES ($1, $2, $3, 'admin', 'male', 30, 175, 75, 'active', 'intermediate')
    RETURNING id
  `, [ADMIN_NAME, ADMIN_EMAIL, hash]);

  await db.execute('INSERT INTO user_xp (user_id, total_xp, current_level) VALUES ($1, 0, 1)', [result.id]);

  console.log('\n  Admin account created!');
  console.log(`  Email: ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log('\n  Change these in your .env file:');
  console.log('  ADMIN_EMAIL=your-email@example.com');
  console.log('  ADMIN_PASSWORD=your-secure-password');
  console.log('  ADMIN_NAME=Your Name\n');
}

setupAdmin().catch(console.error);
