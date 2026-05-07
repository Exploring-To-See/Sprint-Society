export function estimateVO2maxFromRace(distanceMeters: number, timeSeconds: number): number {
  const timeMinutes = timeSeconds / 60;
  const velocity = distanceMeters / timeMinutes;

  const oxygenCost = -4.60 + 0.182258 * velocity + 0.000104 * velocity * velocity;
  const percentMax = 0.8 + 0.1894393 * Math.exp(-0.012778 * timeMinutes) +
    0.2989558 * Math.exp(-0.1932605 * timeMinutes);

  if (percentMax <= 0) return 30;
  return Math.max(20, Math.min(85, oxygenCost / percentMax));
}

export function estimateVO2maxFromProfile(
  age: number,
  gender: 'male' | 'female' | 'non-binary',
  fitnessLevel: string,
  weight_kg: number,
  height_cm: number
): number {
  const bmi = weight_kg / Math.pow(height_cm / 100, 2);
  const genderFactor = gender === 'male' ? 1 : gender === 'female' ? 0 : 0.5;
  const fitnessMultiplier: Record<string, number> = {
    sedentary: 0.7,
    lightly_active: 0.85,
    active: 1.0,
    very_active: 1.15,
  };

  const baseVO2 = 50 - (0.3 * age) + (6 * genderFactor);
  const bmiPenalty = bmi > 25 ? (bmi - 25) * 0.5 : 0;
  const fitnessMult = fitnessMultiplier[fitnessLevel] || 0.85;

  return Math.max(20, Math.min(75, (baseVO2 - bmiPenalty) * fitnessMult));
}

export function getVO2maxCategory(vo2max: number, age: number, gender: string): string {
  const genderOffset = gender === 'female' ? -5 : gender === 'non-binary' ? -2.5 : 0;
  const adjusted = vo2max - genderOffset;
  const ageOffset = age > 30 ? (age - 30) * 0.3 : 0;
  const score = adjusted + ageOffset;

  if (score >= 55) return 'Excellent';
  if (score >= 47) return 'Good';
  if (score >= 40) return 'Average';
  if (score >= 33) return 'Below Average';
  return 'Poor';
}
