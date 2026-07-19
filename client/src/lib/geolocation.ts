import { Geolocation, type Position as CapPosition } from '@capacitor/geolocation';
import { isNative } from './native';

/**
 * Unified geolocation layer.
 *
 * - Native (APK / iOS): @capacitor/geolocation — triggers the real system
 *   permission popup and uses fused location for reliable real-time tracking.
 * - Web: navigator.geolocation (browser permission prompt).
 *
 * All consumers receive the same GeoPoint shape.
 */

export interface GeoPoint {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
  timestamp: number;
}

export type GeoErrorCode = 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNSUPPORTED';

export interface GeoError {
  code: GeoErrorCode;
  message: string;
}

function fromCapPosition(pos: CapPosition): GeoPoint {
  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    altitude: pos.coords.altitude ?? null,
    accuracy: pos.coords.accuracy,
    timestamp: pos.timestamp,
  };
}

function fromWebPosition(pos: GeolocationPosition): GeoPoint {
  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    altitude: pos.coords.altitude,
    accuracy: pos.coords.accuracy,
    timestamp: pos.timestamp,
  };
}

function webErrorToGeoError(err: GeolocationPositionError): GeoError {
  if (err.code === err.PERMISSION_DENIED) return { code: 'PERMISSION_DENIED', message: 'Location access denied' };
  if (err.code === err.POSITION_UNAVAILABLE) return { code: 'POSITION_UNAVAILABLE', message: 'GPS signal unavailable' };
  return { code: 'TIMEOUT', message: 'GPS timeout — retrying...' };
}

/**
 * Ensure location permission, showing the system popup when needed.
 * Returns true when granted. On web the browser shows its own prompt on the
 * first position request, so this resolves optimistically.
 */
export async function ensureLocationPermission(): Promise<boolean> {
  if (isNative) {
    try {
      const status = await Geolocation.checkPermissions();
      if (status.location === 'granted' || status.coarseLocation === 'granted') return true;
      const req = await Geolocation.requestPermissions({ permissions: ['location'] });
      return req.location === 'granted' || req.coarseLocation === 'granted';
    } catch {
      return false;
    }
  }
  return typeof navigator !== 'undefined' && !!navigator.geolocation;
}

/** One-shot current position (triggers the permission popup if not yet granted). */
export async function getCurrentPosition(
  options: { enableHighAccuracy?: boolean; timeout?: number; maximumAge?: number } = {}
): Promise<GeoPoint> {
  const { enableHighAccuracy = true, timeout = 15000, maximumAge = 0 } = options;
  if (isNative) {
    const granted = await ensureLocationPermission();
    if (!granted) throw { code: 'PERMISSION_DENIED', message: 'Location access denied' } satisfies GeoError;
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy, timeout, maximumAge });
    return fromCapPosition(pos);
  }
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({ code: 'UNSUPPORTED', message: 'GPS not supported' } satisfies GeoError);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(fromWebPosition(pos)),
      (err) => reject(webErrorToGeoError(err)),
      { enableHighAccuracy, timeout, maximumAge }
    );
  });
}

export interface GeoWatch {
  clear: () => void;
}

/**
 * Continuous real-time position watch. Handles the permission popup first, then
 * streams updates to `onPosition`. Call `.clear()` to stop.
 */
export async function watchPosition(
  onPosition: (point: GeoPoint) => void,
  onError: (error: GeoError) => void
): Promise<GeoWatch> {
  if (isNative) {
    const granted = await ensureLocationPermission();
    if (!granted) {
      onError({ code: 'PERMISSION_DENIED', message: 'Location access denied — enable it in your device Settings to track runs' });
      return { clear: () => {} };
    }
    const watchId = await Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 },
      (pos, err) => {
        if (err) {
          onError({ code: 'POSITION_UNAVAILABLE', message: err.message || 'GPS signal unavailable' });
          return;
        }
        if (pos) onPosition(fromCapPosition(pos));
      }
    );
    return { clear: () => { Geolocation.clearWatch({ id: watchId }); } };
  }

  if (!navigator.geolocation) {
    onError({ code: 'UNSUPPORTED', message: 'GPS not supported' });
    return { clear: () => {} };
  }
  const id = navigator.geolocation.watchPosition(
    (pos) => onPosition(fromWebPosition(pos)),
    (err) => onError(webErrorToGeoError(err)),
    { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
  );
  return { clear: () => navigator.geolocation.clearWatch(id) };
}
