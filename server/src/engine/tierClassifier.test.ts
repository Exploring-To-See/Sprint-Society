import { describe, it, expect } from 'vitest';
import { classifyTier } from './tierClassifier';

function makeRun(distanceM: number, timeSec: number, daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return { distance_meters: distanceM, moving_time_seconds: timeSec, start_date: d.toISOString() };
}

const baseUser = { age: 30, gender: 'male' as const, height_cm: 175, weight_kg: 70, fitness_level: 'active', running_experience: 'intermediate' };

describe('tierClassifier', () => {
  it('classifies profile-only user (no runs) as beginner', () => {
    const result = classifyTier(baseUser, []);
    expect(result.tier).toBe('beginner');
    expect(result.score).toBeLessThan(35);
  });

  it('classifies with <3 runs using profile-based VO2max', () => {
    const runs = [makeRun(3000, 900, 2), makeRun(4000, 1200, 5)];
    const result = classifyTier(baseUser, runs);
    expect(result.tier).toBe('beginner');
  });

  it('classifies consistent fast runner as intermediate or advanced', () => {
    // 5K in 22 min × 10 runs over last 4 weeks = solid intermediate
    const runs = Array.from({ length: 10 }, (_, i) => makeRun(5000, 22 * 60, i * 2));
    const result = classifyTier(baseUser, runs);
    expect(['intermediate', 'advanced']).toContain(result.tier);
    expect(result.score).toBeGreaterThanOrEqual(35);
  });

  it('classifies elite runner as advanced', () => {
    // 5K in 16 min, high weekly distance, high consistency
    const runs = Array.from({ length: 20 }, (_, i) => makeRun(10000, 40 * 60, i * 1.4));
    const result = classifyTier(baseUser, runs);
    expect(result.tier).toBe('advanced');
    expect(result.score).toBeGreaterThanOrEqual(65);
  });

  it('returns breakdown with all score components', () => {
    const runs = Array.from({ length: 5 }, (_, i) => makeRun(5000, 1500, i * 3));
    const result = classifyTier(baseUser, runs);
    expect(result.breakdown).toHaveProperty('age_graded_score');
    expect(result.breakdown).toHaveProperty('vo2max_score');
    expect(result.breakdown).toHaveProperty('distance_score');
    expect(result.breakdown).toHaveProperty('consistency_score');
  });

  it('returns estimated_vo2max as a number', () => {
    const runs = Array.from({ length: 5 }, (_, i) => makeRun(5000, 1500, i * 3));
    const result = classifyTier(baseUser, runs);
    expect(typeof result.estimated_vo2max).toBe('number');
    expect(result.estimated_vo2max).toBeGreaterThan(0);
  });
});
