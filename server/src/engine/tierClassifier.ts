import { calculateAgeGradedPercent } from './ageGrading';
import { estimateVO2maxFromRace, estimateVO2maxFromProfile } from './vo2max';

type Gender = 'male' | 'female' | 'non-binary';
type Tier = 'beginner' | 'intermediate' | 'advanced';

interface UserProfile {
  age: number;
  gender: Gender;
  height_cm: number;
  weight_kg: number;
  fitness_level: string;
  running_experience: string;
}

interface RunData {
  distance_meters: number;
  moving_time_seconds: number;
  start_date: string;
}

export interface TierResult {
  tier: Tier;
  score: number;
  estimated_vo2max: number;
  age_graded_percent: number;
  breakdown: {
    age_graded_score: number;
    vo2max_score: number;
    distance_score: number;
    consistency_score: number;
  };
}

function normalizeVO2max(vo2max: number): number {
  return Math.min(100, Math.max(0, (vo2max - 20) * (100 / 50)));
}

function normalizeWeeklyDistance(distanceKm: number): number {
  if (distanceKm >= 50) return 100;
  if (distanceKm >= 30) return 80;
  if (distanceKm >= 20) return 60;
  if (distanceKm >= 10) return 40;
  if (distanceKm >= 5) return 20;
  return 10;
}

function calculateConsistency(runs: RunData[]): number {
  if (runs.length === 0) return 0;

  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const recentRuns = runs.filter(r => new Date(r.start_date) >= fourWeeksAgo);
  const runsPerWeek = recentRuns.length / 4;

  if (runsPerWeek >= 5) return 100;
  if (runsPerWeek >= 4) return 85;
  if (runsPerWeek >= 3) return 70;
  if (runsPerWeek >= 2) return 50;
  if (runsPerWeek >= 1) return 30;
  return 10;
}

function calculateWeeklyAvgDistance(runs: RunData[]): number {
  if (runs.length === 0) return 0;

  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const recentRuns = runs.filter(r => new Date(r.start_date) >= fourWeeksAgo);

  const totalMeters = recentRuns.reduce((sum, r) => sum + r.distance_meters, 0);
  return (totalMeters / 1000) / 4;
}

export function classifyTier(user: UserProfile, runs: RunData[]): TierResult {
  let estimatedVO2max: number;
  let ageGradedPercent: number;

  if (runs.length >= 3) {
    const sortedRuns = [...runs].sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
    const recentRuns = sortedRuns.slice(0, 10);

    const avgDistance = recentRuns.reduce((s, r) => s + r.distance_meters, 0) / recentRuns.length;
    const avgTime = recentRuns.reduce((s, r) => s + r.moving_time_seconds, 0) / recentRuns.length;

    estimatedVO2max = estimateVO2maxFromRace(avgDistance, avgTime);
    ageGradedPercent = calculateAgeGradedPercent(avgTime, avgDistance, user.age, user.gender);
  } else {
    estimatedVO2max = estimateVO2maxFromProfile(user.age, user.gender, user.fitness_level, user.weight_kg, user.height_cm);
    ageGradedPercent = normalizeVO2max(estimatedVO2max) * 0.6;
  }

  const weeklyDistance = calculateWeeklyAvgDistance(runs);
  const consistency = calculateConsistency(runs);

  const ageGradedScore = Math.min(100, ageGradedPercent);
  const vo2maxScore = normalizeVO2max(estimatedVO2max);
  const distanceScore = normalizeWeeklyDistance(weeklyDistance);
  const consistencyScore = consistency;

  const score = (
    ageGradedScore * 0.35 +
    vo2maxScore * 0.25 +
    distanceScore * 0.20 +
    consistencyScore * 0.20
  );

  let tier: Tier;
  if (score >= 65) tier = 'advanced';
  else if (score >= 35) tier = 'intermediate';
  else tier = 'beginner';

  return {
    tier,
    score,
    estimated_vo2max: Math.round(estimatedVO2max * 10) / 10,
    age_graded_percent: Math.round(ageGradedPercent * 10) / 10,
    breakdown: {
      age_graded_score: Math.round(ageGradedScore),
      vo2max_score: Math.round(vo2maxScore),
      distance_score: Math.round(distanceScore),
      consistency_score: Math.round(consistencyScore),
    },
  };
}
