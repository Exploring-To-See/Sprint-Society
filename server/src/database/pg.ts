import { Pool, types, type PoolConfig } from 'pg';

// Return Postgres DATE columns as plain 'YYYY-MM-DD' strings instead of JS
// Date objects. Otherwise res.json serializes events.date as a full ISO
// timestamp and every client `new Date(date + 'T' + time)` concatenation
// produces Invalid Date ("NaN days" badges, broken event headers).
types.setTypeParser(1082, (v) => v);

// Resolve the Postgres URL. DATABASE_URL wins when set; otherwise fall back to
// the vars the Supabase↔Vercel integration injects (POSTGRES_PRISMA_URL is the
// pgBouncer transaction-pooler URL — the right one for serverless).
const rawDbUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  '';

// Strip query params that fight the explicit `ssl` config below: node-postgres
// treats sslmode=require in the URL as verify-full, which rejects Supabase's
// pooler cert with "self-signed certificate in certificate chain" even when
// ssl.rejectUnauthorized=false is passed. pgbouncer/supa are Vercel-integration
// markers node-postgres doesn't understand.
const dbUrl = rawDbUrl
  .replace(/([?&])(sslmode|pgbouncer|supa|uselibpqcompat)=[^&]*/g, '$1')
  .replace(/[?&]+$/, '')
  .replace(/\?&+/, '?');

// Use SSL only for remote/managed Postgres (e.g. Supabase). Local/test Postgres
// typically has no SSL, and forcing it throws "server does not support SSL connections".
const isLocalDb =
  /@(localhost|127\.0\.0\.1|::1)/.test(dbUrl) ||
  process.env.NODE_ENV === 'development' ||
  process.env.NODE_ENV === 'test' ||
  process.env.PGSSL === 'false';

// On Vercel each warm function instance keeps its own pool, and many instances
// run concurrently — so keep the per-instance pool tiny to stay under Supabase's
// connection ceiling. Point DATABASE_URL at Supabase's transaction pooler
// (the "...pooler.supabase.com:6543" connection string) in production so these
// short-lived connections are multiplexed by pgBouncer.
const isServerless = !!process.env.VERCEL;

const poolConfig: PoolConfig = {
  connectionString: dbUrl || undefined,
  // Vercel Fluid compute serves many concurrent requests per instance — max:1
  // serialized every query behind one connection. 5 stays comfortably under
  // Supabase's pooled ceiling (pgBouncer multiplexes them).
  max: isServerless ? 5 : 10,
  ssl: isLocalDb ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: isServerless ? 10000 : 30000,
  allowExitOnIdle: isServerless,
};

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[PG] Unexpected pool error:', err.message);
});

/**
 * Execute a query and return all rows.
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  try {
    const result = await pool.query(sql, params);
    return result.rows as T[];
  } catch (err: any) {
    console.error('[PG] Query error:', err.message);
    console.error('[PG] SQL:', sql);
    console.error('[PG] Params:', params);
    throw err;
  }
}

/**
 * Execute a query and return the first row or null.
 */
export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/**
 * Execute a statement (INSERT/UPDATE/DELETE) and return rowCount + rows.
 * rows includes RETURNING data if present in the SQL.
 */
export async function execute(sql: string, params?: any[]): Promise<{ rowCount: number; rows: any[] }> {
  try {
    const result = await pool.query(sql, params);
    return { rowCount: result.rowCount ?? 0, rows: result.rows };
  } catch (err: any) {
    console.error('[PG] Execute error:', err.message);
    console.error('[PG] SQL:', sql);
    console.error('[PG] Params:', params);
    throw err;
  }
}

/**
 * Initialize the database: run schema.pg.sql
 * Call this on server startup.
 */
export async function initializeDatabase(): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');

  const schemaPath = path.join(__dirname, 'schema.pg.sql');

  if (!fs.existsSync(schemaPath)) {
    console.error('[PG] schema.pg.sql not found at:', schemaPath);
    throw new Error('schema.pg.sql not found');
  }

  const schema = fs.readFileSync(schemaPath, 'utf-8');

  try {
    await pool.query(schema);
    console.log('[PG] Schema applied successfully.');
  } catch (err: any) {
    console.error('[PG] Schema error:', err.message);
    throw err;
  }
}

/**
 * Hot column migrations — the tiny idempotent ALTERs from the bottom of
 * schema.pg.sql that runtime queries depend on (activities.rpe/map_polyline/
 * deleted_at etc.). Databases provisioned before those columns existed 500
 * every run save. Runs once per warm instance, fire-and-forget, each statement
 * a no-op when the column already exists.
 */
let hotMigrationsStarted = false;
export function ensureHotMigrations(): void {
  if (hotMigrationsStarted) return;
  hotMigrationsStarted = true;
  const stmts = [
    "ALTER TABLE activities ADD COLUMN IF NOT EXISTS activity_type TEXT DEFAULT 'Run'",
    'ALTER TABLE activities ADD COLUMN IF NOT EXISTS rpe INTEGER',
    'ALTER TABLE activities ADD COLUMN IF NOT EXISTS suspicious INTEGER DEFAULT 0',
    'ALTER TABLE activities ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP',
    'ALTER TABLE activities ADD COLUMN IF NOT EXISTS map_polyline TEXT',
    'ALTER TABLE activities ADD COLUMN IF NOT EXISTS splits TEXT',
    'ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP',
    'ALTER TABLE communities ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP',
    "ALTER TABLE kudos ADD COLUMN IF NOT EXISTS reaction_type TEXT DEFAULT 'high_five'",
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT',
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Kolkata'",
  ];
  (async () => {
    for (const s of stmts) {
      try { await pool.query(s); } catch { /* column exists or table missing — fine */ }
    }
  })();
}

/**
 * Gracefully shut down the pool.
 */
export async function closePool(): Promise<void> {
  await pool.end();
  console.log('[PG] Pool closed.');
}

const db = { pool, query, queryOne, execute };
export default db;
