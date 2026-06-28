import math


def estimate_vo2max_from_race(distance_meters: float, time_seconds: float) -> float:
    """Daniels/Gilbert VO2max estimation from race performance."""
    time_minutes = time_seconds / 60
    velocity = distance_meters / time_minutes

    oxygen_cost = -4.60 + 0.182258 * velocity + 0.000104 * velocity * velocity
    percent_max = (
        0.8
        + 0.1894393 * math.exp(-0.012778 * time_minutes)
        + 0.2989558 * math.exp(-0.1932605 * time_minutes)
    )

    if percent_max <= 0:
        return 30.0
    return max(20.0, min(85.0, oxygen_cost / percent_max))


def estimate_vo2max_from_profile(
    age: int,
    gender: str,
    fitness_level: str,
    weight_kg: float,
    height_cm: float,
) -> float:
    """Estimate VO2max from demographic profile when no race data available."""
    bmi = weight_kg / ((height_cm / 100) ** 2)
    gender_factor = 1.0 if gender == "male" else (0.0 if gender == "female" else 0.5)

    fitness_multiplier = {
        "sedentary": 0.7,
        "lightly_active": 0.85,
        "active": 1.0,
        "very_active": 1.15,
    }

    base_vo2 = 50 - (0.3 * age) + (6 * gender_factor)
    bmi_penalty = (bmi - 25) * 0.5 if bmi > 25 else 0
    fitness_mult = fitness_multiplier.get(fitness_level, 0.85)

    return max(20.0, min(75.0, (base_vo2 - bmi_penalty) * fitness_mult))


def estimate_vo2max_from_5k(five_k_minutes: float) -> float:
    """Estimate VO2max from a 5K time in minutes."""
    time_seconds = five_k_minutes * 60
    return estimate_vo2max_from_race(5000, time_seconds)


def get_vo2max_category(vo2max: float, age: int, gender: str) -> str:
    """Categorize VO2max relative to age and gender."""
    gender_offset = -5 if gender == "female" else (-2.5 if gender == "non-binary" else 0)
    adjusted = vo2max - gender_offset
    age_offset = (age - 30) * 0.3 if age > 30 else 0
    score = adjusted + age_offset

    if score >= 55:
        return "Excellent"
    if score >= 47:
        return "Good"
    if score >= 40:
        return "Average"
    if score >= 33:
        return "Below Average"
    return "Poor"
