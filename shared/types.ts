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

// ===== Events & Meetups Types =====

export type EventType = 'group_run' | 'coffee_meetup' | 'workout' | 'social' | 'custom';
export type EventVisibility = 'public' | 'followers_only' | 'invite_only';
export type EventStatus = 'upcoming' | 'live' | 'completed' | 'cancelled';
export type RSVPStatus = 'going' | 'maybe' | 'not_going';

export interface Event {
  id: number;
  creator_id: number;
  title: string;
  description?: string;
  event_type: EventType;
  date: string;
  time: string;
  duration_minutes: number;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  max_attendees?: number;
  is_recurring: boolean;
  recurrence_rule?: string;
  cover_image_url?: string;
  visibility: EventVisibility;
  status: EventStatus;
  created_at: string;
  updated_at: string;
}

export interface EventHost {
  user_id: number;
  name: string;
  profile_image_url?: string;
  role_label: string;
}

export interface EventWithDetails extends Event {
  creator_name: string;
  creator_image?: string;
  attendee_count: number;
  maybe_count: number;
  user_rsvp?: RSVPStatus;
  attendees: EventAttendee[];
  hosts: EventHost[];
  is_full: boolean;
}

export interface EventAttendee {
  user_id: number;
  name: string;
  profile_image_url?: string;
  rsvp_status: RSVPStatus;
}

export interface EventComment {
  id: number;
  event_id: number;
  user_id: number;
  user_name: string;
  profile_image_url?: string;
  body: string;
  created_at: string;
}

// ===== Communities Types =====

export type CommunityCategory = 'run_club' | 'training' | 'nutrition' | 'wellness' | 'social' | 'brand' | 'custom';
export type CommunityMemberRole = 'owner' | 'admin' | 'member';

export interface Community {
  id: number;
  owner_id: number;
  name: string;
  description?: string;
  category: CommunityCategory;
  avatar_url?: string;
  cover_url?: string;
  is_verified: boolean;
  member_count: number;
  created_at: string;
}

export interface CommunityWithDetails extends Community {
  owner_name: string;
  owner_image?: string;
  user_role?: CommunityMemberRole;
  is_member: boolean;
  recent_posts: CommunityPost[];
}

export interface CommunityMember {
  user_id: number;
  name: string;
  profile_image_url?: string;
  role: CommunityMemberRole;
  joined_at: string;
}

export interface CommunityPost {
  id: number;
  community_id: number;
  author_id: number;
  author_name: string;
  author_image?: string;
  body: string;
  image_url?: string;
  pinned: boolean;
  likes_count: number;
  user_liked: boolean;
  created_at: string;
}

export interface CreateCommunityPayload {
  name: string;
  description?: string;
  category: CommunityCategory;
}

// ===== Subscription Types =====

export type PlanKey = 'free' | 'base' | 'pro';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';

export interface SubscriptionPlan {
  id: number;
  key: PlanKey;
  name: string;
  price_inr: number;
  duration_days: number;
  features: string[];
}

export interface UserSubscription {
  plan_key: PlanKey;
  plan_name: string;
  status: SubscriptionStatus;
  started_at: string;
  expires_at: string;
  auto_renew: boolean;
  days_remaining: number;
}

// ===== Notifications Types =====

export type NotificationType = 'welcome' | 'kudos' | 'comment' | 'follow' | 'event_reminder' | 'event_rsvp' | 'community_post' | 'community_join' | 'achievement' | 'level_up' | 'xp_award' | 'ai_insight';

export interface UserNotification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  body?: string;
  actor_id?: number;
  actor_name?: string;
  actor_image?: string;
  target_type?: string;
  target_id?: number;
  read: boolean;
  created_at: string;
}

// ===== Public Profile Types =====

export interface PublicProfile {
  id: number;
  name: string;
  profile_image_url?: string;
  running_experience: RunningExperience;
  current_tier?: Tier;
  current_level: number;
  total_xp: number;
  total_runs: number;
  total_distance_km: number;
  current_streak_days: number;
  joined_at: string;
  is_following: boolean;
  followers_count: number;
  following_count: number;
  communities: { id: number; name: string; category: string }[];
  recent_achievements: Achievement[];
}

// ===== API Envelope Types =====

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiSuccessResponse<T = unknown> {
  data: T;
}

export interface ApiErrorResponse {
  error: ApiError;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;
