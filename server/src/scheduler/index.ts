import { expireChallenges, decayStreaks, expireSubscriptions, autoBackup } from './jobs';

interface ScheduledJob {
  name: string;
  interval: number; // ms
  handler: () => Promise<unknown> | unknown;
  lastRun: number;
}

const jobs: ScheduledJob[] = [];

export function registerJob(name: string, intervalMs: number, handler: () => Promise<unknown> | unknown) {
  jobs.push({ name, interval: intervalMs, handler, lastRun: 0 });
}

/**
 * In-process scheduler for self-hosted (always-on) deploys.
 *
 * On Vercel this is NOT used — serverless functions are ephemeral, so the same
 * job logic is invoked through Vercel Cron (see vercel.json "crons" → /api/cron/*).
 */
export function startScheduler() {
  console.log(`  Scheduler started with ${jobs.length} jobs`);

  // Delay first run by 10s to let DB fully initialize
  setTimeout(() => {
    // Check every 60 seconds which jobs are due
    setInterval(async () => {
      const now = Date.now();
      for (const job of jobs) {
        if (now - job.lastRun >= job.interval) {
          job.lastRun = now;
          try {
            await job.handler();
          } catch (err) {
            console.error(`[Scheduler] Job "${job.name}" failed:`, err);
          }
        }
      }
    }, 60_000);
  }, 10_000);
}

registerJob('challenge-expiry', 60 * 60 * 1000, expireChallenges);
registerJob('streak-decay', 6 * 60 * 60 * 1000, decayStreaks);
registerJob('subscription-expiry', 60 * 60 * 1000, expireSubscriptions);
registerJob('auto-backup', 24 * 60 * 60 * 1000, autoBackup);
