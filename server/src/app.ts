// Patches Express 4 so rejected promises from async route handlers are forwarded
// to the error handler. Without this, any DB rejection (e.g. a Supabase pooler
// hiccup) leaves the request hanging until the serverless function times out
// (504) instead of returning a clean JSON 500. MUST be imported before routes.
import 'express-async-errors';
import express from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import db from './database/pg';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter, authLimiter, aiLimiter, chatLimiter } from './middleware/rateLimiter';
import { sanitizeInput } from './middleware/sanitize';
import { createRequestLogger } from './utils/logger';
import { getAllFlags } from './utils/featureFlags';
import './utils/sentry';
import authRoutes from './routes/auth.routes';
import passwordRoutes from './routes/password.routes';
import runsRoutes from './routes/runs.routes';
import coachingRoutes from './routes/coaching.routes';
import trainingRoutes from './routes/training.routes';
import onboardingRoutes from './routes/onboarding.routes';
import progressRoutes from './routes/progress.routes';
import gamificationRoutes from './routes/gamification.routes';
import adminRoutes from './routes/admin.routes';
import heartrateRoutes from './routes/heartrate.routes';
import recordsRoutes from './routes/records.routes';
import adaptiveRoutes from './routes/adaptive.routes';
import socialRoutes from './routes/social.routes';
import chatRoutes from './routes/chat.routes';
import eventsRoutes from './routes/events.routes';
import communitiesRoutes from './routes/communities.routes';
import notificationsRoutes from './routes/notifications.routes';
import profileRoutes from './routes/profile.routes';
import subscriptionRoutes from './routes/subscription.routes';
import profilingRoutes from './routes/profiling.routes';
import inviteRoutes from './routes/invite.routes';
import feedbackRoutes from './routes/feedback.routes';
import aiRoutes from './routes/ai.routes';
import kenduRoutes from './routes/kendu.routes';
import wellnessRoutes from './routes/wellness.routes';
import goalsRoutes from './routes/goals.routes';
import dashboardBatchRoutes from './routes/dashboard.routes';
import insightsBatchRoutes from './routes/insights.batch.routes';
import coachRoutes from './routes/coach.routes';
import adminAnalyticsRoutes from './routes/admin-analytics.routes';
import adminFlagsRoutes from './routes/admin-flags.routes';
import adminSegmentsRoutes from './routes/admin-segments.routes';
import adminNotificationsRoutes from './routes/admin-notifications.routes';
import adminContentRoutes from './routes/admin-content.routes';
import adminAuditRoutes from './routes/admin-audit.routes';
import adminEngineeringRoutes from './routes/admin-engineering.routes';
import adminModerationRoutes from './routes/admin-moderation.routes';
import adminBackupRoutes from './routes/admin-backup.routes';
import insightsRoutes from './routes/insights.routes';
import googleAuthRoutes from './routes/google-auth.routes';
import cronRoutes from './routes/cron.routes';

export interface CreateAppOptions {
  /**
   * Serve the built client (client/dist) and SPA fallback from Express.
   * Self-hosted single-host deploys set this to true. On Vercel the static
   * client is served by the platform, so the serverless function leaves it false.
   */
  serveStatic?: boolean;
}

/**
 * Build the full Sprint Society API as an Express app.
 *
 * This is the single source of truth for the HTTP surface and is shared by:
 *   - server/src/index.ts  — the always-on self-hosted server (adds WebSocket + scheduler + listen)
 *   - api/index.ts         — the Vercel serverless function (stateless, no WebSocket/scheduler)
 */
export function createApp(options: CreateAppOptions = {}) {
  const app = express();

  // Behind Vercel/any reverse proxy: trust X-Forwarded-For so req.ip is the real
  // client IP. Without this every request shares the proxy's IP, so the per-IP
  // rate limiter becomes a single GLOBAL bucket and locks out all users at once.
  app.set('trust proxy', true);

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: config.clientUrl, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(createRequestLogger());
  app.use(sanitizeInput);
  app.use('/api', generalLimiter);

  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/auth', authLimiter, googleAuthRoutes);
  app.use('/api/auth', authLimiter, passwordRoutes);
  app.use('/api/runs', runsRoutes);
  app.use('/api/coaching', coachingRoutes);
  app.use('/api/training', trainingRoutes);
  app.use('/api/onboarding', onboardingRoutes);
  app.use('/api/progress', progressRoutes);
  app.use('/api/gamification', gamificationRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/admin/analytics', adminAnalyticsRoutes);
  app.use('/api/admin/flags', adminFlagsRoutes);
  app.use('/api/admin/segments', adminSegmentsRoutes);
  app.use('/api/admin/push', adminNotificationsRoutes);
  app.use('/api/admin/content', adminContentRoutes);
  app.use('/api/admin/audit', adminAuditRoutes);
  app.use('/api/admin/engineering', adminEngineeringRoutes);
  app.use('/api/admin/moderation', adminModerationRoutes);
  app.use('/api/admin/backup', adminBackupRoutes);
  app.use('/api/heartrate', heartrateRoutes);
  app.use('/api/records', recordsRoutes);
  app.use('/api/adaptive', adaptiveRoutes);
  app.use('/api/social', socialRoutes);
  app.use('/api/chat', chatLimiter, chatRoutes);
  app.use('/api/events', eventsRoutes);
  app.use('/api/communities', communitiesRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/subscription', subscriptionRoutes);
  app.use('/api/profiling', profilingRoutes);
  app.use('/api/invite', inviteRoutes);
  app.use('/api/feedback', feedbackRoutes);
  app.use('/api/ai', aiLimiter, aiRoutes);
  app.use('/api/kendu', kenduRoutes);
  app.use('/api/wellness', wellnessRoutes);
  app.use('/api/goals', goalsRoutes);
  app.use('/api/insights', insightsRoutes);
  app.use('/api/dashboard', dashboardBatchRoutes);
  app.use('/api/coach/insights', insightsBatchRoutes);
  // One-way (Rs.9) AI coach: pre-run brief, during-run cue stream, post-run report.
  app.use('/api/coach', coachRoutes);

  // Scheduled-job endpoints (challenge expiry, streak decay, backup). On Vercel
  // these are driven by Vercel Cron (see vercel.json "crons"); on a self-hosted
  // server the in-process scheduler calls the same handlers directly.
  app.use('/api/cron', cronRoutes);

  // GET /api/flags — client-facing feature flags (authenticated)
  app.get('/api/flags', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      let userId: number | undefined;
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const decoded = jwt.verify(authHeader.slice(7), config.jwtSecret) as any;
          userId = decoded.userId || decoded.id;
        } catch {}
      }
      const flags = await getAllFlags(userId);
      res.json(flags);
    } catch (err) {
      res.json({});
    }
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', name: 'Sprint Society API', version: '1.2.0', uptime: Math.floor(process.uptime()) });
  });

  // Public announcements endpoint (runners see these on their dashboard)
  app.get('/api/announcements', async (_req, res) => {
    try {
      const announcements = await db.query(`
        SELECT a.id, a.title, a.body, a.pinned, a.created_at, COALESCE(u.name, 'System') as author_name
        FROM announcements a LEFT JOIN users u ON a.admin_id = u.id
        ORDER BY a.pinned DESC, a.created_at DESC LIMIT 10
      `, []);
      res.json(announcements);
    } catch (err) {
      console.error('[Announcements] Error:', err);
      res.json([]);
    }
  });

  // Unknown API routes must return JSON 404 — never fall through to the SPA
  // catch-all below (which would serve index.html with a 200 and break client
  // error handling).
  app.use('/api', (req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `No such endpoint: ${req.method} ${req.originalUrl}` } });
  });

  // Single-host deploy only: serve the built SPA. On Vercel this is handled by
  // the platform's static hosting, so the serverless function leaves it off.
  if (options.serveStatic) {
    const clientDist = path.join(__dirname, '../../client/dist');
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.use(errorHandler);

  return app;
}

export default createApp;
