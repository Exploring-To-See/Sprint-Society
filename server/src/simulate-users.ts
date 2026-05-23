/**
 * Sprint Society — User Simulation Script (V2)
 *
 * Uses the Classification Engine V2 for realistic runner distribution.
 * Target distribution for random population aged 16-40:
 *   ~40% Beginner, ~35% Intermediate, ~20% Advanced, ~5% Pro
 */

import {
  normalizePerformance,
  normalizeVolume,
  normalizeConsistency,
  normalizeRecovery,
  normalizeVO2max,
  normalizePaceCompliance,
  calculateRunnerLevel,
  checkSafetyRails,
  tierDisplayName,
  type Gender,
  type BestTimes,
  type RecoveryData,
  type RunForCompliance,
  type PaceZones,
  type ClassificationTier,
  type FactorScores,
  type LevelResult,
} from './engine/classification-engine';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Config
// ============================================================================

const NUM_USERS = 100;

const FIRST_NAMES = ['Arjun', 'Priya', 'Rahul', 'Neha', 'Vikram', 'Aisha', 'Karan', 'Ananya', 'Rohan', 'Divya', 'Aditya', 'Sakshi', 'Varun', 'Ishita', 'Dev', 'Kavya', 'Nikhil', 'Shruti', 'Aman', 'Riya', 'Siddharth', 'Pooja', 'Akash', 'Tanya', 'Manish', 'Sneha', 'Yash', 'Meghna', 'Kunal', 'Nisha', 'Deepak', 'Anjali', 'Harsh', 'Ritika', 'Gaurav', 'Simran', 'Mohit', 'Swati', 'Pranav', 'Kriti', 'Abhi', 'Diya', 'Sahil', 'Bhavna', 'Jay', 'Aditi', 'Raghav', 'Lavanya', 'Ankur', 'Fatima', 'Vivek', 'Kiara', 'Tushar', 'Muskaan', 'Parth', 'Aanchal', 'Shivam', 'Tanvi', 'Dhruv', 'Megha', 'Om', 'Palak', 'Rishabh', 'Saanvi', 'Aryan', 'Naina', 'Kabir', 'Isha', 'Reyansh', 'Zara', 'Advait', 'Anushka', 'Ishan', 'Myra', 'Krishna', 'Sara', 'Vihaan', 'Aanya', 'Atharv', 'Pihu', 'Ayaan', 'Kirti', 'Rudra', 'Avni', 'Aakash', 'Jiya', 'Laksh', 'Rhea', 'Arnav', 'Siya', 'Darsh', 'Nandini', 'Shivansh', 'Anika', 'Veer', 'Mahika', 'Aarav', 'Disha', 'Kabeer', 'Trisha'];
const LAST_NAMES = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Joshi', 'Verma', 'Shah', 'Reddy', 'Nair', 'Mehta', 'Iyer', 'Kapoor', 'Rao', 'Bhat', 'Chopra', 'Malhotra', 'Saxena', 'Agarwal', 'Sinha'];

const COACH_STYLES = ['Kendu_Ishu', 'Kendu_Nainu', 'Kendu_Goggins', 'Kendu_Kip'] as const;

// ============================================================================
// Helpers
// ============================================================================

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatPace(secPerKm: number): string {
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

// ============================================================================
// Realistic User Generation
// ============================================================================

/**
 * Generate a realistic simulated user with training data.
 *
 * Population distribution logic:
 * - Most people are casual/beginner runners
 * - Intermediate runners train regularly
 * - Advanced runners have years of structured training
 * - Pro-level is extremely rare in a random population
 *
 * We bias the generation with a "runner archetype" draw that controls all parameters.
 */
function generateSimulatedUser(index: number) {
  const gender: Gender = Math.random() < 0.5 ? 'male' : 'female';
  const age = rand(16, 40);

  // Draw runner archetype (controls how "good" this runner is)
  // Use a weighted distribution that produces ~40% B, 35% I, 20% A, 5% P
  const archetypeRoll = Math.random();
  let archetype: 'casual' | 'regular' | 'serious' | 'elite';
  if (archetypeRoll < 0.40) archetype = 'casual';
  else if (archetypeRoll < 0.75) archetype = 'regular';
  else if (archetypeRoll < 0.95) archetype = 'serious';
  else archetype = 'elite';

  // --- Generate 5K time based on archetype + gender + age ---
  // These are realistic time ranges for Indian runners aged 16-40
  let fiveKSeconds: number;
  switch (archetype) {
    case 'casual':
      // 28:00 - 50:00 (slow joggers, brand new runners)
      fiveKSeconds = gender === 'male' ? rand(28 * 60, 48 * 60) : rand(32 * 60, 52 * 60);
      break;
    case 'regular':
      // 20:00 - 28:00 (regular runners with some training)
      fiveKSeconds = gender === 'male' ? rand(20 * 60, 28 * 60) : rand(23 * 60, 32 * 60);
      break;
    case 'serious':
      // 16:00 - 21:00 (trained runners, club level)
      fiveKSeconds = gender === 'male' ? rand(16 * 60, 21 * 60) : rand(18 * 60, 24 * 60);
      break;
    case 'elite':
      // 13:00 - 16:00 (competitive athletes)
      fiveKSeconds = gender === 'male' ? rand(13 * 60, 16 * 60) : rand(15 * 60, 18 * 60);
      break;
  }

  // Some users have 10K / HM times too (more likely for serious/elite)
  let tenKSeconds: number | undefined;
  let halfMSeconds: number | undefined;
  const has10K = archetype === 'elite' ? Math.random() < 0.9 : archetype === 'serious' ? Math.random() < 0.7 : archetype === 'regular' ? Math.random() < 0.4 : Math.random() < 0.1;
  const hasHM = archetype === 'elite' ? Math.random() < 0.8 : archetype === 'serious' ? Math.random() < 0.5 : archetype === 'regular' ? Math.random() < 0.2 : false;

  if (has10K) {
    // 10K is roughly 2.1x 5K time (with some variance)
    tenKSeconds = Math.round(fiveKSeconds * randFloat(2.05, 2.15));
  }
  if (hasHM) {
    // HM is roughly 4.6x 5K time
    halfMSeconds = Math.round(fiveKSeconds * randFloat(4.5, 4.75));
  }

  const bestTimes: BestTimes = {
    fiveK: fiveKSeconds,
    tenK: tenKSeconds,
    halfM: halfMSeconds,
  };

  // --- Weekly volume based on archetype ---
  let avgWeeklyKm: number;
  switch (archetype) {
    case 'casual': avgWeeklyKm = randFloat(3, 20); break;
    case 'regular': avgWeeklyKm = randFloat(20, 55); break;
    case 'serious': avgWeeklyKm = randFloat(55, 110); break;
    case 'elite': avgWeeklyKm = randFloat(110, 180); break;
  }

  // --- Consistency ---
  let activeWeeksLast12: number;
  switch (archetype) {
    case 'casual': activeWeeksLast12 = rand(3, 8); break;
    case 'regular': activeWeeksLast12 = rand(7, 11); break;
    case 'serious': activeWeeksLast12 = rand(10, 12); break;
    case 'elite': activeWeeksLast12 = rand(11, 12); break;
  }
  const totalWeeksOnPlatform = rand(4, 104); // 1 month to 2 years

  // --- Recovery ---
  const restDays = archetype === 'elite' ? randFloat(1, 2) :
                   archetype === 'serious' ? randFloat(1, 2.5) :
                   archetype === 'regular' ? randFloat(1.5, 3) :
                   randFloat(2, 5);
  const hrvOptions: ('improving' | 'stable' | 'declining' | undefined)[] = ['improving', 'stable', 'declining', undefined];
  const hrvTrend = Math.random() < 0.6 ? pick(hrvOptions.slice(0, 3) as ('improving' | 'stable' | 'declining')[]) : undefined;
  const avgRPE = archetype === 'casual' ? randFloat(3, 6) :
                 archetype === 'regular' ? randFloat(4, 7) :
                 archetype === 'serious' ? randFloat(5, 7.5) :
                 randFloat(5, 8);
  const avgSleep = randFloat(5.5, 8.5);

  const recoveryData: RecoveryData = {
    avgRestDaysPerWeek: restDays,
    hrvTrend,
    avgRPE,
    avgSleepHours: avgSleep,
  };

  // --- VO2max (estimated from 5K using Daniels, clamped for slow runners) ---
  const minutes5K = fiveKSeconds / 60;
  let vo2max: number;
  if (minutes5K > 35) {
    // Daniels formula unreliable above 35 min — use linear estimate
    vo2max = 40 - (minutes5K - 20) * 0.8; // ~28 for 35min, ~20 for 50min
  } else {
    vo2max = 120.8 - 3.12 * minutes5K + 0.032 * minutes5K * minutes5K;
  }
  vo2max = Math.max(20, Math.min(80, vo2max));
  // Add some noise (real-world estimates aren't perfect)
  vo2max += randFloat(-3, 3);
  const vo2maxDate = new Date(Date.now() - rand(1, 60) * 86400000); // measured 1-60 days ago

  // --- Pace zones & compliance ---
  const racePace = fiveKSeconds / 5; // sec/km
  const paceZones: PaceZones = {
    easy: racePace + 70,
    tempo: racePace + 20,
    interval: racePace - 15,
  };

  // Generate recent runs for compliance check
  const numRuns = rand(10, 40);
  const runs: RunForCompliance[] = [];
  const zoneOptions: ('easy' | 'tempo' | 'interval' | undefined)[] = ['easy', 'easy', 'easy', 'tempo', 'interval', undefined];
  for (let i = 0; i < numRuns; i++) {
    const zone = pick(zoneOptions);
    let pace: number;
    if (zone === 'easy') {
      pace = paceZones.easy + randFloat(-20, 30); // some run too fast on easy days
    } else if (zone === 'tempo') {
      pace = paceZones.tempo + randFloat(-15, 15);
    } else if (zone === 'interval') {
      pace = paceZones.interval + randFloat(-10, 20);
    } else {
      pace = racePace + randFloat(20, 60); // unstructured
    }
    runs.push({ prescribedZone: zone, average_pace_per_km: pace });
  }

  // --- Coach assignment ---
  const coach = pick(COACH_STYLES);

  // --- Safety data ---
  const acuteLoad = avgWeeklyKm * randFloat(0.8, 1.3);
  const chronicLoad = avgWeeklyKm * randFloat(0.9, 1.1);
  const safetyData = {
    acuteLoad7day: acuteLoad,
    chronicLoad28day: chronicLoad,
    currentWeekVolume: avgWeeklyKm * randFloat(0.8, 1.25),
    avg4WeekVolume: avgWeeklyKm,
    weeksSinceLastRun: archetype === 'casual' ? rand(0, 3) : rand(0, 1),
  };

  // ========== RUN THE CLASSIFICATION ENGINE ==========
  const performanceScore = normalizePerformance(bestTimes, age, gender);
  const volumeScore = normalizeVolume(avgWeeklyKm, gender);
  const consistencyScore = normalizeConsistency(activeWeeksLast12, totalWeeksOnPlatform);
  const recoveryScore = normalizeRecovery(recoveryData);
  const vo2maxScore = normalizeVO2max(vo2max, gender, vo2maxDate);
  const complianceScore = normalizePaceCompliance(runs, paceZones);

  const factors: FactorScores = {
    performance: performanceScore,
    volume: volumeScore,
    consistency: consistencyScore,
    recovery: recoveryScore,
    vo2max: vo2maxScore,
    paceCompliance: complianceScore,
  };

  const classification = calculateRunnerLevel(factors);
  const safety = checkSafetyRails(safetyData);

  return {
    id: index + 1,
    name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    age,
    gender,
    archetype,
    coach,
    bestTimes: {
      fiveK: formatPace(fiveKSeconds / 5) + '/km (' + formatTime(fiveKSeconds) + ')',
      tenK: tenKSeconds ? formatTime(tenKSeconds) : null,
      halfM: halfMSeconds ? formatTime(halfMSeconds) : null,
    },
    avgWeeklyKm: Math.round(avgWeeklyKm * 10) / 10,
    activeWeeksLast12,
    totalWeeksOnPlatform,
    vo2max: Math.round(vo2max * 10) / 10,
    factors: {
      performance: Math.round(performanceScore * 10) / 10,
      volume: volumeScore,
      consistency: consistencyScore,
      recovery: recoveryScore,
      vo2max: vo2maxScore,
      paceCompliance: complianceScore,
    },
    classification: {
      tier: classification.tier,
      tierName: tierDisplayName(classification.tier),
      subLevel: classification.subLevel,
      rawScore: Math.round(classification.rawScore * 100) / 100,
      display: `${classification.tier}${classification.subLevel}`,
    },
    safety: {
      canAdvance: safety.canAdvance,
      activeRails: safety.activeRails,
      message: safety.message,
    },
    numRuns,
  };
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ============================================================================
// Run Simulation
// ============================================================================

console.log(`Generating ${NUM_USERS} simulated users with Classification Engine V2...\n`);

const results: ReturnType<typeof generateSimulatedUser>[] = [];
for (let i = 0; i < NUM_USERS; i++) {
  results.push(generateSimulatedUser(i));
}

// ============================================================================
// Analyze Distribution
// ============================================================================

const tierBreakdown: Record<ClassificationTier, number> = { B: 0, I: 0, A: 0, P: 0 };
const coachBreakdown: Record<string, number> = {};
const archetypeBreakdown: Record<string, number> = {};

for (const user of results) {
  tierBreakdown[user.classification.tier]++;
  coachBreakdown[user.coach] = (coachBreakdown[user.coach] || 0) + 1;
  archetypeBreakdown[user.archetype] = (archetypeBreakdown[user.archetype] || 0) + 1;
}

const avgRawScore = Math.round(results.reduce((s, u) => s + u.classification.rawScore, 0) / NUM_USERS * 100) / 100;
const avgWeeklyKm = Math.round(results.reduce((s, u) => s + u.avgWeeklyKm, 0) / NUM_USERS * 10) / 10;
const avgVO2max = Math.round(results.reduce((s, u) => s + u.vo2max, 0) / NUM_USERS * 10) / 10;
const safetyRailCount = results.filter(u => u.safety.activeRails.length > 0).length;

// Level distribution (1-40)
const levelDist: Record<number, number> = {};
for (const user of results) {
  const lvl = Math.round(user.classification.rawScore);
  levelDist[lvl] = (levelDist[lvl] || 0) + 1;
}

// ============================================================================
// Output
// ============================================================================

console.log('╔══════════════════════════════════════════════════════╗');
console.log('║   SPRINT SOCIETY — CLASSIFICATION ENGINE V2 SIM     ║');
console.log('╚══════════════════════════════════════════════════════╝\n');

console.log('=== TIER DISTRIBUTION ===');
console.log(`  Beginner (B):     ${tierBreakdown.B}%  (target: ~40%)`);
console.log(`  Intermediate (I): ${tierBreakdown.I}%  (target: ~35%)`);
console.log(`  Advanced (A):     ${tierBreakdown.A}%  (target: ~20%)`);
console.log(`  Pro (P):          ${tierBreakdown.P}%   (target: ~5%)\n`);

console.log('=== ARCHETYPE DISTRIBUTION ===');
console.log(`  Casual:  ${archetypeBreakdown['casual'] || 0}`);
console.log(`  Regular: ${archetypeBreakdown['regular'] || 0}`);
console.log(`  Serious: ${archetypeBreakdown['serious'] || 0}`);
console.log(`  Elite:   ${archetypeBreakdown['elite'] || 0}\n`);

console.log('=== COACH ASSIGNMENT ===');
for (const [coach, count] of Object.entries(coachBreakdown)) {
  console.log(`  ${coach}: ${count}`);
}

console.log('\n=== AVERAGES ===');
console.log(`  Avg raw score:  ${avgRawScore}`);
console.log(`  Avg weekly km:  ${avgWeeklyKm}`);
console.log(`  Avg VO2max:     ${avgVO2max}`);
console.log(`  Safety rails:   ${safetyRailCount} users flagged\n`);

// Sample users
console.log('=== SAMPLE USERS ===');
const samples = [results[0], results[Math.floor(NUM_USERS * 0.4)], results[Math.floor(NUM_USERS * 0.75)], results[NUM_USERS - 1]];
for (const u of samples) {
  console.log(`  ${u.name} (${u.age}${u.gender[0].toUpperCase()}) — ${u.classification.display} (${u.classification.tierName}) | Score: ${u.classification.rawScore} | 5K: ${u.bestTimes.fiveK} | ${u.avgWeeklyKm}km/wk | VO2: ${u.vo2max}`);
}

// ============================================================================
// Save Results
// ============================================================================

const summary = {
  meta: {
    generated_at: new Date().toISOString(),
    engine_version: 'v2',
    total_users: NUM_USERS,
  },
  distribution: {
    tier: {
      B: tierBreakdown.B,
      I: tierBreakdown.I,
      A: tierBreakdown.A,
      P: tierBreakdown.P,
    },
    archetype: archetypeBreakdown,
    coach: coachBreakdown,
    level: levelDist,
  },
  averages: {
    raw_score: avgRawScore,
    weekly_km: avgWeeklyKm,
    vo2max: avgVO2max,
    safety_flagged: safetyRailCount,
  },
  users: results.map(u => ({
    id: u.id,
    name: u.name,
    age: u.age,
    gender: u.gender,
    archetype: u.archetype,
    coach: u.coach,
    tier: u.classification.tier,
    tier_name: u.classification.tierName,
    sub_level: u.classification.subLevel,
    display: u.classification.display,
    raw_score: u.classification.rawScore,
    factors: u.factors,
    best_5k: u.bestTimes.fiveK,
    best_10k: u.bestTimes.tenK,
    best_hm: u.bestTimes.halfM,
    weekly_km: u.avgWeeklyKm,
    vo2max: u.vo2max,
    active_weeks_12: u.activeWeeksLast12,
    safety_rails: u.safety.activeRails,
    num_runs: u.numRuns,
  })),
};

const outDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'simulation-results.json');
fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
console.log(`\nResults saved to: ${outPath}`);
