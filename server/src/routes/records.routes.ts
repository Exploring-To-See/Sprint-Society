import { Router, Response } from 'express';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { calculateAllPRs, checkForNewPRs, getPRSummary } from '../engine/personalRecords';

const router = Router();
router.use(authenticate);

// GET /records — All personal records
router.get('/', (req: AuthRequest, res: Response) => {
  const activities = db.prepare(
    `SELECT id, distance_meters, moving_time_seconds, average_pace_per_km,
     average_heartrate, max_heartrate, elevation_gain, start_date
     FROM activities WHERE user_id = ? ORDER BY start_date DESC`
  ).all(req.userId) as any[];

  if (activities.length === 0) {
    return res.json({
      race_prs: [],
      effort_prs: [],
      total_count: 0,
      message: 'No runs yet. Your PRs will appear here after your first activity.',
    });
  }

  const allPRs = calculateAllPRs(activities);
  const summary = getPRSummary(allPRs);

  res.json(summary);
});

// GET /records/check/:activityId — Check if a specific activity set any PRs
router.get('/check/:activityId', (req: AuthRequest, res: Response) => {
  const activity = db.prepare(
    `SELECT id, distance_meters, moving_time_seconds, average_pace_per_km,
     average_heartrate, max_heartrate, elevation_gain, start_date
     FROM activities WHERE id = ? AND user_id = ?`
  ).get(req.params.activityId, req.userId) as any;

  if (!activity) return res.status(404).json({ error: 'Activity not found' });

  // Get all other activities to compare against
  const otherActivities = db.prepare(
    `SELECT id, distance_meters, moving_time_seconds, average_pace_per_km,
     average_heartrate, max_heartrate, elevation_gain, start_date
     FROM activities WHERE user_id = ? AND id != ? ORDER BY start_date DESC`
  ).all(req.userId, activity.id) as any[];

  const existingPRs = calculateAllPRs(otherActivities);
  const prCheck = checkForNewPRs(activity, existingPRs);

  res.json({
    ...prCheck,
    has_new_pr: prCheck.new_prs.length > 0,
    celebration: prCheck.new_prs.length > 0
      ? generateCelebration(prCheck.new_prs)
      : null,
  });
});

// GET /records/timeline — PR progression over time
router.get('/timeline', (req: AuthRequest, res: Response) => {
  const activities = db.prepare(
    `SELECT id, distance_meters, moving_time_seconds, average_pace_per_km,
     average_heartrate, max_heartrate, elevation_gain, start_date
     FROM activities WHERE user_id = ? ORDER BY start_date ASC`
  ).all(req.userId) as any[];

  if (activities.length < 2) {
    return res.json({ timeline: [], message: 'Need more runs to show PR progression.' });
  }

  // Build PR timeline: for each activity, check if it was a PR at the time
  const timeline: { date: string; category: string; value: string; improvement?: string }[] = [];
  const runningPRs = new Map<string, number>();

  for (const activity of activities) {
    // Check 5K PR progression (most common)
    const dist = activity.distance_meters;
    if (dist >= 4500 && dist <= 5500) {
      const normalized = Math.round(activity.moving_time_seconds * (5000 / dist));
      const current5kBest = runningPRs.get('5k') || Infinity;
      if (normalized < current5kBest) {
        const improvement = current5kBest === Infinity ? undefined : formatSeconds(current5kBest - normalized);
        timeline.push({
          date: activity.start_date,
          category: '5K',
          value: formatSeconds(normalized),
          improvement,
        });
        runningPRs.set('5k', normalized);
      }
    }

    // Check 10K
    if (dist >= 9000 && dist <= 11000) {
      const normalized = Math.round(activity.moving_time_seconds * (10000 / dist));
      const current10kBest = runningPRs.get('10k') || Infinity;
      if (normalized < current10kBest) {
        timeline.push({
          date: activity.start_date,
          category: '10K',
          value: formatSeconds(normalized),
          improvement: current10kBest === Infinity ? undefined : formatSeconds(current10kBest - normalized),
        });
        runningPRs.set('10k', normalized);
      }
    }

    // Check fastest pace
    if (dist >= 1000) {
      const currentPaceBest = runningPRs.get('pace') || Infinity;
      if (activity.average_pace_per_km < currentPaceBest) {
        timeline.push({
          date: activity.start_date,
          category: 'Fastest Pace',
          value: formatPace(activity.average_pace_per_km) + '/km',
          improvement: currentPaceBest === Infinity ? undefined : formatSeconds(Math.round(currentPaceBest - activity.average_pace_per_km)) + ' faster',
        });
        runningPRs.set('pace', activity.average_pace_per_km);
      }
    }
  }

  res.json({ timeline: timeline.reverse(), total_prs_set: timeline.length });
});

function generateCelebration(newPRs: any[]): { title: string; message: string; type: 'gold' | 'silver' | 'bronze' } {
  const count = newPRs.length;
  const firstPR = newPRs[0];

  if (count >= 3) {
    return { title: 'TRIPLE PR!', message: `You smashed ${count} personal records in one run. Legendary.`, type: 'gold' };
  }
  if (count === 2) {
    return { title: 'DOUBLE PR!', message: `Two records broken. Your training is paying off.`, type: 'gold' };
  }

  const improvement = firstPR.improvement;
  if (improvement && improvement.percent > 3) {
    return { title: 'MASSIVE PR!', message: `${firstPR.category}: ${firstPR.formatted} — ${improvement.percent}% improvement!`, type: 'gold' };
  }

  return {
    title: 'NEW PR!',
    message: `${firstPR.category}: ${firstPR.formatted}${improvement ? ` (was ${improvement.formatted} faster than previous best)` : ' — your first!'}`,
    type: improvement ? 'silver' : 'bronze',
  };
}

function formatPace(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function formatSeconds(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round(totalSeconds % 60);
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default router;
