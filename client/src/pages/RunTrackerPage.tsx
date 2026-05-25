import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '../components/layout/AppShell';
import { useAuth } from '../context/AuthContext';

type TrackingState = 'IDLE' | 'RUNNING' | 'PAUSED' | 'FINISHED';

interface Position {
  lat: number;
  lon: number;
  timestamp: number;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatPace(paceSeconds: number): string {
  if (!paceSeconds || !isFinite(paceSeconds) || paceSeconds <= 0) return '--:--';
  const mins = Math.floor(paceSeconds / 60);
  const secs = Math.round(paceSeconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function RunTrackerPage() {
  const { token } = useAuth() as { token: string | null };
  const [state, setState] = useState<TrackingState>('IDLE');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0); // meters
  const [currentPace, setCurrentPace] = useState(0); // seconds per km
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const positionsRef = useRef<Position[]>([]);
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<string | null>(null);
  const paceCalcRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer logic
  useEffect(() => {
    if (state === 'RUNNING') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state]);

  // Pace calculation every 5 seconds
  useEffect(() => {
    if (state === 'RUNNING') {
      paceCalcRef.current = setInterval(() => {
        const positions = positionsRef.current;
        if (positions.length < 2) return;

        // Calculate pace from last ~100m of movement
        let distAccum = 0;
        let timeSpan = 0;
        for (let i = positions.length - 1; i > 0 && distAccum < 100; i--) {
          const d = haversineDistance(
            positions[i - 1].lat, positions[i - 1].lon,
            positions[i].lat, positions[i].lon
          );
          distAccum += d;
          timeSpan = (positions[i].timestamp - positions[i - 1].timestamp) / 1000;
        }

        if (distAccum > 10 && timeSpan > 0) {
          // pace = seconds per km
          const pace = (timeSpan / distAccum) * 1000;
          setCurrentPace(pace);
        }
      }, 5000);
    } else {
      if (paceCalcRef.current) {
        clearInterval(paceCalcRef.current);
        paceCalcRef.current = null;
      }
    }
    return () => {
      if (paceCalcRef.current) clearInterval(paceCalcRef.current);
    };
  }, [state]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('GPS not supported on this device');
      return;
    }

    setGpsError(null);
    startTimeRef.current = new Date().toISOString();
    positionsRef.current = [];
    setTotalDistance(0);
    setElapsedSeconds(0);
    setCurrentPace(0);
    setState('RUNNING');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newPos: Position = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          timestamp: position.timestamp,
        };

        const positions = positionsRef.current;
        if (positions.length > 0) {
          const lastPos = positions[positions.length - 1];
          const dist = haversineDistance(lastPos.lat, lastPos.lon, newPos.lat, newPos.lon);
          // Filter out GPS jitter (ignore movements < 2m or > 100m in single update)
          if (dist >= 2 && dist < 100) {
            positionsRef.current = [...positions, newPos];
            setTotalDistance(prev => prev + dist);
          }
        } else {
          positionsRef.current = [newPos];
        }
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsError('GPS permission denied. Please allow location access.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsError('GPS signal unavailable. Try moving to an open area.');
            break;
          case error.TIMEOUT:
            setGpsError('GPS timed out. Retrying...');
            break;
          default:
            setGpsError('GPS error occurred.');
        }
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
  }, []);

  const pauseTracking = useCallback(() => {
    setState('PAUSED');
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const resumeTracking = useCallback(() => {
    setState('RUNNING');
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newPos: Position = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          timestamp: position.timestamp,
        };
        const positions = positionsRef.current;
        if (positions.length > 0) {
          const lastPos = positions[positions.length - 1];
          const dist = haversineDistance(lastPos.lat, lastPos.lon, newPos.lat, newPos.lon);
          if (dist >= 2 && dist < 100) {
            positionsRef.current = [...positions, newPos];
            setTotalDistance(prev => prev + dist);
          }
        } else {
          positionsRef.current = [newPos];
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
  }, []);

  const stopTracking = useCallback(() => {
    setState('FINISHED');
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const saveRun = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch('/api/runs/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          distance_meters: Math.round(totalDistance),
          moving_time_seconds: elapsedSeconds,
          start_date: startTimeRef.current,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveMessage(data.message || 'Run saved!');
      } else {
        setSaveMessage(data.error || 'Failed to save run');
      }
    } catch {
      setSaveMessage('Network error. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const discardRun = () => {
    setState('IDLE');
    setElapsedSeconds(0);
    setTotalDistance(0);
    setCurrentPace(0);
    positionsRef.current = [];
    startTimeRef.current = null;
    setSaveMessage(null);
  };

  const averagePace = totalDistance > 0 ? (elapsedSeconds / (totalDistance / 1000)) : 0;

  return (
    <AppShell>
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {/* IDLE STATE */}
          {state === 'IDLE' && (
            <motion.div
              key="idle"
              variants={fadeUp}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center text-center space-y-8"
            >
              <div className="space-y-3">
                <h1 className="font-heading text-[28px] font-bold text-white">Track Your Run</h1>
                <p className="text-[13px] text-zinc-500 max-w-[260px]">
                  We'll use GPS to track your distance and pace
                </p>
              </div>

              {gpsError && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 max-w-[300px]">
                  <p className="text-[12px] text-red-400">{gpsError}</p>
                </div>
              )}

              <button
                onClick={startTracking}
                className="w-[180px] h-[180px] rounded-full bg-accent hover:bg-accent/90 active:scale-95 transition-all flex items-center justify-center shadow-[0_0_60px_rgba(249,115,22,0.3)]"
              >
                <span className="text-[20px] font-bold text-white tracking-wide">START RUN</span>
              </button>
            </motion.div>
          )}

          {/* RUNNING / PAUSED STATE */}
          {(state === 'RUNNING' || state === 'PAUSED') && (
            <motion.div
              key="running"
              variants={fadeUp}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center text-center space-y-8 w-full"
            >
              {/* GPS indicator */}
              <div className="flex items-center gap-2">
                <motion.div
                  animate={state === 'RUNNING' ? { scale: [1, 1.4, 1], opacity: [1, 0.6, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className={`w-2.5 h-2.5 rounded-full ${state === 'RUNNING' ? 'bg-accent-green' : 'bg-yellow-500'}`}
                />
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
                  {state === 'RUNNING' ? 'GPS Active' : 'Paused'}
                </span>
              </div>

              {/* Timer */}
              <div className="space-y-1">
                <p className="font-mono text-[64px] font-bold text-white leading-none tracking-tight">
                  {formatTime(elapsedSeconds)}
                </p>
                <p className="text-[11px] text-zinc-600 uppercase tracking-wider">Elapsed Time</p>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-[28px] font-bold text-white">
                    {(totalDistance / 1000).toFixed(2)}
                  </p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">km</p>
                </div>
                <div className="w-px h-10 bg-bg-tertiary" />
                <div className="text-center">
                  <p className="text-[28px] font-bold text-white">
                    {formatPace(currentPace)}
                  </p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">min/km</p>
                </div>
              </div>

              {gpsError && (
                <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 px-4 py-2">
                  <p className="text-[11px] text-yellow-400">{gpsError}</p>
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center gap-4 pt-4">
                {state === 'RUNNING' ? (
                  <button
                    onClick={pauseTracking}
                    className="w-16 h-16 rounded-full bg-bg-secondary border border-bg-tertiary flex items-center justify-center active:scale-90 transition-all"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
                      <rect x="5" y="3" width="3.5" height="14" rx="1" />
                      <rect x="11.5" y="3" width="3.5" height="14" rx="1" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={resumeTracking}
                    className="w-16 h-16 rounded-full bg-accent-green/20 border border-accent-green/30 flex items-center justify-center active:scale-90 transition-all"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="#22c55e">
                      <polygon points="5,3 17,10 5,17" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={stopTracking}
                  className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center active:scale-90 transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="#ef4444">
                    <rect x="3" y="3" width="12" height="12" rx="2" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}

          {/* FINISHED STATE */}
          {state === 'FINISHED' && (
            <motion.div
              key="finished"
              variants={fadeUp}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-6"
            >
              <div className="text-center space-y-1">
                <h2 className="font-heading text-[24px] font-bold text-white">Run Complete</h2>
                <p className="text-[12px] text-zinc-500">Great effort! Here's your summary.</p>
              </div>

              {/* Summary card */}
              <div className="rounded-2xl bg-bg-secondary border border-bg-tertiary p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-[24px] font-bold text-white">{(totalDistance / 1000).toFixed(2)}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">km</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[24px] font-bold text-white">{formatTime(elapsedSeconds)}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Time</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[24px] font-bold text-white">{formatPace(averagePace)}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Avg Pace</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[24px] font-bold text-white">
                      {new Date(startTimeRef.current || '').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Date</p>
                  </div>
                </div>
              </div>

              {saveMessage && (
                <div className={`rounded-xl px-4 py-3 text-center ${
                  saveMessage.includes('saved') ? 'bg-accent-green/10 border border-accent-green/20' : 'bg-red-500/10 border border-red-500/20'
                }`}>
                  <p className={`text-[12px] font-medium ${saveMessage.includes('saved') ? 'text-accent-green' : 'text-red-400'}`}>
                    {saveMessage}
                  </p>
                </div>
              )}

              {/* Actions */}
              {!saveMessage?.includes('saved') && (
                <div className="flex gap-3">
                  <button
                    onClick={discardRun}
                    className="flex-1 py-3.5 rounded-xl bg-bg-secondary border border-bg-tertiary text-[13px] font-semibold text-zinc-400 active:scale-95 transition-all"
                  >
                    Discard
                  </button>
                  <button
                    onClick={saveRun}
                    disabled={saving || totalDistance < 10}
                    className="flex-1 py-3.5 rounded-xl bg-accent text-[13px] font-semibold text-white active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Run'}
                  </button>
                </div>
              )}

              {saveMessage?.includes('saved') && (
                <button
                  onClick={discardRun}
                  className="w-full py-3.5 rounded-xl bg-accent text-[13px] font-semibold text-white active:scale-95 transition-all"
                >
                  Track Another Run
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

export default RunTrackerPage;
