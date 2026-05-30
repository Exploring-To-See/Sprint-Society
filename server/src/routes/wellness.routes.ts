import { Router, Response } from 'express';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// POST /wellness/log — Log today's sleep + stress
router.post('/log', (req: AuthRequest, res: Response) => {
  const { sleep_hours, stress_level, energy_level, notes } = req.body;

  if (!sleep_hours && !stress_level) {
    return res.status(400).json({ error: 'Provide at least sleep_hours or stress_level' });
  }

  const today = new Date().toISOString().split('T')[0];

  try {
    db.prepare(`
      INSERT INTO daily_wellness (user_id, date, sleep_hours, stress_level, energy_level, notes)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, date) DO UPDATE SET
        sleep_hours = COALESCE(excluded.sleep_hours, sleep_hours),
        stress_level = COALESCE(excluded.stress_level, stress_level),
        energy_level = COALESCE(excluded.energy_level, energy_level),
        notes = COALESCE(excluded.notes, notes)
    `).run(req.userId, today, sleep_hours || null, stress_level || null, energy_level || null, notes || null);

    res.json({ message: 'Wellness logged', date: today });
  } catch (err) {
    res.status(500).json({ error: 'Failed to log wellness' });
  }
});

// GET /wellness/today — Get today's log (if exists)
router.get('/today', (req: AuthRequest, res: Response) => {
  const today = new Date().toISOString().split('T')[0];
  const log = db.prepare('SELECT * FROM daily_wellness WHERE user_id = ? AND date = ?').get(req.userId, today);
  res.json(log || { logged: false });
});

// GET /wellness/week — Last 7 days of wellness data
router.get('/week', (req: AuthRequest, res: Response) => {
  const logs = db.prepare(`
    SELECT date, sleep_hours, stress_level, energy_level
    FROM daily_wellness
    WHERE user_id = ? AND date >= date('now', '-7 days')
    ORDER BY date DESC
  `).all(req.userId);

  const avgSleep = logs.filter((l: any) => l.sleep_hours).reduce((s: number, l: any) => s + l.sleep_hours, 0) / (logs.filter((l: any) => l.sleep_hours).length || 1);
  const avgStress = logs.filter((l: any) => l.stress_level).reduce((s: number, l: any) => s + l.stress_level, 0) / (logs.filter((l: any) => l.stress_level).length || 1);

  res.json({
    logs,
    avg_sleep: Math.round(avgSleep * 10) / 10,
    avg_stress: Math.round(avgStress * 10) / 10,
    days_logged: logs.length,
    sleep_debt: avgSleep < 7 ? Math.round((7 - avgSleep) * 7 * 10) / 10 : 0,
  });
});

// GET /wellness/recovery-factor — How wellness affects today's training readiness
router.get('/recovery-factor', (req: AuthRequest, res: Response) => {
  const today = new Date().toISOString().split('T')[0];
  const log = db.prepare('SELECT * FROM daily_wellness WHERE user_id = ? AND date = ?').get(req.userId, today) as any;

  if (!log) {
    return res.json({ factor: 1.0, adjustment: 'none', message: 'Log your wellness for personalized training adjustments.' });
  }

  let factor = 1.0;
  const adjustments: string[] = [];

  // Sleep adjustment (based on exercise physiology: <6h = significant performance impact)
  if (log.sleep_hours && log.sleep_hours < 5) {
    factor -= 0.20;
    adjustments.push('Very low sleep — reduce intensity significantly');
  } else if (log.sleep_hours && log.sleep_hours < 6) {
    factor -= 0.12;
    adjustments.push('Low sleep — consider easy run only');
  } else if (log.sleep_hours && log.sleep_hours < 7) {
    factor -= 0.05;
    adjustments.push('Slightly under-slept — stay in target zone');
  }

  // Stress adjustment
  if (log.stress_level && log.stress_level >= 8) {
    factor -= 0.10;
    adjustments.push('High stress — cortisol elevated, keep effort low');
  } else if (log.stress_level && log.stress_level >= 6) {
    factor -= 0.05;
    adjustments.push('Moderate stress — don\'t push into zone 4+');
  }

  // Energy adjustment
  if (log.energy_level && log.energy_level <= 3) {
    factor -= 0.08;
    adjustments.push('Low energy — listen to your body');
  }

  const adjustment = factor < 0.85 ? 'significant_reduction' : factor < 0.95 ? 'slight_reduction' : 'none';

  res.json({
    factor: Math.max(0.6, Math.round(factor * 100) / 100),
    adjustment,
    adjustments,
    message: adjustments.length > 0 ? adjustments[0] : 'Good recovery status. Train as planned.',
  });
});

export default router;
