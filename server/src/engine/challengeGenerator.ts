type Tier = 'beginner' | 'intermediate' | 'advanced';
type Category = 'bodyweight' | 'nutrition' | 'hydration' | 'technique' | 'gear' | 'breathing' | 'running';

interface ChallengeTemplate {
  title: string;
  description: string;
  target_value?: number;
  target_unit?: string;
  xp_reward: number;
}

const TEMPLATES: Record<Category, Record<Tier, ChallengeTemplate[]>> = {
  bodyweight: {
    beginner: [
      { title: 'Plank Starter', description: 'Hold a plank for 30 seconds, 3 times today. Rest between sets.', target_value: 3, target_unit: 'sets', xp_reward: 40 },
      { title: 'Squat Foundation', description: 'Complete 30 bodyweight squats throughout the day (break into sets).', target_value: 30, target_unit: 'reps', xp_reward: 40 },
      { title: 'Wall Sit Challenge', description: 'Hold a wall sit for 45 seconds. Try 3 times with 1 min rest.', target_value: 45, target_unit: 'seconds', xp_reward: 35 },
      { title: 'Lunges Intro', description: 'Do 20 walking lunges (10 each leg). Focus on form over speed.', target_value: 20, target_unit: 'reps', xp_reward: 40 },
    ],
    intermediate: [
      { title: 'Core Circuit', description: '3 rounds: 30s plank + 15 crunches + 10 leg raises. No rest between exercises, 30s between rounds.', target_value: 3, target_unit: 'rounds', xp_reward: 60 },
      { title: 'Single-Leg Power', description: '3x12 single-leg deadlifts each side + 3x10 Bulgarian split squats each side.', target_value: 3, target_unit: 'sets', xp_reward: 65 },
      { title: 'Push-Up Ladder', description: '1-2-3-4-5-4-3-2-1 push-ups with 15s rest between sets. Thats 25 total!', target_value: 25, target_unit: 'reps', xp_reward: 55 },
      { title: 'Hip Strength', description: '3 sets: 15 glute bridges + 12 clamshells each side + 10 fire hydrants each side.', target_value: 3, target_unit: 'sets', xp_reward: 60 },
    ],
    advanced: [
      { title: 'Plyometric Power', description: '4 rounds: 10 box jumps + 10 burpees + 15 jump squats. 45s rest between rounds.', target_value: 4, target_unit: 'rounds', xp_reward: 80 },
      { title: 'Pistol Squat Practice', description: 'Work towards 5 pistol squats each leg. Use a support if needed. 4 sets.', target_value: 4, target_unit: 'sets', xp_reward: 85 },
      { title: 'Full Body Blast', description: '5 rounds: 10 burpees + 20 mountain climbers + 15 jump lunges + 30s plank. 60s rest.', target_value: 5, target_unit: 'rounds', xp_reward: 90 },
      { title: 'Explosive Sprint Drills', description: '6x30m sprint starts from a standing position, walk back recovery. Focus on first 5 steps.', target_value: 6, target_unit: 'sprints', xp_reward: 75 },
    ],
  },
  nutrition: {
    beginner: [
      { title: 'Protein Awareness', description: 'Track your protein intake today. Aim for a palm-sized portion with each meal.', target_value: 3, target_unit: 'meals', xp_reward: 35 },
      { title: 'Pre-Run Fuel', description: 'Eat a banana or toast with peanut butter 30-60 min before your next run.', target_value: 1, target_unit: 'run', xp_reward: 30 },
      { title: 'Colorful Plate', description: 'Include at least 3 different colored vegetables in your meals today.', target_value: 3, target_unit: 'colors', xp_reward: 35 },
      { title: 'Post-Run Recovery', description: 'Within 30 min of your next run, have a snack with both protein and carbs (e.g., chocolate milk, yogurt with fruit).', target_value: 1, target_unit: 'snack', xp_reward: 35 },
    ],
    intermediate: [
      { title: 'Carb Timing', description: 'Eat complex carbs (oats, rice, sweet potato) 2-3 hours before your run this week. Note how you feel.', target_value: 3, target_unit: 'runs', xp_reward: 50 },
      { title: 'Anti-Inflammatory Week', description: 'Include turmeric, berries, or leafy greens in at least one meal daily for 5 days.', target_value: 5, target_unit: 'days', xp_reward: 55 },
      { title: 'Protein Target', description: 'Hit 1.4g protein per kg bodyweight daily for 5 days. Use a simple tracker or estimate.', target_value: 5, target_unit: 'days', xp_reward: 60 },
      { title: 'Meal Prep Sunday', description: 'Prepare 3 balanced meals in advance for the week. Include lean protein + complex carbs + veggies.', target_value: 3, target_unit: 'meals', xp_reward: 50 },
    ],
    advanced: [
      { title: 'Periodized Nutrition', description: 'Match calorie intake to training load: higher on long run days, moderate on easy days, lighter on rest days.', target_value: 7, target_unit: 'days', xp_reward: 75 },
      { title: 'Race Day Practice', description: 'Practice your pre-race meal and during-race fuel strategy on your long run. Note what works.', target_value: 1, target_unit: 'practice', xp_reward: 70 },
      { title: 'Iron & B12 Focus', description: 'Ensure iron-rich foods (red meat, spinach, lentils) + vitamin C pairing for 5 days straight.', target_value: 5, target_unit: 'days', xp_reward: 70 },
      { title: 'Glycogen Loading', description: 'Practice 2-day carb load before your longest run this week (7-10g carbs/kg).', target_value: 2, target_unit: 'days', xp_reward: 75 },
    ],
  },
  hydration: {
    beginner: [
      { title: 'Water Baseline', description: 'Drink at least 8 glasses (2L) of water today. Set hourly reminders if needed.', target_value: 8, target_unit: 'glasses', xp_reward: 30 },
      { title: 'Pre-Run Hydration', description: 'Drink 500ml water 2 hours before your next run. Notice the difference!', target_value: 500, target_unit: 'ml', xp_reward: 30 },
      { title: 'Color Check', description: 'Check urine color 3 times today. Aim for pale yellow. If dark, drink more!', target_value: 3, target_unit: 'checks', xp_reward: 25 },
      { title: 'Morning Ritual', description: 'Start every morning this week with a full glass of water before anything else.', target_value: 7, target_unit: 'days', xp_reward: 40 },
    ],
    intermediate: [
      { title: 'Sweat Rate Test', description: 'Weigh yourself before and after a run (no water during). Each kg lost = 1L sweat. Know your rate!', target_value: 1, target_unit: 'test', xp_reward: 50 },
      { title: 'Electrolyte Balance', description: 'Add a pinch of salt and squeeze of lemon to your water post-run for 3 runs this week.', target_value: 3, target_unit: 'runs', xp_reward: 45 },
      { title: 'Hydration Schedule', description: 'For runs over 45 min, drink 150-200ml every 15 minutes. Practice this twice.', target_value: 2, target_unit: 'runs', xp_reward: 50 },
      { title: 'Cut the Caffeine After 2pm', description: 'No caffeine after 2pm for 5 days. Better sleep = better recovery = better runs.', target_value: 5, target_unit: 'days', xp_reward: 45 },
    ],
    advanced: [
      { title: 'Personalized Plan', description: 'Based on your sweat rate, create a hydration plan for your next long run and execute it perfectly.', target_value: 1, target_unit: 'plan', xp_reward: 65 },
      { title: 'Sodium Loading', description: 'For your longest run, take 500-700mg sodium with 500ml water 90 min before. Track performance impact.', target_value: 1, target_unit: 'run', xp_reward: 70 },
      { title: 'Heat Adaptation', description: 'If training in heat: increase fluid intake by 50% and add electrolyte tablets. Maintain for 4 sessions.', target_value: 4, target_unit: 'sessions', xp_reward: 70 },
      { title: 'Recovery Protocol', description: 'Post-run: drink 1.5x fluid lost (per sweat rate test) within 2 hours, including electrolytes.', target_value: 3, target_unit: 'runs', xp_reward: 65 },
    ],
  },
  technique: {
    beginner: [
      { title: 'Cadence Awareness', description: 'Count your steps for 30 seconds during a run and multiply by 2. Aim for 160-170 spm.', target_value: 170, target_unit: 'spm', xp_reward: 40 },
      { title: 'Posture Check', description: 'During your next run, do 5 posture checks: head up, shoulders back, slight forward lean from ankles.', target_value: 5, target_unit: 'checks', xp_reward: 35 },
      { title: 'Light Landing', description: 'Focus on landing softly for 1km of your next run. Imagine running on eggshells.', target_value: 1, target_unit: 'km', xp_reward: 40 },
      { title: 'Arm Swing Fix', description: 'Run 500m focusing only on arms: elbows at 90°, hands relaxed, swinging forward (not across body).', target_value: 500, target_unit: 'meters', xp_reward: 35 },
    ],
    intermediate: [
      { title: 'Strides Practice', description: 'After an easy run, do 4x100m strides: gradually accelerate to 90% effort then decelerate.', target_value: 4, target_unit: 'strides', xp_reward: 55 },
      { title: 'Hill Form', description: 'Find a moderate hill. Run up 5 times focusing on: short stride, high knees, forward lean, pumping arms.', target_value: 5, target_unit: 'repeats', xp_reward: 60 },
      { title: 'Downhill Control', description: 'Practice running downhill with control: slight forward lean, quick cadence, dont brake with heels.', target_value: 4, target_unit: 'descents', xp_reward: 55 },
      { title: 'Mid-Foot Strike', description: 'Dedicate 2km of your run to consciously landing mid-foot directly under your center of mass.', target_value: 2, target_unit: 'km', xp_reward: 50 },
    ],
    advanced: [
      { title: 'Race Pace Form', description: 'Maintain perfect form during a 2km tempo: high cadence (180+), minimal vertical oscillation, relaxed shoulders.', target_value: 2, target_unit: 'km', xp_reward: 75 },
      { title: 'Economy Drills', description: 'Do a full drill session: A-skips, B-skips, high knees, butt kicks, carioca. 2x30m each.', target_value: 10, target_unit: 'drills', xp_reward: 70 },
      { title: 'Fatigue Form', description: 'In the last 2km of a hard run, maintain 95% of your fresh form. Film yourself to check.', target_value: 2, target_unit: 'km', xp_reward: 80 },
      { title: 'Sprint Mechanics', description: '6x60m sprints focusing on: powerful toe-off, full hip extension, high knee drive, quick ground contact.', target_value: 6, target_unit: 'sprints', xp_reward: 75 },
    ],
  },
  gear: {
    beginner: [
      { title: 'Shoe Rotation Check', description: 'Check your current running shoes: are they over 500km old? If yes, research a replacement pair.', target_value: 1, target_unit: 'check', xp_reward: 30 },
      { title: 'Dress for Success', description: 'Run in moisture-wicking fabric (not cotton!). Notice how much more comfortable it is.', target_value: 1, target_unit: 'run', xp_reward: 30 },
      { title: 'Night Visibility', description: 'If you run in low light, wear reflective gear or a headlamp. Safety first!', target_value: 1, target_unit: 'setup', xp_reward: 25 },
      { title: 'Sock Upgrade', description: 'Try running-specific socks (moisture-wicking, cushioned). Notice reduced friction and blisters.', target_value: 1, target_unit: 'run', xp_reward: 30 },
    ],
    intermediate: [
      { title: 'Shoe Purpose', description: 'Learn the difference: daily trainers vs tempo shoes vs race day shoes. Research one shoe from each category.', target_value: 3, target_unit: 'categories', xp_reward: 45 },
      { title: 'Layering System', description: 'Master the layer system: base (moisture-wicking), mid (insulation), outer (wind/rain). Test on your next cold run.', target_value: 1, target_unit: 'run', xp_reward: 45 },
      { title: 'Running Belt/Vest', description: 'Try a running belt or vest for carrying phone, keys, water. Run at least 5km with it to test comfort.', target_value: 5, target_unit: 'km', xp_reward: 40 },
      { title: 'Anti-Chafe Strategy', description: 'Apply body glide or petroleum jelly to common chafe points before a long run. Note the difference.', target_value: 1, target_unit: 'run', xp_reward: 40 },
    ],
    advanced: [
      { title: 'Race Day Kit', description: 'Assemble your complete race day kit: shoes, socks, shorts, singlet, watch, nutrition, extras. Do a dress rehearsal run.', target_value: 1, target_unit: 'rehearsal', xp_reward: 60 },
      { title: 'Carbon Plate Test', description: 'If you have carbon plate shoes, run a tempo effort in them vs regular trainers. Compare pace at same effort.', target_value: 2, target_unit: 'runs', xp_reward: 65 },
      { title: 'Weather Adaptation', description: 'Have a complete kit ready for rain, cold, and heat. Test each in training before using in races.', target_value: 3, target_unit: 'conditions', xp_reward: 60 },
      { title: 'Compression Recovery', description: 'Try compression socks/tights for 2 hours post-run for 3 consecutive hard sessions. Rate recovery.', target_value: 3, target_unit: 'sessions', xp_reward: 55 },
    ],
  },
  breathing: {
    beginner: [
      { title: 'Belly Breathing', description: 'Practice diaphragmatic breathing: lie down, hand on belly, breathe into your belly for 2 minutes. Then try while walking.', target_value: 2, target_unit: 'minutes', xp_reward: 35 },
      { title: 'Rhythmic Start', description: 'Start your next run with a 3:3 breathing pattern (3 steps inhale, 3 steps exhale) for the first 5 minutes.', target_value: 5, target_unit: 'minutes', xp_reward: 40 },
      { title: 'Nose Breathing Walk', description: 'Go for a 10-minute walk breathing only through your nose. Build your nasal breathing capacity.', target_value: 10, target_unit: 'minutes', xp_reward: 35 },
      { title: 'Talk Test', description: 'During your next easy run, check you can speak in full sentences. If not, slow down! Easy should feel easy.', target_value: 1, target_unit: 'run', xp_reward: 30 },
    ],
    intermediate: [
      { title: '3:2 Breathing', description: 'Practice the 3:2 pattern (inhale 3 steps, exhale 2 steps) for your entire next easy run. It balances stress across both sides.', target_value: 1, target_unit: 'run', xp_reward: 50 },
      { title: 'Nose-to-Tempo', description: 'Breathe only through your nose for the first 10 minutes of 3 runs this week. Builds efficiency.', target_value: 3, target_unit: 'runs', xp_reward: 55 },
      { title: 'Box Breathing Recovery', description: 'After hard efforts: 4s inhale, 4s hold, 4s exhale, 4s hold. Do 5 cycles. Accelerates recovery.', target_value: 5, target_unit: 'cycles', xp_reward: 45 },
      { title: 'Effort Matching', description: 'Match breathing to effort: 3:3 for easy, 3:2 for moderate, 2:1 for hard. Practice in one session with pace changes.', target_value: 1, target_unit: 'session', xp_reward: 55 },
    ],
    advanced: [
      { title: 'CO2 Tolerance', description: 'Do 3 sets of exhale-hold walking: exhale fully, hold breath, walk until moderate urge to breathe. Track steps.', target_value: 3, target_unit: 'sets', xp_reward: 70 },
      { title: 'Race Breathing Strategy', description: 'Plan and execute breathing patterns for your next hard run: start conservative (3:2), progress to (2:1) for the final push.', target_value: 1, target_unit: 'run', xp_reward: 70 },
      { title: 'Breathing Under Load', description: 'During intervals, maintain rhythmic breathing even at high intensity. No gasping — stay in control.', target_value: 6, target_unit: 'intervals', xp_reward: 75 },
      { title: 'Wim Hof Lite', description: '3 rounds: 30 power breaths (deep in, gentle out), hold on exhale until urge to breathe, recovery breath and hold 15s.', target_value: 3, target_unit: 'rounds', xp_reward: 65 },
    ],
  },
  running: {
    beginner: [
      { title: 'Walk-Run Method', description: 'Try run/walk intervals: 2 min run, 1 min walk, repeat 5 times. Build endurance without burnout.', target_value: 5, target_unit: 'intervals', xp_reward: 40 },
      { title: 'Easy Pace Discovery', description: 'Run an entire session at conversational pace (can talk in sentences). Note the pace — thats your easy zone.', target_value: 1, target_unit: 'run', xp_reward: 35 },
      { title: 'Distance Milestone', description: 'Complete a continuous 3km run without stopping. Walk warm-up and cool-down dont count!', target_value: 3, target_unit: 'km', xp_reward: 50 },
      { title: 'Consistency Week', description: 'Run (any distance) 3 times this week. Consistency beats intensity at this stage.', target_value: 3, target_unit: 'runs', xp_reward: 45 },
    ],
    intermediate: [
      { title: 'Tempo Tuesday', description: 'Include a 15-minute tempo effort (comfortably hard) in one run this week.', target_value: 15, target_unit: 'minutes', xp_reward: 60 },
      { title: 'Long Run Extension', description: 'Make your longest run this week 10% further than last week. Slow pace is fine!', target_value: 10, target_unit: 'percent', xp_reward: 55 },
      { title: 'Negative Split', description: 'Run the second half of a 5K faster than the first half. Practice pacing discipline.', target_value: 1, target_unit: 'run', xp_reward: 65 },
      { title: 'Fartlek Fun', description: 'During a run, alternate hard (30-90s) and easy (1-2 min) efforts based on feel. Do at least 6 hard efforts.', target_value: 6, target_unit: 'efforts', xp_reward: 55 },
    ],
    advanced: [
      { title: 'Interval Session', description: '5x1km at 5K race pace with 90s jog recovery. Track your splits for consistency.', target_value: 5, target_unit: 'reps', xp_reward: 80 },
      { title: 'Threshold Run', description: '20 minutes at lactate threshold pace (hard but sustainable). No slowing in the last 5 min.', target_value: 20, target_unit: 'minutes', xp_reward: 75 },
      { title: 'Progressive Long Run', description: 'Long run where each 5km is 10-15s/km faster than the previous. Finish near tempo pace.', target_value: 1, target_unit: 'run', xp_reward: 85 },
      { title: 'Race Simulation', description: 'Simulate race conditions: proper warm-up, race-pace effort for goal distance, cool-down. Practice everything.', target_value: 1, target_unit: 'simulation', xp_reward: 90 },
    ],
  },
};

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function generateWeeklyChallenges(
  userId: number,
  tier: Tier,
  weekStart: string
): { category: Category; title: string; description: string; target_value?: number; target_unit?: string; xp_reward: number; tier: Tier }[] {
  const categories: Category[] = ['bodyweight', 'nutrition', 'hydration', 'technique', 'gear', 'breathing', 'running'];
  const seed = userId * 1000 + new Date(weekStart).getTime() / 86400000;

  const shuffled = [...categories].sort((a, b) => seededRandom(seed + categories.indexOf(a)) - seededRandom(seed + categories.indexOf(b)));
  const selected = shuffled.slice(0, 4);

  return selected.map((category, i) => {
    const templates = TEMPLATES[category][tier];
    const idx = Math.floor(seededRandom(seed + i * 7) * templates.length);
    const template = templates[idx];
    return { category, ...template, tier };
  });
}
