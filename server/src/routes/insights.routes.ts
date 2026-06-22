import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateInsights } from '../engine/proactiveCoach';
import { getAthleteProfile } from '../engine/athleteMemory';
import { generateWeeklySummary, generatePreRunBrief, generatePostRunAnalysis } from '../engine/coachingOutputs';

const router = Router();
router.use(authenticate);

// NOTE: all engine functions below are async. They must be awaited — returning
// the Promise straight to res.json() serializes it as `{}` and the real insight
// is lost. Errors propagate to the global errorHandler (express-async-errors).
router.get('/', async (req: AuthRequest, res: Response) => {
  const insights = await generateInsights(req.userId!);
  res.json(insights);
});

router.get('/athlete-profile', async (req: AuthRequest, res: Response) => {
  const profile = await getAthleteProfile(req.userId!);
  res.json(profile);
});

router.get('/weekly-summary', async (req: AuthRequest, res: Response) => {
  const summary = await generateWeeklySummary(req.userId!);
  res.json(summary);
});

router.get('/pre-run', async (req: AuthRequest, res: Response) => {
  const brief = await generatePreRunBrief(req.userId!);
  res.json(brief);
});

router.get('/post-run/:activityId', async (req: AuthRequest, res: Response) => {
  const activityId = parseInt(req.params.activityId);
  if (isNaN(activityId)) return res.status(400).json({ error: 'Invalid activity ID' });
  const analysis = await generatePostRunAnalysis(req.userId!, activityId);
  res.json(analysis);
});

export default router;
