import { Response, NextFunction } from 'express';
import db from '../database/pg';
import { AuthRequest } from './auth';

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const user = await db.queryOne('SELECT role FROM users WHERE id = $1', [req.userId]);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
