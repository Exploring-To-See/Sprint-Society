import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { config } from './config';
import { initializeDatabase } from './database/db';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter, authLimiter, aiLimiter, chatLimiter } from './middleware/rateLimiter';
import { sanitizeInput } from './middleware/sanitize';
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
import adminAnalyticsRoutes from './routes/admin-analytics.routes';
import adminFlagsRoutes from './routes/admin-flags.routes';
import adminSegmentsRoutes from './routes/admin-segments.routes';
import adminNotificationsRoutes from './routes/admin-notifications.routes';
import adminContentRoutes from './routes/admin-content.routes';
import adminAuditRoutes from './routes/admin-audit.routes';
import adminEngineeringRoutes from './routes/admin-engineering.routes';
import adminModerationRoutes from './routes/admin-moderation.routes';
import insightsRoutes from './routes/insights.routes';
import { startScheduler } from './scheduler';

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(sanitizeInput);
app.use('/api', generalLimiter);

app.use('/api/auth', authLimiter, authRoutes);
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
app.use('/api/insights', insightsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'Sprint Society API', version: '1.2.0', uptime: Math.floor(process.uptime()) });
});

// Public announcements endpoint (runners see these on their dashboard)
app.get('/api/announcements', (req, res) => {
  const { default: db } = require('./database/db');
  const announcements = db.prepare(`
    SELECT a.id, a.title, a.body, a.pinned, a.created_at, u.name as author_name
    FROM announcements a JOIN users u ON a.admin_id = u.id
    ORDER BY a.pinned DESC, a.created_at DESC LIMIT 10
  `).all();
  res.json(announcements);
});

if (config.nodeEnv === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(errorHandler);

try {
  initializeDatabase();
  console.log('  Database initialized');
} catch (err) {
  console.error('  WARNING: Database initialization error (non-fatal):', err);
}

const server = createServer(app);

try {
  const { initWebSocket } = require('./websocket');
  initWebSocket(server);
  console.log('  WebSocket server attached at /ws');
} catch (e) {
  console.log('  WebSocket skipped (ws package not installed)');
}

server.listen(config.port, '0.0.0.0', () => {
  console.log(`\n  Sprint Society API running on http://localhost:${config.port}`);
  console.log(`  Environment: ${config.nodeEnv}\n`);
  try {
    startScheduler();
  } catch (err) {
    console.error('  Scheduler failed to start:', err);
  }
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});

export default app;
