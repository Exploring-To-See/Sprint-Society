"""Each of the four AI coaches owns a distinct 10-level training cycle.

A "level" (1-10) is the runner's position inside *that coach's* progression.
The cycle is unique to the coach's philosophy: the Scientist runs a lab
protocol, the Energizer climbs an adventure ladder, the Warrior is forged
through ranks, the Sage walks a path through nature. The active coach assesses
the runner, names their level, and guides them upward one level at a time.
"""

COACH_CYCLES = {
    "scientist": {
        "cycle_name": "The Lab Protocol",
        "philosophy": "Progression is engineered. Each level is unlocked by hitting measurable physiological and consistency markers — no level is skipped, every adaptation is earned and verified.",
        "levels": [
            {"n": 1, "name": "Baseline Diagnostics", "focus": "Establish metrics: resting HR, current easy pace, a benchmark time trial. No hard work yet — gather data.", "graduate": "2 weeks of logged runs and a recorded benchmark effort."},
            {"n": 2, "name": "Aerobic Foundation", "focus": "Build the aerobic base. Strict Zone 2 / conversational pace to grow mitochondria and capillary density.", "graduate": "3-4 consistent weeks of easy volume with controlled heart rate."},
            {"n": 3, "name": "Movement Economy", "focus": "Optimize running economy: cadence ~170-180, form drills, 4-6 strides twice weekly.", "graduate": "Stable cadence and relaxed form on easy runs; strides feel smooth."},
            {"n": 4, "name": "Threshold Introduction", "focus": "Introduce lactate-clearance work: short tempo and cruise intervals at controlled effort.", "graduate": "Complete 3 tempo sessions at prescribed effort without fade."},
            {"n": 5, "name": "Capacity Building", "focus": "Progress weekly volume within the 10% rule; build durability and a longer long run.", "graduate": "Reach target weekly volume for 2 weeks with good recovery markers."},
            {"n": 6, "name": "VO2max Development", "focus": "Oxygen-uptake intervals (e.g. 3-5 min reps) with full recovery; sharpen the top end.", "graduate": "Hit interval paces on 3 sessions while recovery metrics stay green."},
            {"n": 7, "name": "Specific Endurance", "focus": "Race-pace specificity: workouts that rehearse goal pace and metabolic demand.", "graduate": "Execute a race-specific simulation at goal effort."},
            {"n": 8, "name": "Load Optimization", "focus": "Periodize and autoregulate: manage ACWR, deloads, and recovery data precisely.", "graduate": "Two clean training blocks with deloads and stable load ratios."},
            {"n": 9, "name": "Peak Engineering", "focus": "Taper design and supercompensation: reduce volume, preserve intensity, model freshness.", "graduate": "Complete a taper and a peak performance or strong tune-up."},
            {"n": 10, "name": "Performance Mastery", "focus": "Self-directed science: autoregulate daily, hunt marginal gains, coach yourself with data.", "graduate": "Sustained self-managed peak performance — the protocol is yours."},
        ],
    },
    "energizer": {
        "cycle_name": "The Adventure Ladder",
        "philosophy": "Progression is a series of joyful wins. Each level is unlocked by showing up and having fun — momentum and identity grow rung by rung, never through drudgery.",
        "levels": [
            {"n": 1, "name": "First Steps", "focus": "Just move and celebrate it! Any run-walk counts. The only goal is to start and smile.", "graduate": "Complete your first 3 sessions — you showed up, that's huge!"},
            {"n": 2, "name": "Habit Spark", "focus": "Light the streak. Run on your scheduled days and stack tiny wins into a routine.", "graduate": "Two weeks of hitting your planned run days."},
            {"n": 3, "name": "Finding Your Flow", "focus": "Discover the joy — easy runs that feel good, favorite routes, your running 'why'.", "graduate": "Finish a run feeling better than when you started, repeatedly."},
            {"n": 4, "name": "Distance Explorer", "focus": "Go a little farther and explore new routes. Adventure over speed.", "graduate": "Comfortably extend your longest run by a meaningful chunk."},
            {"n": 5, "name": "Speed Playground", "focus": "Play with pace! Fartlek games, strides, chasing lampposts — fast feels fun.", "graduate": "Enjoy 3 playful faster sessions."},
            {"n": 6, "name": "Confidence Climb", "focus": "Sustain efforts and believe. You're stronger than you thought.", "graduate": "Hold a steady harder effort and feel proud of it."},
            {"n": 7, "name": "Challenge Seeker", "focus": "Sign up for a fun event or set a shiny target to train toward.", "graduate": "Commit to a real goal/event on the calendar."},
            {"n": 8, "name": "Momentum Master", "focus": "String strong, consistent weeks together — you're rolling now.", "graduate": "A full month of consistent, energized training."},
            {"n": 9, "name": "Breakthrough Mode", "focus": "Chase the big goal with everything — this is your moment to shine.", "graduate": "Crush a goal event or personal milestone."},
            {"n": 10, "name": "Unstoppable", "focus": "Running is who you are. Your energy is infectious — now you inspire others.", "graduate": "You live it and lift others up. Unstoppable!"},
        ],
    },
    "warrior": {
        "cycle_name": "The Forge",
        "philosophy": "Progression is earned through discipline. Each rank is taken by doing the work no matter what — toughness is forged, not given, and every level demands more grit than the last.",
        "levels": [
            {"n": 1, "name": "Recruit", "focus": "Show up. No excuses. Learn to run on schedule regardless of mood.", "graduate": "Complete every planned session for one week."},
            {"n": 2, "name": "Private", "focus": "Consistency under all conditions — rain, cold, tired. Discipline is the mission.", "graduate": "Two weeks, zero missed runs."},
            {"n": 3, "name": "Soldier", "focus": "Embrace the grind. Bank easy mileage and build the engine.", "graduate": "Hold steady weekly mileage with no shortcuts."},
            {"n": 4, "name": "Corporal", "focus": "First hard sessions. Meet discomfort head-on and finish what you start.", "graduate": "Complete 3 hard sessions without quitting early."},
            {"n": 5, "name": "Sergeant", "focus": "Own your training. Total accountability — track it, report it, no soft days.", "graduate": "Self-log every session honestly for 3 weeks."},
            {"n": 6, "name": "Lieutenant", "focus": "Sustained suffering: threshold and tempo work. Stay in the fight when it burns.", "graduate": "Execute prescribed threshold sessions at target effort."},
            {"n": 7, "name": "Captain", "focus": "Execute plans with precision. Hit paces and recovery exactly as ordered.", "graduate": "Nail a full training block to spec."},
            {"n": 8, "name": "Major", "focus": "Peak volume and resilience. Carry the load and recover like a professional.", "graduate": "Survive and adapt to your highest training load."},
            {"n": 9, "name": "Commander", "focus": "Race-ready toughness. Sharpen, taper with discipline, prepare for battle.", "graduate": "Arrive at a race peaked and execute the plan."},
            {"n": 10, "name": "Champion", "focus": "Forged and unbreakable. You set the standard and lead others by example.", "graduate": "Proven mental and physical mastery — you are the example."},
        ],
    },
    "sage": {
        "cycle_name": "The Path",
        "philosophy": "Progression is organic and patient, like nature growing. Each level unfolds in its own season — never rushed, always rooted in listening to the body and trusting the long process.",
        "levels": [
            {"n": 1, "name": "Seed", "focus": "Gentle beginnings. Plant the practice with patience; small, kind, regular movement.", "graduate": "Begin the habit gently over your first couple of weeks."},
            {"n": 2, "name": "Sprout", "focus": "First green shoots — quiet consistency, no force, simply returning to the run.", "graduate": "A steady, unhurried rhythm of easy runs."},
            {"n": 3, "name": "Sapling", "focus": "Grow roots: a calm aerobic base built slowly and surely.", "graduate": "Several weeks of relaxed base building."},
            {"n": 4, "name": "Branch", "focus": "Reach a little. Gently stretch your limits while staying present.", "graduate": "Extend distance with ease and awareness."},
            {"n": 5, "name": "Bloom", "focus": "Flourish — running becomes joyful and mindful, body and breath in harmony.", "graduate": "Find genuine flow and presence on your runs."},
            {"n": 6, "name": "River", "focus": "Flow with sustained, smooth rhythm. Effort without strain.", "graduate": "Hold a steady sustained effort with calm."},
            {"n": 7, "name": "Hill", "focus": "Meet effort with equanimity. Climb the harder work without losing your center.", "graduate": "Face tougher sessions with a quiet mind."},
            {"n": 8, "name": "Forest", "focus": "Depth and accumulated wisdom — greater volume carried with patience.", "graduate": "Sustain higher volume while listening to the body."},
            {"n": 9, "name": "Summit", "focus": "Approach your peak with serenity. Taper, trust, and let fitness ripen.", "graduate": "Arrive at a goal rested, trusting the process."},
            {"n": 10, "name": "Mountain", "focus": "Stillness in motion. Mastery, deep self-knowledge, and the wisdom to guide others.", "graduate": "Embody calm mastery — the path continues, and you light it for others."},
        ],
    },
}

# Map experience tier to a sensible starting level on any coach's cycle.
_TIER_START = {"spark": 1, "pace": 3, "tempo": 6, "apex": 8}


def get_cycle(coach_style: str) -> dict:
    return COACH_CYCLES.get(coach_style, COACH_CYCLES["energizer"])


def get_level(coach_style: str, level: int) -> dict:
    levels = get_cycle(coach_style)["levels"]
    level = max(1, min(10, int(level or 1)))
    return levels[level - 1]


def estimate_starting_level(coach_style: str, profile: dict | None) -> int:
    """Pick an initial level from the runner's tier and 5K, nudged by experience."""
    tier = (profile or {}).get("tier", "pace")
    base = _TIER_START.get(tier, 3)
    exp = (profile or {}).get("running_experience", "beginner")
    if exp == "advanced":
        base += 1
    elif exp == "none":
        base -= 1
    return max(1, min(10, base))


def level_block_for_prompt(coach_style: str, level: int) -> str:
    """Compact block describing the runner's current level + next step."""
    cycle = get_cycle(coach_style)
    level = max(1, min(10, int(level or 1)))
    cur = cycle["levels"][level - 1]
    nxt = cycle["levels"][level] if level < 10 else None
    lines = [
        f"TRAINING CYCLE: {cycle['cycle_name']} (your unique 10-level progression).",
        f"Philosophy: {cycle['philosophy']}",
        f"Runner is at LEVEL {level}/10 — {cur['name']}: {cur['focus']}",
        f"To level up: {cur['graduate']}",
    ]
    if nxt:
        lines.append(f"Next is Level {nxt['n']} — {nxt['name']}: {nxt['focus']}")
    else:
        lines.append("This is the final level — focus on mastery and mentoring.")
    lines.append(
        "Always tell the runner their current level by name, reference the cycle, and "
        "make every session a step toward leveling up. Use set_training_level when they "
        "have clearly met the graduation criteria."
    )
    return "\n".join(lines)
