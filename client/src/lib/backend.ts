// Backend location resolution.
//
// Single-host deploy (e.g. one server serving both the SPA and the API): leave
// VITE_API_URL unset and everything uses same-origin relative paths.
//
// Split deploy (frontend on Vercel, backend on Railway/another always-on host):
// set VITE_API_URL to the backend's API base, e.g. https://app.sprintsociety.in/api
// VITE_API_URL is baked into the bundle at BUILD time by Vite, so it must be
// present in the Vercel project's environment variables when the client builds.

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '/api';

export const API_BASE = API_URL;

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
