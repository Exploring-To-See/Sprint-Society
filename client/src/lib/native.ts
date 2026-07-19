import { Capacitor } from '@capacitor/core';

/**
 * Native platform detection for the Capacitor (APK / iOS) builds.
 *
 * Inside the native shells the web assets are served from capacitor://localhost
 * (iOS) or https://localhost (Android), so relative URLs like `/api` no longer
 * reach the backend. lib/backend.ts uses this flag to fall back to the hosted
 * production API origin when VITE_API_URL wasn't baked in at build time.
 */
export const isNative = Capacitor.isNativePlatform();

/** Production API base used by native builds when VITE_API_URL is not set. */
export const NATIVE_DEFAULT_API = 'https://app.sprintsociety.in/api';
