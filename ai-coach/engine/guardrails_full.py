"""Complete guardrail system — 8 categories per the runbook.

Categories:
1. Training safety (per-tier volume/intensity limits)
2. Medical / injury (red flags, never diagnose)
3. Nutrition (block dangerous advice, RED-S awareness)
4. Content, scope & fairness (refuse off-topic, bias check)
5. Data privacy & security (PII minimization, consent)
6. Intellectual property (no copyrighted text, attribution)
7. Cost / budget (per-plan caps, model-escalation gate)
8. Output integrity (anti-hallucination, cite sources)

Every recommendation/write passes through check_all_guardrails() before returning.
"""

import json
import re
from dataclasses import dataclass, field


@dataclass
class GuardrailResult:
    passed: bool = True
    blocked: bool = False
    category: str = ""
    warnings: list[str] = field(default_factory=list)
    actions: list[str] = field(default_factory=list)
    replacement_text: str | None = None

    def to_dict(self) -> dict:
        return {
            "passed": self.passed,
            "blocked": self.blocked,
            "category": self.category,
            "warnings": self.warnings,
            "actions": self.actions,
            "replacement_text": self.replacement_text,
        }


# ============================================================
# 1. TRAINING SAFETY
# ============================================================

TIER_LIMITS = {
    "spark": {
        "max_weekly_km": 15,
        "max_single_run_min": 40,
        "max_consecutive_days": 3,
        "min_rest_days_week": 3,
        "max_volume_increase_pct": 10,
        "blocked_intensities": ["intervals", "tempo_runs", "hill_sprints", "fasted_runs", "vo2max"],
        "allowed_intensities": ["easy", "walk_run", "recovery"],
    },
    "pace": {
        "max_weekly_km": 40,
        "max_single_run_min": 75,
        "max_consecutive_days": 4,
        "min_rest_days_week": 2,
        "max_volume_increase_pct": 10,
        "blocked_intensities": ["vo2max_over_1km", "doubles", "altitude_training"],
        "allowed_intensities": ["easy", "tempo", "short_intervals", "long_run", "recovery", "fartlek"],
        "min_hours_between_hard": 48,
    },
    "tempo": {
        "max_weekly_km": 80,
        "max_single_run_min": 150,
        "max_consecutive_days": 5,
        "min_rest_days_week": 1,
        "max_volume_increase_pct": 10,
        "blocked_intensities": [],
        "allowed_intensities": ["all"],
        "mandatory_deload_weeks": 4,
        "min_hours_between_hard": 48,
    },
    "apex": {
        "max_weekly_km": 150,
        "max_single_run_min": 210,
        "max_consecutive_days": 6,
        "min_rest_days_week": 1,
        "max_volume_increase_pct": 10,
        "blocked_intensities": [],
        "allowed_intensities": ["all"],
        "acwr_max": 1.5,
        "acwr_caution": 1.3,
        "strain_ceiling": 800,
    },
}


def check_training_safety(tier: str, recommendation_type: str, details: str, **kwargs) -> GuardrailResult:
    """Category 1: Training safety guardrails."""
    result = GuardrailResult(category="training_safety")
    limits = TIER_LIMITS.get(tier, TIER_LIMITS["pace"])

    weekly_km = kwargs.get("weekly_km")
    volume_increase = kwargs.get("volume_increase_percent")
    intensity_type = kwargs.get("intensity_type")
    consecutive_days = kwargs.get("consecutive_run_days")

    # Volume check
    if weekly_km and weekly_km > limits["max_weekly_km"]:
        result.passed = False
        result.blocked = True
        result.warnings.append(
            f"BLOCKED: {weekly_km}km/week exceeds {tier.upper()} tier limit of {limits['max_weekly_km']}km"
        )
        result.actions.append("Reduce proposed volume to within tier limits")

    # Volume increase check
    if volume_increase and volume_increase > limits["max_volume_increase_pct"]:
        result.passed = False
        result.warnings.append(
            f"Volume increase of {volume_increase}% exceeds safe limit of {limits['max_volume_increase_pct']}%"
        )
        result.actions.append("Limit increase to 10% per week maximum")

    # Intensity check
    if intensity_type and limits["blocked_intensities"]:
        if intensity_type.lower() in [i.lower() for i in limits["blocked_intensities"]]:
            result.passed = False
            result.blocked = True
            result.warnings.append(
                f"BLOCKED: {intensity_type} is not appropriate for {tier.upper()} tier"
            )
            result.actions.append(f"Suggest alternatives: {limits['allowed_intensities']}")

    # Consecutive days
    if consecutive_days and consecutive_days > limits["max_consecutive_days"]:
        result.passed = False
        result.warnings.append(
            f"Running {consecutive_days} consecutive days exceeds {tier.upper()} limit of {limits['max_consecutive_days']}"
        )
        result.actions.append("Insert a rest day")

    return result


# ============================================================
# 2. MEDICAL / INJURY
# ============================================================

RED_FLAG_PATTERNS = [
    (r"chest\s*pain|chest\s*pressure|heart\s*pain", "EMERGENCY: Chest pain during exercise requires immediate medical attention. STOP running and seek emergency care."),
    (r"can'?t\s*breathe|difficulty\s*breathing|breathless\s*at\s*rest", "URGENT: Breathing difficulty at rest or disproportionate to effort needs medical assessment."),
    (r"faint|passed?\s*out|lost\s*conscious|blackout", "URGENT: Fainting during exercise requires medical evaluation before returning to running."),
    (r"sharp\s*(localized|specific|point)\s*pain.*bone|bone\s*pain.*sharp", "CONCERN: Sharp localized bone pain may indicate stress fracture. Stop running and get imaging."),
    (r"numbness|tingling.*leg|leg.*numb", "CONCERN: Numbness/tingling during running needs nerve assessment. Stop and consult a physiotherapist."),
    (r"blood\s*in\s*urine|bloody\s*urine", "CONCERN: Blood in urine after running needs medical assessment."),
    (r"swollen.*hot.*joint|joint.*swollen.*hot", "CONCERN: Hot swollen joint needs medical assessment to rule out infection or acute injury."),
]

MEDICAL_SCOPE_VIOLATIONS = [
    (r"what\s*medication|which\s*drug|prescribe|dosage", "I cannot prescribe medication. Please consult your doctor or pharmacist."),
    (r"diagnos|do\s*i\s*have|is\s*this\s*(?:arthritis|tendinitis|fracture|torn)", "I cannot diagnose medical conditions. Please see a sports medicine professional for assessment."),
    (r"surgery|should\s*i\s*(?:get|have)\s*(?:an?\s*)?(?:operation|procedure)", "Surgical decisions should be made with your orthopedic surgeon, not a coaching AI."),
]


def check_medical_safety(text: str) -> GuardrailResult:
    """Category 2: Medical / injury guardrails."""
    result = GuardrailResult(category="medical_injury")

    text_lower = text.lower()

    # Check red flags
    for pattern, response in RED_FLAG_PATTERNS:
        if re.search(pattern, text_lower):
            result.passed = False
            result.blocked = True
            result.warnings.append(response)
            result.actions.append("Refer to medical professional immediately")
            result.replacement_text = response + "\n\nPlease seek professional medical help. This is beyond coaching scope."
            return result  # Immediate stop on red flags

    # Check scope violations
    for pattern, response in MEDICAL_SCOPE_VIOLATIONS:
        if re.search(pattern, text_lower):
            result.passed = False
            result.warnings.append(response)
            result.actions.append("Redirect to healthcare professional")

    return result


# ============================================================
# 3. NUTRITION
# ============================================================

NUTRITION_BLOCKS = [
    (r"(?:extreme|crash|starvation|zero.?carb)\s*diet", "BLOCKED: Cannot recommend extreme/starvation diets. These are dangerous for athletes."),
    (r"laxative|purging|vomit.*weight", "BLOCKED: Cannot provide advice that promotes disordered eating behaviors. Please consult a specialist."),
    (r"(?:lose|cut).*(?:5|6|7|8|9|10)\+?\s*kg.*(?:1|2)\s*week", "BLOCKED: Rapid weight loss (>0.5kg/week) is dangerous for runners and impairs performance."),
    (r"dnp|clenbuterol|ephedra|eca\s*stack", "BLOCKED: Cannot recommend dangerous weight loss supplements. These can cause death."),
]

REDS_FLAGS = [
    (r"(?:period|menstrual|cycle).*(?:stop|miss|lost|absent|irregular)", "RED-S WARNING: Missed periods + running may indicate Relative Energy Deficiency in Sport. Please see a sports medicine doctor."),
    (r"(?:stress\s*fracture|bone\s*break).*(?:another|again|third|recurring)", "RED-S WARNING: Recurring stress fractures may indicate low energy availability. Please get assessed."),
    (r"(?:always|constantly)\s*(?:cold|tired|sick).*(?:train|run)", "CONCERN: Chronic fatigue + frequent illness during training may indicate under-fueling. Consider seeing a sports dietitian."),
]


def check_nutrition_safety(text: str) -> GuardrailResult:
    """Category 3: Nutrition guardrails."""
    result = GuardrailResult(category="nutrition")

    text_lower = text.lower()

    for pattern, response in NUTRITION_BLOCKS:
        if re.search(pattern, text_lower):
            result.passed = False
            result.blocked = True
            result.warnings.append(response)
            return result

    for pattern, response in REDS_FLAGS:
        if re.search(pattern, text_lower):
            result.warnings.append(response)
            result.actions.append("Recommend professional assessment")

    return result


# ============================================================
# 4. CONTENT, SCOPE & FAIRNESS
# ============================================================

OFF_TOPIC_PATTERNS = [
    (r"(?:invest|stock|crypto|bitcoin|trading)", "I'm your running coach! I can't help with financial topics. What can I help you with for your training?"),
    (r"(?:politic|election|vote|government)", "Let's keep focused on your running. How can I help with your training today?"),
    (r"(?:hack|exploit|password|bypass)", "That's outside my scope. I'm here to help with your running!"),
]

SELF_HARM_PATTERNS = [
    (r"(?:want\s*to\s*(?:die|kill|hurt)\s*my|suicid|end\s*(?:my\s*)?life)", None),
    (r"(?:self.?harm|cutting\s*myself)", None),
]

BIAS_CHECK_TERMS = [
    "men are better", "women can't", "too old to", "too fat to",
    "real runners", "not a real athlete", "just jogging",
]


def check_content_fairness(text: str, response_text: str = "") -> GuardrailResult:
    """Category 4: Content, scope & fairness."""
    result = GuardrailResult(category="content_fairness")

    text_lower = text.lower()

    # Self-harm: immediate crisis response
    for pattern, _ in SELF_HARM_PATTERNS:
        if re.search(pattern, text_lower):
            result.passed = False
            result.blocked = True
            result.replacement_text = (
                "I hear you, and I care about you. Please reach out for support:\n\n"
                "India: Vandrevala Foundation 1860-2662-345 (24/7)\n"
                "India: iCall 9152987821\n"
                "International: Crisis Text Line - text HOME to 741741\n\n"
                "You matter. Running will be here when you're ready."
            )
            return result

    # Off-topic
    for pattern, response in OFF_TOPIC_PATTERNS:
        if re.search(pattern, text_lower):
            result.warnings.append(response)
            result.actions.append("Redirect to running topics")

    # Bias in AI response (check output, not input)
    if response_text:
        resp_lower = response_text.lower()
        for term in BIAS_CHECK_TERMS:
            if term in resp_lower:
                result.passed = False
                result.warnings.append(f"BIAS DETECTED: Response contains potentially biased language: '{term}'")
                result.actions.append("Rephrase without bias/stereotype")

    return result


# ============================================================
# 5. DATA PRIVACY & SECURITY
# ============================================================

PII_PATTERNS = [
    (r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", "email"),
    (r"\b\d{10}\b", "phone_number"),
    (r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b", "card_number"),
    (r"\b(?:passport|aadhaar|pan)\s*(?:number|no|#)?\s*:?\s*\w+", "government_id"),
]


def check_privacy(text: str, context_data: dict = None) -> GuardrailResult:
    """Category 5: Data privacy & security."""
    result = GuardrailResult(category="privacy")

    # Check if PII is being sent to LLM unnecessarily
    if context_data:
        unnecessary_fields = ["email", "phone", "password", "address", "aadhaar", "pan"]
        for field in unnecessary_fields:
            if field in context_data:
                result.warnings.append(f"PII field '{field}' should not be sent to LLM")
                result.actions.append(f"Remove '{field}' from context before LLM call")

    # Check for PII in text that shouldn't be stored
    for pattern, pii_type in PII_PATTERNS:
        if re.search(pattern, text):
            result.warnings.append(f"Detected {pii_type} in text — should not be logged")
            result.actions.append(f"Redact {pii_type} before storing in logs/memory")

    return result


# ============================================================
# 6. INTELLECTUAL PROPERTY
# ============================================================

def check_ip(response_text: str) -> GuardrailResult:
    """Category 6: Intellectual property."""
    result = GuardrailResult(category="intellectual_property")

    # Check for signs of verbatim reproduction
    if len(response_text) > 50:
        # Look for common signs of copy-paste from papers
        academic_markers = [
            "all rights reserved", "copyright", "reprinted with permission",
            "doi:", "published by", "journal of",
        ]
        for marker in academic_markers:
            if marker in response_text.lower():
                result.warnings.append(f"Response may contain copyrighted text (found: '{marker}')")
                result.actions.append("Summarize in own words with attribution instead of verbatim text")

    return result


# ============================================================
# 7. COST / BUDGET
# ============================================================

def check_cost(user_id: int, plan: str, model_requested: str) -> GuardrailResult:
    """Category 7: Cost / budget guardrails."""
    from agent.cost_logger import cost_logger
    from agent.providers import estimate_cost

    result = GuardrailResult(category="cost_budget")
    budget = cost_logger.get_budget(user_id, plan)

    if not budget.can_make_call():
        result.passed = False
        result.blocked = True
        result.warnings.append("Monthly budget or daily cap exhausted")
        result.actions.append("Use rule-based fallback")
        return result

    # Check if requested model is within remaining budget
    est = estimate_cost(model_requested, 1500, 800)
    if est > budget.remaining_usd:
        result.passed = False
        result.warnings.append(f"Model {model_requested} costs ~${est:.5f} but only ${budget.remaining_usd:.5f} remaining")
        result.actions.append("Downgrade to cheaper model or use rule-based")

    return result


# ============================================================
# 8. OUTPUT INTEGRITY (Anti-hallucination)
# ============================================================

INVENTED_PACE_PATTERN = r"(?:run\s*at|pace\s*(?:of|is|should\s*be)|at\s+)\s*(\d+):(\d+)\s*/?\s*km"
CONFIDENCE_PHRASES = [
    "I'm not sure but", "I think maybe", "probably around",
    "approximately", "roughly", "about",
]


def check_output_integrity(response_text: str, tools_used: list[str] = None) -> GuardrailResult:
    """Category 8: Output integrity — anti-hallucination."""
    result = GuardrailResult(category="output_integrity")

    tools_used = tools_used or []

    # Check if pace numbers appear without calculate_pace_zones being called
    pace_mentions = re.findall(INVENTED_PACE_PATTERN, response_text)
    if pace_mentions and "calculate_pace_zones" not in tools_used:
        result.passed = False
        result.warnings.append("INTEGRITY: Pace numbers in response but calculate_pace_zones was NOT called. Paces may be hallucinated.")
        result.actions.append("Re-run with calculate_pace_zones tool to get verified paces")

    # Check for race time predictions without predict_race_time tool
    race_time_pattern = r"(?:predict|estimated?|should\s*run)\s*(?:a\s*)?(?:5K|10K|half|marathon)\s*(?:in|time|of)\s*(\d+)"
    if re.search(race_time_pattern, response_text, re.IGNORECASE) and "predict_race_time" not in tools_used:
        result.warnings.append("Race time prediction without using predict_race_time tool — may be inaccurate")
        result.actions.append("Use predict_race_time tool for verified predictions")

    return result


# ============================================================
# MASTER CHECK — runs all categories
# ============================================================

def check_all_guardrails(
    tier: str,
    user_message: str,
    response_text: str = "",
    recommendation_type: str = "",
    details: str = "",
    tools_used: list[str] = None,
    user_id: int = 0,
    plan: str = "base",
    model: str = "",
    context_data: dict = None,
    **kwargs,
) -> dict:
    """Run ALL guardrail categories and return combined result.

    Returns:
        {
            "passed": bool (all categories passed),
            "blocked": bool (any category hard-blocked),
            "results": [list of category results],
            "replacement_text": str or None (if blocked, use this instead),
            "all_warnings": [combined warnings],
            "all_actions": [combined actions],
        }
    """
    results = []

    # 1. Training safety (if recommending training)
    if recommendation_type:
        r1 = check_training_safety(tier, recommendation_type, details, **kwargs)
        results.append(r1)

    # 2. Medical safety (check user message for red flags)
    r2 = check_medical_safety(user_message)
    results.append(r2)

    # 3. Nutrition safety
    r3 = check_nutrition_safety(user_message)
    results.append(r3)

    # 4. Content & fairness (check both input and output)
    r4 = check_content_fairness(user_message, response_text)
    results.append(r4)

    # 5. Privacy
    r5 = check_privacy(user_message, context_data)
    results.append(r5)

    # 6. IP (check output only)
    if response_text:
        r6 = check_ip(response_text)
        results.append(r6)

    # 7. Cost
    if user_id and model:
        r7 = check_cost(user_id, plan, model)
        results.append(r7)

    # 8. Output integrity
    if response_text:
        r8 = check_output_integrity(response_text, tools_used)
        results.append(r8)

    # Combine
    all_passed = all(r.passed for r in results)
    any_blocked = any(r.blocked for r in results)
    replacement = None
    for r in results:
        if r.replacement_text:
            replacement = r.replacement_text
            break

    all_warnings = []
    all_actions = []
    for r in results:
        all_warnings.extend(r.warnings)
        all_actions.extend(r.actions)

    return {
        "passed": all_passed,
        "blocked": any_blocked,
        "replacement_text": replacement,
        "all_warnings": all_warnings,
        "all_actions": all_actions,
        "categories_checked": len(results),
        "results": [r.to_dict() for r in results],
    }


# ============================================================
# DISCLAIMER (always appended to health-related responses)
# ============================================================

DISCLAIMER = "Note: This is AI coaching guidance, not medical advice. Consult a healthcare professional for medical concerns."

DISCLAIMER_HINDI = "Note: Yeh AI coaching guidance hai, medical advice nahi. Medical concerns ke liye doctor se milein."
