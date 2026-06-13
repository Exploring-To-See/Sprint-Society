import { describe, it, expect } from 'vitest';
import {
  estimateVDOT,
  getTrainingPaces,
  calculateWeeklyVolume,
  calculateReadiness,
} from './trainingPlanGenerator';

function makeRun(distanceM: number, timeSec: number, daysAgo: number) {
  const d = new Date(Date.now() - daysAgo * 86400000);
  return {
    distance_meters: distanceM,
    moving_time_seconds: timeSec,
    average_pace_per_km: timeSec / (distanceM / 1000),
    start_date: d.toISOString(),
  };
}

describe('trainingPlanGenerator', () => {
  describe('estimateVDOT', () => {
    it('returns higher VDOT for faster 5K', () => {
      const fast = [makeRun(5000, 18 * 60, 1)];
      const slow = [makeRun(5000, 30 * 60, 1)];
      expect(estimateVDOT(fast)).toBeGreaterThan(estimateVDOT(slow));
    });

    it('filters runs shorter than 1500m', () => {
      const runs = [makeRun(1000, 300, 1), makeRun(5000, 1500, 2)];
      const result = estimateVDOT(runs);
      expect(result).toBeGreaterThan(30);
    });

    it('clamps VDOT to 30-85', () => {
      const slow = [makeRun(2000, 1200, 1)];
      const result = estimateVDOT(slow);
      expect(result).toBeGreaterThanOrEqual(30);
      expect(result).toBeLessThanOrEqual(85);
    });
  });

  describe('getTrainingPaces', () => {
    it('returns all pace zones', () => {
      const paces = getTrainingPaces(45);
      expect(paces).toHaveProperty('easy_min');
      expect(paces).toHaveProperty('easy_max');
      expect(paces).toHaveProperty('tempo');
      expect(paces).toHaveProperty('interval');
      expect(paces).toHaveProperty('long');
      expect(paces).toHaveProperty('recovery');
    });

    it('faster paces for higher VDOT', () => {
      const low = getTrainingPaces(35);
      const high = getTrainingPaces(55);
      expect(high.tempo).toBeLessThan(low.tempo);
      expect(high.interval).toBeLessThan(low.interval);
    });

    it('easy pace is slower than tempo', () => {
      const paces = getTrainingPaces(45);
      expect(paces.easy_min).toBeGreaterThan(paces.tempo);
    });
  });

  describe('calculateWeeklyVolume', () => {
    it('returns 0 for no runs', () => {
      expect(calculateWeeklyVolume([])).toBe(0);
    });

    it('averages over 4 weeks', () => {
      // 4 runs of 10km each, one per week
      const runs = [makeRun(10000, 3600, 3), makeRun(10000, 3600, 10), makeRun(10000, 3600, 17), makeRun(10000, 3600, 24)];
      const result = calculateWeeklyVolume(runs);
      expect(result).toBeCloseTo(10, 0); // 40km / 4 weeks
    });
  });

  describe('calculateReadiness', () => {
    it('returns high readiness after rest day', () => {
      // No runs yesterday, no runs 2 days ago
      const runs = [makeRun(5000, 1500, 3)];
      const result = calculateReadiness(runs);
      expect(result.score).toBeGreaterThanOrEqual(75);
      expect(result.label).toBe('Ready');
    });

    it('returns lower readiness after long run yesterday', () => {
      const runs = [makeRun(15000, 5400, 0.5)]; // yesterday, 15km
      const result = calculateReadiness(runs);
      expect(result.score).toBeLessThan(75);
    });

    it('clamps score between 20-100', () => {
      // Very heavy recent days
      const runs = [
        makeRun(12000, 4000, 0.5),
        makeRun(12000, 4000, 1.5),
      ];
      const result = calculateReadiness(runs);
      expect(result.score).toBeGreaterThanOrEqual(20);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });
});
