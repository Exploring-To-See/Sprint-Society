// First-party product analytics. Every send is gated by analytics consent
// (lib/consent) and requires an auth token — no-op otherwise. Fire-and-forget:
// analytics must never throw into the UI or block a render.
import api from './api';
import { hasAnalyticsConsent } from './consent';

function sessionId(): string {
  try {
    let s = sessionStorage.getItem('ss_sid');
    if (!s) {
      s = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem('ss_sid', s);
    }
    return s;
  } catch {
    return 'nosession';
  }
}

function loggedIn(): boolean {
  try {
    return !!localStorage.getItem('sprint_society_token');
  } catch {
    return false;
  }
}

/** Record a product event. Silently skipped without consent or a session. */
export function track(eventName: string, properties?: Record<string, unknown>, eventType = 'app'): void {
  if (!hasAnalyticsConsent() || !loggedIn()) return;
  api.post('/analytics/track', {
    event_type: eventType,
    event_name: eventName,
    properties,
    session_id: sessionId(),
  }).catch(() => { /* analytics is best-effort */ });
}

/** Record a page view. Called on every route change (see AnalyticsTracker). */
export function trackPageView(path: string): void {
  track('page_view', { path }, 'page');
}
