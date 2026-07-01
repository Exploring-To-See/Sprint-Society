import { Router, Response } from 'express';
import crypto from 'crypto';
import db from '../database/pg';
import { authenticate, AuthRequest } from '../middleware/auth';
import { config } from '../config';

const router = Router();

// GET /subscription/plans — list all plans (public)
router.get('/plans', async (req, res: Response) => {
  const plans = await db.query('SELECT * FROM subscription_plans WHERE active = 1 ORDER BY price_inr ASC') as any[];
  res.json(plans.map(p => ({ ...p, features: JSON.parse(p.features || '[]') })));
});

// GET /subscription/status — current user's subscription
router.get('/status', authenticate, async (req: AuthRequest, res: Response) => {
  const sub = await db.queryOne(`
    SELECT us.*, sp.name as plan_name
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_key = sp.key
    WHERE us.user_id = $1 AND us.status = 'active' AND us.expires_at > NOW()
    ORDER BY us.expires_at DESC
    LIMIT 1
  `, [req.userId]) as any;

  if (!sub) {
    return res.json({
      plan_key: 'free',
      plan_name: 'Free',
      status: 'active',
      started_at: null,
      expires_at: null,
      auto_renew: false,
      days_remaining: null,
      scheduled_plan_key: null,
    });
  }

  const daysRemaining = Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / 86400000);

  res.json({
    plan_key: sub.plan_key,
    plan_name: sub.plan_name,
    status: sub.status,
    started_at: sub.started_at,
    expires_at: sub.expires_at,
    auto_renew: !!sub.auto_renew,
    days_remaining: Math.max(0, daysRemaining),
    scheduled_plan_key: sub.scheduled_plan_key || null,
  });
});

// POST /subscription/create-order — create Razorpay order
router.post('/create-order', authenticate, async (req: AuthRequest, res: Response) => {
  const { plan_key } = req.body;

  const plan = await db.queryOne('SELECT * FROM subscription_plans WHERE key = $1 AND active = 1', [plan_key]) as any;
  if (!plan) return res.status(400).json({ error: 'Invalid plan' });
  if (plan.price_inr === 0) return res.status(400).json({ error: 'Cannot purchase free plan' });

  const razorpayKeyId = config.razorpayKeyId;
  const razorpayKeySecret = config.razorpayKeySecret;

  if (!razorpayKeyId || !razorpayKeySecret) {
    return res.status(503).json({ error: 'Payment system not configured' });
  }

  try {
    const orderData = {
      amount: plan.price_inr * 100, // Razorpay uses paise
      currency: 'INR',
      receipt: `sub_${req.userId}_${Date.now()}`,
      notes: {
        user_id: req.userId?.toString(),
        plan_key: plan.key,
      },
    };

    const auth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify(orderData),
    });

    const order = await response.json() as any;

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to create order', details: order.error });
    }

    // Store pending payment
    await db.execute(`
      INSERT INTO payment_history (user_id, plan_key, amount_inr, status, razorpay_order_id)
      VALUES ($1, $2, $3, 'pending', $4)
    `, [req.userId, plan_key, plan.price_inr, order.id]);

    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: razorpayKeyId,
      plan_name: plan.name,
      plan_key: plan.key,
    });
  } catch (err) {
    res.status(500).json({ error: 'Payment service unavailable' });
  }
});

// POST /subscription/verify — verify Razorpay payment and activate subscription
router.post('/verify', authenticate, async (req: AuthRequest, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment details' });
  }

  const razorpayKeySecret = config.razorpayKeySecret;
  if (!razorpayKeySecret) {
    return res.status(503).json({ error: 'Payment system not configured' });
  }

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', razorpayKeySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: 'Invalid payment signature' });
  }

  // Find the pending payment
  const payment = await db.queryOne(
    'SELECT * FROM payment_history WHERE razorpay_order_id = $1 AND user_id = $2 AND status = $3',
    [razorpay_order_id, req.userId, 'pending']
  ) as any;

  if (!payment) return res.status(404).json({ error: 'Payment not found' });

  // Get plan duration
  const plan = await db.queryOne('SELECT * FROM subscription_plans WHERE key = $1', [payment.plan_key]) as any;
  const expiresAt = new Date(Date.now() + plan.duration_days * 86400000).toISOString();

  // Update payment record
  await db.execute(`
    UPDATE payment_history SET status = 'success', razorpay_payment_id = $1, razorpay_signature = $2
    WHERE id = $3
  `, [razorpay_payment_id, razorpay_signature, payment.id]);

  // Expire any existing active subscription
  await db.execute(`
    UPDATE user_subscriptions SET status = 'expired' WHERE user_id = $1 AND status = 'active'
  `, [req.userId]);

  // Create new subscription
  await db.execute(`
    INSERT INTO user_subscriptions (user_id, plan_key, status, expires_at, razorpay_subscription_id, razorpay_payment_id)
    VALUES ($1, $2, 'active', $3, $4, $5)
  `, [req.userId, payment.plan_key, expiresAt, razorpay_order_id, razorpay_payment_id]);

  res.json({
    success: true,
    plan_key: payment.plan_key,
    plan_name: plan.name,
    expires_at: expiresAt,
  });
});

// POST /subscription/cancel — cancel auto-renewal
router.post('/cancel', authenticate, async (req: AuthRequest, res: Response) => {
  const sub = await db.queryOne(
    "SELECT * FROM user_subscriptions WHERE user_id = $1 AND status = 'active' ORDER BY expires_at DESC LIMIT 1",
    [req.userId]
  ) as any;

  if (!sub) return res.status(404).json({ error: 'No active subscription' });

  await db.execute('UPDATE user_subscriptions SET auto_renew = 0 WHERE id = $1', [sub.id]);
  res.json({ success: true, message: 'Auto-renewal cancelled. Your plan remains active until expiry.' });
});

// POST /subscription/upgrade — upgrade Base → Pro (new billing period)
router.post('/upgrade', authenticate, async (req: AuthRequest, res: Response) => {
  const currentSub = await db.queryOne(
    "SELECT * FROM user_subscriptions WHERE user_id = $1 AND status = 'active' AND expires_at > NOW() LIMIT 1",
    [req.userId]
  ) as any;

  if (!currentSub) return res.status(400).json({ error: 'No active subscription to upgrade' });
  if (currentSub.plan_key === 'pro') return res.status(400).json({ error: 'Already on Pro plan' });

  const proPlan = await db.queryOne("SELECT * FROM subscription_plans WHERE key = 'pro' AND active = 1") as any;
  if (!proPlan) return res.status(500).json({ error: 'Pro plan not found' });

  if (!config.razorpayKeyId || !config.razorpayKeySecret) {
    return res.status(503).json({ error: 'Payment system not configured' });
  }

  try {
    const auth = Buffer.from(`${config.razorpayKeyId}:${config.razorpayKeySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${auth}` },
      body: JSON.stringify({
        amount: proPlan.price_inr * 100,
        currency: 'INR',
        receipt: `upgrade_${req.userId}_${Date.now()}`,
        notes: { user_id: req.userId?.toString(), plan_key: 'pro', upgrade_from: currentSub.plan_key },
      }),
    });

    const order = await response.json() as any;
    if (!response.ok) return res.status(500).json({ error: 'Failed to create upgrade order' });

    await db.execute('INSERT INTO payment_history (user_id, plan_key, amount_inr, status, razorpay_order_id) VALUES ($1, $2, $3, $4, $5)',
      [req.userId, 'pro', proPlan.price_inr, 'pending', order.id]);

    res.json({ order_id: order.id, amount: order.amount, currency: order.currency, key_id: config.razorpayKeyId, plan_name: proPlan.name });
  } catch {
    res.status(500).json({ error: 'Payment service unavailable' });
  }
});

// POST /subscription/downgrade — schedule a move to a lower-priced plan at period
// end. The paid plan stays active until expires_at; scheduled_plan_key records the
// intent (surfaced in /status and applied by the renewal flow). Reversible.
router.post('/downgrade', authenticate, async (req: AuthRequest, res: Response) => {
  const target = (typeof req.body?.plan_key === 'string' && req.body.plan_key) || 'base';

  const sub = await db.queryOne(
    "SELECT * FROM user_subscriptions WHERE user_id = $1 AND status = 'active' AND expires_at > NOW() ORDER BY expires_at DESC LIMIT 1",
    [req.userId]
  ) as any;
  if (!sub) return res.status(400).json({ error: 'No active subscription to downgrade' });
  if (target === sub.plan_key) return res.status(400).json({ error: 'Already on that plan' });

  const current = await db.queryOne('SELECT * FROM subscription_plans WHERE key = $1', [sub.plan_key]) as any;
  const targetPlan = await db.queryOne('SELECT * FROM subscription_plans WHERE key = $1 AND active = 1', [target]) as any;
  if (!targetPlan) return res.status(400).json({ error: 'Invalid target plan' });
  if (!current || targetPlan.price_inr >= current.price_inr) {
    return res.status(400).json({ error: 'Downgrade must target a lower-priced plan. Use upgrade instead.' });
  }

  await db.execute('UPDATE user_subscriptions SET scheduled_plan_key = $1 WHERE id = $2', [target, sub.id]);
  res.json({
    message: `You'll move to ${targetPlan.name} when your ${current.name} plan ends. You keep ${current.name} until then.`,
    scheduled_plan_key: target,
    effective_at: sub.expires_at,
  });
});

// POST /subscription/downgrade/cancel — undo a scheduled downgrade.
router.post('/downgrade/cancel', authenticate, async (req: AuthRequest, res: Response) => {
  const sub = await db.queryOne(
    "SELECT * FROM user_subscriptions WHERE user_id = $1 AND status = 'active' AND expires_at > NOW() ORDER BY expires_at DESC LIMIT 1",
    [req.userId]
  ) as any;
  if (!sub) return res.status(404).json({ error: 'No active subscription' });
  await db.execute('UPDATE user_subscriptions SET scheduled_plan_key = NULL WHERE id = $1', [sub.id]);
  res.json({ message: 'Downgrade cancelled — your plan stays as it is.' });
});

// GET /subscription/history — payment history
router.get('/history', authenticate, async (req: AuthRequest, res: Response) => {
  const payments = await db.query(`
    SELECT ph.*, sp.name as plan_name
    FROM payment_history ph
    JOIN subscription_plans sp ON ph.plan_key = sp.key
    WHERE ph.user_id = $1
    ORDER BY ph.created_at DESC
    LIMIT 50
  `, [req.userId]) as any[];

  res.json(payments.map(p => ({
    id: p.id,
    plan_key: p.plan_key,
    plan_name: p.plan_name,
    amount_inr: p.amount_inr,
    status: p.status,
    razorpay_order_id: p.razorpay_order_id,
    created_at: p.created_at,
  })));
});

// POST /subscription/webhook — Razorpay webhook (no auth, verifies signature)
router.post('/webhook', async (req, res: Response) => {
  const webhookSecret = config.razorpayWebhookSecret;
  if (!webhookSecret) return res.status(503).json({ error: 'Not configured' });

  const signature = req.headers['x-razorpay-signature'] as string;
  if (!signature) return res.status(400).json({ error: 'Missing signature' });

  const body = JSON.stringify(req.body);
  const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');

  if (expectedSignature !== signature) {
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  const event = req.body.event;
  const payload = req.body.payload;

  if (event === 'payment.captured') {
    const payment = payload.payment?.entity;
    if (payment?.order_id) {
      const record = await db.queryOne('SELECT * FROM payment_history WHERE razorpay_order_id = $1 AND status = $2', [payment.order_id, 'pending']) as any;
      if (record) {
        await db.execute("UPDATE payment_history SET status = 'success', razorpay_payment_id = $1 WHERE id = $2", [payment.id, record.id]);
      }
    }
  }

  if (event === 'payment.failed') {
    const payment = payload.payment?.entity;
    if (payment?.order_id) {
      await db.execute("UPDATE payment_history SET status = 'failed' WHERE razorpay_order_id = $1 AND status = 'pending'", [payment.order_id]);
    }
  }

  res.json({ status: 'ok' });
});

export default router;
