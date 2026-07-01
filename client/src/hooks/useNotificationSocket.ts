import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { backendWsUrl, WS_ENABLED, NOTIFICATION_POLL_MS } from '../lib/backend';

/**
 * Keeps notifications fresh.
 *
 * - WebSocket transport (always-on backend, VITE_ENABLE_WS=true): the server
 *   pushes a `notification` event and we invalidate the notification queries.
 * - Polling fallback (Vercel serverless, default): we re-fetch the notification
 *   queries on an interval so badges/lists stay current without a socket.
 */
export function useNotificationSocket(enabled: boolean) {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!enabled) return;

    function refreshNotifications() {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }

    // Polling fallback — no persistent socket available (e.g. Vercel serverless).
    if (!WS_ENABLED) {
      const interval = setInterval(refreshNotifications, NOTIFICATION_POLL_MS);
      return () => clearInterval(interval);
    }

    function connect() {
      const token = localStorage.getItem('sprint_society_token');
      if (!token) return;

      const ws = new WebSocket(backendWsUrl(`/ws?token=${token}`));
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'notification') {
            refreshNotifications();
          }
        } catch {}
      };

      ws.onclose = () => {
        setConnected(false);
        reconnectTimeout.current = setTimeout(connect, 5000);
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      clearTimeout(reconnectTimeout.current);
      wsRef.current?.close();
    };
  }, [enabled, queryClient]);

  return connected;
}
