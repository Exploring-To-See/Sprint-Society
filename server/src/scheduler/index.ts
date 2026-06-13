import db from '../database/db';
import { runBackup } from '../routes/admin-backup.routes';
import path from 'path';
import fs from 'fs';

interface ScheduledJob {
  name: string;
  interval: number; // ms
  handler: () => void;
  lastRun: number;
}

const jobs: ScheduledJob[] = [];

export function registerJob(name: string, intervalMs: number, handler: () => void) {
  jobs.push({ name, interval: intervalMs, handler, lastRun: 0 });
}

export function startScheduler() {
  console.log(`  Scheduler started with ${jobs.length} jobs`);

  // Delay first run by 10s to let DB fully initialize
  setTimeout(() => {
    // Check every 60 seconds which jobs are due
    setInterval(() => {
      const now = Date.now();
      for (const job of jobs) {
        if (now - job.lastRun >= job.interval) {
          job.lastRun = now;
          try {
            job.handler();
          } catch (err) {
            console.error(`[Scheduler] Job "${job.name}" failed:`, err);
          }
        }
      }
    }, 60_000);
  }, 10_000);
}

// --- Job: Challenge expiry (every 1 hour) ---
// Mark incomplete challenges as expired if their week is over (week_start + 7 days < now)
registerJob('challenge-expiry', 60 * 60 * 1000, () => {
  const result = db.prepare(`
    UPDATE challenges
    SET completed = -1
    WHERE completed = 0
      AND date(week_start, '+7 days') < date('now')
  `).run();

  if (result.changes > 0) {
    console.log(`[Scheduler] Expired ${result.changes} overdue challenges`);
  }
});

// --- Job: Kendu upkeep (disabled — re-enable when kendu economy is fully tested) ---
// registerJob('kendu-upkeep', 24 * 60 * 60 * 1000, () => {
//   const result = checkAllUpkeepDue();
//   if (result.processed > 0 || result.dormant > 0) {
//     console.log(`[Scheduler] Kendu upkeep: ${result.processed} processed, ${result.dormant} dormant`);
//   }
// });

// --- Job: Auto backup (every 24 hours) ---
// Creates a CSV backup of all tables in /data/backups/
registerJob('auto-backup', 24 * 60 * 60 * 1000, () => {
  try {
    const result = runBackup();
    console.log(`[Scheduler] Backup complete: ${result.tables} tables, ${result.totalRows} rows → ${result.filename}`);
  } catch (err) {
    console.error('[Scheduler] Backup failed:', err);
  }
});

// --- Job: Streak decay (every 6 hours) ---
// Reset streaks for users who haven't logged activity in > 1 day
registerJob('streak-decay', 6 * 60 * 60 * 1000, () => {
  const result = db.prepare(`
    UPDATE user_xp
    SET current_streak_days = 0
    WHERE current_streak_days > 0
      AND last_activity_date IS NOT NULL
      AND date(last_activity_date) < date('now', '-1 day')
  `).run();

  if (result.changes > 0) {
    console.log(`[Scheduler] Reset streaks for ${result.changes} inactive users`);
  }
});

// --- Job: Subscription expiry (every 1 hour) ---
// Expire subscriptions past their expires_at date
registerJob('subscription-expiry', 60 * 60 * 1000, () => {
  const result = db.prepare(`
    UPDATE user_subscriptions SET status = 'expired'
    WHERE status = 'active' AND expires_at <= datetime('now')
  `).run();

  if (result.changes > 0) {
    console.log(`[Scheduler] Expired ${result.changes} lapsed subscriptions`);
  }
});

// --- Job: Nightly SQLite .backup (every 24 hours) ---
registerJob('sqlite-backup', 24 * 60 * 60 * 1000, () => {
  const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/sprint-society.db');
  const backupDir = path.join(path.dirname(dbPath), 'backups');

  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().split('T')[0];
  const backupPath = path.join(backupDir, `sprint-society-${timestamp}.backup`);

  try {
    db.backup(backupPath);
    console.log(`[Scheduler] SQLite backup complete: ${backupPath}`);

    // Prune backups older than 14 days
    const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.backup'));
    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
    for (const file of files) {
      const filePath = path.join(backupDir, file);
      const stat = fs.statSync(filePath);
      if (stat.mtimeMs < cutoff) {
        fs.unlinkSync(filePath);
        console.log(`[Scheduler] Pruned old backup: ${file}`);
      }
    }

    // Upload to object storage if configured
    const storageTarget = process.env.BACKUP_STORAGE_URL;
    if (storageTarget) {
      const axios = require('axios');
      const fileData = fs.readFileSync(backupPath);
      axios.put(`${storageTarget}/sprint-society-${timestamp}.backup`, fileData, {
        headers: { 'Content-Type': 'application/octet-stream' },
      }).then(() => {
        console.log(`[Scheduler] Backup uploaded to object storage`);
      }).catch((err: any) => {
        console.error(`[Scheduler] Backup upload failed:`, err.message);
      });
    }
  } catch (err: any) {
    console.error(`[Scheduler] SQLite backup failed:`, err.message);
  }
});
