export interface ProfilingInput {
  age: number;
  gender: string;
  weight_kg: number;
  height_cm: number;
  fitness_level: string;
  running_experience: string;
  injury_history?: string[];
  weekly_km?: number;
  dream_race: string;
  running_why: string;
  run_feeling?: string;
  bad_run_response: string;
  preferred_time: string;
  training_days: number;
  recent_5k_time?: number;
}

export interface RunnerDNA {
  estimated_vo2max: number;
  estimated_5k_sec: number;
  tier: 'beginner' | 'intermediate' | 'advanced';
  coach_style: 'motivator' | 'analyst' | 'zen' | 'drill_sergeant';
  ai_coach_name: string;
  personality_tags: string[];
  pace_zones: {
    easy: string;
    tempo: string;
    interval: string;
    race: string;
  };
  weekly_volume_km: number;
  training_days: number;
  strengths: string[];
  focus_areas: string[];
  first_week_preview: string;
  motivational_message: string;
}

export function generateRunnerDNA(input: ProfilingInput): RunnerDNA {
  // VO2max estimation using Cooper/Daniels-style approximation
  let baseVO2 = estimateVO2max(input);

  // Tier classification
  const tier = baseVO2 >= 50 ? 'advanced' : baseVO2 >= 40 ? 'intermediate' : 'beginner';

  // 5K time estimation from VO2max (Daniels formula)
  const estimated5kSec = vo2maxTo5kTime(baseVO2);

  // Coach style based on personality signals
  const coachStyle = determineCoachStyle(input);
  const aiCoachName = getCoachName(coachStyle);

  // Personality tags
  const tags = buildPersonalityTags(input);

  // Pace zones from VO2max (Daniels VDOT tables approximation)
  const paceZones = calculatePaceZones(baseVO2);

  // Weekly volume recommendation
  const weeklyKm = recommendWeeklyVolume(tier, input.training_days, input.fitness_level);

  // Strengths and focus areas
  const { strengths, focusAreas } = assessStrengthsAndGaps(input, tier);

  // First week preview
  const firstWeekPreview = generateFirstWeekPreview(tier, input.training_days, weeklyKm);

  // Motivational message based on their "why"
  const motivationalMessage = craftMotivation(input, tier);

  return {
    estimated_vo2max: Math.round(baseVO2 * 10) / 10,
    estimated_5k_sec: estimated5kSec,
    tier,
    coach_style: coachStyle,
    ai_coach_name: aiCoachName,
    personality_tags: tags,
    pace_zones: paceZones,
    weekly_volume_km: weeklyKm,
    training_days: input.training_days,
    strengths,
    focus_areas: focusAreas,
    first_week_preview: firstWeekPreview,
    motivational_message: motivationalMessage,
  };
}

function estimateVO2max(input: ProfilingInput): number {
  // Base estimate from age/gender/fitness
  let vo2 = 35;

  // Age adjustment (peaks around 25-30)
  if (input.age < 30) vo2 += 3;
  else if (input.age > 40) vo2 -= (input.age - 40) * 0.3;
  else if (input.age > 50) vo2 -= 6;

  // Gender adjustment
  if (input.gender === 'female') vo2 -= 3;

  // Fitness level
  const fitnessBonus: Record<string, number> = { sedentary: -8, lightly_active: -3, active: 3, very_active: 8 };
  vo2 += fitnessBonus[input.fitness_level] || 0;

  // Running experience
  const expBonus: Record<string, number> = { none: -5, beginner: 0, intermediate: 5, advanced: 12 };
  vo2 += expBonus[input.running_experience] || 0;

  // BMI adjustment
  const bmi = input.weight_kg / Math.pow(input.height_cm / 100, 2);
  if (bmi > 28) vo2 -= 3;
  else if (bmi < 22) vo2 += 2;

  // If they provided a recent 5K time, use that instead (most accurate)
  if (input.recent_5k_time && input.recent_5k_time > 0) {
    vo2 = fiveKTimeToVO2max(input.recent_5k_time);
  }

  return Math.max(20, Math.min(75, vo2));
}

function fiveKTimeToVO2max(seconds: number): number {
  // Simplified Daniels VDOT table lookup
  const minutes = seconds / 60;
  return 120.8 - 3.12 * minutes + 0.032 * minutes * minutes;
}

function vo2maxTo5kTime(vo2max: number): number {
  // Inverse of the VDOT estimation
  if (vo2max >= 60) return Math.round(15 * 60 + (60 - vo2max) * 15);
  if (vo2max >= 50) return Math.round(20 * 60 + (50 - vo2max) * 30);
  if (vo2max >= 40) return Math.round(25 * 60 + (40 - vo2max) * 40);
  return Math.round(30 * 60 + (35 - Math.max(25, vo2max)) * 60);
}

function determineCoachStyle(input: ProfilingInput): 'motivator' | 'analyst' | 'zen' | 'drill_sergeant' {
  const why = (input.running_why || '').toLowerCase();
  const feeling = (input.run_feeling || '').toLowerCase();
  const badRun = (input.bad_run_response || '').toLowerCase();

  if (badRun.includes('push') || badRun.includes('harder') || badRun.includes('angry') || why.includes('compete'))
    return 'drill_sergeant';
  if (feeling.includes('data') || feeling.includes('pace') || feeling.includes('track') || why.includes('improve'))
    return 'analyst';
  if (feeling.includes('peace') || feeling.includes('calm') || feeling.includes('meditat') || why.includes('mental'))
    return 'zen';
  return 'motivator';
}

function getCoachName(style: string): string {
  const names: Record<string, string> = {
    motivator: 'The Energizer',
    analyst: 'The Scientist',
    zen: 'The Sage',
    drill_sergeant: 'The Warrior',
  };
  return names[style] || 'The Energizer';
}

function buildPersonalityTags(input: ProfilingInput): string[] {
  const tags: string[] = [];

  if (input.preferred_time === 'morning') tags.push('Early Bird');
  else if (input.preferred_time === 'evening') tags.push('Night Runner');

  if (input.training_days >= 5) tags.push('High Volume');
  else if (input.training_days <= 2) tags.push('Weekend Warrior');

  if (input.running_experience === 'advanced') tags.push('Seasoned');
  if (input.running_experience === 'none') tags.push('Fresh Start');

  const why = (input.running_why || '').toLowerCase();
  if (why.includes('race') || why.includes('marathon') || why.includes('compete')) tags.push('Competitor');
  if (why.includes('health') || why.includes('fit') || why.includes('weight')) tags.push('Health Focused');
  if (why.includes('stress') || why.includes('mental') || why.includes('peace')) tags.push('Mind Runner');
  if (why.includes('fun') || why.includes('friend') || why.includes('social')) tags.push('Social Runner');

  if (input.fitness_level === 'very_active') tags.push('Athlete');

  return tags.slice(0, 4);
}

function calculatePaceZones(vo2max: number): { easy: string; tempo: string; interval: string; race: string } {
  // Daniels-inspired pace zones from VO2max
  const vdotPace = 480 - (vo2max - 30) * 5; // rough race pace in sec/km

  const easy = vdotPace + 60;
  const tempo = vdotPace + 20;
  const interval = vdotPace - 15;
  const race = vdotPace;

  return {
    easy: formatPace(easy),
    tempo: formatPace(tempo),
    interval: formatPace(interval),
    race: formatPace(race),
  };
}

function formatPace(secPerKm: number): string {
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function recommendWeeklyVolume(tier: string, trainingDays: number, fitness: string): number {
  const baseKm: Record<string, number> = { beginner: 12, intermediate: 25, advanced: 45 };
  let vol = baseKm[tier] || 15;

  if (trainingDays >= 5) vol *= 1.3;
  else if (trainingDays <= 2) vol *= 0.6;

  if (fitness === 'very_active') vol *= 1.1;
  if (fitness === 'sedentary') vol *= 0.7;

  return Math.round(vol);
}

function assessStrengthsAndGaps(input: ProfilingInput, tier: string): { strengths: string[]; focusAreas: string[] } {
  const strengths: string[] = [];
  const focusAreas: string[] = [];

  if (input.fitness_level === 'very_active') strengths.push('High baseline fitness');
  if (input.training_days >= 4) strengths.push('Consistent training habit');
  if (input.running_experience === 'advanced') strengths.push('Technical running knowledge');
  if (input.preferred_time === 'morning') strengths.push('Disciplined morning routine');

  if (tier === 'beginner') {
    focusAreas.push('Build aerobic base');
    focusAreas.push('Establish consistent routine');
    if (input.training_days < 3) focusAreas.push('Increase weekly frequency');
  } else if (tier === 'intermediate') {
    focusAreas.push('Introduce tempo runs');
    focusAreas.push('Speed endurance development');
    if (input.training_days < 4) focusAreas.push('Add one more training day');
  } else {
    focusAreas.push('Periodized training blocks');
    focusAreas.push('Race-specific preparation');
    focusAreas.push('Recovery optimization');
  }

  if (strengths.length === 0) strengths.push('Willingness to start');
  return { strengths: strengths.slice(0, 3), focusAreas: focusAreas.slice(0, 3) };
}

function generateFirstWeekPreview(tier: string, days: number, weeklyKm: number): string {
  if (tier === 'beginner') {
    return `Your first week: ${days} easy runs (${Math.round(weeklyKm / days)}km each), focusing on comfortable effort. No pace pressure — just build the habit.`;
  } else if (tier === 'intermediate') {
    return `Week 1: ${days - 1} easy runs + 1 tempo session. Total ~${weeklyKm}km. We'll establish your baseline this week.`;
  }
  return `Week 1: ${days - 2} easy runs + 1 tempo + 1 interval session. ~${weeklyKm}km total. Starting where you are, building from there.`;
}

function craftMotivation(input: ProfilingInput, tier: string): string {
  const why = (input.running_why || '').toLowerCase();

  if (why.includes('race') || why.includes('marathon')) {
    return tier === 'beginner'
      ? "Every marathon runner started with a single kilometer. Your race journey begins today — and I'm here every step."
      : "You've got the foundation. Now we build the engine that takes you to that finish line faster than you imagined.";
  }
  if (why.includes('health') || why.includes('weight') || why.includes('fit')) {
    return "Running transforms bodies AND minds. Consistent effort > intensity. We'll build something sustainable that you'll love.";
  }
  if (why.includes('stress') || why.includes('mental') || why.includes('peace')) {
    return "The road is your therapy, and I'm your pace partner. Every run is a reset. Let's make this your daily anchor.";
  }
  if (why.includes('fun') || why.includes('social') || why.includes('friend')) {
    return "Running is better together. The fitter you get, the more adventures unlock. Let's build your engine while having a blast.";
  }
  return "You showed up. That's the hardest part. Everything that follows is just showing up again — and I'll be here each time.";
}
