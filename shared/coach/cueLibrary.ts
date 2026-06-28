// The coach's WORDS for the one-way (Rs.9) plan — every spoken response, all four
// personas. Ported from the Python lab (coaching/cue_library.py).
//
// Templated (not live-LLM) on purpose: during-run cues must be instant, are filled
// ONLY with engine-computed numbers (so no pace/distance/HR can be invented), and
// must work offline with no key — exactly like Google Maps' turn-by-turn voice.
// Each (trigger x persona) has several phrasings; the renderer rotates through them
// so repeated nudges never sound identical.

import { Cue, CueEvent } from './runCues';

export type Persona = 'scientist' | 'energizer' | 'warrior' | 'sage';
export const PERSONAS: Persona[] = ['scientist', 'energizer', 'warrior', 'sage'];

type ByPersona = Record<Persona, string[]>;

// During-run cue templates. {slots} are filled from the cue payload. Keep each
// line ~8-15 words, imperative, and NEVER a question expecting an answer (one-way).
const CUE_TEMPLATES: Partial<Record<Cue, ByPersona>> = {
  [Cue.RUN_START]: {
    scientist: [
      'Starting now. Hold {target_pace}. Let the heart rate rise gradually, no surges.',
      'Begin controlled at {target_pace}. First kilometre is calibration, not performance.',
    ],
    energizer: [
      "Here we go! Ease in nice and smooth, find your rhythm. You've got this!",
      "And we're off! Relax the shoulders, settle in - this is your time!",
    ],
    warrior: [
      'Mission start. Controlled and deliberate. Lock onto {target_pace}. Execute.',
      'Begin. No hero starts. Discipline first - {target_pace}, hold the line.',
    ],
    sage: [
      'Begin gently. The first kilometre simply wakes the body. Breathe and relax.',
      'Ease into it. No rush. Let the rhythm find you, not the other way around.',
    ],
  },
  [Cue.KM_MILESTONE]: {
    scientist: [
      '{km_done} km logged at {avg_pace} average. Metrics are steady - maintain.',
      'Kilometre {km_done} complete. Average {avg_pace}. Cadence and effort look efficient.',
    ],
    energizer: [
      '{km_done} km down and looking strong! {avg_pace} average - keep that energy!',
      'Boom, {km_done} km! You\'re cruising at {avg_pace}. Love it, keep rolling!',
    ],
    warrior: [
      '{km_done} kilometres banked. {avg_pace}. Keep grinding, no let-up.',
      '{km_done} km done. Holding {avg_pace}. Stay sharp, stay on it.',
    ],
    sage: [
      '{km_done} km, flowing at {avg_pace}. Steady miles build the runner. Stay present.',
      'Another kilometre behind you - {km_done} now. Smooth and patient at {avg_pace}.',
    ],
  },
  [Cue.HALFWAY]: {
    scientist: [
      'Halfway. {km_left} km remaining. Pacing is on plan - execute the second half evenly.',
      'Midpoint reached. The back half is where even-pacing pays off. Hold form.',
    ],
    energizer: [
      'Halfway there - and you feel great! {km_left} km to go, you\'re owning this!',
      'Halfway! The hard part\'s behind you in your head. {km_left} km of fun left!',
    ],
    warrior: [
      'Halfway. This is where it\'s won. {km_left} km. Dig in and hold standard.',
      'Midpoint. Second half separates the disciplined. {km_left} km. Drive.',
    ],
    sage: [
      'The midpoint. {km_left} km remain. Stay with your breath; the miles will come.',
      'Halfway home. No urgency. Let the second half unfold as patiently as the first.',
    ],
  },
  [Cue.SETTLE_PACE]: {
    scientist: [
      'About {pace_delta_abs}s/km fast. Ease back toward {target_pace} to protect the finish.',
      'You\'re ahead of target pace. Dial back to {target_pace} - bank energy, not seconds.',
      'Pace is hot. Settle to {target_pace}; the even effort wins this run.',
    ],
    energizer: [
      'Whoa, flying a bit! Reel it back to {target_pace} so you finish strong and happy!',
      'Easy tiger - that\'s quick! Settle to {target_pace}, save that fire for later!',
      'Loving the energy - just ease to {target_pace} so it lasts the whole way!',
    ],
    warrior: [
      'Too hot. Rein it in to {target_pace}. Discipline now, glory later.',
      'Slow the start. {target_pace} is the order. Don\'t burn the mission early.',
      'Check the pace. Back to {target_pace}. Control wins, not bravado.',
    ],
    sage: [
      'Gently - you\'re rushing. Drift back to {target_pace}. Patience is your ally today.',
      'Ease the pace toward {target_pace}. The eager start fades; the steady one endures.',
      'No need to hurry. Float back to {target_pace} and let the run come to you.',
    ],
  },
  [Cue.HOLD_PACE]: {
    scientist: [
      'Effort is climbing. Relax shoulders, drop the jaw, hold {target_pace} efficiently.',
      'Heart rate drifting up. Same pace, less tension - breathe deep and steady.',
      'Cardiac drift is normal here. Stay relaxed; the pace is fine, the tension isn\'t.',
    ],
    energizer: [
      'Effort\'s creeping up - shake out those arms, stay loose, you\'re still strong!',
      'Stay smooth! Relax the shoulders, easy breaths, keep that rhythm rolling!',
      'Loosen up and breathe easy - you\'re working, but you\'re in control!',
    ],
    warrior: [
      'Tension rising. Control it. Loosen the shoulders, hold form, stay on pace.',
      'Effort up - own it. Relax, breathe, execute. No wasted energy.',
      'Stay composed. Drop the tension, keep the pace. Master the effort.',
    ],
    sage: [
      'The effort rises. Soften your body, lengthen the breath, let the pace stay.',
      'Notice the tension and release it. Calm shoulders, calm mind, steady miles.',
      'Breath in, breath out. The effort is just weather; let it pass through you.',
    ],
  },
  [Cue.SUPPORT_FADE]: {
    scientist: [
      'Pace slipped ~{pace_delta_abs}s/km. Shorten stride, lift cadence slightly - efficiency over force.',
      'Fatigue showing. Quick light steps, drive the arms - that recovers pace cheaply.',
      'Form first now: tall posture, relaxed hands, faster turnover. Reclaim the rhythm.',
    ],
    energizer: [
      'Legs are talking - that\'s normal! Short quick steps, pump those arms, stay tough!',
      'Dig in, friend! Lighten the stride, smile it out - you\'ve got more than you think!',
      'This is where heroes are made! Quick feet, big heart - keep that engine going!',
    ],
    warrior: [
      'You\'re fading. Shorten stride, drive the arms, hold the line. Finish what you started.',
      'This is the test. Quick feet, strong arms. Refuse to slow. Push through.',
      'Adversity is the point. Tighten form, hold pace, do not yield.',
    ],
    sage: [
      'The body tires - that\'s the journey. Small light steps, steady breath. Stay with it.',
      'Fatigue is a passing season. Shorten the stride, soften the mind, keep moving.',
      'Meet the tiredness gently. Light feet, calm breath - the finish is closer than it feels.',
    ],
  },
  [Cue.WALL_SUPPORT]: {
    scientist: [
      'Glycogen territory. Shorten stride, steady breathing, small fuel sip if you have it.',
      'Deep fatigue zone. One minute at a time. Maintain cadence, not force.',
      'Energy is low now. Relax the effort, keep turnover light, stay patient.',
    ],
    energizer: [
      'This is the legendary part - one block at a time, you\'re so close!',
      'The wall\'s just a story you rewrite! Small steps, big heart, keep going!',
      'You\'re in the deep end now - and you\'re still moving. That\'s heroic!',
    ],
    warrior: [
      'The wall. This is who you are now. One minute at a time.',
      'Pain is information, not a command. Shorten stride, breathe, advance.',
      'This is the forge. Hold your form, keep moving, do not stop.',
    ],
    sage: [
      'The hardest stretch teaches the most. One breath, one step.',
      'Here the mountain steepens. Slow, steady, patient. Keep walking the path.',
      'Tiredness is a passing season. Light feet, calm breath, stay with it.',
    ],
  },
  // Safety cue: persona only softens the TONE — the instruction (ease off) is
  // identical and non-negotiable across all four.
  [Cue.HR_SAFETY]: {
    scientist: [
      'Heart rate very high. Ease to a walk and let it recover.',
      'Still redlining. Slow down now; let the heart rate come back.',
      'Effort is too high. Back off to a jog and recover.',
    ],
    energizer: [
      'Heart\'s redlining - let\'s protect you. Ease to a walk now.',
      'Still too high! Slow it right down and let it settle.',
      'Take care of yourself - gentle walk, let that heart recover.',
    ],
    warrior: [
      'Heart rate too high. Back off now. Smart runners protect the body.',
      'Still redlining. Ease down - this is discipline, not weakness.',
      'Too hard. Walk it down and let the heart recover.',
    ],
    sage: [
      'Your heart works too hard. Slow to a walk and breathe.',
      'Still too high. Ease back gently; let it settle.',
      'Honour the body - slow down and let the heart calm.',
    ],
  },
  [Cue.FINAL_PUSH]: {
    scientist: [
      '{km_left} km left. If reserves allow, lift effort gradually - controlled negative split.',
      'Closing stretch. Increase turnover slightly, hold form - finish faster than you started.',
    ],
    energizer: [
      'Final push! {km_left} km - empty the tank, this is your victory lap, GO!',
      'Bring it home! {km_left} to go, you\'ve EARNED this finish - light it up!',
    ],
    warrior: [
      'Final push. {km_left} km. Everything you\'ve got, now. Leave nothing behind.',
      'This is the finish. {km_left} to go. Attack it. Earn the line.',
    ],
    sage: [
      'The path nears its end. {km_left} km. Run them with gratitude and quiet strength.',
      'Final stretch. {km_left} km left. Give what remains, calmly and fully.',
    ],
  },
  [Cue.FINISH]: {
    scientist: ['Run complete: {km_done} km at {avg_pace}. Data captured - analysis to follow. Well executed.'],
    energizer: ['YOU DID IT! {km_done} km at {avg_pace} - incredible work, soak it in!'],
    warrior: ['Done. {km_done} km, {avg_pace}. Mission accomplished. That\'s who you are.'],
    sage: ['Complete. {km_done} km at {avg_pace}. Honour the effort. Now recover well.'],
  },
};

const GENERIC_FALLBACK: Partial<Record<Cue, string>> = {
  [Cue.RUN_START]: 'Starting now - ease in and find a comfortable, steady rhythm.',
  [Cue.KM_MILESTONE]: '{km_done} km done. Keep it steady.',
  [Cue.HALFWAY]: 'Halfway there. Stay smooth and even.',
  [Cue.SETTLE_PACE]: 'Ease the pace back a little - settle into a sustainable effort.',
  [Cue.HOLD_PACE]: 'Effort climbing - relax, breathe, and hold your form.',
  [Cue.SUPPORT_FADE]: 'Pace easing off - shorten your stride and drive your arms.',
  [Cue.WALL_SUPPORT]: 'Tough stretch - one minute at a time, keep moving.',
  [Cue.HR_SAFETY]: 'Heart rate very high - ease to a walk and let it recover.',
  [Cue.FINAL_PUSH]: 'Final stretch - bring it home with what you\'ve got left.',
  [Cue.FINISH]: 'Run complete. Strong work - recover well.',
};

/** Format a template, returning null if any referenced slot is missing/null. */
function safeFormat(template: string, data: Record<string, unknown>): string | null {
  const view: Record<string, unknown> = { ...data };
  if (view.pace_delta_s != null) view.pace_delta_abs = Math.abs(Math.round(Number(view.pace_delta_s)));
  let missing = false;
  const out = template.replace(/\{(\w+)\}/g, (_m, key: string) => {
    const v = view[key];
    if (v == null) { missing = true; return ''; }
    return String(v);
  });
  if (missing || out.includes('null') || out.includes('undefined')) return null;
  return out;
}

function asPersona(p: string): Persona {
  return (PERSONAS as string[]).includes(p) ? (p as Persona) : 'energizer';
}

/** Turn a CueEvent into the persona's spoken line. Deterministic variant rotation. */
export function renderCue(event: CueEvent, persona: string): string {
  const p = asPersona(persona);
  const variants = CUE_TEMPLATES[event.trigger]?.[p] ?? [];
  if (variants.length > 0) {
    const start = Math.trunc(event.payload.variant ?? event.t_s) % variants.length;
    const order = variants.slice(start).concat(variants.slice(0, start));
    for (const tmpl of order) {
      const rendered = safeFormat(tmpl, event.payload as unknown as Record<string, unknown>);
      if (rendered) return rendered;
    }
  }
  const fallback = GENERIC_FALLBACK[event.trigger] ?? 'Keep going - steady and strong.';
  return safeFormat(fallback, event.payload as unknown as Record<string, unknown>) || fallback.replace('{km_done}', '').trim();
}

// --------------------------------------------------------------------------- //
// Pre-run brief
// --------------------------------------------------------------------------- //
const PRE_RUN: Record<Persona, string> = {
  scientist:
    'Today: {type_label}, target {target_km} km at {target_pace}. Plan your splits evenly - the goal is a ' +
    'controlled, repeatable effort. Warm up easy for the first kilometre and let the heart rate rise gradually.',
  energizer:
    "Today's adventure: {type_label}, {target_km} km at {target_pace}! Start easy, settle into your groove, " +
    "and enjoy every step. Trust your training - you're ready for this. Let's make it a great one!",
  warrior:
    'Mission: {type_label}. {target_km} km at {target_pace}. Controlled start, even effort, strong finish. ' +
    'No hero pacing in the first kilometre. Execute the plan with discipline.',
  sage:
    "Today you'll run a {type_label} - {target_km} km around {target_pace}. Begin gently, stay present with " +
    "your breath, and let the rhythm carry you. There's no need to chase; the miles will come.",
};

const TYPE_LABEL: Record<string, string> = {
  easy: 'easy aerobic run',
  long: 'long endurance run',
  tempo: 'tempo run',
  intervals: 'interval session',
  race: 'race effort',
};

export function preRunBriefText(data: Record<string, unknown>, persona: string): string {
  const p = asPersona(persona);
  const view = { ...data, type_label: TYPE_LABEL[String(data.type)] ?? 'run' };
  const out = safeFormat(PRE_RUN[p], view);
  if (out) return out;
  return `Today's session is an ${view.type_label}. Start easy, stay relaxed, and run a steady, even effort.`;
}

// --------------------------------------------------------------------------- //
// Post-run inference (grounded in run-analysis numbers)
// --------------------------------------------------------------------------- //
const POST_HEADER: Record<Persona, string> = {
  scientist: 'Run analysis', energizer: 'Run recap', warrior: 'Debrief', sage: 'Reflection',
};

const POST_SPLIT: Record<'negative' | 'even' | 'positive', Record<Persona, string>> = {
  negative: {
    scientist: 'You ran a negative split - second half faster. That\'s textbook pacing efficiency.',
    energizer: 'Negative split - you got STRONGER as you went. That\'s how it\'s done!',
    warrior: 'Negative split. You finished harder than you started. That\'s discipline.',
    sage: 'You quickened as you went - a patient, well-judged run. The body was trusted.',
  },
  even: {
    scientist: 'Your splits were even - consistent pacing, the hallmark of a controlled run.',
    energizer: 'Rock-steady splits start to finish - beautifully controlled, love to see it!',
    warrior: 'Even splits. Held the line all the way. Solid execution.',
    sage: 'Even, steady splits - you ran with composure from start to finish.',
  },
  positive: {
    scientist: 'You slowed in the second half (positive split). Next time start ~5s/km easier to even it out.',
    energizer: 'You faded a touch late - totally normal! Start a hair easier next time and you\'ll fly.',
    warrior: 'You faded late. The fix is discipline early - start controlled, finish strong.',
    sage: 'The pace eased late, as it often does. Begin a little gentler next time; the finish will reward you.',
  },
};

export function postRunText(data: Record<string, unknown>, persona: string): string {
  const p = asPersona(persona);
  const lines: string[] = [`${POST_HEADER[p]}: ${data.km ?? 0} km at ${data.avg_pace ?? 'a steady pace'}.`];

  const shape = data.split_shape as 'negative' | 'even' | 'positive' | undefined;
  if (shape && POST_SPLIT[shape]) lines.push(POST_SPLIT[shape][p]);

  if (data.adherence_pct != null) lines.push(`You held target pace ${Math.trunc(Number(data.adherence_pct))}% of the run.`);

  if (data.improvement) lines.push(String(data.improvement));
  else if (data.cold_start) lines.push("Not enough run history yet to judge a trend - a few more runs and I'll track your progress.");

  return lines.join(' ');
}
