import jwt from 'jsonwebtoken';
import { config } from '../config';

export function signToken(userId: number): string {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn as string & {} });
}

export function verifyToken(token: string): { userId: number } {
  return jwt.verify(token, config.jwtSecret) as { userId: number };
}
