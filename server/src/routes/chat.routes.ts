import { Router, Response } from 'express';
import rateLimit from 'express-rate-limit';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { estimateVDOT, getTrainingPaces, calculateReadiness } from '../engine/trainingPlanGenerator';
import { calculateTrainingLoad } from '../engine/adaptiveEngine';
import { calculateHRZones, estimateMaxHR } from '../engine/heartRateZones';
import { config } from '../config';
import { chatWithSonnet, extractAndStoreInsights } from '../services/ai.service';

const router = Router();
router.use(authenticate);

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req: any) => req.user?.id?.toString() || req.userId?.toString() || req.ip,
  message: { error: 'Too many messages. Take a breath and try again in a minute.' }
});

// POST /chat/message — Send a message to the AI coach
router.post('/message', chatLimiter, async (req: AuthRequest, res: Response) => {
  const { message } = req.body;
  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Gather runner context for the AI
  const context = buildRunnerContext(req.userId!, user);

  // Save user message
  db.prepare('INSERT INTO chat_messages (user_id, role, content, context) VALUES (?, ?, ?, ?)').run(
    req.userId, 'user', message.trim(), JSON.stringify(context)
  );

  // Get conversation history (last 10 messages for context)
  const history = db.prepare(
    `SELECT role, content FROM chat_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`
  ).all(req.userId) as any[];

  // Check if user has pro subscription AND API key exists → use Sonnet
  const subscription = db.prepare('SELECT plan_key FROM user_subscriptions WHERE user_id = ? AND status = ?').get(req.userId, 'active') as any;
  const useAI = config.anthropic.apiKey && (subscription?.plan_key === 'pro' || subscription?.plan_key === 'premium');

  let response: string;

  if (useAI) {
    try {
      const aiResult = await chatWithSonnet(req.userId!, message.trim(), history.reverse());
      response = aiResult.response || generateCoachResponse(message.trim(), context, history);
    } catch {
      response = generateCoachResponse(message.trim(), context, history);
    }
  } else {
    response = generateCoachResponse(message.trim(), context, history.reverse());
  }

  // Save assistant message
  db.prepare('INSERT INTO chat_messages (user_id, role, content) VALUES (?, ?, ?)').run(
    req.userId, 'assistant', response
  );

  res.json({
    message: response,
    context_used: {
      has_recent_runs: context.recentRuns > 0,
      current_vdot: context.vdot,
      injury_risk: context.injuryRisk,
    },
    ai_powered: !!useAI,
  });
});

// GET /chat/history — Get chat history
router.get('/history', (req: AuthRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;

  const messages = db.prepare(
    `SELECT id, role, content, created_at FROM chat_messages WHERE user_id = ? ORDER BY created_at ASC LIMIT ?`
  ).all(req.userId, limit);

  res.json(messages);
});

// DELETE /chat/history — Clear chat history
router.delete('/history', (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM chat_messages WHERE user_id = ?').run(req.userId);
  res.json({ success: true });
});

// ===== Context Builder =====

function buildRunnerContext(userId: number, user: any) {
  const recentRuns = db.prepare(
    `SELECT distance_meters, moving_time_seconds, average_pace_per_km, average_heartrate, start_date, activity_type
     FROM activities WHERE user_id = ? ORDER BY start_date DESC LIMIT 20`
  ).all(userId) as any[];

  const stats = db.prepare(`
    SELECT COUNT(*) as total_runs, COALESCE(SUM(distance_meters), 0) as total_distance,
    COALESCE(AVG(average_pace_per_km), 0) as avg_pace
    FROM activities WHERE user_id = ?
  `).get(userId) as any;

  const xp = db.prepare('SELECT * FROM user_xp WHERE user_id = ?').get(userId) as any;
  const vdot = recentRuns.length > 0 ? estimateVDOT(recentRuns) : 30;
  const paces = getTrainingPaces(vdot);
  const readiness = calculateReadiness(recentRuns);

  const loadActivities = db.prepare(
    `SELECT distance_meters, moving_time_seconds, average_heartrate, start_date, activity_type
     FROM activities WHERE user_id = ? AND start_date > datetime('now', '-35 days')`
  ).all(userId) as any[];
  const load = calculateTrainingLoad(loadActivities, user.max_heartrate);

  const plan = db.prepare(
    `SELECT plan_data FROM transformation_plans WHERE user_id = ? ORDER BY generated_at DESC LIMIT 1`
  ).get(userId) as any;

  const currentWeek = plan ? (() => {
    const planData = JSON.parse(plan.plan_data);
    const weeksSinceStart = Math.floor((Date.now() - new Date(planData.generated_at).getTime()) / (7 * 86400000));
    return planData.weeks[Math.min(weeksSinceStart, planData.weeks.length - 1)];
  })() : null;

  return {
    name: user.name.split(' ')[0],
    age: user.age,
    gender: user.gender,
    experience: user.running_experience,
    fitnessLevel: user.fitness_level,
    injuries: JSON.parse(user.injury_history || '[]'),
    vdot,
    paces,
    readiness: readiness.label,
    readinessScore: readiness.score,
    recentRuns: recentRuns.length,
    totalRuns: stats.total_runs,
    totalDistanceKm: Math.round(stats.total_distance / 1000),
    avgPace: stats.avg_pace ? formatPace(stats.avg_pace) : null,
    currentLevel: xp?.current_level || 1,
    streak: xp?.current_streak_days || 0,
    injuryRisk: load.injury_risk,
    trainingBalance: load.training_stress_balance,
    currentPhase: currentWeek?.phase_name || null,
  };
}

// ===== AI Response Generator =====
// This is a rule-based coach for now. Upgrade to Claude API when ready.

function generateCoachResponse(message: string, context: any, history: any[]): string {
  const msg = message.toLowerCase();

  // Injury / pain questions
  if (msg.includes('pain') || msg.includes('hurt') || msg.includes('injur') || msg.includes('sore')) {
    return handleInjuryQuestion(msg, context);
  }

  // Training plan questions
  if (msg.includes('plan') || msg.includes('schedule') || msg.includes('week') || msg.includes('next run')) {
    return handleTrainingQuestion(msg, context);
  }

  // Pace questions
  if (msg.includes('pace') || msg.includes('faster') || msg.includes('speed') || msg.includes('tempo')) {
    return handlePaceQuestion(msg, context);
  }

  // Recovery questions
  if (msg.includes('recover') || msg.includes('rest') || msg.includes('tired') || msg.includes('fatigue')) {
    return handleRecoveryQuestion(msg, context);
  }

  // Race questions
  if (msg.includes('race') || msg.includes('5k') || msg.includes('10k') || msg.includes('marathon') || msg.includes('event')) {
    return handleRaceQuestion(msg, context);
  }

  // Nutrition
  if (msg.includes('eat') || msg.includes('food') || msg.includes('nutrition') || msg.includes('fuel') || msg.includes('diet')) {
    return handleNutritionQuestion(msg, context);
  }

  // Motivation
  if (msg.includes('motivat') || msg.includes('don\'t want') || msg.includes('skip') || msg.includes('lazy') || msg.includes('hard')) {
    return handleMotivationQuestion(msg, context);
  }

  // General / greeting
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.length < 10) {
    return `Hey ${context.name}! ${getStatusSummary(context)} What's on your mind?`;
  }

  // Default: provide helpful context-aware response
  return getContextualResponse(context);
}

function handleInjuryQuestion(msg: string, ctx: any): string {
  if (ctx.injuryRisk === 'critical' || ctx.injuryRisk === 'high') {
    return `${ctx.name}, your training load is already ${ctx.injuryRisk} right now. If you're feeling pain, I'd strongly recommend taking 2-3 full rest days. Pain during running is your body's alarm system — never push through sharp or worsening pain.\n\nIf it's:\n• Muscle soreness (dull, both sides) → Usually OK, reduce intensity\n• Joint pain (sharp, one side) → Stop running, rest, ice\n• Shin pain → Could be shin splints, reduce volume 50%\n\nWhen in doubt, a sports physio is worth the visit.`;
  }
  return `Listen to your body, ${ctx.name}. Here's my quick guide:\n\n• If pain is < 3/10 and doesn't worsen during the run → OK to continue at easy pace\n• If pain is > 3/10 or gets worse as you run → Stop and rest\n• If it persists > 3 days → See a physio\n\nYour current training load is ${ctx.injuryRisk} risk. ${ctx.injuryRisk === 'moderate' ? 'Be extra careful — you might be on the edge.' : 'You have room to train, but don\'t ignore signals.'}`;
}

function handleTrainingQuestion(msg: string, ctx: any): string {
  if (!ctx.currentPhase) {
    return `You don't have an active training plan yet. Head to the Training tab to generate one based on your goal race. I'll build a periodized plan using your VDOT of ${ctx.vdot}.`;
  }
  return `You're in the **${ctx.currentPhase}** phase right now. Your readiness is ${ctx.readiness} (${ctx.readinessScore}%).\n\n${
    ctx.readiness === 'Ready' ? 'Good to train as planned today.' :
    ctx.readiness === 'Moderate' ? 'Consider dropping intensity today — an easy run instead of a hard session would be smart.' :
    'Rest day recommended. Your body needs recovery before the next hard effort.'
  }\n\nTraining balance: ${ctx.trainingBalance > 0 ? `+${ctx.trainingBalance} (fresh)` : `${ctx.trainingBalance} (fatigued)`}. ${ctx.trainingBalance < -10 ? 'You\'re carrying fatigue — a deload would help.' : ''}`;
}

function handlePaceQuestion(msg: string, ctx: any): string {
  const p = ctx.paces;
  return `Based on your VDOT of ${ctx.vdot}, here are your training paces:\n\n• Easy: ${formatPace(p.easy_min)}–${formatPace(p.easy_max)}/km\n• Long run: ${formatPace(p.long_run)}/km\n• Tempo: ${formatPace(p.tempo)}/km\n• Interval: ${formatPace(p.interval)}/km\n\n${
    msg.includes('faster') ? 'To get faster: 80% of your runs should be at easy pace. Speed comes from consistency + the 20% of quality work (tempo + intervals). Most runners go too fast on easy days, which sabotages recovery.' : 'Keep easy runs truly easy — that\'s where the aerobic magic happens.'
  }`;
}

function handleRecoveryQuestion(msg: string, ctx: any): string {
  const tips = [
    'Sleep 7-9 hours (this is #1)',
    'Hydrate: aim for clear/pale urine',
    'Easy day after hard day (never stack hard sessions)',
    'Post-run: 20-30g protein within 30 minutes',
  ];

  if (ctx.injuryRisk === 'high' || ctx.injuryRisk === 'critical') {
    return `Your body is telling you to rest, ${ctx.name}. Training stress balance is ${ctx.trainingBalance} — that's deep fatigue.\n\nPrescription for the next 3 days:\n1. Day 1: Complete rest (no running)\n2. Day 2: 20-min walk only\n3. Day 3: Easy 3km if feeling better\n\nRecovery tips:\n${tips.map(t => `• ${t}`).join('\n')}`;
  }

  return `Recovery is where you actually get faster, ${ctx.name}. Your current status: ${ctx.readiness}.\n\nTop recovery priorities:\n${tips.map(t => `• ${t}`).join('\n')}\n\n${ctx.streak > 5 ? `Your ${ctx.streak}-day streak is impressive, but don't let streak pressure override rest needs.` : ''}`;
}

function handleRaceQuestion(msg: string, ctx: any): string {
  const vdot = ctx.vdot;
  const p = ctx.paces;
  // Rough predictions
  const predict5k = Math.round(5 * p.interval * 1.02);
  const predict10k = Math.round(10 * (p.tempo + (p.interval - p.tempo) * 0.3));
  const predictHM = Math.round(21.1 * (p.marathon + (p.tempo - p.marathon) * 0.4));

  return `Based on your VDOT of ${ctx.vdot}, here are your estimated race times:\n\n• 5K: ${formatDuration(predict5k)}\n• 10K: ${formatDuration(predict10k)}\n• Half Marathon: ${formatDuration(predictHM)}\n\n${ctx.totalRuns > 10 ? 'These predictions are fairly reliable based on your training data.' : 'Note: These get more accurate as you log more runs.'}\n\nWant me to build a training plan targeting a specific race?`;
}

function handleNutritionQuestion(msg: string, ctx: any): string {
  return `For a runner at your level (${ctx.experience}), here's what matters most:\n\n**Before running:**\n• 1-2 hours before: light carbs (banana, toast, oats)\n• If morning runner on empty stomach: that's fine for easy runs < 60min\n\n**During running:**\n• Under 60min: water only\n• Over 60min: 30-60g carbs/hour (gels, dates, sports drink)\n\n**After running:**\n• Within 30min: 20-30g protein + carbs\n• Example: chocolate milk, yogurt + fruit, or protein shake\n\n**Daily:**\n• Carbs are fuel, not the enemy (especially for runners)\n• Iron-rich foods (critical for runners: spinach, lentils, red meat)\n• ${ctx.gender === 'female' ? 'Female runners: extra attention to iron and calcium intake.' : ''}`;
}

function handleMotivationQuestion(msg: string, ctx: any): string {
  const motivators = [
    ctx.streak > 0 ? `You've got a ${ctx.streak}-day streak going. That consistency is your superpower.` : null,
    ctx.totalDistanceKm > 50 ? `You've already covered ${ctx.totalDistanceKm}km total. That's not nothing.` : null,
    `Your VDOT is ${ctx.vdot} — every run moves that number. Even a bad run beats no run.`,
    'The runners who get fast aren\'t the ones who never miss — they\'re the ones who come back after missing.',
    'Motivation is unreliable. Systems beat motivation. Just put shoes on and walk out the door.',
  ].filter(Boolean);

  const random = motivators[Math.floor(Math.random() * motivators.length)];
  return `${ctx.name}, I get it. Not every day is a fire day.\n\n${random}\n\nIf you truly don't want to run today, here's a deal: put on shoes, walk for 5 minutes. If after 5 minutes you still want to stop — stop. No guilt. But 90% of the time, you'll keep going.\n\n${ctx.readiness === 'Fatigued' ? 'Also — your readiness is low. Sometimes your body knows best. A rest day IS training.' : ''}`;
}

function getStatusSummary(ctx: any): string {
  if (ctx.recentRuns === 0) return 'I see you haven\'t logged any runs yet. Connect Strava or go for a run to get started!';
  return `You're currently ${ctx.readiness.toLowerCase()} readiness, VDOT ${ctx.vdot}, ${ctx.streak > 0 ? `on a ${ctx.streak}-day streak.` : 'ready to build momentum.'}`;
}

function getContextualResponse(ctx: any): string {
  return `I'm your AI running coach, ${ctx.name}. I can help with:\n\n• Training pace questions\n• Race predictions\n• Recovery advice\n• Injury guidance\n• Nutrition tips\n• Motivation when you need it\n\nI know your data: VDOT ${ctx.vdot}, ${ctx.totalRuns} runs logged, ${ctx.totalDistanceKm}km total. Ask me anything about your running.`;
}

function formatPace(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round(totalSeconds % 60);
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default router;
