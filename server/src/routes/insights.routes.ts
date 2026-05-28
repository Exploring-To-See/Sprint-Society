import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateInsights } from '../engine/proactiveCoach';
import { getAthleteProfile } from '../engine/athleteMemory';
import { generateWeeklySummary, generatePreRunBrief, generatePostRunAnalysis } from '../engine/coachingOutputs';

const router = Router();
router.use(authenticate);

router.get('/', (req: AuthRequest, res: Response) => {
  const insights = generateInsights(req.userId!);
  res.json(insights);
});

router.get('/athlete-profile', (req: AuthRequest, res: Response) => {
  const profile = getAthleteProfile(req.userId!);
  res.json(profile);
});

router.get('/weekly-summary', (req: AuthRequest, res: Response) => {
  const summary = generateWeeklySummary(req.userId!);
  res.json(summary);
});

router.get('/pre-run', (req: AuthRequest, res: Response) => {
  const brief = generatePreRunBrief(req.userId!);
  res.json(brief);
});

router.get('/post-run/:activityId', (req: AuthRequest, res: Response) => {
  const activityId = parseInt(req.params.activityId);
  if (isNaN(activityId)) return res.status(400).json({ error: 'Invalid activity ID' });
  const analysis = generatePostRunAnalysis(req.userId!, activityId);
  res.json(analysis);
});

export default router;
