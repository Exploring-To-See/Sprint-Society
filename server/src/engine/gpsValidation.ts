/**
 * GPS Fraud Detection Module
 *
 * Validates run data for anomalies and spoofing indicators.
 * Flags suspicious activities but does NOT block them — the suspicious
 * flag is stored on the activity record for admin review.
 */

export interface GpsValidationInput {
  distanceMeters: number;
  movingTimeSeconds: number;
  pacePerKm: number;
  splits?: string | null; // JSON string of per-km splits
  elevationGain?: number | null;
}

export interface GpsValidationResult {
  suspicious: boolean;
  flags: string[];
  confidence: number; // 0-100, how confident we are this is legit (100 = definitely legit)
}

/**
 * Validate a run for GPS fraud / spoofing indicators.
 *
 * Checks:
 * 1. Impossible pace (faster than 2:30/km or slower than 15:00/km)
 * 2. Impossible distance jumps between GPS points (teleportation via splits)
 * 3. Suspiciously consistent pace (zero variance = likely spoofed)
 * 4. Impossible elevation gain for distance
 */
export function validateRunData(input: GpsValidationInput): GpsValidationResult {
  const flags: string[] = [];
  let confidence = 100;

  const { distanceMeters, movingTimeSeconds, pacePerKm, splits, elevationGain } = input;

  // --- 1. IMPOSSIBLE PACE ---
  // World record marathon pace is ~2:53/km (Kipchoge), 1500m is ~3:26/km pace
  // Sub-2:30/km is basically impossible for any sustained distance
  const MIN_PACE_SECONDS = 150; // 2:30/km — physically impossible for sustained running
  const MAX_PACE_SECONDS = 900; // 15:00/km — slower than walking

  if (pacePerKm > 0 && pacePerKm < MIN_PACE_SECONDS && distanceMeters > 500) {
    flags.push(`impossible_pace: ${formatPace(pacePerKm)}/km is faster than world record pace`);
    confidence -= 40;
  }

  if (pacePerKm > MAX_PACE_SECONDS && distanceMeters > 500) {
    flags.push(`extremely_slow: ${formatPace(pacePerKm)}/km is slower than walking pace`);
    confidence -= 15; // Less suspicious — could be a walk/rest heavy run
  }

  // --- 2. TELEPORTATION DETECTION (via splits) ---
  if (splits) {
    try {
      const splitData = typeof splits === 'string' ? JSON.parse(splits) : splits;

      if (Array.isArray(splitData) && splitData.length > 1) {
        for (let i = 1; i < splitData.length; i++) {
          const prevPace = parseSplitPace(splitData[i - 1]);
          const currPace = parseSplitPace(splitData[i]);

          if (prevPace > 0 && currPace > 0) {
            const paceRatio = Math.max(prevPace, currPace) / Math.min(prevPace, currPace);

            // If pace doubles/halves between consecutive splits, that's suspicious
            // (e.g., 6:00/km to 3:00/km in a single kilometer = likely GPS jump)
            if (paceRatio > 3.0) {
              flags.push(`teleportation: pace jumped ${formatPace(prevPace)} to ${formatPace(currPace)} between km ${i} and ${i + 1}`);
              confidence -= 25;
            }
          }
        }
      }
    } catch {
      // Splits parsing failed — not suspicious, just malformed data
    }
  }

  // --- 3. SUSPICIOUSLY CONSISTENT PACE ---
  if (splits) {
    try {
      const splitData = typeof splits === 'string' ? JSON.parse(splits) : splits;

      if (Array.isArray(splitData) && splitData.length >= 3) {
        const paces = splitData.map(parseSplitPace).filter(p => p > 0);

        if (paces.length >= 3) {
          const mean = paces.reduce((sum, p) => sum + p, 0) / paces.length;
          const variance = paces.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / paces.length;
          const coefficientOfVariation = Math.sqrt(variance) / mean;

          // CV < 0.5% across 3+ splits is unnaturally consistent
          // Real runners have at least 2-5% variation even on flat courses
          if (coefficientOfVariation < 0.005 && paces.length >= 3) {
            flags.push(`zero_variance: pace variation is ${(coefficientOfVariation * 100).toFixed(3)}% — unnaturally consistent (likely spoofed)`);
            confidence -= 35;
          } else if (coefficientOfVariation < 0.01 && paces.length >= 5) {
            flags.push(`low_variance: pace variation is only ${(coefficientOfVariation * 100).toFixed(2)}% across ${paces.length} splits — suspiciously consistent`);
            confidence -= 15;
          }
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  // --- 4. IMPOSSIBLE ELEVATION ---
  if (elevationGain && distanceMeters > 0) {
    const distanceKm = distanceMeters / 1000;
    // Average grade > 30% sustained is essentially impossible for running
    // Elevation gain per km > 300m is vertical cliff territory
    const gainPerKm = elevationGain / distanceKm;

    if (gainPerKm > 300) {
      flags.push(`impossible_elevation: ${Math.round(gainPerKm)}m gain per km is physically impossible`);
      confidence -= 20;
    }
  }

  // --- 5. IMPOSSIBLY SHORT TIME FOR DISTANCE ---
  if (distanceMeters > 10000 && movingTimeSeconds < 60) {
    flags.push(`impossible_speed: ${(distanceMeters / 1000).toFixed(1)}km in ${movingTimeSeconds}s is impossible`);
    confidence -= 50;
  }

  // Clamp confidence
  confidence = Math.max(0, Math.min(100, confidence));

  return {
    suspicious: confidence < 60 || flags.length >= 2,
    flags,
    confidence,
  };
}

/**
 * Parse pace from a split entry.
 * Handles different split formats: { pace: number }, { time: number, distance: number }, number
 */
function parseSplitPace(split: unknown): number {
  if (typeof split === 'number') return split;
  if (!split || typeof split !== 'object') return 0;

  const s = split as Record<string, unknown>;

  // Format: { pace: secondsPerKm }
  if (typeof s.pace === 'number') return s.pace;

  // Format: { time: seconds, distance: meters }
  if (typeof s.time === 'number' && typeof s.distance === 'number' && s.distance > 0) {
    return s.time / (Number(s.distance) / 1000);
  }

  // Format: { elapsed_time: seconds } (per-km split, distance is 1km)
  if (typeof s.elapsed_time === 'number') return Number(s.elapsed_time);

  // Format: { average_pace: seconds }
  if (typeof s.average_pace === 'number') return Number(s.average_pace);

  return 0;
}

function formatPace(secondsPerKm: number): string {
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
