import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const isStaging = nodeEnv === 'staging';

if (isProduction || isStaging) {
  const required = ['JWT_SECRET', 'CLIENT_URL'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.warn(`[CONFIG] Missing env vars for ${nodeEnv}: ${missing.join(', ')} — using defaults`);
  }
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('[CONFIG] JWT_SECRET is short — recommend 32+ characters for production');
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
