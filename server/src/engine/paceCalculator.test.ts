import { describe, it, expect } from 'vitest';
import { calculateIdealPace, analyzeCurrentPace, formatPace } from './paceCalculator';

describe('paceCalculator', () => {
  describe('calculateIdealPace', () => {
    it('returns faster paces for advanced tier', () => {
      const beginner = calculateIdealPace(30, 'male', 70, 175, 'active', 'beginner');
      const advanced = calculateIdealPace(30, 'male', 70, 175, 'active', 'advanced');
      expect(advanced.tempo_pace_per_km).toBeLessThan(beginner.tempo_pace_per_km);
    });

    it('applies BMI penalty for overweight', () => {
      const normal = calculateIdealPace(30, 'male', 70, 175, 'active', 'intermediate');
      const heavy = calculateIdealPace(30, 'male', 100, 175, 'active', 'intermediate');
      expect(heavy.tempo_pace_per_km).toBeGreaterThan(normal.tempo_pace_per_km);
    });

    it('zone ordering: interval < race < tempo < easy', () => {
      const zones = calculateIdealPace(25, 'male', 70, 178, 'active', 'intermediate');
      expect(zones.interval_pace_per_km).toBeLessThan(zones.race_pace_per_km);
      expect(zones.race_pace_per_km).toBeLessThan(zones.tempo_pace_per_km);
      expect(zones.tempo_pace_per_km).toBeLessThan(zones.easy_pace_per_km);
    });

    it('sedentary fitness level produces slower paces than very_active', () => {
      const sedentary = calculateIdealPace(30, 'male', 70, 175, 'sedentary', 'beginner');
      const active = calculateIdealPace(30, 'male', 70, 175, 'very_active', 'beginner');
      expect(sedentary.tempo_pace_per_km).toBeGreaterThan(active.tempo_pace_per_km);
    });
  });

  describe('analyzeCurrentPace', () => {
    it('returns "No data yet" for empty runs', () => {
      const zones = calculateIdealPace(25, 'male', 70, 175, 'active', 'intermediate');
      const result = analyzeCurrentPace([], zones);
      expect(result.pace_rating).toBe('No data yet');
    });

    it('rates fast runner as "Exceeding targets"', () => {
      const zones = calculateIdealPace(25, 'male', 70, 175, 'active', 'intermediate');
      const runs = [{ average_pace_per_km: zones.tempo_pace_per_km - 30, distance_meters: 5000 }];
      const result = analyzeCurrentPace(runs, zones);
      expect(result.pace_rating).toContain('Exceeding');
    });

    it('rates slow runner as "Building your base"', () => {
      const zones = calculateIdealPace(25, 'male', 70, 175, 'active', 'intermediate');
      const runs = [{ average_pace_per_km: zones.tempo_pace_per_km + 70, distance_meters: 5000 }];
      const result = analyzeCurrentPace(runs, zones);
      expect(result.pace_rating).toContain('Building');
    });
  });

  describe('formatPace', () => {
    it('formats 300 as 5:00/km', () => {
      expect(formatPace(300)).toBe('5:00/km');
    });

    it('formats 265 as 4:25/km', () => {
      expect(formatPace(265)).toBe('4:25/km');
    });

    it('formats 390 as 6:30/km', () => {
      expect(formatPace(390)).toBe('6:30/km');
    });
  });
});
