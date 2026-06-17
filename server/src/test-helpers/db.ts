import { initializeDatabase, query, execute, closePool } from '../database/pg';

/**
 * Bring the test database to a clean, deterministic state.
 *
 * 1. Apply schema.pg.sql (idempotent — every CREATE is `IF NOT EXISTS`), so a
 *    fresh Postgres works on the first run.
 * 2. TRUNCATE every public table with `RESTART IDENTITY CASCADE` so serial IDs
 *    and rows reset between suites.
 *
 * Call this in `beforeAll` of any suite that touches the database. Suites run
 * sequentially (vitest `fileParallelism: false`) so they never wipe each
 * other's data mid-test.
 */
export async function resetDatabase(): Promise<void> {
  await initializeDatabase();

  const tables = await query<{ tablename: string }>(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
  );
  if (tables.length === 0) return;

  const list = tables.map((t) => `"${t.tablename}"`).join(', ');
  await execute(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
}

export { closePool };
