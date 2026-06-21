import { Router, Request, Response } from 'express';
import { runMaintenance } from '../scheduler/jobs';
import { config } from '../config';

const router = Router();

/**
 * Scheduled maintenance, driven by Vercel Cron.
 *
 * vercel.json registers a daily cron that GETs /api/cron/maintenance. Vercel
 * automatically attaches `Authorization: Bearer ${CRON_SECRET}` when the
 * CRON_SECRET env var is set on the project, which we verify below so the
 * endpoint can't be triggered by the public.
 */
function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // In production a secret is mandatory — without one the endpoint stays closed.
  if (!secret) return !config.isProduction;
  const auth = req.headers.authorization;
  if (auth === `Bearer ${secret}`) return true;
  if (req.query.key === secret) return true;
  return false;
}

async function handle(req: Request, res: Response) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const results = await runMaintenance();
    res.json({ ok: true, ran_at: new Date().toISOString(), results });
  } catch (err: any) {
    console.error('[Cron] maintenance failed:', err);
    res.status(500).json({ ok: false, error: err?.message || 'maintenance failed' });
  }
}

router.get('/maintenance', handle);
router.post('/maintenance', handle);

export default router;
