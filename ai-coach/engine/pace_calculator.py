import math
from engine.vo2max import estimate_vo2max_from_5k, estimate_vo2max_from_profile


def get_age_factor(age: int, gender: str) -> float:
    """Age-grading factor: younger = closer to 1.0, older = lower."""
    base = 1.0
    if age > 30:
        decline_rate = 0.006 if gender == "male" else 0.007
        base -= (age - 30) * decline_rate
    return max(0.6, min(1.0, base))


def get_bmi_adjustment(weight_kg: float, height_cm: float) -> float:
    """BMI-based pace adjustment factor (>1 means slower)."""
    bmi = weight_kg / ((height_cm / 100) ** 2)
    if bmi < 18.5:
        return 1.02
    if bmi <= 24.9:
        return 1.0
    if bmi <= 29.9:
        return 1.08
    if bmi <= 34.9:
        return 1.18
    return 1.30


def get_fitness_multiplier(fitness_level: str) -> float:
    """Fitness level pace multiplier (>1 means slower)."""
    multipliers = {
        "sedentary": 1.25,
        "lightly_active": 1.12,
        "active": 1.0,
        "very_active": 0.92,
    }
    return multipliers.get(fitness_level, 1.0)


# ==============================================================================
# Jack Daniels' physiological quadratic pace solver
# ==============================================================================

def solve_daniels_velocity(vdot: float, percent: float) -> float:
    """
    Solves the Daniels/Gilbert quadratic equation for running velocity (m/min) at a given % VDOT:
    0.000104 * v^2 + 0.182258 * v - (4.60 + percent * vdot) = 0
    """
    vo2_req = vdot * percent
    a = 0.000104
    b = 0.182258
    c = -(4.60 + vo2_req)
    
    disc = (b ** 2) - 4 * a * c
    if disc < 0:
        return 100.0  # safe default fallback velocity
    v = (-b + math.sqrt(disc)) / (2 * a)
    return v


def pace_seconds_from_velocity(v_m_min: float) -> int:
    """Converts m/min velocity to seconds per kilometer."""
    if v_m_min <= 0:
        return 600  # Default 10:00/km
    return round(60000.0 / v_m_min)


def calculate_pace_zones_from_profile(
    age: int,
    gender: str,
    weight_kg: float,
    height_cm: float,
    fitness_level: str,
    tier: str,
) -> dict:
    """Calculate VDOT and pace zones from profile using Jack Daniels equations."""
    # 1. Estimate VDOT based on profile-predicted VO2max
    vo2max_profile = estimate_vo2max_from_profile(age, gender, fitness_level, weight_kg, height_cm)
    
    # Adjust VDOT based on age-grading and running efficiency adjustments
    age_factor = get_age_factor(age, gender)
    bmi_adjust = get_bmi_adjustment(weight_kg, height_cm)
    fitness_mult = get_fitness_multiplier(fitness_level)
    
    # Calculate effective VDOT score
    vdot = vo2max_profile * age_factor * (2.0 - bmi_adjust) * (2.0 - fitness_mult)
    vdot = max(25.0, min(80.0, vdot))

    # 2. Solve velocities at specific Jack Daniels percentages of VDOT
    # Easy: 62% | Tempo: 86% | Interval: 97% | Race/Threshold: 88%
    v_easy = solve_daniels_velocity(vdot, 0.62)
    v_tempo = solve_daniels_velocity(vdot, 0.86)
    v_interval = solve_daniels_velocity(vdot, 0.97)
    v_race = solve_daniels_velocity(vdot, 0.88)

    return {
        "easy_pace_per_km": pace_seconds_from_velocity(v_easy),
        "tempo_pace_per_km": pace_seconds_from_velocity(v_tempo),
        "interval_pace_per_km": pace_seconds_from_velocity(v_interval),
        "race_pace_per_km": pace_seconds_from_velocity(v_race),
        "vo2max_estimate": round(vo2max_profile, 1),
        "vdot": round(vdot, 1)
    }


def calculate_pace_zones_from_5k(five_k_minutes: float) -> dict:
    """Calculate pace zones by solving Jack Daniels' formulas for a known 5K time."""
    time_seconds = five_k_minutes * 60
    vdot = estimate_vo2max_from_5k(five_k_minutes)

    # Solve velocities at Daniels intensities
    v_easy = solve_daniels_velocity(vdot, 0.62)
    v_tempo = solve_daniels_velocity(vdot, 0.86)
    v_interval = solve_daniels_velocity(vdot, 0.97)
    v_race = 5000.0 / (time_seconds / 60.0) # actual race pace

    return {
        "easy_pace_per_km": pace_seconds_from_velocity(v_easy),
        "tempo_pace_per_km": pace_seconds_from_velocity(v_tempo),
        "interval_pace_per_km": pace_seconds_from_velocity(v_interval),
        "race_pace_per_km": pace_seconds_from_velocity(v_race),
        "vo2max_estimate": round(vdot, 1),
        "vdot": round(vdot, 1)
    }


def calculate_pace_zones(profile: dict) -> dict:
    """Main entry: uses 5K time if available, else profile-based estimation."""
    five_k = profile.get("recent_5k_time")
    if five_k and five_k > 0:
        zones = calculate_pace_zones_from_5k(five_k)
    else:
        zones = calculate_pace_zones_from_profile(
            profile.get("age", 25),
            profile.get("gender", "male"),
            profile.get("weight_kg", 70),
            profile.get("height_cm", 170),
            profile.get("fitness_level", "active"),
            profile.get("tier", "pace"),
        )

    zones["formatted"] = {
        "easy": format_pace(zones["easy_pace_per_km"]),
        "tempo": format_pace(zones["tempo_pace_per_km"]),
        "interval": format_pace(zones["interval_pace_per_km"]),
        "race": format_pace(zones["race_pace_per_km"]),
    }
    return zones


def format_pace(seconds_per_km: int) -> str:
    """Format seconds to mm:ss/km string."""
    mins = seconds_per_km // 60
    secs = seconds_per_km % 60
    return f"{mins}:{secs:02d}/km"
