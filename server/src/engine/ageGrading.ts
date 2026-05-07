type GenderKey = 'male' | 'female' | 'non-binary';

const AGE_FACTORS: Record<GenderKey, Record<string, number>> = {
  male: {
    '13-19': 0.84, '20-24': 0.97, '25-29': 1.00, '30-34': 0.98,
    '35-39': 0.96, '40-44': 0.93, '45-49': 0.90, '50-54': 0.86,
    '55-59': 0.82, '60-64': 0.77, '65-69': 0.72, '70-74': 0.66,
    '75-79': 0.60, '80+': 0.54,
  },
  female: {
    '13-19': 0.82, '20-24': 0.97, '25-29': 1.00, '30-34': 0.98,
    '35-39': 0.96, '40-44': 0.93, '45-49': 0.89, '50-54': 0.85,
    '55-59': 0.80, '60-64': 0.75, '65-69': 0.69, '70-74': 0.63,
    '75-79': 0.57, '80+': 0.51,
  },
  'non-binary': {
    '13-19': 0.83, '20-24': 0.97, '25-29': 1.00, '30-34': 0.98,
    '35-39': 0.96, '40-44': 0.93, '45-49': 0.895, '50-54': 0.855,
    '55-59': 0.81, '60-64': 0.76, '65-69': 0.705, '70-74': 0.645,
    '75-79': 0.585, '80+': 0.525,
  },
};

const WORLD_RECORD_5K: Record<GenderKey, number> = {
  male: 757,
  female: 851,
  'non-binary': 804,
};

function getAgeBracket(age: number): string {
  if (age < 20) return '13-19';
  if (age < 25) return '20-24';
  if (age < 30) return '25-29';
  if (age < 35) return '30-34';
  if (age < 40) return '35-39';
  if (age < 45) return '40-44';
  if (age < 50) return '45-49';
  if (age < 55) return '50-54';
  if (age < 60) return '55-59';
  if (age < 65) return '60-64';
  if (age < 70) return '65-69';
  if (age < 75) return '70-74';
  if (age < 80) return '75-79';
  return '80+';
}

export function getAgeFactor(age: number, gender: GenderKey): number {
  const bracket = getAgeBracket(age);
  return AGE_FACTORS[gender][bracket] || 0.80;
}

export function calculateAgeGradedPercent(
  timeSeconds: number,
  distanceMeters: number,
  age: number,
  gender: GenderKey
): number {
  const normalizedTo5K = (timeSeconds / distanceMeters) * 5000;
  const ageFactor = getAgeFactor(age, gender);
  const worldRecord = WORLD_RECORD_5K[gender];
  return (worldRecord / normalizedTo5K) * (1 / ageFactor) * 100;
}

export function getAgeGradeDescription(percent: number): string {
  if (percent >= 90) return 'World Class';
  if (percent >= 80) return 'National Class';
  if (percent >= 70) return 'Regional Class';
  if (percent >= 60) return 'Local Class';
  return 'Recreational';
}
