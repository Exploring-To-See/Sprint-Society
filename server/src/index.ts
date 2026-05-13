import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { config } from './config';
import { initializeDatabase } from './database/db';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import passwordRoutes from './routes/password.routes';
import stravaRoutes from './routes/strava.routes';
import runsRoutes from './routes/runs.routes';
import coachingRoutes from './routes/coaching.routes';
import gamificationRoutes from './routes/gamification.routes';
import adminRoutes from './routes/admin.routes';

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/auth', passwordRoutes);
app.use('/api/strava', stravaRoutes);
app.use('/api/runs', runsRoutes);
app.use('/api/coaching', coachingRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'Sprint Society API', version: '1.0.0' });
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

initializeDatabase();

app.listen(config.port, '0.0.0.0', () => {
  console.log(`\n  Sprint Society API running on http://localhost:${config.port}`);
  console.log(`  Environment: ${config.nodeEnv}\n`);
});

export default app;
