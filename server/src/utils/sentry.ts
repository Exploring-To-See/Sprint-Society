let Sentry: any = null;

const SENTRY_DSN = process.env.SENTRY_DSN || '';

if (SENTRY_DSN) {
  try {
    Sentry = require('@sentry/node');
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 0.1,
      beforeSend(event: any) {
        if (event.request?.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
        return event;
      },
    });
    console.log('[Sentry] Initialized (server)');
  } catch {
    console.warn('[Sentry] @sentry/node not installed — error tracking disabled');
    Sentry = null;
  }
} else {
  console.log('[Sentry] No SENTRY_DSN set — error tracking disabled');
}

export function captureException(err: Error, context?: Record<string, any>) {
  if (Sentry) {
    Sentry.captureException(err, context ? { extra: context } : undefined);
  }
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (Sentry) {
    Sentry.captureMessage(message, level);
  }
}

export default Sentry;
