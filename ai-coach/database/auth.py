import bcrypt
import json
from database.models import get_connection


def signup(name: str, email: str, password: str) -> dict | None:
    email_normalized = email.strip().lower() if email else ""
    if not email_normalized:
        return None
    conn = get_connection()
    try:
        # Check uniqueness case-insensitively
        existing = conn.execute(
            "SELECT id FROM users WHERE LOWER(email) = ?", (email_normalized,)
        ).fetchone()
        if existing:
            return None

        password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        cursor = conn.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
            (name, email_normalized, password_hash),
        )
        conn.commit()
        user_id = cursor.lastrowid
        return {"id": user_id, "name": name, "email": email_normalized}
    except Exception:
        return None
    finally:
        conn.close()


def login(email: str, password: str) -> dict | None:
    email_normalized = email.strip().lower() if email else ""
    if not email_normalized:
        return None
    conn = get_connection()
    row = conn.execute("SELECT * FROM users WHERE LOWER(email) = ?", (email_normalized,)).fetchone()
    conn.close()
    if row is None:
        return None
    if bcrypt.checkpw(password.encode(), row["password_hash"].encode()):
        return {"id": row["id"], "name": row["name"], "email": row["email"]}
    return None


def save_profile(user_id: int, profile_data: dict) -> bool:
    conn = get_connection()
    try:
        existing = conn.execute(
            "SELECT id FROM profiles WHERE user_id = ?", (user_id,)
        ).fetchone()

        injury_history = json.dumps(profile_data.get("injury_history", []))

        if existing:
            conn.execute(
                """UPDATE profiles SET
                    gender=?, age=?, height_cm=?, weight_kg=?,
                    fitness_level=?, running_experience=?, dream_race=?,
                    running_why=?, preferred_time=?, training_days=?,
                    bad_run_response=?, recent_5k_time=?, coach_style=?,
                    injury_history=?, tier=?, tier_score=?, profiling_complete=1
                WHERE user_id=?""",
                (
                    profile_data["gender"],
                    profile_data["age"],
                    profile_data["height_cm"],
                    profile_data["weight_kg"],
                    profile_data["fitness_level"],
                    profile_data["running_experience"],
                    profile_data.get("dream_race", "5K"),
                    profile_data.get("running_why", "health"),
                    profile_data.get("preferred_time", "morning"),
                    profile_data.get("training_days", 3),
                    profile_data.get("bad_run_response", "analyze"),
                    profile_data.get("recent_5k_time"),
                    profile_data.get("coach_style", "energizer"),
                    injury_history,
                    profile_data.get("tier", "spark"),
                    profile_data.get("tier_score", 0),
                    user_id,
                ),
            )
        else:
            conn.execute(
                """INSERT INTO profiles (
                    user_id, gender, age, height_cm, weight_kg,
                    fitness_level, running_experience, dream_race,
                    running_why, preferred_time, training_days,
                    bad_run_response, recent_5k_time, coach_style,
                    injury_history, tier, tier_score, profiling_complete
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)""",
                (
                    user_id,
                    profile_data["gender"],
                    profile_data["age"],
                    profile_data["height_cm"],
                    profile_data["weight_kg"],
                    profile_data["fitness_level"],
                    profile_data["running_experience"],
                    profile_data.get("dream_race", "5K"),
                    profile_data.get("running_why", "health"),
                    profile_data.get("preferred_time", "morning"),
                    profile_data.get("training_days", 3),
                    profile_data.get("bad_run_response", "analyze"),
                    profile_data.get("recent_5k_time"),
                    profile_data.get("coach_style", "energizer"),
                    injury_history,
                    profile_data.get("tier", "spark"),
                    profile_data.get("tier_score", 0),
                ),
            )

        conn.commit()
        return True
    except Exception as e:
        print(f"Error saving profile: {e}")
        return False
    finally:
        conn.close()


def get_profile(user_id: int) -> dict | None:
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM profiles WHERE user_id = ?", (user_id,)
    ).fetchone()
    conn.close()
    if row is None:
        return None
    profile = dict(row)
    profile["injury_history"] = json.loads(profile.get("injury_history", "[]"))
    return profile


def is_profiling_complete(user_id: int) -> bool:
    conn = get_connection()
    row = conn.execute(
        "SELECT profiling_complete FROM profiles WHERE user_id = ?", (user_id,)
    ).fetchone()
    conn.close()
    return row is not None and row["profiling_complete"] == 1
