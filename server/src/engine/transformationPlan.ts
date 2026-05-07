type Tier = 'beginner' | 'intermediate' | 'advanced';

export interface Milestone {
  week: number;
  target_pace: number;
  focus_area: string;
  tips: string[];
}

export interface TransformationResult {
  current_pace_per_km: number;
  target_pace_per_km: number;
  current_tier: Tier;
  target_tier: Tier;
  estimated_weeks: number;
  milestones: Milestone[];
}

const FOCUS_AREAS = [
  { area: 'Base Building', tips: ['Focus on easy runs at conversational pace', 'Increase weekly mileage by no more than 10%', 'Prioritize consistency over speed'] },
  { area: 'Strength Foundation', tips: ['Add 2 bodyweight sessions per week', 'Focus on glutes, core, and single-leg exercises', 'Squats, lunges, and planks are your best friends'] },
  { area: 'Cadence & Form', tips: ['Aim for 170-180 steps per minute', 'Focus on landing under your center of mass', 'Keep arms at 90 degrees, relaxed hands'] },
  { area: 'Tempo Introduction', tips: ['Add one tempo effort per week (15-20 min)', 'Comfortably hard — you can speak in phrases, not sentences', 'Build tempo duration before tempo speed'] },
  { area: 'Speed Development', tips: ['Add short intervals (200-400m) once per week', 'Focus on running fast with good form', 'Full recovery between reps — this is about speed, not endurance'] },
  { area: 'Endurance Extension', tips: ['Increase long run by 1-2km per week', 'Run long runs 60-90s/km slower than goal pace', 'Fuel properly before and during long efforts'] },
  { area: 'Lactate Threshold', tips: ['Build threshold runs from 10 min to 25 min', 'Pace should feel hard but sustainable for 30-60 min', 'This is the biggest lever for pace improvement'] },
  { area: 'Race Preparation', tips: ['Practice race-day nutrition and hydration', 'Include race-pace efforts in training', 'Taper: reduce volume 30% in final week, maintain intensity'] },
  { area: 'Recovery & Adaptation', tips: ['Take easy weeks every 4th week (reduce volume 30%)', 'Sleep 7-9 hours — this is when adaptation happens', 'Foam roll, stretch, and manage stress levels'] },
  { area: 'Mental Toughness', tips: ['Practice positive self-talk during hard efforts', 'Break long runs into smaller mental segments', 'Visualize race day and how you want to feel'] },
];

function getNextTier(current: Tier): Tier {
  if (current === 'beginner') return 'intermediate';
  if (current === 'intermediate') return 'advanced';
  return 'advanced';
}

export function generateTransformationPlan(
  currentPace: number,
  targetPace: number,
  currentTier: Tier
): TransformationResult {
  const paceGap = currentPace - targetPace;

  const weeklyImprovement = currentTier === 'beginner' ? 5 :
    currentTier === 'intermediate' ? 3 : 2;

  const estimatedWeeks = Math.max(4, Math.min(24, Math.ceil(paceGap / weeklyImprovement)));
  const targetTier = getNextTier(currentTier);

  const milestones: Milestone[] = [];
  for (let week = 1; week <= estimatedWeeks; week++) {
    const progress = week / estimatedWeeks;
    const milestone_pace = Math.round(currentPace - (paceGap * progress));

    const focusIndex = Math.floor(progress * FOCUS_AREAS.length) % FOCUS_AREAS.length;
    const focus = FOCUS_AREAS[focusIndex];

    milestones.push({
      week,
      target_pace: milestone_pace,
      focus_area: focus.area,
      tips: focus.tips,
    });
  }

  return {
    current_pace_per_km: currentPace,
    target_pace_per_km: targetPace,
    current_tier: currentTier,
    target_tier: targetTier,
    estimated_weeks: estimatedWeeks,
    milestones,
  };
}
