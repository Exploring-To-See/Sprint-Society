import { describe, it, expect, beforeEach, vi } from 'vitest';

// subscription.ts uses the async Postgres layer (../database/pg). Mock its
// queryOne so these stay fast unit tests of the plan-mapping + gating logic.
// (The SQL filtering of expired/cancelled subs is covered by integration tests.)
const { queryOne } = vi.hoisted(() => ({ queryOne: vi.fn() }));
vi.mock('../database/pg', () => ({ default: { queryOne } }));

import { getUserPlan, requirePlan, type PlanKey } from './subscription';

beforeEach(() => queryOne.mockReset());

describe('getUserPlan', () => {
  it('returns "free" when no active subscription row', async () => {
    queryOne.mockResolvedValue(null);
    expect(await getUserPlan(999)).toBe('free');
  });

  it('returns "base" for an active base subscription', async () => {
    queryOne.mockResolvedValue({ plan_key: 'base' });
    expect(await getUserPlan(1)).toBe('base');
  });

  it('returns "pro" for an active pro subscription', async () => {
    queryOne.mockResolvedValue({ plan_key: 'pro' });
    expect(await getUserPlan(2)).toBe('pro');
  });

  it('returns "free" when the sub is filtered out by SQL (expired/cancelled)', async () => {
    queryOne.mockResolvedValue(null);
    expect(await getUserPlan(3)).toBe('free');
  });

  it('returns "free" for an unknown plan key', async () => {
    queryOne.mockResolvedValue({ plan_key: 'unknown_plan' });
    expect(await getUserPlan(5)).toBe('free');
  });
});

describe('requirePlan middleware', () => {
  function mockReqRes(userId: number) {
    const req = { userId } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;
    const next = vi.fn();
    return { req, res, next };
  }

  it('allows a free user through the free gate', async () => {
    queryOne.mockResolvedValue(null);
    const { req, res, next } = mockReqRes(100);
    await requirePlan('free')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('blocks a free user from the base gate', async () => {
    queryOne.mockResolvedValue(null);
    const { req, res, next } = mockReqRes(101);
    await requirePlan('base')(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Upgrade required',
      required_plan: 'base',
      current_plan: 'free',
    }));
  });

  it('blocks a free user from the pro gate', async () => {
    queryOne.mockResolvedValue(null);
    const { req, res, next } = mockReqRes(102);
    await requirePlan('pro')(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('allows a base user through the base gate', async () => {
    queryOne.mockResolvedValue({ plan_key: 'base' });
    const { req, res, next } = mockReqRes(103);
    await requirePlan('base')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('blocks a base user from the pro gate', async () => {
    queryOne.mockResolvedValue({ plan_key: 'base' });
    const { req, res, next } = mockReqRes(104);
    await requirePlan('pro')(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('allows a pro user through all gates', async () => {
    queryOne.mockResolvedValue({ plan_key: 'pro' });
    const gates: PlanKey[] = ['free', 'base', 'pro'];
    for (const gate of gates) {
      const { req, res, next } = mockReqRes(105);
      await requirePlan(gate)(req, res, next);
      expect(next).toHaveBeenCalled();
    }
  });

  it('treats an expired pro user as free (blocks the base gate)', async () => {
    // The SQL `expires_at > NOW()` filter excludes the expired row, so queryOne returns null.
    queryOne.mockResolvedValue(null);
    const { req, res, next } = mockReqRes(106);
    await requirePlan('base')(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ current_plan: 'free' }));
  });
});
