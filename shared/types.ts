export type Gender = 'male' | 'female' | 'non-binary';
export type FitnessLevel = 'sedentary' | 'lightly_active' | 'active' | 'very_active';
export type RunningExperience = 'none' | 'beginner' | 'intermediate' | 'advanced';
export type Tier = 'beginner' | 'intermediate' | 'advanced';
export type ChallengeCategory = 'bodyweight' | 'nutrition' | 'hydration' | 'technique' | 'gear' | 'breathing' | 'running';

export interface User {
  id: number;
  name: string;
  email: string;
  gender: Gender;
  age: number;
  height_cm: number;
  weight_kg: number;
  fitness_level: FitnessLevel;
  running_experience: RunningExperience;
  injury_history: string[];
  profile_image_url?: string;
  created_at: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  gender: Gender;
  age: number;
  height_cm: number;
  weight_kg: number;
  fitness_level: FitnessLevel;
  running_experience: RunningExperience;
  injury_history: string[];
}

export interface Activity {
  id: number;
  user_id: number;
  strava_activity_id?: number;
  distance_meters: number;
  moving_time_seconds: number;
  elapsed_time_seconds: number;
  average_speed: number;
  max_speed: number;
  average_pace_per_km: number;
  elevation_gain: number;
  start_date: string;
  start_latlng?: [number, number];
  end_latlng?: [number, number];
  map_polyline?: string;
  splits?: Split[];
  average_heartrate?: number;
  max_heartrate?: number;
  calories?: number;
}

export interface Split {
  distance: number;
  elapsed_time: number;
  moving_time: number;
  average_speed: number;
  pace_zone: number;
}

export interface TierClassification {
  tier: Tier;
  estimated_vo2max: number;
  age_graded_percent: number;
  score: number;
}

export interface PaceTargets {
  easy_pace_per_km: number;
  tempo_pace_per_km: number;
  interval_pace_per_km: number;
  race_pace_per_km: number;
}

export interface Challenge {
  id: number;
  user_id: number;
  week_start: string;
  category: ChallengeCategory;
  title: string;
  description: string;
  target_value?: number;
  target_unit?: string;
  tier: Tier;
  xp_reward: number;
  completed: boolean;
  completed_at?: string;
}

export interface TransformationPlan {
  id: number;
  user_id: number;
  current_pace_per_km: number;
  target_pace_per_km: number;
  current_tier: Tier;
  target_tier: Tier;
  estimated_weeks: number;
  milestones: TransformationMilestone[];
}

export interface TransformationMilestone {
  week: number;
  target_pace: number;
  focus_area: string;
  tips: string[];
}

export interface UserXP {
  total_xp: number;
  current_level: number;
  current_streak_days: number;
  longest_streak_days: number;
  xp_to_next_level: number;
  level_progress_percent: number;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  earned: boolean;
  earned_at?: string;
}

export interface LeaderboardEntry {
  user_id: number;
  name: string;
  total_xp: number;
  current_level: number;
  tier: Tier;
  total_distance_km: number;
}

export interface WeeklySummary {
  total_distance_km: number;
  total_runs: number;
  total_time_minutes: number;
  average_pace_per_km: number;
  improvement_percent: number;
}

export interface CoachingRecommendation {
  category: ChallengeCategory;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

// ===== Adaptive Engine Types =====

export type InjuryRisk = 'low' | 'moderate' | 'high' | 'critical';
export type VDOTTrend = 'improving' | 'stable' | 'declining';

export interface TrainingLoadMetrics {
  acute_load: number;
  chronic_load: number;
  training_stress_balance: number;
  monotony: number;
  strain: number;
  injury_risk: InjuryRisk;
}

export interface AdaptiveSummary {
  status: 'active' | 'no_data';
  training_load: {
    acute: number;
    chronic: number;
    balance: number;
    injury_risk: InjuryRisk;
  };
  fitness: {
    current_vdot: number;
    trend: VDOTTrend;
    change_4w: number;
  } | null;
  weekly_runs: number;
  message: string;
}

// ===== Heart Rate Zone Types =====

export interface HRZone {
  zone: number;
  name: string;
  min_bpm: number;
  max_bpm: number;
  min_percent: number;
  max_percent: number;
  description: string;
  training_effect: string;
  feel: string;
}

export interface HRProfile {
  max_hr: number;
  resting_hr: number;
  hr_reserve: number;
  zones: HRZone[];
  lactate_threshold_hr: number;
  aerobic_threshold_hr: number;
  source: 'activity_based' | 'formula_estimated';
}

// ===== Personal Records Types =====

export interface PersonalRecord {
  id: string;
  category: string;
  distance_meters?: number;
  value: number;
  formatted: string;
  activity_id: number;
  date: string;
  previous_best?: { value: number; formatted: string; date: string };
  improvement?: { value: number; formatted: string; percent: number };
}

export interface PRSummary {
  race_prs: PersonalRecord[];
  effort_prs: PersonalRecord[];
  total_count: number;
  latest_pr?: PersonalRecord;
}

export interface PRCelebration {
  title: string;
  message: string;
  type: 'gold' | 'silver' | 'bronze';
}
