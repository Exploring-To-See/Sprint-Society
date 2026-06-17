/**
 * Seed invite codes into Postgres.
 * Usage: npx tsx src/seed-codes.ts
 */
import 'dotenv/config';
import { queryOne, execute, initializeDatabase, closePool } from './database/pg';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Aborting.');
    process.exit(1);
  }

  await initializeDatabase();

  const codes = [
    { code: 'SPRINT50', name: 'Beta Launch - First 50 Runners', max_uses: 50 },
    { code: 'KENDU', name: 'Kendu VIP - Unlimited', max_uses: 9999 },
    { code: 'FOUNDERS', name: 'Founding Members', max_uses: 10 },
  ];

  const admin = await queryOne<{ id: number }>("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  const adminId = admin?.id || 1;

  for (const c of codes) {
    const existing = await queryOne<{ id: number }>('SELECT id FROM invite_codes WHERE code = $1', [c.code]);
    if (existing) {
      console.log(`  Exists: ${c.code}`);
      continue;
    }
    await execute(
      'INSERT INTO invite_codes (code, name, max_uses, created_by, active) VALUES ($1, $2, $3, $4, 1)',
      [c.code, c.name, c.max_uses, adminId]
    );
    console.log(`  Created: ${c.code} -- ${c.name} (${c.max_uses} uses)`);
  }

  console.log('\nInvite codes ready. Users need one of these to register.');
  console.log('Create more via: POST /api/admin/invite-codes { code, name, max_uses, expires_at }');

  await closePool();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
