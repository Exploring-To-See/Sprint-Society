import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { isNative } from './lib/native';
import './lib/sentry';
import 'leaflet/dist/leaflet.css';
import './index.css';
import './styles/ss-base.css';

// Admin host hardening: the PWA service worker can serve a stale (runner-app)
// shell on the admin domain (e.g. sprint-society-admin.vercel.app) if it was
// visited before admin mode existed. On the admin host, drop any registered SW +
// caches ONCE per session and reload, so the admin portal always loads fresh.
// The sessionStorage guard prevents a reload loop with the auto-registered SW.
(() => {
  const isAdminHost = /(^|[.-])admin([.-]|$)/.test(window.location.hostname);
  if (!isAdminHost || !('serviceWorker' in navigator)) return;
  if (sessionStorage.getItem('__ss_sw_cleared')) return;
  navigator.serviceWorker.getRegistrations().then((regs) => {
    if (!regs.length) return;
    sessionStorage.setItem('__ss_sw_cleared', '1');
    Promise.all(regs.map((r) => r.unregister()))
      .then(() => (window.caches ? caches.keys().then((ks) => Promise.all(ks.map((k) => caches.delete(k)))) : undefined))
      .then(() => window.location.reload());
  }).catch(() => {});
})();

// Service worker: web only. Inside the Capacitor shell (APK / iOS) a SW caches
// the app shell and can pin the WebView to a stale bundle across APK updates —
// so on native we never register and actively unregister anything left behind
// by older builds. On web we register manually (vite.config injectRegister is
// null) and auto-refresh once when a new deploy's SW takes control.
if ('serviceWorker' in navigator) {
  if (isNative) {
    navigator.serviceWorker.getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())))
      .then(() => (window.caches ? caches.keys().then((ks) => Promise.all(ks.map((k) => caches.delete(k)))) : undefined))
      .catch(() => {});
  } else {
    import('virtual:pwa-register')
      .then(({ registerSW }) => registerSW({ immediate: true }))
      .catch(() => {});
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (sessionStorage.getItem('__ss_reloaded_for_update')) return;
      sessionStorage.setItem('__ss_reloaded_for_update', '1');
      window.location.reload();
    });
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
