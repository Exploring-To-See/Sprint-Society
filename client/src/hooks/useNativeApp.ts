import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { isNative } from '../lib/native';

/** Routes where the Android back button should minimize the app instead of navigating. */
const ROOT_ROUTES = ['/', '/dashboard', '/admin'];

/**
 * Native app behavior for the Capacitor (APK / iOS) builds:
 * - Android hardware back button navigates back through the SPA history
 *   (and minimizes the app from root screens) instead of killing the WebView.
 * - Dark status bar matching the app theme.
 * - Hides the splash screen once React has mounted.
 *
 * No-op on web.
 */
export function useNativeApp() {
  const navigate = useNavigate();
  const location = useLocation();

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
}
