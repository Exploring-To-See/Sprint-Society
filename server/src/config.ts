import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const isStaging = nodeEnv === 'staging';

if (isProduction || isStaging) {
  if (!process.env.JWT_SECRET) {
    console.error(`[FATAL] JWT_SECRET is required in ${nodeEnv}. Server cannot start without it.`);
    process.exit(1);
  }
  if (process.env.JWT_SECRET.length < 32) {
    console.error(`[FATAL] JWT_SECRET must be 32+ characters in ${nodeEnv}. Current: ${process.env.JWT_SECRET.length} chars.`);
    process.exit(1);
  }
  if (!process.env.CLIENT_URL) {
    console.error(`[FATAL] CLIENT_URL is required in ${nodeEnv}.`);
    process.exit(1);
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
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
  },
};
