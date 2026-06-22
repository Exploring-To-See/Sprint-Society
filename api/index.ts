/**
 * Vercel serverless entry for the Sprint Society API.
 *
 * vercel.json rewrites every /api/* request (any depth) to this single function
 * (a bare catch-all filename only matched one path segment on Vercel, which 404'd
 * everything deeper than /api/x — e.g. /api/auth/login). It reuses the exact same
 * Express app as the self-hosted server (server/src/app.ts) but WITHOUT the
 * always-on pieces:
 *   - no WebSocket server (serverless can't hold persistent connections —
 *     the client falls back to polling; Supabase Realtime is the planned upgrade)
 *   - no in-process scheduler (Vercel Cron hits /api/cron/maintenance instead)
 *   - no static file serving (Vercel serves the built client from client/dist)
 *
 * The Postgres pool in server/src/database/pg.ts is created once per warm
 * function instance and reused across invocations.
 */
import { createApp } from '../server/src/app';

const app = createApp({ serveStatic: false });

export default app;
