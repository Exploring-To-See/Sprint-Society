import db from '../database/pg';
import { runBackup } from '../routes/admin-backup.routes';
import { resolveExpiredChallenges } from '../engine/kenduEngine';

/**
 * Shared maintenance jobs.
 *
 * Single source of truth for the recurring background work, called from two places:
 *   - server/src/scheduler/index.ts — the in-process scheduler on a self-hosted server
 *   - server/src/routes/cron.routes.ts — HTTP endpoints driven by Vercel Cron
 *
 * Each job is idempotent and safe to run repeatedly.
 */

export interface JobResult {
  job: string;
  affected: number;
  detail?: string;
}

// Mark incomplete challenges as expired once their week is over.
export async function expireChallenges(): Promise<JobResult> {
  const result = await db.execute(
    `UPDATE challenges
       SET completed = -1
     WHERE completed = 0
       AND date(week_start) + INTERVAL '7 days' < CURRENT_DATE`,
    []
  );
  return { job: 'challenge-expiry', affected: result.rowCount ?? 0 };
}

// Reset streaks for users who haven't logged activity in > 1 day.
export async function decayStreaks(): Promise<JobResult> {
  const result = await db.execute(
    `UPDATE user_xp
       SET current_streak_days = 0
     WHERE current_streak_days > 0
       AND last_activity_date IS NOT NULL
       AND last_activity_date < CURRENT_DATE - INTERVAL '1 day'`,
    []
  );
  return { job: 'streak-decay', affected: result.rowCount ?? 0 };
}

// Expire subscriptions past their expires_at date.
export async function expireSubscriptions(): Promise<JobResult> {
  const result = await db.execute(
    `UPDATE user_subscriptions
       SET status = 'expired'
     WHERE status = 'active' AND expires_at <= NOW()`,
    []
  );
  return { job: 'subscription-expiry', affected: result.rowCount ?? 0 };
}

// Resolve Kendu peer challenges whose deadline has passed (settles stakes, picks
// winners). On a self-hosted server a 5-minute timer in kendu.routes.ts also runs
// this; on Vercel this maintenance pass is the only driver.
export async function resolveKenduChallenges(): Promise<JobResult> {
  const result = await resolveExpiredChallenges();
  return { job: 'kendu-challenge-resolve', affected: result.resolved + result.expired };
}

// Create an on-disk CSV backup of all tables. Self-host / scheduled use only —
// on Supabase the managed database backups are the durable copy.
export async function autoBackup(): Promise<JobResult> {
  const result = await runBackup();
  return {
    job: 'auto-backup',
    affected: result.totalRows,
    detail: `${result.tables} tables → ${result.filename}`,
  };
}

/**
 * Pure-SQL maintenance jobs that are safe on any host (no filesystem writes).
 * This is what the Vercel Cron endpoint runs daily.
 */
export async function runMaintenance(): Promise<JobResult[]> {
  const jobs = [expireChallenges, decayStreaks, expireSubscriptions, resolveKenduChallenges];
  const results: JobResult[] = [];
  for (const job of jobs) {
    try {
      results.push(await job());
    } catch (err: any) {
      results.push({ job: job.name, affected: 0, detail: `error: ${err?.message || err}` });
    }
  }
  return results;
}
