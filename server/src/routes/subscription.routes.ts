import { Router, Response } from 'express';
import crypto from 'crypto';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { config } from '../config';

const router = Router();

// GET /subscription/plans — list all plans (public)
router.get('/plans', (req, res: Response) => {
  const plans = db.prepare('SELECT * FROM subscription_plans WHERE active = 1 ORDER BY price_inr ASC').all() as any[];
  res.json(plans.map(p => ({ ...p, features: JSON.parse(p.features || '[]') })));
});

// GET /subscription/status — current user's subscription
router.get('/status', authenticate, (req: AuthRequest, res: Response) => {
  const sub = db.prepare(`
    SELECT us.*, sp.name as plan_name
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_key = sp.key
    WHERE us.user_id = ? AND us.status = 'active' AND us.expires_at > datetime('now')
    ORDER BY us.expires_at DESC
    LIMIT 1
  `).get(req.userId) as any;

  if (!sub) {
    return res.json({
      plan_key: 'free',
      plan_name: 'Free',
      status: 'active',
      started_at: null,
      expires_at: null,
      auto_renew: false,
      days_remaining: null,
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
  });
});

// POST /subscription/create-order — create Razorpay order
router.post('/create-order', authenticate, async (req: AuthRequest, res: Response) => {
  const { plan_key } = req.body;

  const plan = db.prepare('SELECT * FROM subscription_plans WHERE key = ? AND active = 1').get(plan_key) as any;
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
    db.prepare(`
      INSERT INTO payment_history (user_id, plan_key, amount_inr, status, razorpay_order_id)
      VALUES (?, ?, ?, 'pending', ?)
    `).run(req.userId, plan_key, plan.price_inr, order.id);

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
router.post('/verify', authenticate, (req: AuthRequest, res: Response) => {
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
  const payment = db.prepare(
    'SELECT * FROM payment_history WHERE razorpay_order_id = ? AND user_id = ? AND status = ?'
  ).get(razorpay_order_id, req.userId, 'pending') as any;

  if (!payment) return res.status(404).json({ error: 'Payment not found' });

  // Get plan duration
  const plan = db.prepare('SELECT * FROM subscription_plans WHERE key = ?').get(payment.plan_key) as any;
  const expiresAt = new Date(Date.now() + plan.duration_days * 86400000).toISOString();

  // Update payment record
  db.prepare(`
    UPDATE payment_history SET status = 'success', razorpay_payment_id = ?, razorpay_signature = ?
    WHERE id = ?
  `).run(razorpay_payment_id, razorpay_signature, payment.id);

  // Expire any existing active subscription
  db.prepare(`
    UPDATE user_subscriptions SET status = 'expired' WHERE user_id = ? AND status = 'active'
  `).run(req.userId);

  // Create new subscription
  db.prepare(`
    INSERT INTO user_subscriptions (user_id, plan_key, status, expires_at, razorpay_subscription_id, razorpay_payment_id)
    VALUES (?, ?, 'active', ?, ?, ?)
  `).run(req.userId, payment.plan_key, expiresAt, razorpay_order_id, razorpay_payment_id);

  res.json({
    success: true,
    plan_key: payment.plan_key,
    plan_name: plan.name,
    expires_at: expiresAt,
  });
});

// POST /subscription/cancel — cancel auto-renewal
router.post('/cancel', authenticate, (req: AuthRequest, res: Response) => {
  const sub = db.prepare(
    "SELECT * FROM user_subscriptions WHERE user_id = ? AND status = 'active' ORDER BY expires_at DESC LIMIT 1"
  ).get(req.userId) as any;

  if (!sub) return res.status(404).json({ error: 'No active subscription' });

  db.prepare('UPDATE user_subscriptions SET auto_renew = 0 WHERE id = ?').run(sub.id);
  res.json({ success: true, message: 'Auto-renewal cancelled. Your plan remains active until expiry.' });
});

// POST /subscription/upgrade — upgrade Base → Pro (new billing period)
router.post('/upgrade', authenticate, async (req: AuthRequest, res: Response) => {
  const currentSub = db.prepare(
    "SELECT * FROM user_subscriptions WHERE user_id = ? AND status = 'active' AND expires_at > datetime('now') LIMIT 1"
  ).get(req.userId) as any;

  if (!currentSub) return res.status(400).json({ error: 'No active subscription to upgrade' });
  if (currentSub.plan_key === 'pro') return res.status(400).json({ error: 'Already on Pro plan' });

  const proPlan = db.prepare("SELECT * FROM subscription_plans WHERE key = 'pro' AND active = 1").get() as any;
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

    db.prepare('INSERT INTO payment_history (user_id, plan_key, amount_inr, status, razorpay_order_id) VALUES (?, ?, ?, ?, ?)')
      .run(req.userId, 'pro', proPlan.price_inr, 'pending', order.id);

    res.json({ order_id: order.id, amount: order.amount, currency: order.currency, key_id: config.razorpayKeyId, plan_name: proPlan.name });
  } catch {
    res.status(500).json({ error: 'Payment service unavailable' });
  }
});

// GET /subscription/history — payment history
router.get('/history', authenticate, (req: AuthRequest, res: Response) => {
  const payments = db.prepare(`
    SELECT ph.*, sp.name as plan_name
    FROM payment_history ph
    JOIN subscription_plans sp ON ph.plan_key = sp.key
    WHERE ph.user_id = ?
    ORDER BY ph.created_at DESC
    LIMIT 50
  `).all(req.userId) as any[];

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
router.post('/webhook', (req, res: Response) => {
  const webhookSecret = config.razorpayKeySecret;
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
      const record = db.prepare('SELECT * FROM payment_history WHERE razorpay_order_id = ? AND status = ?').get(payment.order_id, 'pending') as any;
      if (record) {
        db.prepare("UPDATE payment_history SET status = 'success', razorpay_payment_id = ? WHERE id = ?").run(payment.id, record.id);
      }
    }
  }

  if (event === 'payment.failed') {
    const payment = payload.payment?.entity;
    if (payment?.order_id) {
      db.prepare("UPDATE payment_history SET status = 'failed' WHERE razorpay_order_id = ? AND status = 'pending'").run(payment.order_id);
    }
  }

  res.json({ status: 'ok' });
});

export default router;
