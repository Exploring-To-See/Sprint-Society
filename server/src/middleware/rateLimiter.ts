import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator: (req: Request) => string;
  message?: string;
}

/**
 * In-memory sliding window rate limiter.
 * No external dependencies — uses a Map with timestamp arrays.
 */
class SlidingWindowStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  isAllowed(key: string, windowMs: number, maxRequests: number): { allowed: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    const windowStart = now - windowMs;

    let entry = this.store.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      this.store.set(key, entry);
    }

    // Remove timestamps outside the window
    entry.timestamps = entry.timestamps.filter(ts => ts > windowStart);

    if (entry.timestamps.length >= maxRequests) {
      const oldestInWindow = entry.timestamps[0];
      const resetMs = oldestInWindow + windowMs - now;
      return { allowed: false, remaining: 0, resetMs };
    }

    entry.timestamps.push(now);
    const remaining = maxRequests - entry.timestamps.length;
    return { allowed: true, remaining, resetMs: windowMs };
  }

  private cleanup() {
    const now = Date.now();
    // Remove entries that haven't been accessed in 30 minutes
    const maxAge = 30 * 60 * 1000;
    for (const [key, entry] of this.store.entries()) {
      const newest = entry.timestamps[entry.timestamps.length - 1] || 0;
      if (now - newest > maxAge) {
        this.store.delete(key);
      }
    }
  }
}

const globalStore = new SlidingWindowStore();

function createRateLimiter(config: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Disabled under test so integration suites can fire many requests per IP.
    if (process.env.NODE_ENV === 'test') return next();

    const key = config.keyGenerator(req);
    const { allowed, remaining, resetMs } = globalStore.isAllowed(key, config.windowMs, config.maxRequests);

    res.setHeader('X-RateLimit-Limit', config.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil((Date.now() + resetMs) / 1000).toString());

    if (!allowed) {
      return res.status(429).json({
        error: config.message || 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(resetMs / 1000),
      });
    }

    next();
  };
}

// --- Pre-configured limiters ---

/**
 * Auth routes: 10 requests per 10 minutes per IP
 * Protects login/register/forgot-password from brute force while still allowing
 * a real user to mistype their password a few times. (Per-IP only works because
 * `trust proxy` is set so req.ip is the real client, not the shared proxy IP.)
 */
export const authLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes — short so a locked-out user recovers fast
  maxRequests: 12,
  keyGenerator: (req) => `auth:${req.ip}`,
  message: 'Too many attempts. Please wait a couple of minutes and try again.',
});

/**
 * AI routes: 10 requests per minute per user
 * Protects expensive AI API calls
 */
export const aiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  keyGenerator: (req) => `ai:${(req as AuthRequest).userId || req.ip}`,
  message: 'AI rate limit reached. Please wait a minute before sending more requests.',
});

/**
 * General API: 100 requests per minute per IP
 * Prevents abuse across all endpoints
 */
export const generalLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  keyGenerator: (req) => `general:${req.ip}`,
  message: 'Too many requests. Please slow down.',
});

/**
 * Chat: 20 messages per minute per user
 * Prevents spam in AI chat and community chat
 */
export const chatLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20,
  keyGenerator: (req) => `chat:${(req as AuthRequest).userId || req.ip}`,
  message: 'Too many messages. Take a breath and try again in a minute.',
});

export { createRateLimiter };
