import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';

let testDb: InstanceType<typeof Database>;

vi.mock('../database/db', () => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      plan_key TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  return { default: db };
});

import db from '../database/db';
import { getUserPlan, requirePlan, type PlanKey } from './subscription';

function insertSub(userId: number, planKey: string, status: string, daysFromNow: number) {
  const expires = new Date(Date.now() + daysFromNow * 86400000).toISOString();
  db.prepare(
    'INSERT INTO user_subscriptions (user_id, plan_key, status, expires_at) VALUES (?, ?, ?, ?)'
  ).run(userId, planKey, status, expires);
}

function clearSubs() {
  db.prepare('DELETE FROM user_subscriptions').run();
}

describe('getUserPlan', () => {
  beforeEach(clearSubs);

  it('returns "free" for user with no subscription', () => {
    expect(getUserPlan(999)).toBe('free');
  });

  it('returns "base" for user with active base subscription', () => {
    insertSub(1, 'base', 'active', 30);
    expect(getUserPlan(1)).toBe('base');
  });

  it('returns "pro" for user with active pro subscription', () => {
    insertSub(2, 'pro', 'active', 30);
    expect(getUserPlan(2)).toBe('pro');
  });

  it('returns "free" for expired subscription', () => {
    insertSub(3, 'pro', 'active', -1);
    expect(getUserPlan(3)).toBe('free');
  });

  it('returns "free" for cancelled subscription', () => {
    insertSub(4, 'pro', 'cancelled', 30);
    expect(getUserPlan(4)).toBe('free');
  });

  it('returns "free" for unknown plan key in DB', () => {
    insertSub(5, 'unknown_plan', 'active', 30);
    expect(getUserPlan(5)).toBe('free');
  });

  it('returns highest active plan when multiple exist', () => {
    insertSub(6, 'base', 'active', 10);
    insertSub(6, 'pro', 'active', 30);
    expect(getUserPlan(6)).toBe('pro');
  });
});

describe('requirePlan middleware', () => {
  beforeEach(clearSubs);

  function mockReqRes(userId: number) {
    const req = { userId } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;
    const next = vi.fn();
    return { req, res, next };
  }

  it('allows free user through free gate', () => {
    const { req, res, next } = mockReqRes(100);
    requirePlan('free')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('blocks free user from base gate', () => {
    const { req, res, next } = mockReqRes(101);
    requirePlan('base')(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Upgrade required',
      required_plan: 'base',
      current_plan: 'free',
    }));
  });

  it('blocks free user from pro gate', () => {
    const { req, res, next } = mockReqRes(102);
    requirePlan('pro')(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('allows base user through base gate', () => {
    insertSub(103, 'base', 'active', 30);
    const { req, res, next } = mockReqRes(103);
    requirePlan('base')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('blocks base user from pro gate', () => {
    insertSub(104, 'base', 'active', 30);
    const { req, res, next } = mockReqRes(104);
    requirePlan('pro')(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('allows pro user through all gates', () => {
    insertSub(105, 'pro', 'active', 30);

    const gates: PlanKey[] = ['free', 'base', 'pro'];
    for (const gate of gates) {
      const { req, res, next } = mockReqRes(105);
      requirePlan(gate)(req, res, next);
      expect(next).toHaveBeenCalled();
    }
  });

  it('treats expired pro user as free (blocks base gate)', () => {
    insertSub(106, 'pro', 'active', -1);
    const { req, res, next } = mockReqRes(106);
    requirePlan('base')(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      current_plan: 'free',
    }));
  });
});
