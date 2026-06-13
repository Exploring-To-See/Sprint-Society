import { Pool, type PoolConfig, type QueryResult } from 'pg';

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 10,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
};

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[PG] Unexpected pool error:', err.message);
});

/**
 * Execute a query and return all rows.
 * Replacement for SQLite's .all()
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  try {
    const result: QueryResult<T> = await pool.query(sql, params);
    return result.rows;
  } catch (err: any) {
    console.error('[PG] Query error:', err.message);
    console.error('[PG] SQL:', sql);
    console.error('[PG] Params:', params);
    throw err;
  }
}

/**
 * Execute a query and return the first row or null.
 * Replacement for SQLite's .get()
 */
export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/**
 * Execute a statement (INSERT/UPDATE/DELETE) and return rowCount + rows.
 * Replacement for SQLite's .run()
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
 * Gracefully shut down the pool.
 */
export async function closePool(): Promise<void> {
  await pool.end();
  console.log('[PG] Pool closed.');
}

const db = { pool, query, queryOne, execute };
export default db;
