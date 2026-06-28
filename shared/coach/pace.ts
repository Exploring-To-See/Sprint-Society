// Minimal pace helpers for the shared one-way coach engine, so the engine has
// NO dependency on server- or client-specific code and can run in both. The
// server's engine/paceCalculator has an identical formatPace/PaceZones; TypeScript
// structural typing makes the two PaceZones interchangeable at call sites.

export interface PaceZones {
  easy_pace_per_km: number;
  tempo_pace_per_km: number;
  interval_pace_per_km: number;
  race_pace_per_km: number;
}

/** Format seconds-per-km as "m:ss/km". */
export function formatPace(secondsPerKm: number): string {
  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.round(secondsPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}/km`;
}
