"""Signal extraction from free-text chat messages using Groq LLM with a rule-based fallback.

Updates the personalization model dynamically on every message.
"""

import re
import json
from openai import OpenAI
import config

INJURY_AREAS = [
    "knee", "ankle", "hip", "back", "shin", "shins", "hamstring", "calf",
    "calves", "achilles", "plantar", "foot", "heel", "groin", "it band",
    "quad", "glute",
]

POSITIVE_WORDS = [
    "great", "amazing", "awesome", "love", "loved", "happy", "excited",
    "strong", "good", "fantastic", "proud", "crushed", "nailed", "pumped",
    "energized", "confident", "fun", "enjoyed", "best",
]

NEGATIVE_WORDS = [
    "tired", "exhausted", "sore", "pain", "hurt", "hurts", "injured", "sad",
    "frustrated", "struggling", "struggle", "hard", "awful", "terrible",
    "worst", "demotivated", "burned out", "burnt out", "anxious", "stressed",
    "discouraged", "quit", "giving up", "can't", "cant",
]

TOPIC_KEYWORDS = {
    "nutrition": ["eat", "fuel", "gel", "carb", "protein", "hydrat", "diet", "nutrition", "calorie"],
    "injury": INJURY_AREAS + ["injury", "injured", "pain", "physio", "rehab"],
    "racing": ["race", "marathon", "half", "10k", "5k", "pr", "personal best", "bib", "start line"],
    "pacing": ["pace", "splits", "tempo", "threshold", "zone", "heart rate", "hr "],
    "recovery": ["rest", "recover", "sleep", "foam roll", "stretch", "deload", "easy day"],
    "motivation": ["motivat", "give up", "quit", "discourag", "mindset", "consistent", "habit"],
    "training_plan": ["plan", "schedule", "week", "long run", "intervals", "workout", "program"],
    "strength": ["strength", "gym", "squat", "lunge", "core", "lift", "weights"],
    "mental": ["nervous", "anxious", "confidence", "fear", "doubt", "visualize", "focus"],
}

GOAL_PATTERNS = [
    r"(?:i\s+)?(want|hope|plan|planning|aim|aiming|going|trying|would like)\s+to\s+(.{6,90}?)(?:[\.,!?]|$)",
    r"(?:my\s+goal\s+is\s+(?:to\s+)?)(.{6,90}?)(?:[\.,!?]|$)",
    r"(?:training|prepping|preparing)\s+for\s+(?:a\s+|the\s+|my\s+)?(.{4,70}?)(?:[\.,!?]|$)",
    r"(?:i\s+(?:want|wanna)\s+to\s+(?:run|do|finish|complete|break))\s+(.{3,70}?)(?:[\.,!?]|$)",
]

ACHIEVEMENT_PATTERNS = [
    r"(?:i\s+)?(?:just\s+)?(?:ran|did|finished|completed|hit|smashed|crushed|nailed)\s+(?:my\s+|a\s+|an\s+)?(.{4,70}?)(?:[\.,!?]|$)",
    r"(?:new\s+)?(?:pr|personal\s+best|personal\s+record|pb)\b(.{0,50})",
    r"(?:first\s+(?:time|ever))\s+(.{4,60}?)(?:[\.,!?]|$)",
]

PREFERENCE_PATTERNS = [
    (r"i\s+(?:prefer|like|love|enjoy)\s+(.{4,60}?)(?:[\.,!?]|$)", "like"),
    (r"i\s+(?:hate|dislike|avoid|can't stand|cant stand|don't like|dont like)\s+(.{4,60}?)(?:[\.,!?]|$)", "dislike"),
]

MILEAGE_PATTERN = re.compile(
    r"(\d+(?:\.\d+)?)\s*(km|kilometre|kilometer|k\b|mi\b|mile|miles)", re.IGNORECASE
)

_CLAUSE_BREAKS = re.compile(r"\s+(?:but|and|because|though|however|so|while|when)\s+", re.IGNORECASE)


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip(" .,!?-")


def _first_clause(text: str) -> str:
    parts = _CLAUSE_BREAKS.split(text, maxsplit=1)
    return _clean(parts[0]) if parts else _clean(text)


def detect_sentiment(text: str) -> str:
    lo = text.lower()
    pos = sum(1 for w in POSITIVE_WORDS if w in lo)
    neg = sum(1 for w in NEGATIVE_WORDS if w in lo)
    if pos > neg:
        return "positive"
    if neg > pos:
        return "negative"
    return "neutral"


def detect_topics(text: str) -> list[str]:
    lo = text.lower()
    found = []
    for topic, kws in TOPIC_KEYWORDS.items():
        if any(kw in lo for kw in kws):
            found.append(topic)
    return found


def detect_injuries(text: str) -> list[str]:
    lo = text.lower()
    hits = []
    for area in INJURY_AREAS:
        if re.search(rf"\b{re.escape(area)}\b", lo):
            if any(p in lo for p in ["pain", "hurt", "sore", "injur", "tight", "stiff", "niggle", "ache"]):
                hits.append(area.replace("shins", "shin").replace("calves", "calf"))
    return sorted(set(hits))


def extract_signals_rule_based(text: str) -> dict:
    """Fallback rule-based extraction using regular expressions."""
    signals = {
        "goals": [],
        "achievements": [],
        "preferences": [],  # list of (kind, value)
        "injuries": [{"area": area, "status": "active"} for area in detect_injuries(text)],
        "topics": detect_topics(text),
        "sentiment": detect_sentiment(text),
        "mileage": [],
    }

    for pat in GOAL_PATTERNS:
        for m in re.findall(pat, text, re.IGNORECASE):
            val = _clean(m if isinstance(m, str) else m[0])
            if len(val) >= 4:
                signals["goals"].append(val)

    for pat in ACHIEVEMENT_PATTERNS:
        for m in re.findall(pat, text, re.IGNORECASE):
            val = _clean(m if isinstance(m, str) else m[0])
            if len(val) >= 3:
                signals["achievements"].append(val)

    for pat, kind in PREFERENCE_PATTERNS:
        for m in re.findall(pat, text, re.IGNORECASE):
            val = _first_clause(m if isinstance(m, str) else m[0])
            if len(val) >= 3:
                signals["preferences"].append({"kind": kind, "value": val})

    for amount, unit in MILEAGE_PATTERN.findall(text):
        try:
            val = float(amount)
        except ValueError:
            continue
        unit = unit.lower()
        km = val * 1.60934 if unit.startswith("mi") else val
        if 0.5 <= km <= 100:
            signals["mileage"].append(round(km, 2))

    return signals


SYSTEM_EXTRACTOR_PROMPT = """
You are an expert running coach assistant. Extract running-related signals from the user message into a clean JSON structure.
Output ONLY a raw JSON block matching this schema:
{
  "goals": ["specific long-term or training goals discussed as strings"],
  "achievements": ["recent completions, PRs, or milestones as strings"],
  "preferences": [{"kind": "like"|"dislike", "value": "what they like/dislike in running"}],
  "injuries": [{"area": "knee"|"ankle"|"hip"|"back"|"shin"|"hamstring"|"calf"|"achilles"|"plantar"|"foot"|"heel"|"groin"|"it band"|"quad"|"glute", "status": "active"|"resolved"}],
  "sentiment": "positive"|"neutral"|"negative",
  "topics": ["nutrition"|"injury"|"racing"|"pacing"|"recovery"|"motivation"|"training_plan"|"strength"|"mental"],
  "mileage": [floats of kilometers mentioned]
}

Guidelines:
1. Negation: If user says "no more shin pain" or "my knee is healed" or "my ankle is fine now", output that injury area with status "resolved".
2. Sentiment: Detect overall tone.
3. Mileage: If miles are mentioned (e.g. "5 miles"), convert to kilometers (e.g. 8.05) and return as a float in the mileage list.
4. Output nothing but raw JSON. No markdown backticks, no comments.
"""


def extract_signals_via_llm(text: str, api_key: str) -> dict:
    """Uses Groq Llama 3.1 8B to extract semantic features from messages in JSON mode."""
    client = OpenAI(api_key=api_key, base_url="https://api.groq.com/openai/v1")
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": SYSTEM_EXTRACTOR_PROMPT},
            {"role": "user", "content": text}
        ],
        response_format={"type": "json_object"},
        temperature=0.0
    )
    return json.loads(response.choices[0].message.content)


def extract_signals(text: str) -> dict:
    """Main signal extraction entry point. Calls LLM if Groq is configured, falls back to Regex."""
    if not text:
        return {}

    api_key = config.get_groq_api_key()
    if api_key and api_key != "gsk_your_key_here":
        try:
            return extract_signals_via_llm(text, api_key)
        except Exception as e:
            # Fallback on API issues
            return extract_signals_rule_based(text)
    
    return extract_signals_rule_based(text)
