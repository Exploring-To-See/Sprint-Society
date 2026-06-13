import { Router, Response, Request } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import db from '../database/db';
import { signToken } from '../utils/jwt';
import { config } from '../config';
import { awardWelcomeBonus } from '../engine/kenduEngine';
import { createNotification } from './notifications.routes';

const router = Router();

interface GoogleTokenPayload {
  iss: string;
  sub: string;
  aud: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

let cachedCerts: Record<string, string> | null = null;
let certsExpiry = 0;

async function getGoogleCerts(): Promise<Record<string, string>> {
  if (cachedCerts && Date.now() < certsExpiry) return cachedCerts;

  const res = await axios.get('https://www.googleapis.com/oauth2/v1/certs');
  cachedCerts = res.data;

  const cacheControl = String(res.headers['cache-control'] || '');
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  certsExpiry = Date.now() + (maxAgeMatch ? parseInt(maxAgeMatch[1]) * 1000 : 3600000);

  return cachedCerts!;
}

async function verifyGoogleToken(idToken: string): Promise<GoogleTokenPayload> {
  const header = JSON.parse(Buffer.from(idToken.split('.')[0], 'base64url').toString());
  const kid = header.kid;

  const certs = await getGoogleCerts();
  const cert = certs[kid];
  if (!cert) throw new Error('Invalid token signing key');

  const payload = jwt.verify(idToken, cert, { algorithms: ['RS256'] }) as GoogleTokenPayload;

  // The token's `aud` is the client_id the frontend used (VITE_GOOGLE_CLIENT_ID).
  // It must match the server's GOOGLE_CLIENT_ID. Mismatch here is the #1 cause of a
  // popup that signs in but never completes — usually the two env vars hold different
  // IDs, or one has stray whitespace. Trim both sides and report the real values.
  const expected = config.google.clientId.trim();
  const got = String(payload.aud || '').trim();
  if (got !== expected) {
    throw new Error(
      `Token audience mismatch: token aud="${got}" but server GOOGLE_CLIENT_ID="${expected}". ` +
      'Make sure VITE_GOOGLE_CLIENT_ID (frontend build) and GOOGLE_CLIENT_ID (server) are the SAME client ID.'
    );
  }

  if (!['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss)) {
    throw new Error('Invalid token issuer');
  }

  if (!payload.email_verified) {
    throw new Error('Email not verified by Google');
  }

  return payload;
}

router.post('/google', async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: { code: 'GOOGLE_NO_CREDENTIAL', message: 'Google credential required' } });
    }

    if (!config.google.clientId) {
      return res.status(500).json({ error: { code: 'GOOGLE_NOT_CONFIGURED', message: 'Google sign-in is not configured on the server (GOOGLE_CLIENT_ID missing).' } });
    }

    const payload = await verifyGoogleToken(credential);
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists by google_id
    let user = db.prepare('SELECT id, name, email, role FROM users WHERE google_id = ?').get(googleId) as any;

    if (user) {
      const token = signToken(user.id);
      return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    }

    // Check if user exists by email (link Google to existing account)
    user = db.prepare('SELECT id, name, email, role FROM users WHERE email = ?').get(email) as any;

    if (user) {
      db.prepare('UPDATE users SET google_id = ?, profile_image_url = COALESCE(profile_image_url, ?) WHERE id = ?')
        .run(googleId, picture || null, user.id);
      const token = signToken(user.id);
      return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    }

    // New user — create account without password. Wrap every write in a single
    // transaction so a half-created user can never be persisted: either the whole
    // signup lands atomically, or nothing does.
    const createNewUser = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO users (name, email, phone, password_hash, google_id, gender, age, height_cm, weight_kg, fitness_level, running_experience, injury_history, profile_image_url)
        VALUES (?, ?, '', '', ?, 'male', 25, 170, 70, 'active', 'beginner', '[]', ?)
      `).run(name, email, googleId, picture || null);

      const newId = result.lastInsertRowid as number;

      db.prepare('INSERT INTO user_xp (user_id, total_xp, current_level) VALUES (?, 0, 1)').run(newId);

      const socialClub = db.prepare("SELECT id FROM communities WHERE name = 'Sprint Social Club'").get() as any;
      if (socialClub) {
        db.prepare('INSERT OR IGNORE INTO community_members (community_id, user_id, role) VALUES (?, ?, ?)').run(socialClub.id, newId, 'member');
        db.prepare('UPDATE communities SET member_count = member_count + 1 WHERE id = ?').run(socialClub.id);
      }

      awardWelcomeBonus(newId);
      createNotification(newId, 'welcome', 'Welcome to Sprint Society!', 'You received 25 starter Kendu. Start running to earn more!');

      return newId;
    });

    const userId = createNewUser();

    const token = signToken(userId);
    res.status(201).json({ token, user: { id: userId, name, email, role: 'runner' }, isNew: true });
  } catch (err: any) {
    // Log the full reason server-side (never the raw token) so Railway logs pinpoint the cause.
    console.error('[Google Auth] failed:', err?.message, err?.code || '');
    const msg: string = err?.message || '';
    if (msg.includes('audience') || msg.includes('issuer') || msg.includes('Invalid token') || msg.includes('not verified')) {
      return res.status(401).json({ error: { code: 'GOOGLE_AUTH_INVALID', message: msg || 'Invalid Google credential' } });
    }
    res.status(500).json({ error: { code: 'GOOGLE_AUTH_FAILED', message: 'Google authentication failed. Please try again.' } });
  }
});

export default router;
