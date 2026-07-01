// Cookie / tracking consent. Single source of truth for whether the user has
// accepted analytics cookies. Analytics (see lib/analytics) MUST check
// hasAnalyticsConsent() before sending anything. Consent persists in localStorage
// and broadcasts `ss:consent-change` so listeners (analytics init) react live.

export type ConsentState = 'accepted' | 'rejected' | 'unset';

const KEY = 'ss_cookie_consent';
const EVENT = 'ss:consent-change';

export function getConsent(): ConsentState {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'accepted' || v === 'rejected' ? v : 'unset';
  } catch {
    return 'unset';
  }
}

export function setConsent(state: 'accepted' | 'rejected'): void {
  try {
    localStorage.setItem(KEY, state);
  } catch {
    /* storage blocked — consent simply won't persist; treated as unset next load */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<ConsentState>(EVENT, { detail: state }));
  }
}

/** True only when the user has explicitly accepted analytics cookies. */
export function hasAnalyticsConsent(): boolean {
  return getConsent() === 'accepted';
}

/** Subscribe to consent changes. Returns an unsubscribe fn. */
export function onConsentChange(cb: (state: ConsentState) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent<ConsentState>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

export const CONSENT_EVENT = EVENT;
