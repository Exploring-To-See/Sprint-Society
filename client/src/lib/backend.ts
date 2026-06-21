// Backend location resolution.
//
// Default (Vercel): leave VITE_API_URL unset. The SPA and the API are served
// from the same origin, so everything uses same-origin relative paths (/api).
//
// Split deploy (frontend and an always-on backend on different origins): set
// VITE_API_URL to the backend's API base, e.g. https://api.example.com/api.
// VITE_API_URL is baked into the bundle at BUILD time by Vite, so it must be
// present in the Vercel project's environment variables when the client builds.

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '/api';

export const API_BASE = API_URL;

// Whether to use the persistent WebSocket transport for chat + live notifications.
//
// Vercel serverless cannot host a WebSocket server, so this is OFF by default and
// the client polls over REST instead (chat sends via POST, history + notifications
// refetch on an interval). Set VITE_ENABLE_WS=true only when deploying against an
// always-on backend that runs the WebSocket server (server/src/websocket.ts).
// Planned upgrade for true real-time on Vercel: Supabase Realtime.
export const WS_ENABLED =
  String(import.meta.env.VITE_ENABLE_WS ?? '').toLowerCase() === 'true';

// How often to poll when WebSocket is disabled (milliseconds).
export const CHAT_POLL_MS = 4000;
export const NOTIFICATION_POLL_MS = 20000;

// Build a ws(s):// URL pointing at the backend. When VITE_API_URL is absolute we
// derive the WebSocket host from it; otherwise we fall back to the current page
// origin (same-host deploy).
export function backendWsUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (/^https?:\/\//i.test(API_URL)) {
    try {
      const u = new URL(API_URL);
      const proto = u.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${proto}//${u.host}${normalizedPath}`;
    } catch {
      // fall through to same-origin
    }
  }
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}${normalizedPath}`;
}
