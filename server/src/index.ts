import { createServer } from 'http';
import { config } from './config';
import { createApp } from './app';
import { initializeDatabase } from './database/pg';
import { startScheduler } from './scheduler';

/**
 * Self-hosted (always-on) entry point.
 *
 * Builds the shared Express app and layers on the things that only make sense on
 * a long-running process: a persistent WebSocket server, the in-process
 * scheduler, and serving the built SPA. On Vercel none of this runs — the
 * serverless function in api/index.ts uses the same createApp() without them.
 */
const app = createApp({ serveStatic: config.nodeEnv === 'production' });
const server = createServer(app);

async function start() {
  try {
    await initializeDatabase();
    console.log('  Database initialized');
  } catch (err) {
    console.error('  WARNING: Database initialization error (non-fatal):', err);
  }

  try {
    const { initWebSocket } = await import('./websocket');
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
}

start().catch(console.error);

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});

export default app;
