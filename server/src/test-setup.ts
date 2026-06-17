// Vitest global setup — runs BEFORE any test module is imported, so this is the
// only reliable place to configure the database connection ahead of
// database/pg.ts reading process.env at import time. (ES `import` is hoisted, so
// setting process.env inside a test file runs too late and the pool would open
// against the wrong connection string.)
//
// The backend runs on Postgres (Supabase in prod). Tests connect to a local
// throwaway Postgres — in CI that's the `postgres` service container, locally
// it's whatever DATABASE_URL you export. PGSSL=false because local/CI Postgres
// has no TLS, and NODE_ENV=test keeps pg.ts from forcing SSL.
process.env.NODE_ENV = 'test';
process.env.PGSSL = 'false';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-ci';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/sprint_test';
