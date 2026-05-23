import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import db from '../database/db';

const anthropic = config.anthropic.apiKey
  ? new Anthropic({ apiKey: config.anthropic.apiKey })
  : null;

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
 * Build full context string for a user (used in system prompts)
 */
export function buildUserContext(userId: number): string {
  const user = db.prepare(`
    SELECT u.*, ux.total_xp, ux.current_level, ux.current_streak_days
    FROM users u LEFT JOIN user_xp ux ON u.id = ux.user_id
    WHERE u.id = ?
  `).get(userId) as any;

  if (!user) return '';

  // Get AI profile
  const profile = db.prepare('SELECT * FROM ai_profiles WHERE user_id = ?').get(userId) as any;

  // Get recent runs (last 5)
  const recentRuns = db.prepare(`
    SELECT distance_meters, moving_time_seconds, average_pace_per_km, average_heartrate, start_date
    FROM activities WHERE user_id = ? ORDER BY start_date DESC LIMIT 5
  `).all(userId) as any[];

  // Get tier
  const tier = db.prepare('SELECT tier, estimated_vo2max FROM tier_history WHERE user_id = ? ORDER BY calculated_at DESC LIMIT 1').get(userId) as any;

  // Get runner profile (coach style, goals, etc.)
  const runnerProfile = db.prepare('SELECT * FROM runner_profiles WHERE user_id = ?').get(userId) as any;

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
export function checkUsageLimit(userId: number, tier: 'base' | 'pro'): { allowed: boolean; used: number; limit: number } {
  const today = new Date().toISOString().split('T')[0];
  const usage = db.prepare(`
    SELECT COUNT(*) as count FROM ai_usage
    WHERE user_id = ? AND purpose = 'chat' AND DATE(created_at) = ?
  `).get(userId, today) as any;

  const limit = tier === 'pro' ? 30 : 5;
  return { allowed: usage.count < limit, used: usage.count, limit };
}

/**
 * Track AI usage (tokens, model, purpose)
 */
export function trackUsage(userId: number, model: string, inputTokens: number, outputTokens: number, purpose: string): void {
  db.prepare('INSERT INTO ai_usage (user_id, model, input_tokens, output_tokens, purpose) VALUES (?, ?, ?, ?, ?)')
    .run(userId, model, inputTokens, outputTokens, purpose);
}

/**
 * Extract insights from a conversation and update AI profile
 */
export function extractAndStoreInsights(userId: number, userMessage: string, aiResponse: string): void {
  // Ensure profile exists
  db.prepare('INSERT OR IGNORE INTO ai_profiles (user_id) VALUES (?)').run(userId);

  const profile = db.prepare('SELECT * FROM ai_profiles WHERE user_id = ?').get(userId) as any;
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

  db.prepare(`
    UPDATE ai_profiles SET health_notes = ?, goals = ?, personal_context = ?, conversation_insights = ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).run(JSON.stringify(healthNotes), JSON.stringify(goals), JSON.stringify(personalCtx), JSON.stringify(insights), userId);
}

/**
 * Call Haiku for background training evaluation (lightweight, fast)
 */
export async function evaluateTrainingWithHaiku(userId: number): Promise<any> {
  if (!anthropic) return { error: 'AI not configured' };

  const context = buildUserContext(userId);
  if (!context) return { error: 'User not found' };

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: 'You are Sprint Society\'s training intelligence engine. Analyze the runner\'s data and output ONLY valid JSON. No markdown, no explanation.',
      messages: [{
        role: 'user',
        content: `${context}\n\nEvaluate this runner's recent performance. Output JSON:\n{\n  "plan_adjustments": ["adjustment1", "adjustment2"],\n  "insight_text": "1-2 sentence personalized insight for the runner",\n  "risk_flags": ["flag1 if any"],\n  "readiness_score": 0-100,\n  "weekly_summary": "brief summary if it's been 7+ days since last evaluation"\n}`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    trackUsage(userId, 'haiku', response.usage.input_tokens, response.usage.output_tokens, 'background_eval');

    try {
      return JSON.parse(text);
    } catch {
      return { insight_text: text, plan_adjustments: [], risk_flags: [] };
    }
  } catch (err: any) {
    console.error('[AI] Haiku evaluation failed:', err.message);
    return { error: getRandomErrorMessage() };
  }
}

/**
 * Call Sonnet for conversational AI coaching (richer, more nuanced)
 */
export async function chatWithSonnet(userId: number, userMessage: string, recentMessages: Array<{ role: string; content: string }>): Promise<{ response: string; error?: string }> {
  if (!anthropic) return { response: '', error: 'AI coach is not configured yet. Coming soon!' };

  const usageCheck = checkUsageLimit(userId, 'pro');
  if (!usageCheck.allowed) {
    return {
      response: `You've used ${usageCheck.used}/${usageCheck.limit} messages today. Coach is resting — come back tomorrow!`,
      error: 'limit_reached',
    };
  }

  const context = buildUserContext(userId);
  const conversationHistory = recentMessages.slice(-10).map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  conversationHistory.push({ role: 'user', content: userMessage });

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6-20250514',
      max_tokens: 600,
      system: `You are Sprint Society's AI running coach. You are warm, knowledgeable, and direct. You know this runner personally:\n\n${context}\n\nRules:\n- Always reference their specific data (pace, VO2max, recent runs) when relevant\n- Never give generic advice — personalize everything\n- Be concise (2-4 sentences unless they ask for detail)\n- If they mention injury/pain, always recommend caution and suggest seeing a professional\n- Use their name occasionally\n- If you notice something in their data (overtraining, improvement, consistency), proactively mention it\n- Keep a supportive but honest tone — celebrate progress, flag concerns`,
      messages: conversationHistory,
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    trackUsage(userId, 'sonnet', response.usage.input_tokens, response.usage.output_tokens, 'chat');
    extractAndStoreInsights(userId, userMessage, text);

    return { response: text };
  } catch (err: any) {
    console.error('[AI] Sonnet chat failed:', err.message);
    return { response: getRandomErrorMessage(), error: 'api_error' };
  }
}

/**
 * Get AI profile for display (My AI Profile page)
 */
export function getAIProfile(userId: number) {
  db.prepare('INSERT OR IGNORE INTO ai_profiles (user_id) VALUES (?)').run(userId);

  const profile = db.prepare('SELECT * FROM ai_profiles WHERE user_id = ?').get(userId) as any;
  const tier = db.prepare('SELECT tier, estimated_vo2max FROM tier_history WHERE user_id = ? ORDER BY calculated_at DESC LIMIT 1').get(userId) as any;
  const user = db.prepare('SELECT name, age, gender, fitness_level, running_experience FROM users WHERE id = ?').get(userId) as any;
  const usage = db.prepare(`
    SELECT COUNT(*) as total_messages, COALESCE(SUM(input_tokens + output_tokens), 0) as total_tokens
    FROM ai_usage WHERE user_id = ?
  `).get(userId) as any;

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
export function updateAIProfile(userId: number, field: string, value: any): boolean {
  const validFields = ['health_notes', 'goals', 'diet_preferences', 'personal_context'];
  if (!validFields.includes(field)) return false;

  db.prepare('INSERT OR IGNORE INTO ai_profiles (user_id) VALUES (?)').run(userId);
  db.prepare(`UPDATE ai_profiles SET ${field} = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`)
    .run(JSON.stringify(value), userId);
  return true;
}

/**
 * Get today's usage stats for a user
 */
export function getTodayUsage(userId: number) {
  const today = new Date().toISOString().split('T')[0];

  const chatUsage = db.prepare(`
    SELECT COUNT(*) as count FROM ai_usage
    WHERE user_id = ? AND purpose = 'chat' AND DATE(created_at) = ?
  `).get(userId, today) as any;

  const totalUsage = db.prepare(`
    SELECT COUNT(*) as total_calls, COALESCE(SUM(input_tokens), 0) as input_tokens, COALESCE(SUM(output_tokens), 0) as output_tokens
    FROM ai_usage WHERE user_id = ? AND DATE(created_at) = ?
  `).get(userId, today) as any;

  return {
    chat_messages_today: chatUsage.count,
    total_calls_today: totalUsage.total_calls,
    tokens_today: { input: totalUsage.input_tokens, output: totalUsage.output_tokens },
  };
}
