import { getAgeFactor } from './ageGrading';

type Gender = 'male' | 'female' | 'non-binary';
type Tier = 'beginner' | 'intermediate' | 'advanced';

export interface PaceZones {
  easy_pace_per_km: number;
  tempo_pace_per_km: number;
  interval_pace_per_km: number;
  race_pace_per_km: number;
}

export interface IdealPaceResult {
  current_avg_pace: number;
  ideal_zones: PaceZones;
  improvement_needed_seconds: number;
  pace_rating: string;
}

function getBMIAdjustment(weight_kg: number, height_cm: number): number {
  const bmi = weight_kg / Math.pow(height_cm / 100, 2);
  if (bmi < 18.5) return 1.02;
  if (bmi <= 24.9) return 1.0;
  if (bmi <= 29.9) return 1.08;
  if (bmi <= 34.9) return 1.18;
  return 1.30;
}

function getFitnessMultiplier(fitnessLevel: string): number {
  const multipliers: Record<string, number> = {
    sedentary: 1.25,
    lightly_active: 1.12,
    active: 1.0,
    very_active: 0.92,
  };
  return multipliers[fitnessLevel] || 1.0;
}

export function calculateIdealPace(
  age: number,
  gender: Gender,
  weight_kg: number,
  height_cm: number,
  fitnessLevel: string,
  tier: Tier
): PaceZones {
  const tierBasePace: Record<Tier, number> = {
    beginner: 390,
    intermediate: 320,
    advanced: 265,
  };

  const basePace = tierBasePace[tier];
  const ageFactor = 1 / getAgeFactor(age, gender);
  const bmiAdjust = getBMIAdjustment(weight_kg, height_cm);
  const fitnessMult = getFitnessMultiplier(fitnessLevel);

  const adjustedPace = basePace * ageFactor * bmiAdjust * fitnessMult;

  return {
    easy_pace_per_km: Math.round(adjustedPace * 1.20),
    tempo_pace_per_km: Math.round(adjustedPace),
    interval_pace_per_km: Math.round(adjustedPace * 0.88),
    race_pace_per_km: Math.round(adjustedPace * 0.95),
  };
}

export function analyzeCurrentPace(
  runs: { average_pace_per_km: number; distance_meters: number }[],
  idealZones: PaceZones
): IdealPaceResult {
  if (runs.length === 0) {
    return {
      current_avg_pace: 0,
      ideal_zones: idealZones,
      improvement_needed_seconds: 0,
      pace_rating: 'No data yet',
    };
  }

  const totalWeightedPace = runs.reduce((sum, r) => sum + (r.average_pace_per_km * r.distance_meters), 0);
  const totalDistance = runs.reduce((sum, r) => sum + r.distance_meters, 0);
  const currentAvg = totalWeightedPace / totalDistance;

  const idealTempo = idealZones.tempo_pace_per_km;
  const diff = currentAvg - idealTempo;

  let rating: string;
  if (diff <= -20) rating = 'Exceeding targets — impressive!';
  else if (diff <= 10) rating = 'Right on track';
  else if (diff <= 30) rating = 'Close to target — keep pushing';
  else if (diff <= 60) rating = 'Room to improve — stay consistent';
  else rating = 'Building your base — trust the process';

  return {
    current_avg_pace: Math.round(currentAvg),
    ideal_zones: idealZones,
    improvement_needed_seconds: Math.max(0, Math.round(diff)),
    pace_rating: rating,
  };
}

export function formatPace(secondsPerKm: number): string {
  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.round(secondsPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}/km`;
}
