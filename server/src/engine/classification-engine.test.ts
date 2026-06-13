import { describe, it, expect } from 'vitest';
import {
  calculateRunnerLevel,
  normalizePerformance,
  normalizeVolume,
  normalizeConsistency,
  normalizeRecovery,
  normalizeVO2max,
  normalizePaceCompliance,
  checkSafetyRails,
  checkAdvancement,
  checkRegression,
} from './classification-engine';

describe('classification-engine', () => {
  describe('calculateRunnerLevel', () => {
    it('maps score 1-10 to tier B', () => {
      const result = calculateRunnerLevel({ performance: 5, volume: 5, consistency: 5, recovery: 5, vo2max: 5, paceCompliance: 5 });
      expect(result.tier).toBe('B');
    });

    it('maps score 11-20 to tier I', () => {
      const result = calculateRunnerLevel({ performance: 15, volume: 15, consistency: 15, recovery: 15, vo2max: 15, paceCompliance: 15 });
      expect(result.tier).toBe('I');
    });

    it('maps score 21-30 to tier A', () => {
      const result = calculateRunnerLevel({ performance: 25, volume: 25, consistency: 25, recovery: 25, vo2max: 25, paceCompliance: 25 });
      expect(result.tier).toBe('A');
    });

    it('maps score 31-40 to tier P', () => {
      const result = calculateRunnerLevel({ performance: 35, volume: 35, consistency: 35, recovery: 35, vo2max: 35, paceCompliance: 35 });
      expect(result.tier).toBe('P');
    });

    it('caps calibrating users at I5', () => {
      const result = calculateRunnerLevel(
        { performance: 30, volume: 30, consistency: 30, recovery: 30, vo2max: 30, paceCompliance: 30 },
        { weeksOnPlatform: 1, hasRaceResult: false }
      );
      expect(result.tier).toBe('I');
      expect(result.subLevel).toBe(5);
      expect(result.status).toBe('calibrating');
    });

    it('sets validated status when race result exists', () => {
      const result = calculateRunnerLevel(
        { performance: 20, volume: 20, consistency: 20, recovery: 20, vo2max: 20, paceCompliance: 20 },
        { weeksOnPlatform: 8, hasRaceResult: true }
      );
      expect(result.status).toBe('validated');
    });

    it('applies correct weights: perf 40%, vol 15%, cons 15%, rec 15%, vo2 10%, pace 5%', () => {
      const factors = { performance: 40, volume: 0, consistency: 0, recovery: 0, vo2max: 0, paceCompliance: 0 };
      const result = calculateRunnerLevel(factors);
      // rawScore = 40*0.4 = 16
      expect(result.rawScore).toBeCloseTo(16, 0);
    });
  });

  describe('normalizeVolume', () => {
    it('returns 1 for 0 km', () => {
      expect(normalizeVolume(0, 'male')).toBe(1);
    });

    it('returns 40 for 220+ km', () => {
      expect(normalizeVolume(250, 'male')).toBe(40);
    });

    it('applies 13% female boost', () => {
      const male = normalizeVolume(50, 'male');
      const female = normalizeVolume(50, 'female');
      expect(female).toBeGreaterThanOrEqual(male);
    });

    it('scales linearly within bands', () => {
      const low = normalizeVolume(5, 'male');
      const mid = normalizeVolume(50, 'male');
      const high = normalizeVolume(150, 'male');
      expect(low).toBeLessThan(mid);
      expect(mid).toBeLessThan(high);
    });
  });

  describe('normalizeConsistency', () => {
    it('returns max score for 12/12 active weeks + mature platform', () => {
      const result = normalizeConsistency(12, 104); // 2 years
      expect(result).toBe(40);
    });

    it('returns low score for 0 active weeks', () => {
      const result = normalizeConsistency(0, 4);
      expect(result).toBeLessThanOrEqual(5);
    });

    it('adds platform maturity bonus', () => {
      const newUser = normalizeConsistency(6, 4);
      const vetUser = normalizeConsistency(6, 104);
      expect(vetUser).toBeGreaterThan(newUser);
    });
  });

  describe('normalizeRecovery', () => {
    it('optimal recovery yields high score', () => {
      const result = normalizeRecovery({
        avgRestDaysPerWeek: 2,
        hrvTrend: 'improving',
        avgRPE: 6,
        avgSleepHours: 8,
      });
      expect(result).toBeGreaterThanOrEqual(30);
    });

    it('no rest + declining HRV yields low score', () => {
      const result = normalizeRecovery({
        avgRestDaysPerWeek: 0,
        hrvTrend: 'declining',
        avgRPE: 9,
        avgSleepHours: 5,
      });
      expect(result).toBeLessThanOrEqual(5);
    });
  });

  describe('normalizeVO2max', () => {
    it('female gets +5 offset', () => {
      const male = normalizeVO2max(45, 'male');
      const female = normalizeVO2max(45, 'female');
      expect(female).toBeGreaterThan(male);
    });

    it('returns 1 for very low VO2max', () => {
      expect(normalizeVO2max(20, 'male')).toBe(1);
    });

    it('returns 40 for very high VO2max', () => {
      expect(normalizeVO2max(82, 'male')).toBe(40);
    });
  });

  describe('checkSafetyRails', () => {
    it('returns all clear for safe values', () => {
      const result = checkSafetyRails({
        acuteLoad7day: 80, chronicLoad28day: 100,
        currentWeekVolume: 40, avg4WeekVolume: 38,
        weeksSinceLastRun: 0,
      });
      expect(result.canAdvance).toBe(true);
      expect(result.activeRails).toHaveLength(0);
    });

    it('triggers ACWR_CRITICAL when ratio > 1.8', () => {
      const result = checkSafetyRails({
        acuteLoad7day: 200, chronicLoad28day: 100,
        currentWeekVolume: 40, avg4WeekVolume: 38,
        weeksSinceLastRun: 0,
      });
      expect(result.activeRails).toContain('ACWR_CRITICAL');
      expect(result.canAdvance).toBe(false);
    });

    it('triggers VOLUME_DANGER when >130% of 4-week avg', () => {
      const result = checkSafetyRails({
        acuteLoad7day: 80, chronicLoad28day: 100,
        currentWeekVolume: 55, avg4WeekVolume: 40,
        weeksSinceLastRun: 0,
      });
      expect(result.activeRails).toContain('VOLUME_DANGER');
      expect(result.canAdvance).toBe(false);
    });

    it('VOLUME_SPIKE does not block advancement', () => {
      const result = checkSafetyRails({
        acuteLoad7day: 80, chronicLoad28day: 100,
        currentWeekVolume: 49, avg4WeekVolume: 40, // 1.225 ratio
        weeksSinceLastRun: 0,
      });
      expect(result.activeRails).toContain('VOLUME_SPIKE');
      expect(result.canAdvance).toBe(true);
    });

    it('triggers EXTENDED_BREAK after 4 weeks', () => {
      const result = checkSafetyRails({
        acuteLoad7day: 0, chronicLoad28day: 50,
        currentWeekVolume: 0, avg4WeekVolume: 30,
        weeksSinceLastRun: 5,
      });
      expect(result.activeRails).toContain('EXTENDED_BREAK');
    });
  });

  describe('checkAdvancement', () => {
    const safeStatus = { canAdvance: true, activeRails: [] as any, message: '' };

    it('advances when all criteria met', () => {
      const current = { tier: 'I' as const, subLevel: 5, rawScore: 15, status: 'provisional' as const };
      const result = checkAdvancement(current, 16, 3, safeStatus, 16, 20);
      expect(result.advances).toBe(true);
    });

    it('blocks when weeks sustained < 3', () => {
      const current = { tier: 'I' as const, subLevel: 5, rawScore: 15, status: 'provisional' as const };
      const result = checkAdvancement(current, 16, 2, safeStatus, 16, 20);
      expect(result.advances).toBe(false);
      expect(result.reason).toContain('3 consecutive weeks');
    });

    it('blocks when safety rail active', () => {
      const current = { tier: 'I' as const, subLevel: 5, rawScore: 15, status: 'provisional' as const };
      const unsafe = { canAdvance: false, activeRails: ['ACWR_CRITICAL' as const], message: 'Load too high' };
      const result = checkAdvancement(current, 16, 4, unsafe, 16, 20);
      expect(result.advances).toBe(false);
    });

    it('blocks when recovery < 15', () => {
      const current = { tier: 'I' as const, subLevel: 5, rawScore: 15, status: 'provisional' as const };
      const result = checkAdvancement(current, 16, 3, safeStatus, 16, 10);
      expect(result.advances).toBe(false);
      expect(result.reason).toContain('Recovery too low');
    });
  });

  describe('checkRegression', () => {
    it('drops sub-level after 4 weeks below', () => {
      const current = { tier: 'I' as const, subLevel: 5, rawScore: 15, status: 'provisional' as const };
      const result = checkRegression(current, 14, 4);
      expect(result.regresses).toBe(true);
      expect(result.newSubLevel).toBe(4);
    });

    it('demotes tier after 8 weeks below tier floor', () => {
      const current = { tier: 'I' as const, subLevel: 1, rawScore: 11, status: 'provisional' as const };
      const result = checkRegression(current, 9, 8); // below I floor (11)
      expect(result.regresses).toBe(true);
      expect(result.newTier).toBe('B');
    });

    it('no regression when score is at/above current level', () => {
      const current = { tier: 'I' as const, subLevel: 5, rawScore: 15, status: 'provisional' as const };
      const result = checkRegression(current, 15, 4);
      expect(result.regresses).toBe(false);
    });
  });
});
