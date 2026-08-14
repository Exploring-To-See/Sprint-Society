import axios from 'axios';
import { config } from '../config';
import db from '../database/pg';
import { getUserPlan } from '../middleware/subscription';

let Anthropic: any = null;
try {
  Anthropic = require('@anthropic-ai/sdk').default || require('@anthropic-ai/sdk');
} catch {
  console.log('[AI Service] @anthropic-ai/sdk not available — Anthropic provider disabled');
}

const anthropic = (Anthropic && config.anthropic.apiKey)
  ? new Anthropic({ apiKey: config.anthropic.apiKey })
  : null;

/** True when any AI provider is configured. Groq wins when both keys are set. */
const useGroq = !!config.groq.apiKey;
export const aiAvailable = useGroq || !!anthropic;

interface AiTurn { role: 'user' | 'assistant'; content: string }
interface AiResult { text: string; model: string; inputTokens: number; outputTokens: number }

/**
 * Provider-agnostic chat completion. `kind` picks the model tier:
 * 'chat' = conversational coach, 'background' = cheap structured evals.
 *
 * Groq (OpenAI-compatible /chat/completions) is primary — the key lives in the
 * GROQ_API_KEY Vercel env var. Anthropic is the fallback provider when only
 * ANTHROPIC_API_KEY is set.
 */
async function completeChat(kind: 'chat' | 'background', system: string, turns: AiTurn[], maxTokens: number): Promise<AiResult> {
  if (useGroq) {
    const model = kind === 'chat' ? config.groq.models.chat : config.groq.models.background;
    const res = await axios.post(
      `${config.groq.baseUrl}/chat/completions`,
      {
        model,
        max_tokens: maxTokens,
        messages: [{ role: 'system', content: system }, ...turns],
      },
      {
        headers: { Authorization: `Bearer ${config.groq.apiKey}` },
        timeout: 25000, // Vercel function budget is 30s — fail before the platform does
      },
    );
    return {
      text: (res.data?.choices?.[0]?.message?.content ?? '').trim(),
      model,
      inputTokens: res.data?.usage?.prompt_tokens ?? 0,
      outputTokens: res.data?.usage?.completion_tokens ?? 0,
    };
  }

  if (!anthropic) throw new Error('No AI provider configured');
  const model = kind === 'chat' ? config.anthropic.models.sonnet : config.anthropic.models.haiku;
  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    thinking: { type: 'disabled' },
    system,
    messages: turns,
  });
  return {
    text: textOf(response),
    model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

// Fun error messages when AI is unavailable
const AI_UNAVAILABLE_MESSAGES = [
  'Coach is lacing up — try again in a moment!',
  'Even AI coaches need water breaks. Back shortly!',
  'The AI is doing hill repeats. Be right back!',
  'Coach is catching their breath — one second!',
  'Looks like the AI took a wrong turn. Try again!',
];

function getRandomErrorMessage(): string {
  return AI_UNAVAILABLE_MESSAGES[Math.floor(Math.random() * AI_UNAVAILABLE_MESSAGES.length)];
}

/**
 * Pull the assistant's text out of a Messages API response.
 *
 * Indexing content[0] is not safe: when thinking is on, a `thinking` block comes
 * first and the text block sits behind it, so content[0].type === 'text' is false
 * and the coach silently answers with an empty string. Find the text block instead.
 */
function textOf(response: any): string {
  const blocks: any[] = Array.isArray(response?.content) ? response.content : [];
  return blocks
    .filter(b => b?.type === 'text' && typeof b.text === 'string')
    .map(b => b.text)
    .join('')
    .trim();
}

/**
 * Build full context string for a user (used in system prompts)
 */
export async function buildUserContext(userId: number): Promise<string> {
  const user = await db.queryOne(`
    SELECT u.*, ux.total_xp, ux.current_level, ux.current_streak_days
    FROM users u LEFT JOIN user_xp ux ON u.id = ux.user_id
    WHERE u.id = $1
  `, [userId]) as any;

  if (!user) return '';

  // Get AI profile
  const profile = await db.queryOne('SELECT * FROM ai_profiles WHERE user_id = $1', [userId]) as any;

  // Get recent runs (last 5)
  const recentRuns = await db.query(`
    SELECT distance_meters, moving_time_seconds, average_pace_per_km, average_heartrate, start_date
    FROM activities WHERE user_id = $1 ORDER BY start_date DESC LIMIT 5
  `, [userId]) as any[];

  // Get tier
  const tier = await db.queryOne('SELECT tier, estimated_vo2max FROM tier_history WHERE user_id = $1 ORDER BY calculated_at DESC LIMIT 1', [userId]) as any;

  // Get runner profile (coach style, goals, etc.)
  const runnerProfile = await db.queryOne('SELECT * FROM runner_profiles WHERE user_id = $1', [userId]) as any;

  // Build context string
  let context = `RUNNER PROFILE:
Name: ${user.name}, Age: ${user.age || 'unknown'}, Gender: ${user.gender || 'unknown'}
Level: ${user.current_level || 1}, XP: ${user.total_xp || 0}, Streak: ${user.current_streak_days || 0} days
Fitness Level: ${user.fitness_level || 'unknown'}, Experience: ${user.running_experience || 'unknown'}
`;

  if (tier) {
    context += `Tier: ${tier.tier}, VO2max estimate: ${tier.estimated_vo2max || 'calculating'}\n`;
  }

  if (runnerProfile) {
    context += `Coach Style: ${runnerProfile.coach_style || 'motivator'}\n`;
    if (runnerProfile.dream_race) context += `Dream Race: ${runnerProfile.dream_race}\n`;
    if (runnerProfile.running_why) context += `Why They Run: ${runnerProfile.running_why}\n`;
    if (runnerProfile.training_days_per_week) context += `Training Days/Week: ${runnerProfile.training_days_per_week}\n`;
  }

  if (recentRuns.length > 0) {
    context += `\nRECENT RUNS (last ${recentRuns.length}):\n`;
    recentRuns.forEach(r => {
      const km = (r.distance_meters / 1000).toFixed(1);
      const mins = Math.floor(r.moving_time_seconds / 60);
      context += `- ${km}km in ${mins}min, pace ${r.average_pace_per_km?.toFixed(2) || '?'}/km, HR ${r.average_heartrate || '?'} (${r.start_date})\n`;
    });
  }

  if (profile) {
    const healthNotes = JSON.parse(profile.health_notes || '[]');
    const goals = JSON.parse(profile.goals || '[]');
    const dietPrefs = JSON.parse(profile.diet_preferences || '[]');
    const insights = JSON.parse(profile.conversation_insights || '[]');
    const personalCtx = JSON.parse(profile.personal_context || '[]');

    if (healthNotes.length) context += `\nHEALTH NOTES: ${healthNotes.join('; ')}\n`;
    if (goals.length) context += `GOALS: ${goals.join('; ')}\n`;
    if (dietPrefs.length) context += `DIET: ${dietPrefs.join('; ')}\n`;
    if (personalCtx.length) context += `PERSONAL CONTEXT: ${personalCtx.join('; ')}\n`;
    if (insights.length) context += `KEY INSIGHTS: ${insights.slice(-5).join('; ')}\n`;
  }

  return context;
}

/**
 * Check if user has exceeded their daily message limit
 */
export async function checkUsageLimit(userId: number, tier: 'base' | 'pro'): Promise<{ allowed: boolean; used: number; limit: number }> {
  const today = new Date().toISOString().split('T')[0];
  const usage = await db.queryOne(`
    SELECT COUNT(*) as count FROM ai_usage
    WHERE user_id = $1 AND purpose = 'chat' AND DATE(created_at) = $2
  `, [userId, today]) as any;

  const limit = tier === 'pro' ? 30 : 5;
  return { allowed: usage.count < limit, used: usage.count, limit };
}

/**
 * Track AI usage (tokens, model, purpose)
 */
export async function trackUsage(userId: number, model: string, inputTokens: number, outputTokens: number, purpose: string): Promise<void> {
  await db.execute('INSERT INTO ai_usage (user_id, model, input_tokens, output_tokens, purpose) VALUES ($1, $2, $3, $4, $5)',
    [userId, model, inputTokens, outputTokens, purpose]);
}

/**
 * Extract insights from a conversation and update AI profile
 */
export async function extractAndStoreInsights(userId: number, userMessage: string, aiResponse: string): Promise<void> {
  // Ensure profile exists
  await db.execute('INSERT INTO ai_profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [userId]);

  const profile = await db.queryOne('SELECT * FROM ai_profiles WHERE user_id = $1', [userId]) as any;
  const insights: string[] = JSON.parse(profile.conversation_insights || '[]');
  const healthNotes: string[] = JSON.parse(profile.health_notes || '[]');
  const goals: string[] = JSON.parse(profile.goals || '[]');
  const personalCtx: string[] = JSON.parse(profile.personal_context || '[]');

  const msg = userMessage.toLowerCase();

  // Extract health mentions
  const healthKeywords = ['injury', 'knee', 'ankle', 'shin', 'pain', 'hurt', 'sore', 'tight', 'surgery', 'physio', 'doctor', 'hamstring', 'calf', 'plantar', 'it band'];
  if (healthKeywords.some(k => msg.includes(k))) {
    const note = userMessage.slice(0, 200);
    if (!healthNotes.includes(note)) {
      healthNotes.push(note);
      if (healthNotes.length > 10) healthNotes.shift();
    }
  }

  // Extract goals
  const goalKeywords = ['goal', 'target', 'want to', 'aiming for', 'dream', 'plan to run', 'preparing for', 'training for', 'race'];
  if (goalKeywords.some(k => msg.includes(k))) {
    const note = userMessage.slice(0, 200);
    if (!goals.includes(note)) {
      goals.push(note);
      if (goals.length > 5) goals.shift();
    }
  }

  // Extract personal context
  const personalKeywords = ['work', 'schedule', 'family', 'travel', 'shift', 'morning', 'evening', 'vegetarian', 'vegan', 'allergy', 'diet', 'sleep', 'job', 'office'];
  if (personalKeywords.some(k => msg.includes(k))) {
    const note = userMessage.slice(0, 200);
    if (!personalCtx.includes(note)) {
      personalCtx.push(note);
      if (personalCtx.length > 10) personalCtx.shift();
    }
  }

  // Always store a conversation insight (compressed)
  const insight = `[${new Date().toISOString().split('T')[0]}] User: "${userMessage.slice(0, 80)}" → Coach addressed it`;
  insights.push(insight);
  if (insights.length > 20) insights.shift();

  await db.execute(`
    UPDATE ai_profiles SET health_notes = $1, goals = $2, personal_context = $3, conversation_insights = $4, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $5
  `, [JSON.stringify(healthNotes), JSON.stringify(goals), JSON.stringify(personalCtx), JSON.stringify(insights), userId]);
}

/**
 * Call Haiku for background training evaluation (lightweight, fast)
 */
/**
 * Personalized coach notes for a freshly generated training plan (Groq).
 * Returns null when no AI provider is configured or the call fails — the plan
 * itself is deterministic sports science and never depends on this.
 */
export async function generatePlanCoachNotes(
  userId: number,
  plan: { total_weeks?: number; vdot?: number; training_paces?: Record<string, number>; weeks?: unknown[] },
  goal: { race_name?: string; distance_meters?: number; race_date?: string },
): Promise<string | null> {
  if (!aiAvailable) return null;
  try {
    const context = await buildUserContext(userId);
    const paceStr = plan.training_paces
      ? Object.entries(plan.training_paces).map(([k, v]) => `${k}: ${Math.floor(Number(v) / 60)}:${String(Math.round(Number(v) % 60)).padStart(2, '0')}/km`).join(', ')
      : 'n/a';
    const result = await completeChat(
      'background',
      'You are Sprint Society\'s head running coach writing a short personal briefing for a runner\'s new training plan. Plain text only — no headings, no asterisks. 4-6 short lines, each starting with "- ". Reference their actual data. Be specific and realistic; never invent numbers.',
      [{
        role: 'user',
        content: `${context}\n\nNEW PLAN: ${plan.total_weeks} weeks toward ${goal.race_name || 'their goal'} (${goal.distance_meters ? (goal.distance_meters / 1000) + 'km' : 'distance n/a'}${goal.race_date ? ', race day ' + goal.race_date : ''}). Training paces: ${paceStr}.\n\nWrite the briefing: what to focus on in the first weeks, one watch-out based on their profile/history, and one motivating truth about where this plan takes them.`,
      }],
      350,
    );
    await trackUsage(userId, result.model, result.inputTokens, result.outputTokens, 'plan_notes');
    return result.text || null;
  } catch (err: any) {
    console.error('[AI] plan notes failed:', err.message);
    return null;
  }
}

export async function evaluateTrainingWithHaiku(userId: number): Promise<any> {
  if (!aiAvailable) return { error: 'AI not configured' };

  const context = await buildUserContext(userId);
  if (!context) return { error: 'User not found' };

  try {
    const result = await completeChat(
      'background',
      'You are Sprint Society\'s training intelligence engine. Analyze the runner\'s data and output ONLY valid JSON. No markdown, no explanation.',
      [{
        role: 'user',
        content: `${context}\n\nEvaluate this runner's recent performance. Output JSON:\n{\n  "plan_adjustments": ["adjustment1", "adjustment2"],\n  "insight_text": "1-2 sentence personalized insight for the runner",\n  "risk_flags": ["flag1 if any"],\n  "readiness_score": 0-100,\n  "weekly_summary": "brief summary if it's been 7+ days since last evaluation"\n}`,
      }],
      500,
    );

    await trackUsage(userId, result.model, result.inputTokens, result.outputTokens, 'background_eval');

    try {
      // Models sometimes wrap JSON in a markdown fence despite instructions.
      const cleaned = result.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      return JSON.parse(cleaned);
    } catch {
      return { insight_text: result.text, plan_adjustments: [], risk_flags: [] };
    }
  } catch (err: any) {
    console.error('[AI] background evaluation failed:', err.message);
    return { error: getRandomErrorMessage() };
  }
}

/**
 * Call Sonnet for conversational AI coaching (richer, more nuanced)
 */
export async function chatWithSonnet(userId: number, userMessage: string, recentMessages: Array<{ role: string; content: string }>): Promise<{ response: string; error?: string }> {
  if (!aiAvailable) return { response: '', error: 'AI coach is not configured yet. Coming soon!' };

  const plan = await getUserPlan(userId);
  const tier = plan === 'pro' ? 'pro' : 'base';
  const usageCheck = await checkUsageLimit(userId, tier);
  if (!usageCheck.allowed) {
    return {
      response: `You've used ${usageCheck.used}/${usageCheck.limit} messages today. Coach is resting — come back tomorrow!`,
      error: 'limit_reached',
    };
  }

  const context = await buildUserContext(userId);
  const conversationHistory = recentMessages.slice(-10).map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  conversationHistory.push({ role: 'user', content: userMessage });

  try {
    const result = await completeChat(
      'chat',
      `You are Sprint Society's AI running coach. You are warm, knowledgeable, and direct. You know this runner personally:\n\n${context}\n\nRules:\n- Always reference their specific data (pace, VO2max, recent runs) when relevant\n- Never give generic advice — personalize everything\n- Be concise (2-4 sentences unless they ask for detail)\n- If they mention injury/pain, always recommend caution and suggest seeing a professional\n- Use their name occasionally\n- If you notice something in their data (overtraining, improvement, consistency), proactively mention it\n- Keep a supportive but honest tone — celebrate progress, flag concerns\n- Format for a small chat bubble: short paragraphs, "-" for the occasional list, **bold** sparingly for key numbers. NEVER use # headings or tables.`,
      conversationHistory,
      600,
    );

    await trackUsage(userId, result.model, result.inputTokens, result.outputTokens, 'chat');
    await extractAndStoreInsights(userId, userMessage, result.text);

    return { response: result.text };
  } catch (err: any) {
    console.error('[AI] coach chat failed:', err.message);
    return { response: getRandomErrorMessage(), error: 'api_error' };
  }
}

/**
 * Get AI profile for display (My AI Profile page)
 */
export async function getAIProfile(userId: number) {
  await db.execute('INSERT INTO ai_profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [userId]);

  const profile = await db.queryOne('SELECT * FROM ai_profiles WHERE user_id = $1', [userId]) as any;
  const tier = await db.queryOne('SELECT tier, estimated_vo2max FROM tier_history WHERE user_id = $1 ORDER BY calculated_at DESC LIMIT 1', [userId]) as any;
  const user = await db.queryOne('SELECT name, age, gender, fitness_level, running_experience FROM users WHERE id = $1', [userId]) as any;
  const usage = await db.queryOne(`
    SELECT COUNT(*) as total_messages, COALESCE(SUM(input_tokens + output_tokens), 0) as total_tokens
    FROM ai_usage WHERE user_id = $1
  `, [userId]) as any;

  return {
    user: { ...user, tier: tier?.tier || null, vdot: tier?.estimated_vo2max || null },
    health_notes: JSON.parse(profile.health_notes || '[]'),
    goals: JSON.parse(profile.goals || '[]'),
    diet_preferences: JSON.parse(profile.diet_preferences || '[]'),
    personal_context: JSON.parse(profile.personal_context || '[]'),
    conversation_insights: JSON.parse(profile.conversation_insights || '[]'),
    running_profile: JSON.parse(profile.running_profile || '{}'),
    updated_at: profile.updated_at,
    usage_stats: { total_messages: usage.total_messages || 0, total_tokens: usage.total_tokens || 0 },
  };
}

/**
 * Update a specific field in the AI profile (user self-editing)
 */
export async function updateAIProfile(userId: number, field: string, value: any): Promise<boolean> {
  const validFields = ['health_notes', 'goals', 'diet_preferences', 'personal_context'];
  if (!validFields.includes(field)) return false;

  await db.execute('INSERT INTO ai_profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [userId]);
  await db.execute(`UPDATE ai_profiles SET ${field} = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`,
    [JSON.stringify(value), userId]);
  return true;
}

/**
 * Get today's usage stats for a user
 */
export async function getTodayUsage(userId: number) {
  const today = new Date().toISOString().split('T')[0];

  const chatUsage = await db.queryOne(`
    SELECT COUNT(*) as count FROM ai_usage
    WHERE user_id = $1 AND purpose = 'chat' AND DATE(created_at) = $2
  `, [userId, today]) as any;

  const totalUsage = await db.queryOne(`
    SELECT COUNT(*) as total_calls, COALESCE(SUM(input_tokens), 0) as input_tokens, COALESCE(SUM(output_tokens), 0) as output_tokens
    FROM ai_usage WHERE user_id = $1 AND DATE(created_at) = $2
  `, [userId, today]) as any;

  return {
    chat_messages_today: chatUsage.count,
    total_calls_today: totalUsage.total_calls,
    tokens_today: { input: totalUsage.input_tokens, output: totalUsage.output_tokens },
  };
}
