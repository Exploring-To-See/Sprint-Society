import { Router, Response } from 'express';
import db from '../database/pg';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Submit feedback (authenticated users)
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { type, message, page } = req.body;
  if (!type || !message) return res.status(400).json({ error: 'Type and message required' });

  const validTypes = ['bug', 'idea', 'complaint', 'praise'];
  if (!validTypes.includes(type)) return res.status(400).json({ error: 'Invalid type' });

  await db.execute('INSERT INTO feedback (user_id, type, message, page) VALUES ($1, $2, $3, $4)',
    [req.userId, type, message, page || null]);

  res.status(201).json({ message: 'Thanks for the feedback!' });
});

export default router;
