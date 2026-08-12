import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LocalNotifications } from '@capacitor/local-notifications';
import { isNative } from '../lib/native';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { NOTIFICATION_POLL_MS } from '../lib/backend';

interface AppNotification {
  id: number;
  title: string;
  body?: string | null;
}

/**
 * Native (APK / iOS) notification behavior. No-op on web.
 *
 * 1. Permission: Android 13+ requires the POST_NOTIFICATIONS runtime permission
 *    (declared in AndroidManifest.xml). We show the system dialog IN-APP right
 *    after sign-in — the user never has to dig through device Settings.
 * 2. Delivery: the app's notifications are rows in user_notifications served
 *    over REST (no FCM yet), so while the app is running we mirror newly
 *    arrived items into the Android system tray via LocalNotifications. The
 *    poll rides the same cadence as the in-app badge.
 */
export function useNativeNotifications() {
  const { user } = useAuth();

  // 1) Prime the permission with the in-app system dialog once signed in.
  useEffect(() => {
    if (!isNative || !user) return;
    LocalNotifications.checkPermissions()
      .then((s) => {
        if (s.display === 'prompt' || s.display === 'prompt-with-rationale') {
          return LocalNotifications.requestPermissions().then(() => undefined);
        }
      })
      .catch(() => { /* plugin unavailable — in-app notifications still work */ });
  }, [user]);

  // 2) Watch the latest notifications and surface new arrivals in the tray.
  const { data } = useQuery({
    queryKey: ['native-notifications-mirror'],
    queryFn: () => api.get('/notifications', { params: { limit: 5 } }).then((r) => r.data),
    enabled: isNative && !!user,
    refetchInterval: NOTIFICATION_POLL_MS,
    staleTime: NOTIFICATION_POLL_MS,
  });

  // null = first page load not yet seen; after that, anything newer gets mirrored.
  const lastSeenIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isNative || !data) return;
    const list: AppNotification[] = Array.isArray(data) ? data : (data.notifications ?? []);
    if (!list.length) return;

    if (lastSeenIdRef.current === null) {
      // Baseline on boot — don't replay the user's whole history into the tray.
      lastSeenIdRef.current = list[0].id;
      return;
    }
    if (list[0].id === lastSeenIdRef.current) return;

    const fresh: AppNotification[] = [];
    for (const n of list) {
      if (n.id === lastSeenIdRef.current) break;
      fresh.push(n);
    }
    lastSeenIdRef.current = list[0].id;
    if (!fresh.length) return;

    LocalNotifications.checkPermissions()
      .then((s) => {
        if (s.display !== 'granted') return;
        return LocalNotifications.schedule({
          notifications: fresh.slice(0, 3).map((n) => ({
            // Android notification ids are 32-bit ints.
            id: n.id % 2147483647,
            title: n.title || 'Sprint Society',
            body: n.body || '',
            smallIcon: 'ic_launcher_foreground',
          })),
        }).then(() => undefined);
      })
      .catch(() => {});
  }, [data]);
}
