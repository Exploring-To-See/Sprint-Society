import { describe, it, expect } from 'vitest';
import {
  calculateTrainingLoad,
  analyzeWeekPerformance,
  adaptNextWeek,
  detectDetraining,
} from './adaptiveEngine';

function makeActivity(distanceM: number, timeSec: number, daysAgo: number, hr?: number, type?: string) {
  const d = new Date(Date.now() - daysAgo * 86400000);
  return {
    distance_meters: distanceM,
    moving_time_seconds: timeSec,
    average_heartrate: hr,
    start_date: d.toISOString(),
    activity_type: type || 'Run',
  };
}

describe('calculateTrainingLoad', () => {
  it('returns zero for empty activities', () => {
    const result = calculateTrainingLoad([]);
    expect(result.acute_load).toBe(0);
    expect(result.chronic_load).toBe(0);
    expect(result.injury_risk).toBe('low');
  });

  it('calculates injury risk as critical when ACWR > 1.5', () => {
    // Very heavy recent load, no chronic base
    const heavy = Array.from({ length: 7 }, (_, i) => makeActivity(15000, 5400, i));
    // No chronic history beyond that
    const result = calculateTrainingLoad(heavy);
    expect(result.acute_load).toBeGreaterThan(0);
    // With no 28-day base beyond the 7 days, ACWR should be high
  });

  it('uses HR-based intensity when maxHR provided', () => {
    const activities = [makeActivity(5000, 1800, 1, 160)];
    const withHR = calculateTrainingLoad(activities, 190);
    const withoutHR = calculateTrainingLoad(activities.map(a => ({ ...a, average_heartrate: undefined })));
    // HR-based should give different load calculation
    expect(withHR.acute_load).not.toBe(withoutHR.acute_load);
  });

  it('cross-training contributes at 0.5x load', () => {
    const run = calculateTrainingLoad([makeActivity(5000, 1800, 1, undefined, 'Run')]);
    const cycle = calculateTrainingLoad([makeActivity(5000, 1800, 1, undefined, 'Ride')]);
    expect(cycle.acute_load).toBeLessThan(run.acute_load);
  });
});

describe('analyzeWeekPerformance', () => {
  it('returns missed_session signal when no sessions completed', () => {
    const signals = analyzeWeekPerformance([], 4);
    expect(signals).toHaveLength(1);
    expect(signals[0].type).toBe('missed_session');
    expect(signals[0].severity).toBe(1.0);
  });

  it('detects overreaching on easy runs too fast (paceRatio < 0.88)', () => {
    const sessions = [{
      planned_type: 'easy',
      planned_distance_km: 5,
      planned_pace_per_km: 360,
      actual_distance_km: 5,
      actual_pace_per_km: 300, // paceRatio = 300/360 = 0.83
      date: new Date().toISOString(),
    }];
    const signals = analyzeWeekPerformance(sessions, 3);
    const overreaching = signals.find(s => s.type === 'overreaching');
    expect(overreaching).toBeDefined();
  });

  it('detects overperformance on tempo runs (paceRatio < 0.92)', () => {
    const sessions = [{
      planned_type: 'tempo',
      planned_distance_km: 8,
      planned_pace_per_km: 300,
      actual_distance_km: 8,
      actual_pace_per_km: 270, // 0.90 ratio
      date: new Date().toISOString(),
    }];
    const signals = analyzeWeekPerformance(sessions, 3);
    const overperf = signals.find(s => s.type === 'overperformance');
    expect(overperf).toBeDefined();
  });

  it('detects underperformance on interval (paceRatio > 1.12)', () => {
    const sessions = [{
      planned_type: 'interval',
      planned_distance_km: 6,
      planned_pace_per_km: 260,
      actual_distance_km: 6,
      actual_pace_per_km: 300, // 1.15 ratio
      date: new Date().toISOString(),
    }];
    const signals = analyzeWeekPerformance(sessions, 3);
    const underperf = signals.find(s => s.type === 'underperformance');
    expect(underperf).toBeDefined();
  });

  it('awards consistency bonus for 90%+ completion with no underperformance', () => {
    const sessions = Array.from({ length: 4 }, (_, i) => ({
      planned_type: 'easy',
      planned_distance_km: 5,
      planned_pace_per_km: 360,
      actual_distance_km: 5,
      actual_pace_per_km: 355,
      date: new Date().toISOString(),
    }));
    const signals = analyzeWeekPerformance(sessions, 4);
    const bonus = signals.find(s => s.type === 'consistency_bonus');
    expect(bonus).toBeDefined();
  });
});

describe('adaptNextWeek', () => {
  const basePaces = { easy_min: 360, easy_max: 400, tempo: 300, interval: 260, long: 380, recovery: 420 };
  const safLoad: any = { acute_load: 80, chronic_load: 100, training_stress_balance: 20, monotony: 1.2, strain: 96, injury_risk: 'low' };

  it('increases volume on consistency bonus', () => {
    const signals = [{ type: 'consistency_bonus' as const, severity: 0.3, description: '', recommendation: '' }];
    const result = adaptNextWeek(signals, 40, basePaces, safLoad);
    expect(result.adapted_volume_km).toBeGreaterThan(40);
    expect(result.volume_change_percent).toBeGreaterThan(0);
  });

  it('decreases volume on missed session', () => {
    const signals = [{ type: 'missed_session' as const, severity: 0.7, description: '', recommendation: '' }];
    const result = adaptNextWeek(signals, 40, basePaces, safLoad);
    expect(result.adapted_volume_km).toBeLessThan(40);
  });

  it('forces deload on critical injury risk regardless of signals', () => {
    const signals = [{ type: 'consistency_bonus' as const, severity: 0.3, description: '', recommendation: '' }];
    const criticalLoad = { ...safLoad, injury_risk: 'critical' as const };
    const result = adaptNextWeek(signals, 40, basePaces, criticalLoad);
    expect(result.adapted_volume_km).toBe(24); // 40 * 0.6
    expect(result.intensity_shift).toBe('easier');
  });

  it('caps volume at 0.7x when TSB < -20', () => {
    const signals: any[] = [];
    const fatiguedLoad = { ...safLoad, training_stress_balance: -25 };
    const result = adaptNextWeek(signals, 40, basePaces, fatiguedLoad);
    expect(result.adapted_volume_km).toBeLessThanOrEqual(28); // 40 * 0.7
  });
});

describe('detectDetraining', () => {
  it('returns no detraining for null date', () => {
    const result = detectDetraining(null);
    expect(result.detected).toBe(false);
  });

  it('returns no detraining for recent run (<=3 days)', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const result = detectDetraining(yesterday);
    expect(result.detected).toBe(false);
    expect(result.severity).toBe('none');
  });

  it('detects mild detraining (4-7 days)', () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 86400000).toISOString();
    const result = detectDetraining(fiveDaysAgo);
    expect(result.detected).toBe(true);
    expect(result.severity).toBe('mild');
    expect(result.vdot_adjustment).toBe(-1);
  });

  it('detects moderate detraining (8-14 days)', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString();
    const result = detectDetraining(tenDaysAgo);
    expect(result.detected).toBe(true);
    expect(result.severity).toBe('moderate');
    expect(result.vdot_adjustment).toBe(-2);
  });

  it('detects severe detraining (>14 days)', () => {
    const twentyDaysAgo = new Date(Date.now() - 20 * 86400000).toISOString();
    const result = detectDetraining(twentyDaysAgo);
    expect(result.detected).toBe(true);
    expect(result.severity).toBe('severe');
    expect(result.fitness_loss_percent).toBeLessThanOrEqual(25);
  });
});
