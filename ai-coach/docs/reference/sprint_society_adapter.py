"""Sprint Society Data Adapter — Bridge between AI Coach tools and Sprint Society's Supabase.

When the AI Coach is deployed alongside Sprint Society, it reads user data
from Sprint Society's production tables rather than its internal SQLite.

This adapter provides the same interface as the internal database/auth module
but reads from Supabase via HTTP (supabase-py) or direct PostgreSQL connection.

Configuration:
    SPRINT_SOCIETY_SUPABASE_URL=https://xxx.supabase.co
    SPRINT_SOCIETY_SUPABASE_KEY=service-role-key
    SPRINT_SOCIETY_DATA_SOURCE=supabase  (or "internal" for test mode)
"""

import os
import json
from datetime import datetime, timedelta
from typing import Any

DATA_SOURCE = os.getenv("SPRINT_SOCIETY_DATA_SOURCE", "internal")


def _get_supabase_client():
    """Lazy-init Supabase client."""
    from supabase import create_client
    url = os.getenv("SPRINT_SOCIETY_SUPABASE_URL", "")
    key = os.getenv("SPRINT_SOCIETY_SUPABASE_KEY", "")
    if not url or not key:
        raise RuntimeError("SPRINT_SOCIETY_SUPABASE_URL and KEY required for supabase mode")
    return create_client(url, key)


def get_profile(user_id: int) -> dict | None:
    """Get runner profile from Sprint Society's runner_profiles table."""
    if DATA_SOURCE == "internal":
        from database.auth import get_profile as _internal_get_profile
        return _internal_get_profile(user_id)

    client = _get_supabase_client()
    result = client.table("runner_profiles").select("*").eq("user_id", user_id).single().execute()
    if not result.data:
        return None

    row = result.data
    return {
        "user_id": user_id,
        "tier": row.get("tier", "pace"),
        "age": row.get("age"),
        "gender": row.get("gender"),
        "weight_kg": row.get("weight_kg"),
        "height_cm": row.get("height_cm"),
        "fitness_level": row.get("fitness_level", "active"),
        "running_experience": row.get("running_experience"),
        "dream_race": row.get("dream_race"),
        "training_days": row.get("training_days_per_week", 4),
        "recent_5k_time": row.get("recent_5k_time"),
        "coach_style": row.get("coach_style", "energizer"),
        "injury_history": row.get("injury_history", []),
        "tier_score": row.get("tier_score"),
    }


def get_recent_runs(user_id: int, days: int = 14) -> list[dict]:
    """Get recent activities from Sprint Society's activities table."""
    if DATA_SOURCE == "internal":
        from database.memory import get_recent_runs as _internal
        return _internal(user_id, days)

    client = _get_supabase_client()
    since = (datetime.now() - timedelta(days=days)).isoformat()
    result = (
        client.table("activities")
        .select("*")
        .eq("user_id", user_id)
        .gte("date", since)
        .order("date", desc=True)
        .execute()
    )

    runs = []
    for row in (result.data or []):
        runs.append({
            "date": row.get("date"),
            "distance_km": row.get("distance_km", 0),
            "duration_min": row.get("duration_minutes", 0),
            "pace_per_km": row.get("avg_pace_seconds"),
            "type": row.get("activity_type", "easy"),
            "feel": row.get("perceived_effort"),
            "hr_avg": row.get("avg_heart_rate"),
            "notes": row.get("notes", ""),
        })
    return runs


def get_training_history(user_id: int, weeks: int = 8) -> list[dict]:
    """Get weekly training summaries."""
    if DATA_SOURCE == "internal":
        from database.memory import get_training_history as _internal
        return _internal(user_id, weeks)

    runs = get_recent_runs(user_id, days=weeks * 7)
    weekly_data: dict[str, dict] = {}

    for run in runs:
        date_str = run.get("date", "")[:10]
        try:
            dt = datetime.fromisoformat(date_str)
            week_start = dt - timedelta(days=dt.weekday())
            week_key = week_start.strftime("%Y-%m-%d")
        except (ValueError, TypeError):
            continue

        if week_key not in weekly_data:
            weekly_data[week_key] = {"week_start": week_key, "runs": 0, "total_km": 0, "total_min": 0}
        weekly_data[week_key]["runs"] += 1
        weekly_data[week_key]["total_km"] += run.get("distance_km", 0)
        weekly_data[week_key]["total_min"] += run.get("duration_min", 0)

    return sorted(weekly_data.values(), key=lambda w: w["week_start"], reverse=True)


def get_weekly_load_acwr(user_id: int) -> dict:
    """Calculate ACWR from Sprint Society activities data."""
    runs = get_recent_runs(user_id, days=28)

    today = datetime.now()
    acute_km = sum(
        r.get("distance_km", 0) for r in runs
        if _days_ago(r.get("date", ""), today) <= 7
    )
    chronic_runs = [r for r in runs if _days_ago(r.get("date", ""), today) <= 28]
    chronic_km = sum(r.get("distance_km", 0) for r in chronic_runs) / 4 if chronic_runs else 1

    acwr = round(acute_km / max(chronic_km, 0.1), 2)

    risk = "low"
    if acwr > 1.5:
        risk = "critical"
    elif acwr > 1.3:
        risk = "high"
    elif acwr > 1.1:
        risk = "moderate"

    return {
        "acwr": acwr,
        "acute_km": round(acute_km, 1),
        "chronic_avg_km": round(chronic_km, 1),
        "risk_level": risk,
        "days_of_data": len(runs),
    }


def log_run(user_id: int, run_data: dict) -> dict:
    """Log a run to Sprint Society's activities table."""
    if DATA_SOURCE == "internal":
        return {"logged": True, "source": "internal"}

    client = _get_supabase_client()
    record = {
        "user_id": user_id,
        "date": run_data.get("date", datetime.now().isoformat()),
        "distance_km": run_data.get("distance_km", 0),
        "duration_minutes": run_data.get("duration_min", 0),
        "activity_type": run_data.get("type", "easy"),
        "perceived_effort": run_data.get("feel"),
        "notes": run_data.get("notes", ""),
    }
    result = client.table("activities").insert(record).execute()
    return {"logged": True, "id": result.data[0].get("id") if result.data else None}


def _days_ago(date_str: str, from_date: datetime) -> int:
    """Calculate days between a date string and a reference date."""
    try:
        if isinstance(date_str, str):
            dt = datetime.fromisoformat(date_str[:10])
        else:
            dt = date_str
        return (from_date - dt).days
    except (ValueError, TypeError):
        return 999
