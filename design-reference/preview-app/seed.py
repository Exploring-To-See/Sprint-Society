"""
Seed data for the Sprint Society local preview.
Realistic, self-consistent sample data shaped to match the REAL frontend's
expected response fields (mapped from the Express routes on origin/main).
No business logic — just believable content so every page populates and the
whole app can be clicked through. In-memory; resets on restart.
"""

# ---- The signed-in demo runner --------------------------------------------
USER = {
    "id": 1,
    "name": "Ishan Vashistha",
    "email": "ishan@sprintsociety.in",
    "profile_image_url": None,       # falls back to initials "IV"
    "initials": "IV",
    "city": "Ahmedabad",
    "joined": "Jan 2026",
    "lifetime_km": 186,
}

# ---- Gamification / XP -----------------------------------------------------
XP = {
    "current_level": 4,
    "current_xp": 380,
    "xp_to_next_level": 120,
    "level_progress_percent": 76,
    "current_streak_days": 3,
    "total_xp": 1380,
}

TIER = {"tier": "intermediate", "vo2max": 48.6, "vdot": 42.1, "age_grade": 62}

# ---- Run stats + recent runs ----------------------------------------------
RUN_STATS = {
    "total_runs": 24,
    "total_distance": 186000,   # meters
    "best_pace": 292,           # sec/km -> 4:52
    "total_time_seconds": 82800,
}

RECENT_RUNS = [
    {"id": 101, "title": "Easy shakeout",     "distance_km": 6.2,  "pace": "7:38", "when": "Today",     "duration": "47m", "pr": True,  "type": "easy"},
    {"id": 102, "title": "Recovery jog",      "distance_km": 5.0,  "pace": "8:02", "when": "Yesterday", "duration": "40m", "pr": False, "type": "recovery"},
    {"id": 103, "title": "Weekend long run",  "distance_km": 10.4, "pace": "8:15", "when": "Sat",       "duration": "86m", "pr": False, "type": "long"},
    {"id": 104, "title": "Tempo Tuesday",     "distance_km": 8.0,  "pace": "6:40", "when": "Tue",       "duration": "53m", "pr": False, "type": "tempo"},
    {"id": 105, "title": "Fartlek intervals", "distance_km": 7.2,  "pace": "6:58", "when": "Mon",       "duration": "50m", "pr": False, "type": "intervals"},
]

# ---- Today's session / training plan --------------------------------------
TODAY_SESSION = {
    "phase": "Base phase", "week": 4, "total_weeks": 16,
    "title": "Long Run — 5 km",
    "sub": "Conversational · bank base for Sub-270",
    "target_pace": "7:50", "distance_km": 5.0, "rpe": 4,
    "readiness": 78, "readiness_label": "Primed",
}

# ---- Readiness / training --------------------------------------------------
READINESS = {"score": 78, "label": "Primed", "hrv": 62, "resting_hr": 52, "sleep": 7.4, "load": "optimal"}

PACE_ZONES = {"easy_min": "6:15", "easy_max": "6:45", "easy_pace_s": 390}

# pace trend (sec/km) most-recent last, for the sparkline
PACE_TREND = [504, 498, 492, 486, 480, 474, 470, 466, 462, 458, 470, 458]
PACE_TARGET_S = 458  # 7:38

# ---- Challenges ------------------------------------------------------------
CHALLENGES = [
    {"id": 1, "title": "Hydration streak", "category": "Hydration", "xp": 40, "progress": 5, "goal": 7, "done": False},
    {"id": 2, "title": "Core circuit x3",  "category": "Bodyweight","xp": 25, "progress": 3, "goal": 3, "done": True},
    {"id": 3, "title": "Cadence 170+ spm", "category": "Technique", "xp": 30, "progress": 2, "goal": 3, "done": False, "auto": True},
]

# ---- Social feed -----------------------------------------------------------
FEED = [
    {"id": 1, "user_id": 2, "user_name": "Priya S", "initials": "PS", "avatar_hue": "orange",
     "time_ago": "2h ago", "streak_days": 12, "distance_km": 8.4, "pace": "5:32", "time": "46:28",
     "caption": "Dawn tempo along the Sabarmati — legs felt springy, negative-split the back 3 km. On track for the 10K.",
     "kudos_count": 28, "comment_count": 4, "tag": None},
    {"id": 2, "user_id": 3, "user_name": "Arjun M", "initials": "AM", "avatar_hue": "orange",
     "time_ago": "5h ago", "streak_days": 0, "distance_km": 5.0, "pace": "4:38", "time": "23:10",
     "caption": "", "kudos_count": 41, "comment_count": 9, "tag": "TEMPO", "pr": True},
    {"id": 3, "user_id": 1, "user_name": "Ishan V", "initials": "IV", "avatar_hue": "violet",
     "time_ago": "yesterday", "streak_days": 3, "distance_km": 5.0, "pace": "8:02", "time": "40:10",
     "caption": "Easy recovery jog after the weekend long run. Kept it conversational — banking base for Sub-270.",
     "kudos_count": 16, "comment_count": 2, "tag": None},
]

# ---- Communities -----------------------------------------------------------
COMMUNITIES_JOINED = [
    {"id": 1, "name": "Ahmedabad Sunrise Runners", "member_count": 1284, "icon": "run",  "new_count": 3},
    {"id": 2, "name": "Sub-270 Marathon Prep",     "member_count": 642,  "icon": "chart","new_count": 0},
]
COMMUNITIES_DISCOVER = [
    {"id": 3, "name": "Riverfront 5K Club",     "member_count": 410, "icon": "run"},
    {"id": 4, "name": "Trail & Hills Ahmedabad","member_count": 288, "icon": "mountain"},
    {"id": 5, "name": "Speedwork Saturdays",    "member_count": 176, "icon": "bolt"},
]

# ---- Events ----------------------------------------------------------------
EVENTS = [
    {"id": 1, "title": "Sabarmati Sunrise 10K", "date": "Sun, 6 Jul", "time": "5:45 AM",
     "location": "Sabarmati Riverfront", "distance_km": 10, "rsvp": True, "attendees": 84,
     "status": "upcoming", "host": "Ahmedabad Sunrise Runners"},
    {"id": 2, "title": "Tempo Tuesday Track", "date": "Tue, 8 Jul", "time": "6:00 AM",
     "location": "Sardar Patel Stadium", "distance_km": 6, "rsvp": False, "attendees": 32,
     "status": "upcoming", "host": "Speedwork Saturdays"},
    {"id": 3, "title": "Monsoon Long Run", "date": "Sat, 12 Jul", "time": "6:15 AM",
     "location": "Science City Road", "distance_km": 18, "rsvp": False, "attendees": 56,
     "status": "upcoming", "host": "Sub-270 Marathon Prep"},
]

# ---- Progress / journey ----------------------------------------------------
PROGRESS_WEEKLY = [
    {"week": "W1", "km": 22, "target": 25}, {"week": "W2", "km": 28, "target": 28},
    {"week": "W3", "km": 31, "target": 30}, {"week": "W4", "km": 26, "target": 34},
]
JOURNEY = {
    "phase": "Base phase", "week": 4, "total_weeks": 16, "goal": "Sub-2:70 half marathon",
    "improvement_pct": 8, "start_pace": "8:24", "current_pace": "7:38",
}

# ---- Heart-rate zones (already-redesigned page; included for completeness) --
HR_ZONES = [
    {"zone": "Z1", "label": "Recovery", "min": 98,  "max": 117, "pct": 12, "color": "green"},
    {"zone": "Z2", "label": "Easy",     "min": 118, "max": 137, "pct": 46, "color": "green"},
    {"zone": "Z3", "label": "Aerobic",  "min": 138, "max": 156, "pct": 28, "color": "amber"},
    {"zone": "Z4", "label": "Threshold","min": 157, "max": 175, "pct": 11, "color": "orange"},
    {"zone": "Z5", "label": "Max",      "min": 176, "max": 195, "pct": 3,  "color": "orange"},
]

# ---- Records ---------------------------------------------------------------
RECORDS = [
    {"distance": "1 km",  "time": "4:52",  "when": "2 weeks ago", "pr": True},
    {"distance": "5 km",  "time": "26:40", "when": "last month",  "pr": True},
    {"distance": "10 km", "time": "58:12", "when": "6 weeks ago", "pr": False},
    {"distance": "Longest","time": "18.2 km","when": "Apr 2026",  "pr": False},
]

# ---- Rewards / Kendu coins -------------------------------------------------
KENDU = {"balance": 340, "rank": 12, "this_week": 65}
KENDU_OFFERS = [
    {"id": 1, "title": "Free race entry — Sabarmati 10K", "cost": 500, "brand": "Sunrise Runners"},
    {"id": 2, "title": "20% off Kendu running tee",       "cost": 200, "brand": "Kendu Store"},
    {"id": 3, "title": "AI deep-dive analysis",           "cost": 120, "brand": "Sprint Society"},
]

# ---- Notifications ---------------------------------------------------------
NOTIFICATIONS = [
    {"id": 1, "type": "kudos",   "text": "Priya S and 4 others gave you kudos", "when": "1h ago",  "read": False},
    {"id": 2, "type": "event",   "text": "Sabarmati Sunrise 10K starts in 2 days", "when": "3h ago", "read": False},
    {"id": 3, "type": "coach",   "text": "Your readiness is Primed — good day for the long run", "when": "5h ago", "read": True},
    {"id": 4, "type": "level",   "text": "You reached Level 4!", "when": "yesterday", "read": True},
]
UNREAD_COUNT = 3

# ---- Subscription ----------------------------------------------------------
SUBSCRIPTION = {"status": "active", "plan": "Pro", "price": "₹99/mo", "renews": "1 Aug 2026"}
SUB_PLANS = [
    {"id": "free", "name": "Free",  "price": "₹0",     "features": ["Run tracking", "Basic stats", "Community feed"]},
    {"id": "lite", "name": "Lite",  "price": "₹19/mo", "features": ["Everything in Free", "AI daily insight", "Pace zones"]},
    {"id": "pro",  "name": "Pro",   "price": "₹99/mo", "features": ["Everything in Lite", "Full AI coach", "Adaptive plan", "HR analysis"], "current": True},
]

# ---- AI coach cluster ------------------------------------------------------
COACH_CHAT = [
    {"role": "coach", "text": "Morning, Ishan. Readiness is 78 — Primed. Today's a long run, keep it conversational at 7:50/km."},
    {"role": "user",  "text": "My left calf felt a bit tight yesterday."},
    {"role": "coach", "text": "Noted. Add 5 min of easy walking before you start and drop the pace 10s/km if it flares. We're banking base, not chasing splits today."},
]
COACH_INSIGHTS = {
    "readiness": 78, "label": "Primed", "predicted_5k": "26:10",
    "load_7d": "optimal", "hrv_trend": "+4%", "sleep": 7.4,
}

# ---- AI profiling / DNA ----------------------------------------------------
PROFILING_DNA = {
    "tier": "intermediate", "vo2max": 48.6,
    "strengths": ["Aerobic endurance", "Pacing discipline"],
    "focus": ["Top-end speed", "Cadence"],
    "archetype": "Steady Diesel",
}

# ---- Goals -----------------------------------------------------------------
GOALS = [
    {"id": 1, "title": "Sub-2:70 half marathon", "target_date": "Nov 2026", "progress": 42, "primary": True},
    {"id": 2, "title": "Run 4x per week",        "target_date": "ongoing",  "progress": 75, "primary": False},
]

# ---- Admin (light) ---------------------------------------------------------
ADMIN_STATS = {"runners": 1284, "runs_today": 96, "events_live": 2, "communities": 18}
