"""The coach's WORDS for the one-way (Rs.9) plan - every spoken response, for
all four personas.

Why templates and not live LLM generation during a run:
  * Latency - a during-run cue must be instant; a network LLM call is not.
  * Safety/grounding - templates are filled ONLY with numbers the engines
    computed (pace, distance, HR), so the coach can never invent a figure. This
    is the literal "engines do math, the LLM does words" rule, taken to its safe
    extreme for the highest-stakes, real-time surface.
  * Reliability - it works with no API key, offline, every time.
Google Maps' turn-by-turn voice is templated for exactly these reasons; so is this.

Each (trigger x persona) has several phrasings; the renderer rotates through them
so a runner hearing many cues never hears the same sentence twice in a row - a
small thing that matters a lot for "don't irritate the user".

The longer PRE-RUN brief and POST-RUN inference live here too, so 100% of the
coach's wording is in one auditable file (easy to review for tone and safety).
"""

from __future__ import annotations

from typing import Optional

from engine import run_cues as rc


# --------------------------------------------------------------------------- #
# During-run cue templates. Slots in {curly_braces} are filled from the cue
# payload (all engine-computed numbers). Keep each line ~8-15 words, imperative,
# and NEVER a question that expects an answer (this is one-way).
# --------------------------------------------------------------------------- #
CUE_TEMPLATES = {
    rc.CUE_RUN_START: {
        "scientist": [
            "Starting now. Hold {target_pace}. Let the heart rate rise gradually, no surges.",
            "Begin controlled at {target_pace}. First kilometre is calibration, not performance.",
        ],
        "energizer": [
            "Here we go! Ease in nice and smooth, find your rhythm. You've got this!",
            "And we're off! Relax the shoulders, settle in - this is your time!",
        ],
        "warrior": [
            "Mission start. Controlled and deliberate. Lock onto {target_pace}. Execute.",
            "Begin. No hero starts. Discipline first - {target_pace}, hold the line.",
        ],
        "sage": [
            "Begin gently. The first kilometre simply wakes the body. Breathe and relax.",
            "Ease into it. No rush. Let the rhythm find you, not the other way around.",
        ],
    },
    rc.CUE_KM_MILESTONE: {
        "scientist": [
            "{km_done} km logged at {avg_pace} average. Metrics are steady - maintain.",
            "Kilometre {km_done} complete. Average {avg_pace}. Cadence and effort look efficient.",
        ],
        "energizer": [
            "{km_done} km down and looking strong! {avg_pace} average - keep that energy!",
            "Boom, {km_done} km! You're cruising at {avg_pace}. Love it, keep rolling!",
        ],
        "warrior": [
            "{km_done} kilometres banked. {avg_pace}. Keep grinding, no let-up.",
            "{km_done} km done. Holding {avg_pace}. Stay sharp, stay on it.",
        ],
        "sage": [
            "{km_done} km, flowing at {avg_pace}. Steady miles build the runner. Stay present.",
            "Another kilometre behind you - {km_done} now. Smooth and patient at {avg_pace}.",
        ],
    },
    rc.CUE_HALFWAY: {
        "scientist": [
            "Halfway. {km_left} km remaining. Pacing is on plan - execute the second half evenly.",
            "Midpoint reached. The back half is where even-pacing pays off. Hold form.",
        ],
        "energizer": [
            "Halfway there - and you feel great! {km_left} km to go, you're owning this!",
            "Halfway! The hard part's behind you in your head. {km_left} km of fun left!",
        ],
        "warrior": [
            "Halfway. This is where it's won. {km_left} km. Dig in and hold standard.",
            "Midpoint. Second half separates the disciplined. {km_left} km. Drive.",
        ],
        "sage": [
            "The midpoint. {km_left} km remain. Stay with your breath; the miles will come.",
            "Halfway home. No urgency. Let the second half unfold as patiently as the first.",
        ],
    },
    rc.CUE_SETTLE_PACE: {
        "scientist": [
            "About {pace_delta_abs}s/km fast. Ease back toward {target_pace} to protect the finish.",
            "You're ahead of target pace. Dial back to {target_pace} - bank energy, not seconds.",
            "Pace is hot. Settle to {target_pace}; the even effort wins this run.",
        ],
        "energizer": [
            "Whoa, flying a bit! Reel it back to {target_pace} so you finish strong and happy!",
            "Easy tiger - that's quick! Settle to {target_pace}, save that fire for later!",
            "Loving the energy - just ease to {target_pace} so it lasts the whole way!",
        ],
        "warrior": [
            "Too hot. Rein it in to {target_pace}. Discipline now, glory later.",
            "Slow the start. {target_pace} is the order. Don't burn the mission early.",
            "Check the pace. Back to {target_pace}. Control wins, not bravado.",
        ],
        "sage": [
            "Gently - you're rushing. Drift back to {target_pace}. Patience is your ally today.",
            "Ease the pace toward {target_pace}. The eager start fades; the steady one endures.",
            "No need to hurry. Float back to {target_pace} and let the run come to you.",
        ],
    },
    rc.CUE_HOLD_PACE: {
        "scientist": [
            "Effort is climbing. Relax shoulders, drop the jaw, hold {target_pace} efficiently.",
            "Heart rate drifting up. Same pace, less tension - breathe deep and steady.",
            "Cardiac drift is normal here. Stay relaxed; the pace is fine, the tension isn't.",
        ],
        "energizer": [
            "Effort's creeping up - shake out those arms, stay loose, you're still strong!",
            "Stay smooth! Relax the shoulders, easy breaths, keep that rhythm rolling!",
            "Loosen up and breathe easy - you're working, but you're in control!",
        ],
        "warrior": [
            "Tension rising. Control it. Loosen the shoulders, hold form, stay on pace.",
            "Effort up - own it. Relax, breathe, execute. No wasted energy.",
            "Stay composed. Drop the tension, keep the pace. Master the effort.",
        ],
        "sage": [
            "The effort rises. Soften your body, lengthen the breath, let the pace stay.",
            "Notice the tension and release it. Calm shoulders, calm mind, steady miles.",
            "Breath in, breath out. The effort is just weather; let it pass through you.",
        ],
    },
    rc.CUE_SUPPORT_FADE: {
        "scientist": [
            "Pace slipped ~{pace_delta_abs}s/km. Shorten stride, lift cadence slightly - efficiency over force.",
            "Fatigue showing. Quick light steps, drive the arms - that recovers pace cheaply.",
            "Form first now: tall posture, relaxed hands, faster turnover. Reclaim the rhythm.",
        ],
        "energizer": [
            "Legs are talking - that's normal! Short quick steps, pump those arms, stay tough!",
            "Dig in, friend! Lighten the stride, smile it out - you've got more than you think!",
            "This is where heroes are made! Quick feet, big heart - keep that engine going!",
        ],
        "warrior": [
            "You're fading. Shorten stride, drive the arms, hold the line. Finish what you started.",
            "This is the test. Quick feet, strong arms. Refuse to slow. Push through.",
            "Adversity is the point. Tighten form, hold pace, do not yield.",
        ],
        "sage": [
            "The body tires - that's the journey. Small light steps, steady breath. Stay with it.",
            "Fatigue is a passing season. Shorten the stride, soften the mind, keep moving.",
            "Meet the tiredness gently. Light feet, calm breath - the finish is closer than it feels.",
        ],
    },
    rc.CUE_WALL_SUPPORT: {
        "scientist": [
            "Glycogen territory. Shorten stride, steady breathing, small fuel sip if you have it.",
            "Deep fatigue zone. One minute at a time. Maintain cadence, not force.",
            "Energy is low now. Relax the effort, keep turnover light, stay patient.",
        ],
        "energizer": [
            "This is the legendary part - one block at a time, you're so close!",
            "The wall's just a story you rewrite! Small steps, big heart, keep going!",
            "You're in the deep end now - and you're still moving. That's heroic!",
        ],
        "warrior": [
            "The wall. This is who you are now. One minute at a time.",
            "Pain is information, not a command. Shorten stride, breathe, advance.",
            "This is the forge. Hold your form, keep moving, do not stop.",
        ],
        "sage": [
            "The hardest stretch teaches the most. One breath, one step.",
            "Here the mountain steepens. Slow, steady, patient. Keep walking the path.",
            "Tiredness is a passing season. Light feet, calm breath, stay with it.",
        ],
    },
    # Safety cue: persona only softens the TONE - the instruction (ease off) is
    # identical and non-negotiable across all four.
    rc.CUE_HR_SAFETY: {
        "scientist": [
            "Heart rate very high. Ease to a walk and let it recover.",
            "Still redlining. Slow down now; let the heart rate come back.",
            "Effort is too high. Back off to a jog and recover.",
        ],
        "energizer": [
            "Heart's redlining - let's protect you. Ease to a walk now.",
            "Still too high! Slow it right down and let it settle.",
            "Take care of yourself - gentle walk, let that heart recover.",
        ],
        "warrior": [
            "Heart rate too high. Back off now. Smart runners protect the body.",
            "Still redlining. Ease down - this is discipline, not weakness.",
            "Too hard. Walk it down and let the heart recover.",
        ],
        "sage": [
            "Your heart works too hard. Slow to a walk and breathe.",
            "Still too high. Ease back gently; let it settle.",
            "Honour the body - slow down and let the heart calm.",
        ],
    },
    rc.CUE_FINAL_PUSH: {
        "scientist": [
            "{km_left} km left. If reserves allow, lift effort gradually - controlled negative split.",
            "Closing stretch. Increase turnover slightly, hold form - finish faster than you started.",
        ],
        "energizer": [
            "Final push! {km_left} km - empty the tank, this is your victory lap, GO!",
            "Bring it home! {km_left} to go, you've EARNED this finish - light it up!",
        ],
        "warrior": [
            "Final push. {km_left} km. Everything you've got, now. Leave nothing behind.",
            "This is the finish. {km_left} to go. Attack it. Earn the line.",
        ],
        "sage": [
            "The path nears its end. {km_left} km. Run them with gratitude and quiet strength.",
            "Final stretch. {km_left} km left. Give what remains, calmly and fully.",
        ],
    },
    rc.CUE_FINISH: {
        "scientist": [
            "Run complete: {km_done} km at {avg_pace}. Data captured - analysis to follow. Well executed.",
        ],
        "energizer": [
            "YOU DID IT! {km_done} km at {avg_pace} - incredible work, soak it in!",
        ],
        "warrior": [
            "Done. {km_done} km, {avg_pace}. Mission accomplished. That's who you are.",
        ],
        "sage": [
            "Complete. {km_done} km at {avg_pace}. Honour the effort. Now recover well.",
        ],
    },
}


_GENERIC_FALLBACK = {
    rc.CUE_RUN_START: "Starting now - ease in and find a comfortable, steady rhythm.",
    rc.CUE_KM_MILESTONE: "{km_done} km done. Keep it steady.",
    rc.CUE_HALFWAY: "Halfway there. Stay smooth and even.",
    rc.CUE_SETTLE_PACE: "Ease the pace back a little - settle into a sustainable effort.",
    rc.CUE_HOLD_PACE: "Effort climbing - relax, breathe, and hold your form.",
    rc.CUE_SUPPORT_FADE: "Pace easing off - shorten your stride and drive your arms.",
    rc.CUE_WALL_SUPPORT: "Tough stretch - one minute at a time, keep moving.",
    rc.CUE_HR_SAFETY: "Heart rate very high - ease to a walk and let it recover.",
    rc.CUE_FINAL_PUSH: "Final stretch - bring it home with what you've got left.",
    rc.CUE_FINISH: "Run complete. Strong work - recover well.",
}


def _safe_format(template: str, data: dict) -> Optional[str]:
    """Format a template, but return None if any referenced slot is missing or
    None - so the renderer can fall back to a phrasing that needs fewer numbers.
    This is how a cue degrades gracefully when (say) HR or target pace is absent,
    instead of printing 'None' or crashing."""
    view = dict(data)
    if view.get("pace_delta_s") is not None:
        view["pace_delta_abs"] = abs(int(round(view["pace_delta_s"])))
    try:
        out = template.format(**view)
    except (KeyError, ValueError):
        return None
    if "None" in out:
        return None
    return out


def render_cue(event: "rc.CueEvent", persona: str) -> str:
    """Turn a CueEvent into the persona's spoken line.

    Deterministic: the variant is chosen from the event time so a sequence of
    cues rotates phrasings without randomness (reproducible for tests/eval).
    """
    persona = persona if persona in ("scientist", "energizer", "warrior", "sage") else "energizer"
    variants = CUE_TEMPLATES.get(event.trigger, {}).get(persona, [])
    if variants:
        # Rotate by how many times this trigger has fired (set by the planner),
        # so repeated nudges cycle phrasings instead of repeating verbatim.
        start = int(event.payload.get("variant", int(event.t_s))) % len(variants)
        order = variants[start:] + variants[:start]
        for tmpl in order:
            rendered = _safe_format(tmpl, event.payload)
            if rendered:
                return rendered
    # Fall back to a number-light generic line (still persona-neutral but safe).
    fallback = _GENERIC_FALLBACK.get(event.trigger, "Keep going - steady and strong.")
    return _safe_format(fallback, event.payload) or fallback.replace("{km_done}", "").strip()


# --------------------------------------------------------------------------- #
# PRE-RUN brief (longer, spoken/displayed before the run starts)
# --------------------------------------------------------------------------- #
_PRE_RUN = {
    "scientist": (
        "Today: {type_label}, target {target_km} km at {target_pace}. "
        "Plan your splits evenly - the goal is a controlled, repeatable effort. "
        "Warm up easy for the first kilometre and let the heart rate rise gradually."
    ),
    "energizer": (
        "Today's adventure: {type_label}, {target_km} km at {target_pace}! "
        "Start easy, settle into your groove, and enjoy every step. "
        "Trust your training - you're ready for this. Let's make it a great one!"
    ),
    "warrior": (
        "Mission: {type_label}. {target_km} km at {target_pace}. "
        "Controlled start, even effort, strong finish. No hero pacing in the first kilometre. "
        "Execute the plan with discipline."
    ),
    "sage": (
        "Today you'll run a {type_label} - {target_km} km around {target_pace}. "
        "Begin gently, stay present with your breath, and let the rhythm carry you. "
        "There's no need to chase; the miles will come."
    ),
}

_TYPE_LABEL = {
    "easy": "easy aerobic run",
    "long": "long endurance run",
    "tempo": "tempo run",
    "intervals": "interval session",
    "race": "race effort",
}


def pre_run_brief_text(data: dict, persona: str) -> str:
    persona = persona if persona in _PRE_RUN else "energizer"
    view = dict(data)
    view["type_label"] = _TYPE_LABEL.get(data.get("type"), "run")
    out = _safe_format(_PRE_RUN[persona], view)
    if out:
        return out
    # graceful, number-light fallback
    return f"Today's session is an {view['type_label']}. Start easy, stay relaxed, and run a steady, even effort."


# --------------------------------------------------------------------------- #
# POST-RUN inference (grounded narrative built from run_analysis numbers)
# --------------------------------------------------------------------------- #
_POST_HEADER = {
    "scientist": "Run analysis",
    "energizer": "Run recap",
    "warrior": "Debrief",
    "sage": "Reflection",
}

# Phrase fragments per split-shape, per persona. The orchestrator supplies the
# numbers; this only chooses tone.
_POST_SPLIT = {
    "negative": {
        "scientist": "You ran a negative split - second half faster. That's textbook pacing efficiency.",
        "energizer": "Negative split - you got STRONGER as you went. That's how it's done!",
        "warrior": "Negative split. You finished harder than you started. That's discipline.",
        "sage": "You quickened as you went - a patient, well-judged run. The body was trusted.",
    },
    "even": {
        "scientist": "Your splits were even - consistent pacing, the hallmark of a controlled run.",
        "energizer": "Rock-steady splits start to finish - beautifully controlled, love to see it!",
        "warrior": "Even splits. Held the line all the way. Solid execution.",
        "sage": "Even, steady splits - you ran with composure from start to finish.",
    },
    "positive": {
        "scientist": "You slowed in the second half (positive split). Next time start ~5s/km easier to even it out.",
        "energizer": "You faded a touch late - totally normal! Start a hair easier next time and you'll fly.",
        "warrior": "You faded late. The fix is discipline early - start controlled, finish strong.",
        "sage": "The pace eased late, as it often does. Begin a little gentler next time; the finish will reward you.",
    },
}


def post_run_text(data: dict, persona: str) -> str:
    """Build the post-run inference from deterministic analysis numbers.

    `data` is expected to carry: km, avg_pace, split_shape ('negative'|'even'|
    'positive'), adherence_pct (optional), improvement (optional str), and an
    optional cold_start flag when there isn't enough history to judge trends.
    """
    persona = persona if persona in _POST_HEADER else "energizer"
    lines = [f"{_POST_HEADER[persona]}: {data.get('km', 0)} km at {data.get('avg_pace', 'a steady pace')}."]

    shape = data.get("split_shape")
    if shape in _POST_SPLIT:
        lines.append(_POST_SPLIT[shape][persona])

    if data.get("adherence_pct") is not None:
        lines.append(f"You held target pace {int(data['adherence_pct'])}% of the run.")

    improvement = data.get("improvement")
    if improvement:
        lines.append(improvement)
    elif data.get("cold_start"):
        lines.append("Not enough run history yet to judge a trend - a few more runs and I'll track your progress.")

    return " ".join(lines)
