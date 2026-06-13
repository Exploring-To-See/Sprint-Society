import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LatLngExpression } from 'leaflet';
import { useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { SplitChart } from '../components/run/SplitChart';
import { ProgressRing } from '../components/run/ProgressRing';
import { ZoneBar } from '../components/run/ZoneBar';
import { useAuth } from '../context/AuthContext';

const MapContainer = lazy(() => import('react-leaflet').then(m => ({ default: m.MapContainer })));
const TileLayer = lazy(() => import('react-leaflet').then(m => ({ default: m.TileLayer })));
const Polyline = lazy(() => import('react-leaflet').then(m => ({ default: m.Polyline })));

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

export function RunTrackerPage() {
  const { token } = useAuth() as { token: string | null };
  const navigate = useNavigate();
  const [state, setState] = useState<TrackingState>('IDLE');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [currentPace, setCurrentPace] = useState(0);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [elevationGain, setElevationGain] = useState(0);
  const [splits, setSplits] = useState<Split[]>([]);
  const [rpe, setRpe] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [analysis, setAnalysis] = useState<RunAnalysis | null>(null);
  const [kenduEarned, setKenduEarned] = useState<number | null>(null);
  const [cascadeData, setCascadeData] = useState<any>(null);
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
      const data = await res.json();
      if (res.ok) {
        if (data.cascade) {
          setCascadeData(data.cascade);
          setKenduEarned(data.cascade.kendu?.awarded || 0);
        }
        generateAnalysis();
        setState('ANALYSIS');
      }
    } catch (err) {
      console.error('Failed to save run:', err);
      setSaving(false);
      setState('FINISHED');
      alert('Failed to save your run. Please try again.');
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
    prevAltitudeRef.current = null;
    lastSplitKmRef.current = 0;
    splitStartTimeRef.current = 0;
    positionsRef.current = [];
    startTimeRef.current = null;
  };

  const averagePace = totalDistance > 0 ? (elapsedSeconds / (totalDistance / 1000)) : 0;
  const mapCenter = useMemo(() => userLocation || [0, 0] as [number, number], [userLocation]);

  // ANALYSIS STATE — Post-run AI card
  if (state === 'ANALYSIS' && analysis) {
    return (
      <AppShell hideNav>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="min-h-[90vh] flex flex-col items-center justify-center space-y-6 py-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-accent font-bold">Run Analysis</p>

          {/* Score ring */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="absolute w-full h-full" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" stroke="#1e1e22" strokeWidth="6" fill="none" />
              <motion.circle
                cx="50" cy="50" r="44" strokeWidth="6" fill="none"
                stroke="#f97316"
                strokeDasharray={`${analysis.score * 2.76} 276`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                initial={{ strokeDasharray: '0 276' }}
                animate={{ strokeDasharray: `${analysis.score * 2.76} 276` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </svg>
            <div className="text-center">
              <motion.p className="font-mono text-[36px] font-bold text-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                {analysis.score}
              </motion.p>
              <p className="text-[10px] text-zinc-500">/100</p>
            </div>
          </div>

          {/* Tags */}
          <div className="flex gap-2">
            {analysis.tags.map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-[11px] font-semibold text-accent">{tag}</span>
            ))}
          </div>

          {/* AI Commentary */}
          <div className="rounded-xl bg-bg-secondary border border-bg-tertiary p-4 max-w-[320px]">
            <p className="text-[12px] text-zinc-300 leading-relaxed">{analysis.commentary}</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-4 w-full max-w-[320px]">
            <div className="text-center">
              <p className="font-mono text-[20px] font-bold text-white">{(totalDistance / 1000).toFixed(2)}</p>
              <p className="text-[11px] text-zinc-500 uppercase">km</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-[20px] font-bold text-white">{formatPace(averagePace)}</p>
              <p className="text-[11px] text-zinc-500 uppercase">pace</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-[20px] font-bold text-white">{formatTime(elapsedSeconds)}</p>
              <p className="text-[11px] text-zinc-500 uppercase">time</p>
            </div>
          </div>

          {/* Split Chart */}
          {splits.length > 1 && (
            <div className="w-full max-w-[320px] rounded-xl bg-bg-secondary border border-bg-tertiary p-4">
              <SplitChart splits={splits} averagePace={averagePace} />
            </div>
          )}

          {/* Fastest/Slowest */}
          {analysis.fastest_km && analysis.slowest_km && splits.length > 1 && (
            <div className="flex gap-4 text-[11px]">
              <span className="text-accent-green">Fastest: Km {analysis.fastest_km} ({formatPace(splits.find(s => s.km === analysis.fastest_km)?.time_seconds || 0)})</span>
              <span className="text-red-400">Slowest: Km {analysis.slowest_km} ({formatPace(splits.find(s => s.km === analysis.slowest_km)?.time_seconds || 0)})</span>
            </div>
          )}

          {/* Cascade Rewards */}
          {cascadeData && (
            <motion.div className="w-full max-w-[320px] space-y-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
              {/* XP + Kendu row */}
              <div className="flex gap-2">
                <div className="flex-1 rounded-xl bg-purple-500/10 border border-purple-500/20 px-3 py-2 flex items-center gap-2">
                  <span className="text-[14px]">⚡</span>
                  <span className="text-[12px] font-bold text-purple-400">+{cascadeData.xp?.awarded || 25} XP</span>
                </div>
                {kenduEarned !== null && kenduEarned > 0 && (
                  <div className="flex-1 rounded-xl bg-orange-500/10 border border-orange-500/20 px-3 py-2 flex items-center gap-2">
                    <span className="text-[14px]">🔥</span>
                    <span className="text-[12px] font-bold text-orange-400">+{kenduEarned} Kendu</span>
                  </div>
                )}
              </div>

              {/* Streak */}
              {cascadeData.streak?.current > 1 && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 flex items-center gap-2">
                  <span className="text-[14px]">🔥</span>
                  <span className="text-[12px] font-bold text-amber-400">{cascadeData.streak.current}-day streak!</span>
                </div>
              )}

              {/* Personal Best */}
              {cascadeData.personalBest?.isPB && (
                <motion.div className="rounded-xl bg-green-500/10 border border-green-500/20 px-3 py-2 flex items-center gap-2"
                  initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                  <span className="text-[14px]">🏆</span>
                  <span className="text-[12px] font-bold text-green-400">
                    New Personal Best! ({cascadeData.personalBest.type === 'pace' ? 'Fastest pace' : 'Longest run'})
                  </span>
                </motion.div>
              )}

              {/* Level Up */}
              {cascadeData.xp?.leveledUp && (
                <motion.div className="rounded-xl bg-gradient-to-r from-accent/20 to-purple-500/20 border border-accent/30 px-3 py-3 text-center"
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1, type: 'spring' }}>
                  <p className="text-[14px] font-bold text-white">🎉 Level {cascadeData.xp.level}!</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Keep pushing to unlock more</p>
                </motion.div>
              )}

              {/* Achievements Unlocked */}
              {cascadeData.achievements?.unlocked?.length > 0 && (
                <div className="space-y-1.5">
                  {cascadeData.achievements.unlocked.map((a: any) => (
                    <motion.div key={a.id} className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 flex items-center gap-2"
                      initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring' }}>
                      <span className="text-[16px]">{a.icon}</span>
                      <div>
                        <p className="text-[12px] font-bold text-yellow-400">{a.name}</p>
                        <p className="text-[10px] text-zinc-500">+{a.xpReward} XP</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-3 w-full max-w-[320px] pt-2">
            <button
              onClick={() => navigate('/share')}
              className="flex-1 py-3 rounded-xl bg-bg-secondary border border-bg-tertiary text-[13px] font-semibold text-white active:scale-95 transition-all"
            >
              Share Card
            </button>
            <button
              onClick={() => navigate('/dashboard', { state: { fromRun: true } })}
              className="flex-1 py-3 rounded-xl bg-accent text-[13px] font-semibold text-white active:scale-95 transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </motion.div>
      </AppShell>
    );
  }

  return (
    <AppShell hideNav={state === 'RUNNING' || state === 'PAUSED'}>
      <div className="relative min-h-[80vh] flex flex-col">
        {/* Locating indicator */}
        {locating && state === 'IDLE' && (
          <div className="h-[200px] rounded-2xl border border-bg-tertiary flex items-center justify-center bg-bg-secondary">
            <div className="text-center space-y-2">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-zinc-400">Locating you...</p>
            </div>
          </div>
        )}

        {/* Map */}
        {!locating && (state !== 'IDLE' || userLocation) && (
          <div className={`rounded-2xl overflow-hidden border border-bg-tertiary ${state === 'IDLE' ? 'h-[200px]' : state === 'FINISHED' ? 'h-[180px]' : 'flex-1 min-h-[50vh]'}`}>
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
              {(state === 'RUNNING' || state === 'PAUSED') && userLocation && <MapFollower position={userLocation} />}
              {state === 'FINISHED' && routeCoords.length > 1 && <FitBounds positions={routeCoords} />}
            </MapContainer>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* IDLE */}
          {state === 'IDLE' && (
            <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center text-center space-y-6 pt-8">
              <div className="space-y-2">
                <h1 className="font-heading text-[24px] font-bold text-white">Ready to Run</h1>
                <p className="text-[12px] text-zinc-500">GPS will track your route, pace & distance</p>
              </div>

              {gpsError && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2">
                  <p className="text-[11px] text-red-400">{gpsError}</p>
                </div>
              )}

              <button
                onClick={startTracking}
                className="w-40 h-40 rounded-full bg-accent active:scale-95 transition-all flex items-center justify-center shadow-[0_0_50px_rgba(249,115,22,0.3)]"
              >
                <span className="text-[18px] font-bold text-white">START</span>
              </button>
            </motion.div>
          )}

          {/* RUNNING / PAUSED — Overlay on map */}
          {(state === 'RUNNING' || state === 'PAUSED') && (
            <motion.div key="running" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col pointer-events-none">
              {/* Top stats overlay with ProgressRing + ZoneBar */}
              <div className="pointer-events-auto m-3 rounded-xl bg-bg-primary/90 backdrop-blur-md border border-bg-tertiary/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={state === 'RUNNING' ? { scale: [1, 1.3, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className={`w-2 h-2 rounded-full ${state === 'RUNNING' ? 'bg-accent-green' : 'bg-yellow-500'}`}
                    />
                    <span className="text-[11px] text-zinc-500 uppercase tracking-wider">{state === 'RUNNING' ? 'Tracking' : 'Paused'}</span>
                  </div>
                  <span className="font-mono text-[11px] text-zinc-400">{formatTime(elapsedSeconds)}</span>
                </div>

                {/* Progress Ring */}
                <ProgressRing
                  currentDistance={totalDistance}
                  goalDistance={5000}
                  currentPace={currentPace}
                  targetPaceMin={paceZones.easy_min}
                  targetPaceMax={paceZones.easy_max}
                />

                {/* Zone Bar */}
                <div className="mt-3">
                  <ZoneBar
                    currentPace={currentPace}
                    targetPaceMin={375}
                    targetPaceMax={405}
                  />
                </div>

                {/* Secondary metrics */}
                <div className="flex justify-around mt-3 pt-3 border-t border-bg-tertiary/50">
                  <div className="text-center">
                    <p className="font-mono text-[16px] font-bold text-white">{(totalDistance / 1000).toFixed(2)}</p>
                    <p className="text-[11px] text-zinc-500 uppercase">km</p>
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-[16px] font-bold text-white">{Math.round(elapsedSeconds * 0.07)}</p>
                    <p className="text-[11px] text-zinc-500 uppercase">cal</p>
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-[16px] font-bold text-white">+{Math.round(elevationGain)}m</p>
                    <p className="text-[11px] text-zinc-500 uppercase">elev</p>
                  </div>
                </div>
              </div>

              <div className="flex-1" />

              {/* Bottom controls */}
              <div className="pointer-events-auto flex items-center justify-center gap-4 p-4 pb-6">
                {state === 'RUNNING' ? (
                  <button onClick={pauseTracking} className="w-16 h-16 rounded-full bg-bg-primary/90 backdrop-blur border border-bg-tertiary flex items-center justify-center active:scale-90 transition-all">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="white"><rect x="5" y="3" width="3.5" height="14" rx="1"/><rect x="11.5" y="3" width="3.5" height="14" rx="1"/></svg>
                  </button>
                ) : (
                  <button onClick={resumeTracking} className="w-16 h-16 rounded-full bg-accent-green/20 border border-accent-green/30 flex items-center justify-center active:scale-90 transition-all">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="#22c55e"><polygon points="5,3 17,10 5,17"/></svg>
                  </button>
                )}
                <button onClick={stopTracking} className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center active:scale-90 transition-all">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="#ef4444"><rect x="3" y="3" width="12" height="12" rx="2"/></svg>
                </button>
              </div>
            </motion.div>
          )}

          {/* FINISHED */}
          {state === 'FINISHED' && (
            <motion.div key="finished" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pt-4">
              <div className="text-center">
                <h2 className="font-heading text-[20px] font-bold text-white">Run Complete</h2>
              </div>

              {/* Stats */}
              <div className="rounded-xl bg-bg-secondary border border-bg-tertiary p-4">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div><p className="font-mono text-[18px] font-bold text-white">{(totalDistance / 1000).toFixed(2)}</p><p className="text-[11px] text-zinc-500">km</p></div>
                  <div><p className="font-mono text-[18px] font-bold text-white">{formatTime(elapsedSeconds)}</p><p className="text-[11px] text-zinc-500">time</p></div>
                  <div><p className="font-mono text-[18px] font-bold text-white">{formatPace(averagePace)}</p><p className="text-[11px] text-zinc-500">pace</p></div>
                  <div><p className="font-mono text-[18px] font-bold text-white">{Math.round(elevationGain)}m</p><p className="text-[11px] text-zinc-500">elev</p></div>
                </div>
              </div>

              {/* Splits */}
              {splits.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Splits</p>
                  {splits.map((split) => (
                    <div key={split.km} className="flex items-center justify-between px-3 py-2 rounded-lg bg-bg-secondary/50 border border-bg-tertiary/50">
                      <span className="text-[11px] text-zinc-400">Km {split.km}</span>
                      <span className="text-[11px] font-mono text-white">{formatPace(split.time_seconds)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* RPE */}
              <div className="space-y-2">
                <p className="text-[12px] font-semibold text-white text-center">How hard was that?</p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {([
                    { value: 1, label: 'Easy', emoji: '😊' },
                    { value: 2, label: 'Moderate', emoji: '💪' },
                    { value: 3, label: 'Hard', emoji: '😤' },
                    { value: 4, label: 'V. Hard', emoji: '🥵' },
                    { value: 5, label: 'All Out', emoji: '💀' },
                  ] as const).map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setRpe(option.value)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all active:scale-95 ${
                        rpe === option.value ? 'bg-accent text-black border border-accent' : 'bg-bg-secondary border border-bg-tertiary text-zinc-400'
                      }`}
                    >
                      {option.emoji} {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={discardRun} className="flex-1 py-3 rounded-xl bg-bg-secondary border border-bg-tertiary text-[13px] font-semibold text-zinc-400 active:scale-95 transition-all">Discard</button>
                <button onClick={saveRun} disabled={saving || totalDistance < 10} className="flex-1 py-3 rounded-xl bg-accent text-[13px] font-semibold text-white active:scale-95 transition-all disabled:opacity-40">
                  {saving ? 'Saving...' : 'Save Run'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {gpsError && (state === 'RUNNING' || state === 'PAUSED') && (
          <div className="absolute top-20 left-3 right-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 z-20">
            <p className="text-[10px] text-yellow-400 text-center">{gpsError}</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
