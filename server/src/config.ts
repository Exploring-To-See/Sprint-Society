import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const isStaging = nodeEnv === 'staging';
const isServerless = !!process.env.VERCEL;

// Fail fast on missing required config. On a long-running server we exit the
// process; on Vercel serverless we throw instead (process.exit kills the whole
// lambda abnormally) so the misconfiguration surfaces as a clear 500 per request
// rather than silently falling back to an insecure default.
function failFast(msg: string): never {
  console.error(msg);
  if (isServerless) throw new Error(msg);
  process.exit(1);
}

if (isProduction || isStaging) {
  if (!process.env.JWT_SECRET) {
    failFast(`[FATAL] JWT_SECRET is required in ${nodeEnv}. Server cannot start without it.`);
  }
  if (process.env.JWT_SECRET!.length < 32) {
    console.warn(`[CONFIG] ⚠️  JWT_SECRET is short (${process.env.JWT_SECRET!.length} chars) — recommend 32+ for production`);
  }
  if (!process.env.DATABASE_URL) {
    failFast(`[FATAL] DATABASE_URL is required in ${nodeEnv}. Server cannot start without a Postgres connection.`);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('[CONFIG] ⚠️  ANTHROPIC_API_KEY not set — AI coaching/chat will be disabled');
  }
  if (!process.env.CLIENT_URL) {
    console.warn('[CONFIG] ⚠️  CLIENT_URL not set — using default. Set it for CORS to work correctly.');
  }
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn('[CONFIG] ⚠️  RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set — payments will fail');
  }
  if (!process.env.GOOGLE_CLIENT_ID) {
    console.warn('[CONFIG] ⚠️  GOOGLE_CLIENT_ID not set — Google sign-in disabled');
  }
}

if (!isProduction && !isStaging && !process.env.JWT_SECRET) {
  console.warn('[SECURITY] Using dev JWT secret. Set JWT_SECRET env var for production.');
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv,
  isProduction,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    models: {
      sonnet: 'claude-sonnet-4-6',
      haiku: 'claude-haiku-4-5-20251001',
    },
  },
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  // Razorpay signs webhooks with a SEPARATE dashboard "webhook secret", not the
  // API key secret. Set RAZORPAY_WEBHOOK_SECRET to the value configured under
  // Razorpay → Webhooks. Falls back to the key secret for backward compatibility.
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || '',
  google: {
    // Trim to survive trailing spaces/newlines pasted into the Vercel env editor —
    // a stray whitespace char silently breaks the id_token audience check.
    clientId: (process.env.GOOGLE_CLIENT_ID || '').trim(),
  },
};
