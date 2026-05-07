import { Response, NextFunction } from 'express';
import db from '../database/db';
import { AuthRequest } from './auth';

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.userId) as any;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
