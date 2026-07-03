// Run tracker (/run/track) — reskinned on ss-base (reference: run.html). The GPS /
// timer / split / save logic is untouched; only the five states' UI moved onto the
// liquid-glass system: Idle (map preview + START disc + pace-zone tile), Running /
// Paused (map + instrument overlay), Finished (stats + RPE + save), Analysis (score
// orb + AI commentary + cascade rewards + PR celebration via GET /records/check/:id).
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { SSScreen } from '../components/ss/SSScreen';
import { Gauge } from '../components/ss/Gauge';
import { SplitChart } from '../components/run/SplitChart';
import { ProgressRing } from '../components/run/ProgressRing';
import { ZoneBar } from '../components/run/ZoneBar';
import { Play, Bolt, Flame, Trophy } from '../components/ss/icons';
import { useAuth } from '../context/AuthContext';

type TrackingState = 'IDLE' | 'RUNNING' | 'PAUSED' | 'FINISHED' | 'ANALYSIS';

interface Position {
  lat: number;
  lon: number;
  timestamp: number;
  altitude: number | null;
}

interface Split {
  km: number;
  time_seconds: number;
}

interface RunAnalysis {
  score: number;
  tags: string[];
  commentary: string;
  fastest_km: number | null;
  slowest_km: number | null;
  vs_last_run_percent: number | null;
}

interface PRCelebration {
  has_new_pr: boolean;
  new_prs: { id: string; category: string; formatted: string }[];
  celebration: { title: string; message: string; type: 'gold' | 'silver' | 'bronze' } | null;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatPace(paceSeconds: number): string {
  if (!paceSeconds || !isFinite(paceSeconds) || paceSeconds <= 0) return '--:--';
  const mins = Math.floor(paceSeconds / 60);
  const secs = Math.round(paceSeconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function MapFollower({ position }: { position: LatLngExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, map.getZoom(), { animate: true });
  }, [position, map]);
  return null;
}

function FitBounds({ positions }: { positions: LatLngExpression[] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 1) {
      map.fitBounds(positions as [number, number][], { padding: [40, 40] });
    }
  }, [positions, map]);
  return null;
}

// mono stat cell (reference .qcell)
function QCell({ v, unit, k }: { v: string; unit?: string; k: string }) {
  return (
    <div className="ss-surface ss-recess" style={{ borderRadius: 18, padding: '12px 11px' }}>
      <div className="num" style={{ font: '600 var(--m-md) var(--mono)', color: 'var(--fg)', lineHeight: 1, display: 'flex', alignItems: 'baseline', gap: 2, whiteSpace: 'nowrap' }}>
        {v}
        {unit && <small style={{ font: '500 10px var(--mono)', color: 'var(--muted)' }}>{unit}</small>}
      </div>
      <div style={{ font: '600 var(--lbl) var(--body)', textTransform: 'uppercase', letterSpacing: 'var(--trk-sm)', color: 'var(--muted-2)', marginTop: 6, whiteSpace: 'nowrap' }}>{k}</div>
    </div>
  );
}

const RPE_OPTIONS = [
  { value: 1, label: 'Easy' },
  { value: 2, label: 'Moderate' },
  { value: 3, label: 'Hard' },
  { value: 4, label: 'V. Hard' },
  { value: 5, label: 'All out' },
] as const;

export function RunTrackerPage() {
  const { token } = useAuth() as { token: string | null };
  const navigate = useNavigate();
  const [state, setState] = useState<TrackingState>('IDLE');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [currentPace, setCurrentPace] = useState(0);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [elevationGain, setElevationGain] = useState(0);
  const [splits, setSplits] = useState<Split[]>([]);
  const [rpe, setRpe] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [analysis, setAnalysis] = useState<RunAnalysis | null>(null);
  const [kenduEarned, setKenduEarned] = useState<number | null>(null);
  const [cascadeData, setCascadeData] = useState<any>(null);
  const [prCelebration, setPrCelebration] = useState<PRCelebration | null>(null);
  const [paceZones, setPaceZones] = useState<{ easy_min: number; easy_max: number }>({ easy_min: 375, easy_max: 405 });

  const positionsRef = useRef<Position[]>([]);
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<string | null>(null);
  const paceCalcRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevAltitudeRef = useRef<number | null>(null);
  const lastSplitKmRef = useRef(0);
  const splitStartTimeRef = useRef(0);

  const [locating, setLocating] = useState(true);

  // Get initial location
  useEffect(() => {
    if (!navigator.geolocation) { setLocating(false); setGpsError('GPS not supported'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLocation([pos.coords.latitude, pos.coords.longitude]); setLocating(false); },
      () => { setLocating(false); setGpsError('Could not determine location'); }
    );
    // Fetch pace zones for zone bar (non-critical, silent fallback to defaults)
    fetch('/api/training/paces', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.easy_pace) {
          setPaceZones({ easy_min: data.easy_pace - 15, easy_max: data.easy_pace + 15 });
        }
      })
      .catch(() => { /* non-critical: pace zones use defaults */ });
  }, []);

  // Timer
  useEffect(() => {
    if (state === 'RUNNING') {
      timerRef.current = setInterval(() => setElapsedSeconds(prev => prev + 1), 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state]);

  // Pace calculation every 5 seconds
  useEffect(() => {
    if (state === 'RUNNING') {
      paceCalcRef.current = setInterval(() => {
        const positions = positionsRef.current;
        if (positions.length < 2) return;
        let distAccum = 0;
        let timeSpan = 0;
        for (let i = positions.length - 1; i > 0 && distAccum < 100; i--) {
          const d = haversineDistance(positions[i - 1].lat, positions[i - 1].lon, positions[i].lat, positions[i].lon);
          distAccum += d;
          timeSpan = (positions[i].timestamp - positions[i - 1].timestamp) / 1000;
        }
        if (distAccum > 10 && timeSpan > 0) {
          setCurrentPace((timeSpan / distAccum) * 1000);
        }
      }, 5000);
    } else {
      if (paceCalcRef.current) { clearInterval(paceCalcRef.current); paceCalcRef.current = null; }
    }
    return () => { if (paceCalcRef.current) clearInterval(paceCalcRef.current); };
  }, [state]);

  const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
    const newPos: Position = {
      lat: position.coords.latitude,
      lon: position.coords.longitude,
      timestamp: position.timestamp,
      altitude: position.coords.altitude,
    };

    // Elevation
    if (newPos.altitude !== null) {
      if (prevAltitudeRef.current !== null) {
        const altDiff = newPos.altitude - prevAltitudeRef.current;
        if (altDiff > 2) { setElevationGain(prev => prev + altDiff); prevAltitudeRef.current = newPos.altitude; }
        else if (altDiff < -2) { prevAltitudeRef.current = newPos.altitude; }
      } else { prevAltitudeRef.current = newPos.altitude; }
    }

    setUserLocation([newPos.lat, newPos.lon]);
    const positions = positionsRef.current;

    if (positions.length > 0) {
      const lastPos = positions[positions.length - 1];
      const dist = haversineDistance(lastPos.lat, lastPos.lon, newPos.lat, newPos.lon);
      if (dist >= 2 && dist < 100) {
        positionsRef.current = [...positions, newPos];
        setRouteCoords(prev => [...prev, [newPos.lat, newPos.lon]]);
        setTotalDistance(prev => {
          const newTotal = prev + dist;
          const currentKm = Math.floor(newTotal / 1000);
          if (currentKm > lastSplitKmRef.current) {
            for (let km = lastSplitKmRef.current + 1; km <= currentKm; km++) {
              setSplits(prevSplits => [...prevSplits, { km, time_seconds: Math.round((position.timestamp - splitStartTimeRef.current) / 1000) }]);
              splitStartTimeRef.current = position.timestamp;
            }
            lastSplitKmRef.current = currentKm;
          }
          return newTotal;
        });
      }
    } else {
      positionsRef.current = [newPos];
      setRouteCoords([[newPos.lat, newPos.lon]]);
      splitStartTimeRef.current = position.timestamp;
    }
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) { setGpsError('GPS not supported'); return; }
    setGpsError(null);
    startTimeRef.current = new Date().toISOString();
    positionsRef.current = [];
    setRouteCoords([]);
    setTotalDistance(0);
    setElapsedSeconds(0);
    setCurrentPace(0);
    setElevationGain(0);
    setSplits([]);
    setRpe(null);
    setAnalysis(null);
    setKenduEarned(null);
    setPrCelebration(null);
    prevAltitudeRef.current = null;
    lastSplitKmRef.current = 0;
    splitStartTimeRef.current = 0;
    setState('RUNNING');

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      (error) => {
        if (error.code === error.PERMISSION_DENIED) setGpsError('Location access denied');
        else if (error.code === error.POSITION_UNAVAILABLE) setGpsError('GPS signal unavailable');
        else setGpsError('GPS timeout — retrying...');
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
  }, [handlePositionUpdate]);

  const pauseTracking = useCallback(() => {
    setState('PAUSED');
    if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
  }, []);

  const resumeTracking = useCallback(() => {
    setState('RUNNING');
    watchIdRef.current = navigator.geolocation.watchPosition(handlePositionUpdate, () => {}, { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 });
  }, [handlePositionUpdate]);

  const stopTracking = useCallback(() => {
    setState('FINISHED');
    if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
  }, []);

  const saveRun = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/runs/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          distance_meters: Math.round(totalDistance),
          moving_time_seconds: elapsedSeconds,
          start_date: startTimeRef.current,
          elevation_gain: Math.round(elevationGain),
          splits: JSON.stringify(splits),
          rpe,
          map_polyline: routeCoords.length > 1 ? JSON.stringify(routeCoords) : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Without this branch a non-2xx response (e.g. a server/DB error) was
        // silently swallowed: the run was lost with no message and no retry.
        throw new Error(data?.error?.message || data?.error || `Save failed (${res.status})`);
      }
      if (data.cascade) {
        setCascadeData(data.cascade);
        setKenduEarned(data.cascade.kendu?.awarded || 0);
      }
      // PR celebration (non-critical): did this run set any personal records?
      if (data.id) {
        fetch(`/api/records/check/${data.id}`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => (r.ok ? r.json() : null))
          .then((pr) => { if (pr?.has_new_pr) setPrCelebration(pr); })
          .catch(() => { /* non-critical */ });
      }
      generateAnalysis();
      setState('ANALYSIS');
    } catch (err) {
      console.error('Failed to save run:', err);
      setSaving(false);
      setState('FINISHED');
      setSaveError('We couldn\'t save your run. Check your connection and try again.');
      return;
    } finally { setSaving(false); }
  };

  const generateAnalysis = () => {
    const avgPace = totalDistance > 0 ? elapsedSeconds / (totalDistance / 1000) : 0;
    const km = totalDistance / 1000;

    // Score (simplified client-side)
    let score = 50;
    if (km >= 3) score += 10;
    if (km >= 5) score += 10;
    if (km >= 10) score += 10;
    if (splits.length >= 2 && avgPace > 0) {
      const variance = splits.reduce((sum, s) => sum + Math.abs(s.time_seconds - avgPace), 0) / splits.length;
      if (variance < avgPace * 0.1) score += 10; // consistent
    }
    if (splits.length >= 2 && splits[splits.length - 1].time_seconds < splits[0].time_seconds) score += 10; // negative split
    if (elevationGain > 30) score += 5;
    score = Math.min(99, Math.max(30, score));

    // Tags
    const tags: string[] = [];
    if (splits.length >= 2 && splits[splits.length - 1].time_seconds < splits[0].time_seconds) tags.push('Strong Finish');
    if (splits.length >= 2) {
      const v = splits.reduce((sum, s) => sum + Math.abs(s.time_seconds - avgPace), 0) / splits.length;
      if (v < avgPace * 0.1) tags.push('Steady Pacer');
    }
    if (km >= 8) tags.push('Endurance Builder');
    if (elevationGain > 50) tags.push('Hill Crusher');
    if (avgPace > 0 && avgPace < 330) tags.push('Speed Demon');
    if (tags.length === 0) tags.push('Consistent Runner');
    if (tags.length === 1) tags.push('Keep Improving');

    // Commentary
    let commentary = `Solid ${km.toFixed(1)}km effort at ${formatPace(avgPace)}/km. `;
    if (splits.length >= 2 && splits[splits.length - 1].time_seconds < splits[0].time_seconds) {
      const improvement = Math.round((1 - splits[splits.length - 1].time_seconds / splits[0].time_seconds) * 100);
      commentary += `Great negative split — last km was ${improvement}% faster than your first. `;
    }
    if (elevationGain > 30) commentary += `Good hill work with ${Math.round(elevationGain)}m elevation gain.`;
    else commentary += 'Stay consistent and the pace will come.';

    // Fastest/slowest km
    let fastest: number | null = null, slowest: number | null = null;
    if (splits.length > 0) {
      fastest = splits.reduce((min, s) => s.time_seconds < min.time_seconds ? s : min, splits[0]).km;
      slowest = splits.reduce((max, s) => s.time_seconds > max.time_seconds ? s : max, splits[0]).km;
    }

    setAnalysis({ score, tags: tags.slice(0, 2), commentary, fastest_km: fastest, slowest_km: slowest, vs_last_run_percent: null });
  };

  const discardRun = () => {
    setState('IDLE');
    setElapsedSeconds(0);
    setTotalDistance(0);
    setCurrentPace(0);
    setElevationGain(0);
    setSplits([]);
    setRpe(null);
    setRouteCoords([]);
    setAnalysis(null);
    setKenduEarned(null);
    setPrCelebration(null);
    setSaveError(null);
    prevAltitudeRef.current = null;
    lastSplitKmRef.current = 0;
    splitStartTimeRef.current = 0;
    positionsRef.current = [];
    startTimeRef.current = null;
  };

  const averagePace = totalDistance > 0 ? (elapsedSeconds / (totalDistance / 1000)) : 0;
  const mapCenter = useMemo(() => userLocation || [0, 0] as [number, number], [userLocation]);

  const rewardChip = (bg: string, border: string, color: string, icon: React.ReactNode, label: string) => (
    <div style={{ flex: 1, borderRadius: 13, background: bg, border: `1px solid ${border}`, padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color, display: 'inline-flex' }}>{icon}</span>
      <span className="num" style={{ font: '600 12px var(--mono)', color }}>{label}</span>
    </div>
  );

  // ANALYSIS STATE — Post-run AI card
  if (state === 'ANALYSIS' && analysis) {
    return (
      <SSScreen hideNav bodyLabel="Run analysis">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="ss-pad"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, paddingTop: 10, paddingBottom: 24 }}
        >
          <p className="tlbl" style={{ color: 'var(--accent-2)' }}>Run analysis</p>

          {/* Score orb */}
          <Gauge value={analysis.score} display={String(analysis.score)} caption="/100" size={120} ariaLabel={`Run score ${analysis.score} out of 100`} />

          {/* Tags */}
          <div style={{ display: 'flex', gap: 8 }}>
            {analysis.tags.map(tag => (
              <span key={tag} className="ss-tag now">{tag}</span>
            ))}
          </div>

          {/* AI Commentary — the violet AI surface */}
          <div className="ss-surface ss-ai" style={{ borderRadius: 18, padding: 13, width: '100%', maxWidth: 340 }}>
            <span className="ss-aibadge">Coach's read</span>
            <p style={{ font: '400 12.5px/1.55 var(--body)', color: '#D7D7E4', marginTop: 8 }}>{analysis.commentary}</p>
          </div>

          {/* PR celebration */}
          {prCelebration?.has_new_pr && prCelebration.celebration && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="ss-surface"
              style={{ borderRadius: 18, padding: 13, width: '100%', maxWidth: 340, display: 'flex', gap: 11, alignItems: 'center', border: '1px solid rgba(251,191,36,.3)', background: 'rgba(251,191,36,.08)' }}
              data-testid="pr-celebration"
            >
              <span className="ticon" style={{ background: 'rgba(251,191,36,.16)', borderColor: 'rgba(251,191,36,.3)' }}>
                <Trophy width={14} height={14} style={{ color: 'var(--amber)' }} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ font: '700 12.5px var(--head)', color: 'var(--amber)', letterSpacing: '.02em' }}>{prCelebration.celebration.title}</p>
                <p style={{ font: '400 11px/1.5 var(--body)', color: 'var(--muted)', marginTop: 2 }}>{prCelebration.celebration.message}</p>
              </div>
            </motion.div>
          )}

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--gap)', width: '100%', maxWidth: 340 }}>
            <QCell v={(totalDistance / 1000).toFixed(2)} unit="km" k="Distance" />
            <QCell v={formatPace(averagePace)} unit="/km" k="Pace" />
            <QCell v={formatTime(elapsedSeconds)} k="Time" />
          </div>

          {/* Split Chart */}
          {splits.length > 1 && (
            <div className="ss-surface ss-recess" style={{ borderRadius: 18, padding: 14, width: '100%', maxWidth: 340 }}>
              <SplitChart splits={splits} averagePace={averagePace} />
            </div>
          )}

          {/* Fastest/Slowest */}
          {analysis.fastest_km && analysis.slowest_km && splits.length > 1 && (
            <div style={{ display: 'flex', gap: 10 }}>
              <span className="ss-dchip good">Fastest · Km {analysis.fastest_km} ({formatPace(splits.find(s => s.km === analysis.fastest_km)?.time_seconds || 0)})</span>
              <span className="ss-dchip warn">Slowest · Km {analysis.slowest_km} ({formatPace(splits.find(s => s.km === analysis.slowest_km)?.time_seconds || 0)})</span>
            </div>
          )}

          {/* Cascade Rewards */}
          {cascadeData && (
            <motion.div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 8 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {rewardChip('rgba(124,107,240,.12)', 'rgba(124,107,240,.26)', 'var(--violet-2)', <Bolt width={13} height={13} />, `+${cascadeData.xp?.awarded || 25} XP`)}
                {kenduEarned !== null && kenduEarned > 0 &&
                  rewardChip('rgba(249,115,22,.1)', 'rgba(249,115,22,.26)', 'var(--accent-2)', <Flame width={13} height={13} />, `+${kenduEarned} Kendu`)}
              </div>

              {cascadeData.streak?.current > 1 && (
                rewardChip('rgba(251,191,36,.1)', 'rgba(251,191,36,.24)', 'var(--amber)', <Flame width={13} height={13} />, `${cascadeData.streak.current}-day streak`)
              )}

              {cascadeData.personalBest?.isPB && (
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                  {rewardChip('rgba(52,211,153,.1)', 'rgba(52,211,153,.24)', 'var(--green)', <Trophy width={13} height={13} />,
                    `New personal best (${cascadeData.personalBest.type === 'pace' ? 'fastest pace' : 'longest run'})`)}
                </motion.div>
              )}

              {cascadeData.xp?.leveledUp && (
                <motion.div
                  className="ss-surface ss-hero"
                  style={{ borderRadius: 16, padding: '12px 14px', textAlign: 'center' }}
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1, type: 'spring' }}
                >
                  <p style={{ font: '700 14px var(--head)', color: 'var(--fg)' }}>Level {cascadeData.xp.level}</p>
                  <p style={{ font: '400 10.5px var(--body)', color: 'var(--muted)', marginTop: 2 }}>Keep pushing to unlock more</p>
                </motion.div>
              )}

              {cascadeData.achievements?.unlocked?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {cascadeData.achievements.unlocked.map((a: any) => (
                    <motion.div
                      key={a.id}
                      initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring' }}
                      style={{ borderRadius: 13, background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.22)', padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 10 }}
                    >
                      <Trophy width={15} height={15} style={{ color: 'var(--amber)', flex: 'none' }} />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ font: '600 12px var(--body)', color: 'var(--amber)' }}>{a.name}</p>
                        <p className="num" style={{ font: '500 10px var(--mono)', color: 'var(--muted-2)' }}>+{a.xpReward} XP</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 9, width: '100%', maxWidth: 340, paddingTop: 4 }}>
            <button className="ss-btn ss-btn-soft" onClick={() => navigate('/share')}>Share card</button>
            <button className="ss-btn ss-btn-primary" onClick={() => navigate('/dashboard', { state: { fromRun: true } })}>Back home</button>
          </div>
        </motion.div>
      </SSScreen>
    );
  }

  const immersive = state === 'RUNNING' || state === 'PAUSED';

  return (
    <SSScreen hideNav={immersive} bodyLabel="Run tracker">
      <div className="ss-pad" style={{ position: 'relative', minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        {/* Locating indicator */}
        {locating && state === 'IDLE' && (
          <div className="ss-surface ss-recess" style={{ height: 200, borderRadius: 20, display: 'grid', placeItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 24, height: 24, margin: '0 auto 8px', borderRadius: '50%',
                border: '2px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite',
              }} aria-hidden="true" />
              <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
              <p style={{ font: '500 12px var(--body)', color: 'var(--muted)' }}>Locating you...</p>
            </div>
          </div>
        )}

        {/* Map */}
        {!locating && (state !== 'IDLE' || userLocation) && (
          <div
            className="ss-surface ss-recess"
            style={{
              borderRadius: 20, padding: 0, overflow: 'hidden',
              height: state === 'IDLE' ? 200 : state === 'FINISHED' ? 180 : undefined,
              flex: immersive ? 1 : undefined,
              minHeight: immersive ? '50vh' : undefined,
            }}
          >
            <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
              <MapContainer
                center={mapCenter}
                zoom={15}
                style={{ width: '100%', height: '100%' }}
                zoomControl={false}
                attributionControl={false}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                {routeCoords.length > 1 && (
                  <Polyline positions={routeCoords} pathOptions={{ color: '#f97316', weight: 4, opacity: 0.9 }} />
                )}
                {immersive && userLocation && <MapFollower position={userLocation} />}
                {state === 'FINISHED' && routeCoords.length > 1 && <FitBounds positions={routeCoords} />}
              </MapContainer>
            </div>
            {state === 'IDLE' && (
              <span className="schip" style={{ position: 'absolute', top: 11, left: 11, zIndex: 2 }}>
                <span className="dot" aria-hidden="true" style={gpsError ? { background: 'var(--amber)', boxShadow: '0 0 0 3px rgba(251,191,36,.18)' } : undefined} />
                {gpsError ? 'GPS limited' : 'GPS ready'}
              </span>
            )}
          </div>
        )}

        {/* Keyed conditional mounts — an AnimatePresence mode="wait" nested under the route-level one stalls the entering child at opacity 0 */}
          {/* IDLE */}
          {state === 'IDLE' && (
            <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div style={{ textAlign: 'center', padding: '18px 0 4px' }}>
                <h1 style={{ font: '600 var(--m-hero) var(--head)', letterSpacing: '-.02em', color: 'var(--fg)', margin: 0 }}>Ready to run</h1>
                <p style={{ font: '500 12px var(--body)', color: 'var(--muted)', marginTop: 7 }}>GPS will track your route, pace &amp; distance</p>
              </div>

              {gpsError && (
                <div style={{ borderRadius: 13, background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.22)', padding: '8px 14px', alignSelf: 'center' }}>
                  <p style={{ font: '500 11px var(--body)', color: 'var(--amber)' }}>{gpsError}</p>
                </div>
              )}

              {/* START disc — the FAB language, enlarged */}
              <div style={{ display: 'grid', placeItems: 'center', padding: '6px 0 10px' }}>
                <button
                  onClick={startTracking}
                  aria-label="Start run"
                  data-testid="start-run-disc"
                  style={{
                    position: 'relative', width: 120, height: 120, borderRadius: '50%', border: 'none', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                    background: 'linear-gradient(135deg,var(--accent),var(--accent-2))',
                    boxShadow: '0 18px 44px -10px rgba(249,115,22,.6), 0 3px 10px rgba(0,0,0,.4), inset 0 2px 0 rgba(255,255,255,.28), inset 0 -3px 8px -2px rgba(0,0,0,.28)',
                  }}
                >
                  <span aria-hidden="true" style={{
                    position: 'absolute', inset: 0, borderRadius: '50%', pointerEvents: 'none',
                    background: 'radial-gradient(120% 90% at 50% 16%,rgba(255,255,255,.34),rgba(255,255,255,0) 46%)',
                  }} />
                  <Play width={26} height={26} style={{ position: 'relative', zIndex: 1, color: '#fff' }} />
                  <span style={{ position: 'relative', zIndex: 1, font: '700 15px var(--head)', letterSpacing: '.14em', color: '#fff' }}>START</span>
                </button>
              </div>

              {/* TARGET PACE ZONE */}
              <section className="ss-surface ss-recess" style={{ borderRadius: 18, padding: 14 }} aria-label="Target pace zone">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span className="tlbl">Target pace zone</span>
                  <span className="ss-tag go" style={{ marginLeft: 'auto' }}>Easy</span>
                </div>
                <div className="num" style={{ font: '700 var(--m-lg) var(--mono)', color: 'var(--fg)', display: 'flex', alignItems: 'baseline', gap: 3, lineHeight: 1, marginBottom: 12 }}>
                  {formatPace(paceZones.easy_min)}<small style={{ font: '500 11px var(--mono)', color: 'var(--muted)' }}>–</small>{formatPace(paceZones.easy_max)}
                  <small style={{ font: '500 11px var(--mono)', color: 'var(--muted)' }}>/km</small>
                </div>
                <ZoneBar currentPace={0} targetPaceMin={paceZones.easy_min} targetPaceMax={paceZones.easy_max} />
              </section>
            </motion.div>
          )}

          {/* RUNNING / PAUSED — Overlay on map */}
          {immersive && (
            <motion.div key="running" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', pointerEvents: 'none', zIndex: 5 }}>
              {/* Top instrument panel */}
              <div className="ss-surface" style={{ pointerEvents: 'auto', margin: 10, borderRadius: 18, padding: 14, background: 'rgba(11,10,22,.72)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <motion.span
                      animate={state === 'RUNNING' ? { scale: [1, 1.3, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      style={{ width: 8, height: 8, borderRadius: '50%', background: state === 'RUNNING' ? 'var(--green)' : 'var(--amber)', display: 'inline-block' }}
                      aria-hidden="true"
                    />
                    <span className="tlbl">{state === 'RUNNING' ? 'Tracking' : 'Paused'}</span>
                  </div>
                  <span className="num" style={{ font: '600 12px var(--mono)', color: 'var(--muted)' }}>{formatTime(elapsedSeconds)}</span>
                </div>

                <ProgressRing
                  currentDistance={totalDistance}
                  goalDistance={5000}
                  currentPace={currentPace}
                  targetPaceMin={paceZones.easy_min}
                  targetPaceMax={paceZones.easy_max}
                />

                <div style={{ marginTop: 12 }}>
                  <ZoneBar currentPace={currentPace} targetPaceMin={paceZones.easy_min} targetPaceMax={paceZones.easy_max} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--hair)' }}>
                  {[
                    { v: (totalDistance / 1000).toFixed(2), k: 'km' },
                    { v: String(Math.round(elapsedSeconds * 0.07)), k: 'cal' },
                    { v: `+${Math.round(elevationGain)}m`, k: 'elev' },
                  ].map((m) => (
                    <div key={m.k} style={{ textAlign: 'center' }}>
                      <p className="num" style={{ font: '700 16px var(--mono)', color: 'var(--fg)', lineHeight: 1 }}>{m.v}</p>
                      <p style={{ font: '600 var(--lbl) var(--body)', textTransform: 'uppercase', letterSpacing: 'var(--trk-sm)', color: 'var(--muted-2)', marginTop: 4 }}>{m.k}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ flex: 1 }} />

              {/* Bottom controls */}
              <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '16px 16px 24px' }}>
                {state === 'RUNNING' ? (
                  <button
                    onClick={pauseTracking}
                    aria-label="Pause run"
                    className="ss-surface"
                    style={{ width: 64, height: 64, borderRadius: '50%', display: 'grid', placeItems: 'center', cursor: 'pointer', background: 'rgba(11,10,22,.72)' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="var(--fg)" aria-hidden="true"><rect x="5" y="3" width="3.5" height="14" rx="1" /><rect x="11.5" y="3" width="3.5" height="14" rx="1" /></svg>
                  </button>
                ) : (
                  <button
                    onClick={resumeTracking}
                    aria-label="Resume run"
                    style={{ width: 64, height: 64, borderRadius: '50%', display: 'grid', placeItems: 'center', cursor: 'pointer', background: 'rgba(52,211,153,.16)', border: '1px solid rgba(52,211,153,.3)' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="var(--green)" aria-hidden="true"><polygon points="5,3 17,10 5,17" /></svg>
                  </button>
                )}
                <button
                  onClick={stopTracking}
                  aria-label="Finish run"
                  style={{ width: 64, height: 64, borderRadius: '50%', display: 'grid', placeItems: 'center', cursor: 'pointer', background: 'rgba(249,115,22,.16)', border: '1px solid rgba(249,115,22,.32)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="var(--accent-2)" aria-hidden="true"><rect x="3" y="3" width="12" height="12" rx="2" /></svg>
                </button>
              </div>
            </motion.div>
          )}

          {/* FINISHED */}
          {state === 'FINISHED' && (
            <motion.div key="finished" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 13, paddingTop: 14 }}>
              <h2 style={{ font: '600 20px var(--head)', letterSpacing: '-.02em', color: 'var(--fg)', textAlign: 'center' }}>Run complete</h2>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'var(--gap)' }}>
                <QCell v={(totalDistance / 1000).toFixed(2)} k="km" />
                <QCell v={formatTime(elapsedSeconds)} k="Time" />
                <QCell v={formatPace(averagePace)} k="Pace" />
                <QCell v={`${Math.round(elevationGain)}m`} k="Elev" />
              </div>

              {/* Splits */}
              {splits.length > 0 && (
                <div className="ss-surface ss-recess" style={{ borderRadius: 18, padding: '6px 14px' }}>
                  <p className="tlbl" style={{ padding: '8px 0 2px' }}>Splits</p>
                  {splits.map((split, i) => (
                    <div key={split.km} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: i === splits.length - 1 ? 'none' : '1px solid var(--hair)' }}>
                      <span className="num" style={{ font: '500 11px var(--mono)', color: 'var(--muted)' }}>Km {split.km}</span>
                      <span className="num" style={{ font: '600 12px var(--mono)', color: 'var(--fg)' }}>{formatPace(split.time_seconds)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* RPE */}
              <div>
                <p style={{ font: '600 12.5px var(--body)', color: 'var(--fg)', textAlign: 'center', marginBottom: 8 }}>How hard was that?</p>
                <div className="rpe" role="radiogroup" aria-label="Rate the effort">
                  {RPE_OPTIONS.map((option) => {
                    const on = rpe === option.value;
                    return (
                      <button
                        key={option.value}
                        role="radio"
                        aria-checked={on}
                        onClick={() => setRpe(option.value)}
                        className="rchip"
                        style={on ? { borderColor: 'rgba(167,139,250,.5)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.12),0 6px 16px -10px rgba(124,107,240,.6)', background: 'linear-gradient(180deg,rgba(124,107,240,.32),rgba(124,107,240,.14))' } : undefined}
                      >
                        <span className="rv num" style={on ? { color: '#fff' } : undefined}>{option.value}</span>
                        <span className="rk" style={on ? { color: 'var(--violet-2)' } : undefined}>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {saveError && (
                <div style={{ borderRadius: 13, background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.22)', padding: '9px 14px' }} role="alert">
                  <p style={{ font: '500 11.5px var(--body)', color: 'var(--amber)' }}>{saveError}</p>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 9 }}>
                <button className="ss-btn ss-btn-soft" onClick={discardRun}>Discard</button>
                <button className="ss-btn ss-btn-primary" onClick={saveRun} disabled={saving || totalDistance < 10}>
                  {saving ? 'Saving...' : 'Save run'}
                </button>
              </div>
            </motion.div>
          )}

        {gpsError && immersive && (
          <div style={{ position: 'absolute', top: 8, left: 12, right: 12, zIndex: 20, borderRadius: 11, background: 'rgba(251,191,36,.12)', border: '1px solid rgba(251,191,36,.25)', padding: '7px 12px', backdropFilter: 'blur(8px)' }}>
            <p style={{ font: '500 10px var(--body)', color: 'var(--amber)', textAlign: 'center' }}>{gpsError}</p>
          </div>
        )}
      </div>
    </SSScreen>
  );
}
