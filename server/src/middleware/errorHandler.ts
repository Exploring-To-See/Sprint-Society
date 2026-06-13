import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { captureException } from '../utils/sentry';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error({ err, method: req.method, path: req.path, requestId: (req as any).id }, 'Unhandled error');
  captureException(err, { method: req.method, path: req.path });
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' } });
}
