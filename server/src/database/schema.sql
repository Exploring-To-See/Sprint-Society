CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'runner' CHECK(role IN ('admin', 'runner')),
    gender TEXT NOT NULL CHECK(gender IN ('male', 'female', 'non-binary')),
    age INTEGER NOT NULL,
    height_cm REAL NOT NULL,
    weight_kg REAL NOT NULL,
    fitness_level TEXT NOT NULL CHECK(fitness_level IN ('sedentary', 'lightly_active', 'active', 'very_active')),
    running_experience TEXT NOT NULL CHECK(running_experience IN ('none', 'beginner', 'intermediate', 'advanced')),
    injury_history TEXT DEFAULT '[]',
    profile_image_url TEXT,
    invite_code_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS strava_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    strava_athlete_id INTEGER NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    scope TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    strava_activity_id INTEGER UNIQUE,
    session_id INTEGER,
    distance_meters REAL NOT NULL,
    moving_time_seconds INTEGER NOT NULL,
    elapsed_time_seconds INTEGER NOT NULL,
    average_speed REAL,
    max_speed REAL,
    average_pace_per_km REAL,
    elevation_gain REAL,
    start_date DATETIME NOT NULL,
    start_latlng TEXT,
    end_latlng TEXT,
    map_polyline TEXT,
    splits TEXT,
    average_heartrate REAL,
    max_heartrate REAL,
    calories REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS club_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    target_distance_meters REAL NOT NULL,
    session_date DATETIME NOT NULL,
    location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tier_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    tier TEXT NOT NULL CHECK(tier IN ('beginner', 'intermediate', 'advanced')),
    estimated_vo2max REAL,
    age_graded_percent REAL,
    score REAL,
    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    week_start DATE NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('bodyweight', 'nutrition', 'hydration', 'technique', 'gear', 'breathing', 'running')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    target_value REAL,
    target_unit TEXT,
    tier TEXT NOT NULL,
    xp_reward INTEGER NOT NULL DEFAULT 50,
    completed INTEGER DEFAULT 0,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_xp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    total_xp INTEGER NOT NULL DEFAULT 0,
    current_level INTEGER NOT NULL DEFAULT 1,
    current_streak_days INTEGER NOT NULL DEFAULT 0,
    longest_streak_days INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS xp_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    source TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT NOT NULL,
    requirement_type TEXT NOT NULL,
    requirement_value REAL NOT NULL,
    xp_reward INTEGER NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS user_achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    achievement_id INTEGER NOT NULL,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id),
    UNIQUE(user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS transformation_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    current_pace_per_km REAL,
    target_pace_per_km REAL,
    current_tier TEXT,
    target_tier TEXT,
    estimated_weeks INTEGER,
    plan_data TEXT,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    pinned INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS session_attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_id INTEGER NOT NULL,
    activity_id INTEGER,
    attended INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (session_id) REFERENCES club_sessions(id),
    UNIQUE(user_id, session_id)
);

CREATE TABLE IF NOT EXISTS user_profiles (
    user_id INTEGER PRIMARY KEY,
    sleep_hours REAL,
    sleep_quality TEXT,
    available_days INTEGER,
    preferred_time TEXT,
    primary_goal TEXT,
    target_race TEXT,
    target_race_date TEXT,
    target_race_distance REAL,
    diet_type TEXT,
    work_type TEXT,
    stress_level TEXT,
    has_gym_access INTEGER DEFAULT 0,
    has_track_access INTEGER DEFAULT 0,
    has_trail_access INTEGER DEFAULT 0,
    medical_conditions TEXT DEFAULT '[]',
    previous_sports TEXT DEFAULT '[]',
    motivation_style TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Social: Following system
CREATE TABLE IF NOT EXISTS follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_id INTEGER NOT NULL,
    following_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(follower_id, following_id)
);

-- Social: Kudos (likes on activities)
CREATE TABLE IF NOT EXISTS kudos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    activity_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    UNIQUE(user_id, activity_id)
);

-- Social: Comments on activities
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    activity_id INTEGER NOT NULL,
    body TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
);

-- AI Chat: Conversation history
CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    context TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===== Admin: Analytics =====

CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    event_type TEXT NOT NULL,
    event_name TEXT NOT NULL,
    properties TEXT DEFAULT '{}',
    session_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS daily_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL UNIQUE,
    dau INTEGER NOT NULL DEFAULT 0,
    new_users INTEGER NOT NULL DEFAULT 0,
    active_runners INTEGER NOT NULL DEFAULT 0,
    total_distance_meters REAL NOT NULL DEFAULT 0,
    total_runs INTEGER NOT NULL DEFAULT 0,
    challenges_completed INTEGER NOT NULL DEFAULT 0,
    retention_d1 REAL,
    retention_d7 REAL,
    retention_d30 REAL
);

-- ===== Admin: Feature Flags =====

CREATE TABLE IF NOT EXISTS feature_flags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    enabled INTEGER NOT NULL DEFAULT 0,
    rollout_percentage INTEGER DEFAULT 100,
    target_segments TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feature_flag_overrides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flag_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    enabled INTEGER NOT NULL,
    FOREIGN KEY (flag_id) REFERENCES feature_flags(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(flag_id, user_id)
);

-- ===== Admin: User Segments =====

CREATE TABLE IF NOT EXISTS segments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    criteria TEXT NOT NULL,
    auto_refresh INTEGER DEFAULT 1,
    member_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS segment_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    segment_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(segment_id, user_id)
);

-- ===== Admin: Push Notifications =====

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK(target_type IN ('all', 'segment', 'user')),
    target_id INTEGER,
    scheduled_at DATETIME,
    sent_at DATETIME,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'scheduled', 'sent', 'failed')),
    sent_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ===== Admin: Content CMS =====

CREATE TABLE IF NOT EXISTS content_blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('tip', 'article', 'quote', 'coaching_message')),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    target_tier TEXT,
    target_segment_id INTEGER,
    published INTEGER DEFAULT 0,
    scheduled_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (target_segment_id) REFERENCES segments(id) ON DELETE SET NULL
);

-- ===== Admin: Audit Log =====

CREATE TABLE IF NOT EXISTS admin_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id INTEGER,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id)
);

-- ===== Admin: Sprint History (Engineering Hub) =====

CREATE TABLE IF NOT EXISTS sprint_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sprint_date DATE NOT NULL,
    proposed TEXT NOT NULL,
    built TEXT,
    auto_fixed TEXT,
    status TEXT DEFAULT 'proposed' CHECK(status IN ('proposed', 'in_progress', 'completed', 'rejected')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ===== Events & Meetups =====

CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL CHECK(event_type IN ('group_run', 'coffee_meetup', 'workout', 'social', 'custom')),
    date DATE NOT NULL,
    time TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    location_name TEXT,
    latitude REAL,
    longitude REAL,
    max_attendees INTEGER,
    is_recurring INTEGER DEFAULT 0,
    recurrence_rule TEXT,
    cover_image_url TEXT,
    visibility TEXT NOT NULL DEFAULT 'public' CHECK(visibility IN ('public', 'followers_only', 'invite_only')),
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK(status IN ('upcoming', 'live', 'completed', 'cancelled')),
    check_in_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS event_rsvps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'going' CHECK(status IN ('going', 'maybe', 'not_going')),
    rsvped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS event_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    body TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS event_hosts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role_label TEXT NOT NULL DEFAULT 'Host',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(event_id, user_id)
);

-- ===== Communities =====

CREATE TABLE IF NOT EXISTS communities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'custom' CHECK(category IN ('run_club', 'training', 'nutrition', 'wellness', 'social', 'brand', 'custom')),
    avatar_url TEXT,
    cover_url TEXT,
    is_verified INTEGER DEFAULT 0,
    member_count INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS community_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    community_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('owner', 'admin', 'member')),
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(community_id, user_id)
);

CREATE TABLE IF NOT EXISTS community_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    community_id INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    body TEXT NOT NULL,
    image_url TEXT,
    pinned INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS community_post_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(post_id, user_id)
);

-- ===== Indexes =====

CREATE INDEX IF NOT EXISTS idx_activities_user_date ON activities(user_id, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_challenges_user_week ON challenges(user_id, week_start);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON xp_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_strava_athlete ON strava_tokens(strava_athlete_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_kudos_activity ON kudos(activity_id);
CREATE INDEX IF NOT EXISTS idx_comments_activity ON comments(activity_id);
CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type, event_name);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_segment_members_user ON segment_members(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin ON admin_audit_log(admin_id, created_at DESC);

-- ===== Invite Codes =====

CREATE TABLE IF NOT EXISTS invite_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    max_uses INTEGER NOT NULL DEFAULT 50,
    used_count INTEGER NOT NULL DEFAULT 0,
    source TEXT,
    expires_at DATETIME,
    created_by INTEGER NOT NULL,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS invite_code_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (code_id) REFERENCES invite_codes(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code, active);

-- ===== AI Runner Profile =====

CREATE TABLE IF NOT EXISTS runner_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    dream_race TEXT,
    dream_race_distance_km REAL,
    running_why TEXT,
    run_feeling TEXT,
    bad_run_response TEXT,
    preferred_time TEXT,
    training_days_per_week INTEGER,
    coach_style TEXT CHECK(coach_style IN ('motivator', 'analyst', 'zen', 'drill_sergeant')),
    estimated_vo2max REAL,
    estimated_5k_time_sec INTEGER,
    personality_tags TEXT DEFAULT '[]',
    ai_coach_name TEXT DEFAULT 'Kai',
    weekly_plan_generated INTEGER DEFAULT 0,
    profiling_complete INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===== Subscriptions =====

CREATE TABLE IF NOT EXISTS subscription_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    price_inr INTEGER NOT NULL,
    duration_days INTEGER NOT NULL DEFAULT 30,
    features TEXT NOT NULL DEFAULT '[]',
    razorpay_plan_id TEXT,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    plan_key TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'expired', 'cancelled', 'pending')),
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    razorpay_subscription_id TEXT,
    razorpay_payment_id TEXT,
    auto_renew INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payment_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    plan_key TEXT NOT NULL,
    amount_inr INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'success', 'failed', 'refunded')),
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expiry ON user_subscriptions(expires_at, status);
CREATE INDEX IF NOT EXISTS idx_payment_history_user ON payment_history(user_id, created_at DESC);

-- ===== In-App Notifications =====

CREATE TABLE IF NOT EXISTS user_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('kudos', 'comment', 'follow', 'event_reminder', 'event_rsvp', 'community_post', 'community_join', 'achievement', 'level_up', 'xp_award')),
    title TEXT NOT NULL,
    body TEXT,
    actor_id INTEGER,
    target_type TEXT,
    target_id INTEGER,
    read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON user_notifications(user_id, read, created_at DESC);

-- Events indexes
-- Event Awards (auto-generated on event completion)
CREATE TABLE IF NOT EXISTS event_awards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    award_type TEXT NOT NULL,
    award_title TEXT NOT NULL,
    award_icon TEXT NOT NULL,
    rank_position INTEGER,
    stat_value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_event_awards_event ON event_awards(event_id);
CREATE INDEX IF NOT EXISTS idx_event_awards_user ON event_awards(user_id);

-- Event Check-ins
CREATE TABLE IF NOT EXISTS event_checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    checked_in_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_checkins_event ON event_checkins(event_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date, time);
CREATE INDEX IF NOT EXISTS idx_events_creator ON events(creator_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status, date);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event ON event_rsvps(event_id, status);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user ON event_rsvps(user_id);
CREATE INDEX IF NOT EXISTS idx_event_comments_event ON event_comments(event_id);

-- Community reactions (emoji-based)
CREATE TABLE IF NOT EXISTS community_post_reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    emoji TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(post_id, user_id, emoji)
);

-- Community polls
CREATE TABLE IF NOT EXISTS community_polls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    community_id INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    options TEXT NOT NULL,
    closes_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS community_poll_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    poll_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    option_index INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (poll_id) REFERENCES community_polls(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(poll_id, user_id)
);

-- Community broadcasts (one-way from owner/admin)
CREATE TABLE IF NOT EXISTS community_broadcasts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    community_id INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    body TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Community mute preferences
CREATE TABLE IF NOT EXISTS community_mutes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    community_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    muted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(community_id, user_id)
);

-- Communities indexes
CREATE INDEX IF NOT EXISTS idx_communities_category ON communities(category);
CREATE INDEX IF NOT EXISTS idx_community_members_community ON community_members(community_id, role);
CREATE INDEX IF NOT EXISTS idx_community_members_user ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_community ON community_posts(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_post_likes_post ON community_post_likes(post_id);

-- ===== Waitlist =====

CREATE TABLE IF NOT EXISTS waitlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT,
    phone TEXT,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_phone ON waitlist(phone);

-- ===== Feedback =====

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK(type IN ('bug', 'idea', 'complaint', 'praise')),
  message TEXT NOT NULL,
  page TEXT,
  status TEXT DEFAULT 'new' CHECK(status IN ('new', 'reviewed', 'resolved', 'wontfix')),
  admin_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status, created_at DESC);

-- ===== AI Profile System =====

-- AI Profile: stores extracted insights about each user (permanent memory)
CREATE TABLE IF NOT EXISTS ai_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  running_profile TEXT DEFAULT '{}',
  health_notes TEXT DEFAULT '[]',
  diet_preferences TEXT DEFAULT '[]',
  personal_context TEXT DEFAULT '[]',
  conversation_insights TEXT DEFAULT '[]',
  goals TEXT DEFAULT '[]',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI usage tracking (for token limiting)
CREATE TABLE IF NOT EXISTS ai_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  purpose TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON ai_usage(user_id, created_at);

-- AI check-in responses
CREATE TABLE IF NOT EXISTS ai_checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('pre_run', 'post_run', 'weekly_review')),
  responses TEXT NOT NULL DEFAULT '{}',
  ai_summary TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
