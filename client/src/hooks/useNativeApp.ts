import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { isNative } from '../lib/native';
import { useAuth } from '../context/AuthContext';

/** Routes where the Android back button should minimize the app instead of navigating. */
const ROOT_ROUTES = ['/', '/dashboard', '/admin'];

/**
 * Native app behavior for the Capacitor (APK / iOS) builds:
 * - Android hardware back button navigates back through the SPA history
 *   (and minimizes the app from root screens) instead of killing the WebView.
 * - Dark status bar matching the app theme.
 * - Hides the splash screen once React has mounted.
 * - Captures deep-link auth callbacks from the hosted Google/email bridge
 *   (`in.sprintsociety.app://auth?token=…`).
 *
 * No-op on web.
 */
export function useNativeApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { acceptToken } = useAuth();

  useEffect(() => {
    if (!isNative) return;
    SplashScreen.hide().catch(() => {});
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#09090B' }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isNative) return;
    const sub = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (ROOT_ROUTES.includes(window.location.pathname) || !canGoBack) {
        CapApp.minimizeApp();
      } else {
        navigate(-1);
      }
    });
    return () => { sub.then(s => s.remove()); };
  }, [navigate, location.pathname]);

  // Deep-link auth: in.sprintsociety.app://auth?token=JWT&isNew=1
  useEffect(() => {
    if (!isNative) return;

    const applyAuthUrl = (url: string) => {
      try {
        const parsed = new URL(url);
        if (parsed.hostname !== 'auth' && !parsed.pathname.includes('auth')) {
          // Custom schemes parse as protocol://hostname/path — hostname is "auth"
          // for in.sprintsociety.app://auth?token=…
        }
        const jwt = parsed.searchParams.get('token');
        if (!jwt) return;
        acceptToken(jwt);
        const isNew = parsed.searchParams.get('isNew') === '1';
        navigate(isNew ? '/profiling' : '/dashboard', { replace: true });
      } catch (err) {
        console.warn('[native] failed to parse auth deep link', err);
      }
    };

    // Cold start: app launched via deep link
    CapApp.getLaunchUrl()
      .then((result) => { if (result?.url) applyAuthUrl(result.url); })
      .catch(() => {});

    const sub = CapApp.addListener('appUrlOpen', ({ url }) => applyAuthUrl(url));
    return () => { sub.then(s => s.remove()); };
  }, [acceptToken, navigate]);
}
