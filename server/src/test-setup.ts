// Vitest global setup — runs BEFORE any test module is imported, so this is the
// only reliable place to set DB_PATH ahead of database/db.ts evaluating it.
// (ES `import` is hoisted, so setting process.env inside a test file runs too late
// and the DB connection would open against the real sprint-society.db.)
import path from 'path';
import fs from 'fs';

const TEST_DB_PATH = path.join(__dirname, `../data/test-${process.pid}.db`);

process.env.DB_PATH = TEST_DB_PATH;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-ci';
process.env.NODE_ENV = 'test';

// Start from a clean slate, and clean up the worker's DB files on exit.
for (const suffix of ['', '-wal', '-shm']) {
  const f = TEST_DB_PATH + suffix;
  if (fs.existsSync(f)) fs.unlinkSync(f);
}

process.on('exit', () => {
  for (const suffix of ['', '-wal', '-shm']) {
    const f = TEST_DB_PATH + suffix;
    try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch { /* ignore */ }
  }
});
