import { Request, Response, NextFunction } from 'express';

/**
 * Fields to sanitize on incoming POST/PUT/PATCH requests.
 * These are user-facing text fields that could contain malicious input.
 */
const TEXT_FIELDS = [
  'body', 'content', 'title', 'description', 'name',
  'message', 'bio', 'location', 'tagline', 'comment',
  'announcement', 'notes', 'feedback', 'reason',
];

/**
 * Strip HTML tags and dangerous patterns from a string.
 * Prevents XSS and script injection without external dependencies.
 */
function stripHtml(input: string): string {
  if (typeof input !== 'string') return input;

  let cleaned = input;

  // Remove <script>...</script> tags and content
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove <style>...</style> tags and content
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove all HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, '');

  // Remove javascript: protocol in any remaining context
  cleaned = cleaned.replace(/javascript\s*:/gi, '');

  // Remove on* event handlers that might slip through (e.g., in malformed input)
  cleaned = cleaned.replace(/on\w+\s*=\s*(['"])[^'"]*\1/gi, '');
  cleaned = cleaned.replace(/on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove encoded entities that could be used in attribute contexts
  cleaned = cleaned.replace(/&#\d+;/g, '').replace(/&#x[\da-fA-F]+;/g, '');

  // Remove null bytes
  cleaned = cleaned.replace(/\0/g, '');

  // Trim excessive whitespace
  cleaned = cleaned.replace(/\s{10,}/g, '  ');

  return cleaned.trim();
}

/**
 * Recursively sanitize an object's text fields.
 */
function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  if (!obj || typeof obj !== 'object') return obj;

  const result: Record<string, unknown> = { ...obj };

  for (const key of Object.keys(result)) {
    const value = result[key];

    if (typeof value === 'string' && TEXT_FIELDS.includes(key)) {
      result[key] = stripHtml(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => {
        if (typeof item === 'string' && TEXT_FIELDS.includes(key)) {
          return stripHtml(item);
        }
        if (typeof item === 'object' && item !== null) {
          return sanitizeObject(item as Record<string, unknown>);
        }
        return item;
      });
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    }
  }

  return result;
}

/**
 * Express middleware that sanitizes request body on POST/PUT/PATCH.
 * Strips HTML tags and script injection from known text fields.
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    for (const key of Object.keys(req.query)) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = stripHtml(req.query[key] as string);
      }
    }
  }
  next();
}
