def classify_runner(profile: dict) -> dict:
    """
    Classify runner into Spark/Pace/Tempo/Apex using weighted scoring.
    Ported from Sprint Society's classification engine.
    """
    exp_scores = {"none": 5, "beginner": 25, "intermediate": 60, "advanced": 95}
    exp_score = exp_scores.get(profile.get("running_experience", "beginner"), 25)

    fit_scores = {"sedentary": 10, "lightly_active": 30, "active": 60, "very_active": 90}
    fit_score = fit_scores.get(profile.get("fitness_level", "active"), 30)

    five_k_time = profile.get("recent_5k_time")
    has_5k = five_k_time is not None and five_k_time > 0

    if has_5k:
        minutes = five_k_time
        if minutes <= 16:
            five_k_score = 100
        elif minutes <= 20:
            five_k_score = 85
        elif minutes <= 25:
            five_k_score = 65
        elif minutes <= 30:
            five_k_score = 45
        elif minutes <= 35:
            five_k_score = 30
        elif minutes <= 40:
            five_k_score = 15
        else:
            five_k_score = 5
    else:
        five_k_score = 0

    days = profile.get("training_days", 3)
    days_score = min(100, max(0, (days - 1) * 16.7))

    if not has_5k:
        total = (exp_score * 0.50) + (fit_score * 0.35) + (days_score * 0.15)
    else:
        total = (exp_score * 0.35) + (fit_score * 0.25) + (five_k_score * 0.25) + (days_score * 0.15)

    if total < 25:
        tier = "spark"
    elif total < 50:
        tier = "pace"
    elif total < 75:
        tier = "tempo"
    else:
        tier = "apex"

    return {
        "tier": tier,
        "score": round(total, 1),
        "breakdown": {
            "experience": round(exp_score, 1),
            "fitness": round(fit_score, 1),
            "five_k": round(five_k_score, 1),
            "training_days": round(days_score, 1),
        },
    }
