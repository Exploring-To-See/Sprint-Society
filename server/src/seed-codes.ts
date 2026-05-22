import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '../data/sprint-society.db');
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

// Run schema to create new tables
const schema = fs.readFileSync(path.join(__dirname, 'database/schema.sql'), 'utf-8');
db.exec(schema);

// Add phone column if missing
try { db.exec('ALTER TABLE users ADD COLUMN phone TEXT'); } catch {}
try { db.exec('ALTER TABLE users ADD COLUMN invite_code_id INTEGER'); } catch {}

// Seed invite codes
const codes = [
  { code: 'SPRINT50', name: 'Beta Launch - First 50 Runners', max_uses: 50 },
  { code: 'KENDU', name: 'Kendu VIP - Unlimited', max_uses: null },
  { code: 'FOUNDERS', name: 'Founding Members', max_uses: 10 },
];

const adminId = (db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get() as any)?.id || 1;

for (const c of codes) {
  try {
    db.prepare('INSERT INTO invite_codes (code, name, max_uses, created_by) VALUES (?, ?, ?, ?)').run(
      c.code, c.name, c.max_uses, adminId
    );
    console.log(`  Created: ${c.code} — ${c.name} (${c.max_uses || 'unlimited'} uses)`);
  } catch {
    console.log(`  Exists: ${c.code}`);
  }
}

console.log('\nInvite codes ready. Users need one of these to register.');
console.log('Create more via: POST /api/admin/invite-codes { code, name, max_uses, expires_at }');
