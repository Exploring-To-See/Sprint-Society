import { Geolocation, type Position as CapPosition } from '@capacitor/geolocation';
import { registerPlugin } from '@capacitor/core';
import { isNative } from './native';

/**
 * Background watcher (native runs): @capacitor-community/background-geolocation
 * runs an Android foreground service with a persistent notification, so GPS
 * samples keep flowing with the screen off / app backgrounded — the Strava
 * behavior. Registered lazily; only used inside watchPosition on native.
 */
interface BgLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  time: number | null;
}
interface BgError { code?: string; message?: string }
interface BackgroundGeolocationPlugin {
  addWatcher(
    options: {
      backgroundMessage?: string;
      backgroundTitle?: string;
      requestPermissions?: boolean;
      stale?: boolean;
      distanceFilter?: number;
    },
    callback: (position?: BgLocation, error?: BgError) => void,
  ): Promise<string>;
  removeWatcher(options: { id: string }): Promise<void>;
  openSettings(): Promise<void>;
}
const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');

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
 * Detailed permission outcome so the UI can react precisely instead of
 * treating every failure as "denied":
 * - 'granted'         — good to go
 * - 'ask-again'       — user dismissed/declined but the system dialog CAN
 *                       reappear (state 'prompt'/'prompt-with-rationale')
 * - 'denied-forever'  — Android will never re-show the dialog; only the app's
 *                       settings screen can grant it now
 * - 'services-off'    — the device's master Location toggle is OFF. Capacitor's
 *                       checkPermissions/requestPermissions REJECT in this case
 *                       (this used to be misread as a permission denial).
 * - 'unavailable'     — no geolocation capability at all
 */
export type LocationPermissionState = 'granted' | 'coarse-only' | 'ask-again' | 'denied-forever' | 'services-off' | 'unavailable';

export async function ensureLocationPermissionDetailed(): Promise<LocationPermissionState> {
  if (!isNative) {
    return typeof navigator !== 'undefined' && !!navigator.geolocation ? 'granted' : 'unavailable';
  }
  try {
    const status = await Geolocation.checkPermissions();
    if (status.location === 'granted') return 'granted';
    if (status.coarseLocation === 'granted') return 'coarse-only';
    const req = await Geolocation.requestPermissions({ permissions: ['location'] });
    if (req.location === 'granted') return 'granted';
    // Android 12+ "Approximate" choice: tracking works but pace/distance are
    // mush — surface it so the UI can nudge toward Precise.
    if (req.coarseLocation === 'granted') return 'coarse-only';
    return req.location === 'denied' ? 'denied-forever' : 'ask-again';
  } catch {
    return 'services-off';
  }
}

/**
 * Boolean convenience wrapper (existing call sites). Shows the system popup
 * when needed; true only when actually granted.
 */
export async function ensureLocationPermission(): Promise<boolean> {
  return (await ensureLocationPermissionDetailed()) === 'granted';
}

/** Open the device screen where the user can fix the blocking state. */
export async function openLocationRemedy(state: LocationPermissionState): Promise<void> {
  if (!isNative) return;
  try {
    const { NativeSettings, AndroidSettings, IOSSettings } = await import('capacitor-native-settings');
    if (state === 'services-off') {
      await NativeSettings.open({ optionAndroid: AndroidSettings.Location, optionIOS: IOSSettings.LocationServices });
    } else {
      await NativeSettings.open({ optionAndroid: AndroidSettings.ApplicationDetails, optionIOS: IOSSettings.App });
    }
  } catch { /* settings screen unavailable — nothing else we can do */ }
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
    const state = await ensureLocationPermissionDetailed();
    if (state !== 'granted' && state !== 'coarse-only') {
      onError({
        code: 'PERMISSION_DENIED',
        message: state === 'services-off'
          ? 'Turn on your device Location (GPS) to track runs'
          : 'Location permission needed to track runs',
      });
      return { clear: () => {} };
    }
    // Foreground-service watcher: keeps delivering fixes with the screen off
    // or the app backgrounded — the run never flatlines in a pocket. Android
    // shows the service notification below while the watcher is alive.
    const watcherId = await BackgroundGeolocation.addWatcher(
      {
        backgroundTitle: 'Run active — Sprint Society',
        backgroundMessage: 'Tracking your route, pace and distance.',
        requestPermissions: true,
        stale: false,
        distanceFilter: 2,
      },
      (position, error) => {
        if (error) {
          // The plugin reports a mid-run Location-Services toggle-off as
          // NOT_AUTHORIZED with a "services disabled" message — that's a GPS
          // problem, not a permission one; word it accordingly.
          if (error.code === 'NOT_AUTHORIZED' && /services disabled/i.test(error.message ?? '')) {
            onError({ code: 'POSITION_UNAVAILABLE', message: 'Turn on your device Location (GPS) to keep tracking' });
          } else if (error.code === 'NOT_AUTHORIZED') {
            onError({ code: 'PERMISSION_DENIED', message: 'Location permission needed to track runs' });
          } else {
            onError({ code: 'POSITION_UNAVAILABLE', message: error.message || 'GPS signal unavailable' });
          }
          return;
        }
        if (position) {
          onPosition({
            latitude: position.latitude,
            longitude: position.longitude,
            altitude: position.altitude ?? null,
            accuracy: position.accuracy,
            timestamp: position.time ?? Date.now(),
          });
        }
      },
    );
    return {
      clear: () => { BackgroundGeolocation.removeWatcher({ id: watcherId }).catch(() => {}); },
    };
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
