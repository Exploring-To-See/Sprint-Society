import { describe, it, expect } from 'vitest';
import {
  estimateVO2maxFromRace,
  estimateVO2maxFromProfile,
  getVO2maxCategory,
  estimateVO2maxWithConfidence,
} from './vo2max';

describe('vo2max', () => {
  describe('estimateVO2maxFromRace', () => {
    it('returns ~50 VO2max for a 20-minute 5K', () => {
      const vo2 = estimateVO2maxFromRace(5000, 20 * 60);
      expect(vo2).toBeGreaterThan(45);
      expect(vo2).toBeLessThan(55);
    });

    it('returns higher VO2max for faster race', () => {
      const slow = estimateVO2maxFromRace(5000, 30 * 60);
      const fast = estimateVO2maxFromRace(5000, 18 * 60);
      expect(fast).toBeGreaterThan(slow);
    });

    it('clamps to range 20-85', () => {
      const veryFast = estimateVO2maxFromRace(5000, 12 * 60);
      const verySlow = estimateVO2maxFromRace(1000, 30 * 60);
      expect(veryFast).toBeLessThanOrEqual(85);
      expect(verySlow).toBeGreaterThanOrEqual(20);
    });
  });

  describe('estimateVO2maxFromProfile', () => {
    it('returns higher VO2max for young active male', () => {
      const young = estimateVO2maxFromProfile(25, 'male', 'very_active', 70, 178);
      const old = estimateVO2maxFromProfile(55, 'male', 'sedentary', 90, 178);
      expect(young).toBeGreaterThan(old);
    });

    it('applies gender factor', () => {
      const male = estimateVO2maxFromProfile(30, 'male', 'active', 70, 175);
      const female = estimateVO2maxFromProfile(30, 'female', 'active', 60, 165);
      expect(male).toBeGreaterThan(female);
    });

    it('clamps to 20-75', () => {
      const result = estimateVO2maxFromProfile(20, 'male', 'very_active', 60, 180);
      expect(result).toBeLessThanOrEqual(75);
      expect(result).toBeGreaterThanOrEqual(20);
    });

    it('applies BMI penalty for overweight', () => {
      const normal = estimateVO2maxFromProfile(30, 'male', 'active', 75, 180);
      const heavy = estimateVO2maxFromProfile(30, 'male', 'active', 110, 180);
      expect(heavy).toBeLessThan(normal);
    });
  });

  describe('getVO2maxCategory', () => {
    it('classifies excellent VO2max correctly', () => {
      expect(getVO2maxCategory(60, 25, 'male')).toBe('Excellent');
    });

    it('classifies poor VO2max correctly', () => {
      expect(getVO2maxCategory(25, 25, 'male')).toBe('Poor');
    });

    it('adjusts for female gender offset', () => {
      // Same VO2max should get a better category for females (lower threshold)
      const maleCategory = getVO2maxCategory(46, 30, 'male');
      const femaleCategory = getVO2maxCategory(46, 30, 'female');
      // Female with 46 has adjusted = 46 + 5 = 51 vs male 46, so female gets better or same
      expect(['Good', 'Excellent']).toContain(femaleCategory);
    });

    it('adjusts for age', () => {
      // Older runner gets age bonus, so same VO2 reads better
      const young = getVO2maxCategory(40, 25, 'male');
      const old = getVO2maxCategory(40, 55, 'male');
      // score = vo2max + ageOffset, and ageOffset = (55-30)*0.3 = 7.5 for old
      expect(old).not.toBe('Poor');
    });
  });

  describe('estimateVO2maxWithConfidence', () => {
    it('returns low confidence for 0 runs', () => {
      const result = estimateVO2maxWithConfidence([]);
      expect(result.confidence).toBe('low');
      expect(result.data_points).toBe(0);
    });

    it('returns medium confidence for 5-9 valid runs', () => {
      const runs = Array.from({ length: 7 }, () => ({
        distance_meters: 5000,
        moving_time_seconds: 1400,
        average_pace_per_km: 280,
      }));
      const result = estimateVO2maxWithConfidence(runs);
      expect(result.confidence).toBe('medium');
      expect(result.data_points).toBe(7);
    });

    it('filters out runs shorter than 1km', () => {
      const runs = [
        { distance_meters: 500, moving_time_seconds: 200, average_pace_per_km: 400 },
        { distance_meters: 5000, moving_time_seconds: 1500, average_pace_per_km: 300 },
      ];
      const result = estimateVO2maxWithConfidence(runs);
      expect(result.data_points).toBe(1);
    });

    it('estimate is within range_min and range_max', () => {
      const runs = Array.from({ length: 5 }, () => ({
        distance_meters: 5000,
        moving_time_seconds: 1500,
        average_pace_per_km: 300,
      }));
      const result = estimateVO2maxWithConfidence(runs);
      expect(result.estimate).toBeGreaterThanOrEqual(result.range_min);
      expect(result.estimate).toBeLessThanOrEqual(result.range_max);
    });
  });
});
