import { Response, NextFunction } from 'express';
import db from '../database/db';
import { AuthRequest } from './auth';

export type PlanKey = 'free' | 'base' | 'pro';

const PLAN_HIERARCHY: Record<PlanKey, number> = {
  free: 0,
  base: 1,
  pro: 2,
};

export function getUserPlan(userId: number): PlanKey {
  const sub = db.prepare(`
    SELECT plan_key FROM user_subscriptions
    WHERE user_id = ? AND status = 'active' AND expires_at > datetime('now')
    ORDER BY expires_at DESC LIMIT 1
  `).get(userId) as any;

  if (!sub?.plan_key) return 'free';
  if (sub.plan_key in PLAN_HIERARCHY) return sub.plan_key as PlanKey;
  return 'free';
}

export function requirePlan(minimumPlan: PlanKey) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userPlan = getUserPlan(req.userId!);
    const userLevel = PLAN_HIERARCHY[userPlan];
    const requiredLevel = PLAN_HIERARCHY[minimumPlan];

    if (userLevel === undefined || requiredLevel === undefined) {
      return res.status(500).json({ error: 'Invalid plan configuration' });
    }

    if (userLevel >= requiredLevel) {
      return next();
    }

    res.status(403).json({
      error: 'Upgrade required',
      required_plan: minimumPlan,
      current_plan: userPlan,
      message: `This feature requires the ${minimumPlan.charAt(0).toUpperCase() + minimumPlan.slice(1)} plan`,
    });
  };
}
