import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error(`[ERROR] ${err.message}`, err.stack);
  res.status(500).json({ error: 'Internal server error' });
}
