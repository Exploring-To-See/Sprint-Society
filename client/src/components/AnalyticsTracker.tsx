// Fires a page_view on every route change. Consent + auth gating live in
// lib/analytics.track, so this can mount unconditionally. Renders nothing.
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../lib/analytics';

export function AnalyticsTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);
  return null;
}
