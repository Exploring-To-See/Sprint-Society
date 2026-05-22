import { Response, NextFunction } from 'express';
import db from '../database/db';
import { AuthRequest } from './auth';

export type PlanKey = 'free' | 'pro' | 'premium';

const PLAN_HIERARCHY: Record<PlanKey, number> = {
  free: 0,
  pro: 1,
  premium: 2,
};

export function getUserPlan(userId: number): PlanKey {
  const sub = db.prepare(`
    SELECT plan_key FROM user_subscriptions
    WHERE user_id = ? AND status = 'active' AND expires_at > datetime('now')
    ORDER BY expires_at DESC LIMIT 1
  `).get(userId) as any;

  return (sub?.plan_key as PlanKey) || 'free';
}

export function requirePlan(minimumPlan: PlanKey) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userPlan = getUserPlan(req.userId!);
    const userLevel = PLAN_HIERARCHY[userPlan];
    const requiredLevel = PLAN_HIERARCHY[minimumPlan];

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
