/**
 * Personal Records Engine
 *
 * Tracks PRs across ALL standard race distances plus custom bests.
 * Detects new PRs on every activity sync — triggers celebration moments.
 *
 * Standard distances: 1K, 3K, 5K, 10K, Half Marathon, Marathon
 * Plus: Longest Run, Fastest Pace, Highest Elevation, Most Active Week
 */

interface Activity {
  id: number;
  distance_meters: number;
  moving_time_seconds: number;
  average_pace_per_km: number;
  average_heartrate?: number;
  max_heartrate?: number;
  elevation_gain?: number;
  start_date: string;
}

interface PersonalRecord {
  id: string;
  category: string;
  distance_meters?: number;
  value: number;
  formatted: string;
  activity_id: number;
  date: string;
  previous_best?: { value: number; formatted: string; date: string };
  improvement?: { value: number; formatted: string; percent: number };
}

interface PRCheck {
  new_prs: PersonalRecord[];
  near_misses: { category: string; current: string; pr: string; gap_percent: number }[];
  total_prs: number;
}

// Standard race distances (meters)
const RACE_DISTANCES = [
  { meters: 1000, name: '1K', tolerance: 0.15 },
  { meters: 3000, name: '3K', tolerance: 0.12 },
  { meters: 5000, name: '5K', tolerance: 0.10 },
  { meters: 10000, name: '10K', tolerance: 0.10 },
  { meters: 21097, name: 'Half Marathon', tolerance: 0.08 },
  { meters: 42195, name: 'Marathon', tolerance: 0.05 },
] as const;

// ===== CALCULATE ALL PERSONAL RECORDS =====

export function calculateAllPRs(activities: Activity[]): PersonalRecord[] {
  if (activities.length === 0) return [];

  const prs: PersonalRecord[] = [];

  // Distance-based PRs (fastest time for each distance)
  for (const race of RACE_DISTANCES) {
    const eligible = activities.filter(a => {
      const ratio = a.distance_meters / race.meters;
      return ratio >= (1 - race.tolerance) && ratio <= (1 + race.tolerance);
    });

    if (eligible.length === 0) continue;

    // Normalize times to exact distance (proportional)
    const normalized = eligible.map(a => ({
      ...a,
      normalized_time: Math.round(a.moving_time_seconds * (race.meters / a.distance_meters)),
    }));

    const best = normalized.sort((a, b) => a.normalized_time - b.normalized_time)[0];

    prs.push({
      id: `best_${race.name.toLowerCase().replace(' ', '_')}`,
      category: `Best ${race.name}`,
      distance_meters: race.meters,
      value: best.normalized_time,
      formatted: formatDuration(best.normalized_time),
      activity_id: best.id,
      date: best.start_date,
    });
  }

  // Fastest pace (min 1km distance)
  const paceEligible = activities.filter(a => a.distance_meters >= 1000);
  if (paceEligible.length > 0) {
    const fastest = paceEligible.sort((a, b) => a.average_pace_per_km - b.average_pace_per_km)[0];
    prs.push({
      id: 'fastest_pace',
      category: 'Fastest Pace',
      value: fastest.average_pace_per_km,
      formatted: `${formatPace(fastest.average_pace_per_km)}/km`,
      activity_id: fastest.id,
      date: fastest.start_date,
    });
  }

  // Longest run
  const longest = [...activities].sort((a, b) => b.distance_meters - a.distance_meters)[0];
  prs.push({
    id: 'longest_run',
    category: 'Longest Run',
    value: longest.distance_meters,
    formatted: `${(longest.distance_meters / 1000).toFixed(2)} km`,
    activity_id: longest.id,
    date: longest.start_date,
  });

  // Longest duration
  const longestDuration = [...activities].sort((a, b) => b.moving_time_seconds - a.moving_time_seconds)[0];
  prs.push({
    id: 'longest_duration',
    category: 'Longest Duration',
    value: longestDuration.moving_time_seconds,
    formatted: formatDuration(longestDuration.moving_time_seconds),
    activity_id: longestDuration.id,
    date: longestDuration.start_date,
  });

  // Highest elevation gain
  const withElevation = activities.filter(a => a.elevation_gain && a.elevation_gain > 0);
  if (withElevation.length > 0) {
    const highest = withElevation.sort((a, b) => (b.elevation_gain || 0) - (a.elevation_gain || 0))[0];
    prs.push({
      id: 'highest_elevation',
      category: 'Most Elevation',
      value: highest.elevation_gain || 0,
      formatted: `${highest.elevation_gain}m`,
      activity_id: highest.id,
      date: highest.start_date,
    });
  }

  // Fastest 1km split (if we have split data)
  // TODO: implement when split data is available

  return prs;
}

// ===== CHECK NEW ACTIVITY FOR PRs =====

export function checkForNewPRs(
  newActivity: Activity,
  existingPRs: PersonalRecord[]
): PRCheck {
  const newPRs: PersonalRecord[] = [];
  const nearMisses: PRCheck['near_misses'] = [];

  // Check each race distance
  for (const race of RACE_DISTANCES) {
    const ratio = newActivity.distance_meters / race.meters;
    if (ratio < (1 - race.tolerance) || ratio > (1 + race.tolerance)) continue;

    const normalizedTime = Math.round(newActivity.moving_time_seconds * (race.meters / newActivity.distance_meters));
    const existingPR = existingPRs.find(pr => pr.id === `best_${race.name.toLowerCase().replace(' ', '_')}`);

    if (!existingPR) {
      // First time at this distance!
      newPRs.push({
        id: `best_${race.name.toLowerCase().replace(' ', '_')}`,
        category: `Best ${race.name}`,
        distance_meters: race.meters,
        value: normalizedTime,
        formatted: formatDuration(normalizedTime),
        activity_id: newActivity.id,
        date: newActivity.start_date,
      });
    } else if (normalizedTime < existingPR.value) {
      // NEW PR!
      const improvement = existingPR.value - normalizedTime;
      const improvementPercent = Math.round((improvement / existingPR.value) * 1000) / 10;

      newPRs.push({
        id: existingPR.id,
        category: existingPR.category,
        distance_meters: race.meters,
        value: normalizedTime,
        formatted: formatDuration(normalizedTime),
        activity_id: newActivity.id,
        date: newActivity.start_date,
        previous_best: {
          value: existingPR.value,
          formatted: existingPR.formatted,
          date: existingPR.date,
        },
        improvement: {
          value: improvement,
          formatted: formatDuration(improvement),
          percent: improvementPercent,
        },
      });
    } else {
      // Near miss? (within 3%)
      const gapPercent = Math.round(((normalizedTime - existingPR.value) / existingPR.value) * 1000) / 10;
      if (gapPercent <= 3) {
        nearMisses.push({
          category: `Best ${race.name}`,
          current: formatDuration(normalizedTime),
          pr: existingPR.formatted,
          gap_percent: gapPercent,
        });
      }
    }
  }

  // Check fastest pace
  if (newActivity.distance_meters >= 1000) {
    const existingPacePR = existingPRs.find(pr => pr.id === 'fastest_pace');
    if (!existingPacePR || newActivity.average_pace_per_km < existingPacePR.value) {
      newPRs.push({
        id: 'fastest_pace',
        category: 'Fastest Pace',
        value: newActivity.average_pace_per_km,
        formatted: `${formatPace(newActivity.average_pace_per_km)}/km`,
        activity_id: newActivity.id,
        date: newActivity.start_date,
        previous_best: existingPacePR ? { value: existingPacePR.value, formatted: existingPacePR.formatted, date: existingPacePR.date } : undefined,
      });
    }
  }

  // Check longest run
  const existingLongest = existingPRs.find(pr => pr.id === 'longest_run');
  if (!existingLongest || newActivity.distance_meters > existingLongest.value) {
    newPRs.push({
      id: 'longest_run',
      category: 'Longest Run',
      value: newActivity.distance_meters,
      formatted: `${(newActivity.distance_meters / 1000).toFixed(2)} km`,
      activity_id: newActivity.id,
      date: newActivity.start_date,
      previous_best: existingLongest ? { value: existingLongest.value, formatted: existingLongest.formatted, date: existingLongest.date } : undefined,
    });
  }

  // Check elevation
  if (newActivity.elevation_gain && newActivity.elevation_gain > 0) {
    const existingElev = existingPRs.find(pr => pr.id === 'highest_elevation');
    if (!existingElev || newActivity.elevation_gain > existingElev.value) {
      newPRs.push({
        id: 'highest_elevation',
        category: 'Most Elevation',
        value: newActivity.elevation_gain,
        formatted: `${newActivity.elevation_gain}m`,
        activity_id: newActivity.id,
        date: newActivity.start_date,
        previous_best: existingElev ? { value: existingElev.value, formatted: existingElev.formatted, date: existingElev.date } : undefined,
      });
    }
  }

  return {
    new_prs: newPRs,
    near_misses: nearMisses,
    total_prs: existingPRs.length + newPRs.length,
  };
}

// ===== PR SUMMARY FOR DISPLAY =====

export function getPRSummary(prs: PersonalRecord[]): {
  race_prs: PersonalRecord[];
  effort_prs: PersonalRecord[];
  total_count: number;
  latest_pr?: PersonalRecord;
  predicted_next?: { category: string; current: string; projected: string; weeks_away: number };
} {
  const racePRs = prs.filter(pr => pr.distance_meters);
  const effortPRs = prs.filter(pr => !pr.distance_meters);

  // Sort by date to find latest
  const sorted = [...prs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    race_prs: racePRs,
    effort_prs: effortPRs,
    total_count: prs.length,
    latest_pr: sorted[0],
  };
}

// ===== HELPERS =====

function formatPace(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
