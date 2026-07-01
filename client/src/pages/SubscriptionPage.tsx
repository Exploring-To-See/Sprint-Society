import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { AppShell } from '../components/layout/AppShell';
import { SSSkeleton, SSEmpty, SSError } from '../components/ss/SSStates';
import { Clock, Bolt } from '../components/ss/icons';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PLAN_STYLES: Record<string, { gradient: string; badge: string; icon: string }> = {
  free: { gradient: 'from-zinc-800 to-zinc-900', badge: 'bg-zinc-700 text-zinc-300', icon: '🏃' },
  base: { gradient: 'from-accent/20 to-accent/5', badge: 'bg-accent/20 text-accent', icon: '⚡' },
  pro: { gradient: 'from-accent-gold/20 to-accent-gold/5', badge: 'bg-accent-gold/20 text-accent-gold', icon: '👑' },
};

// Shape returned by POST /subscription/create-order and POST /subscription/upgrade.
// upgrade omits plan_key (only plan_name); create-order includes both — plan_key is optional here.
interface RazorpayOrder {
  order_id: string;
  amount: number; // paise
  currency: string;
  key_id: string;
  plan_name: string;
  plan_key?: string;
}

// Row shape from GET /subscription/history (bare array). amount_inr is in RUPEES (stored
// directly as price_inr in payment_history), unlike the Razorpay order.amount which is paise.
interface PaymentRecord {
  id: number;
  plan_key: string;
  plan_name: string;
  amount_inr: number;
  status: string;
  razorpay_order_id: string | null;
  created_at: string;
}

// GET /subscription/status — current user's plan (free fallback when no active sub).
interface CurrentSub {
  plan_key: string;
  plan_name: string;
  status: string;
  expires_at: string | null;
  auto_renew: boolean;
  days_remaining: number | null;
}

const STATUS_CHIP: Record<string, 'good' | 'warn' | 'neutral'> = {
  success: 'good',
  pending: 'warn',
  failed: 'neutral',
};

function fmtHistoryDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function SubscriptionPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState('');

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => api.get('/subscription/plans').then(r => r.data),
  });

  const { data: currentSub } = useQuery<CurrentSub>({
    queryKey: ['subscription-status'],
    queryFn: () => api.get('/subscription/status').then(r => r.data),
  });

  const {
    data: history,
    isLoading: historyLoading,
    isError: historyError,
    refetch: refetchHistory,
  } = useQuery<PaymentRecord[]>({
    queryKey: ['subscription-history'],
    queryFn: () => api.get('/subscription/history').then(r => r.data),
  });

  // Shared Razorpay checkout — the single source of truth for the order → verify flow,
  // used by both new-plan purchases (create-order) and Base → Pro upgrades (upgrade).
  const openRazorpay = (order: RazorpayOrder) => {
    const options = {
      key: order.key_id,
      amount: order.amount,
      currency: order.currency,
      name: 'Sprint Society',
      description: `${order.plan_name} Plan - Monthly`,
      order_id: order.order_id,
      handler: async (response: any) => {
        try {
          await api.post('/subscription/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
          queryClient.invalidateQueries({ queryKey: ['subscription-history'] });
          navigate('/dashboard');
        } catch {
          setError('Payment verification failed. Contact support.');
        }
      },
      prefill: {},
      theme: { color: '#f97316' },
    };

    if (typeof window.Razorpay === 'undefined') {
      setError('Payment gateway loading... Please try again.');
      setProcessing(null);
      return;
    }

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', () => {
      setError('Payment failed. Please try again.');
      setProcessing(null);
    });
    rzp.open();
  };

  const handleSubscribe = async (planKey: string) => {
    setProcessing(planKey);
    setError('');

    try {
      const { data: order } = await api.post<RazorpayOrder>('/subscription/create-order', { plan_key: planKey });
      openRazorpay(order);
    } catch (err: any) {
      setError(err.response?.data?.error || err?.message || 'Something went wrong');
    } finally {
      setProcessing(null);
    }
  };

  const handleUpgrade = async () => {
    setProcessing('upgrade');
    setError('');

    try {
      const { data: order } = await api.post<RazorpayOrder>('/subscription/upgrade');
      openRazorpay(order);
    } catch (err: any) {
      setError(err.response?.data?.error || err?.message || 'Something went wrong');
    } finally {
      setProcessing(null);
    }
  };

  const cancelMutation = useMutation({
    mutationFn: () => api.post('/subscription/cancel'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscription-status'] }),
  });

  // Only Base subscribers can upgrade to Pro (not free, not already-Pro).
  const canUpgrade = currentSub?.plan_key === 'base';

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pb-6">
        {/* Header */}
        <div className="text-center pt-2">
          <h1 className="font-heading text-[24px] font-bold">Upgrade Your Run</h1>
          <p className="text-[12px] text-zinc-500 mt-1">Unlock the full Sprint Society experience</p>
        </div>

        {/* Current plan indicator */}
        {currentSub && currentSub.plan_key !== 'free' && (
          <div className="card p-3 flex items-center gap-3">
            <span className="text-lg">{PLAN_STYLES[currentSub.plan_key]?.icon || '⚡'}</span>
            <div className="flex-1">
              <p className="text-[12px] font-semibold text-white">Current: {currentSub.plan_name}</p>
              <p className="text-[10px] text-zinc-600">
                {currentSub.days_remaining} days remaining
                {currentSub.auto_renew ? ' · Auto-renews' : ' · Cancels at end'}
              </p>
            </div>
            {currentSub.auto_renew && (
              <button
                onClick={() => cancelMutation.mutate()}
                className="text-[10px] text-zinc-600 hover:text-zinc-400"
              >
                Cancel
              </button>
            )}
          </div>
        )}

        {/* Upgrade to Pro — only for active Base subscribers */}
        {canUpgrade && (
          <button
            type="button"
            data-testid="sub-upgrade"
            onClick={handleUpgrade}
            disabled={processing === 'upgrade'}
            className="ss-surface ss-rise"
            style={{
              width: '100%',
              textAlign: 'left',
              cursor: processing === 'upgrade' ? 'not-allowed' : 'pointer',
              opacity: processing === 'upgrade' ? 0.6 : 1,
              borderRadius: 18,
              padding: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              fontFamily: 'inherit',
              color: 'inherit',
            }}
          >
            <span
              className="ticon"
              style={{
                width: 42,
                height: 42,
                borderRadius: 13,
                flex: 'none',
                background: 'rgba(251,191,36,.14)',
                borderColor: 'rgba(251,191,36,.28)',
                color: 'var(--amber)',
              }}
            >
              <Bolt width={20} height={20} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ font: '600 14px var(--head)', color: 'var(--fg)', letterSpacing: '-.01em' }}>
                  Upgrade to Pro
                </span>
                <span className="ss-tag maybe">Best value</span>
              </span>
              <span style={{ display: 'block', font: '400 11.5px/1.45 var(--body)', color: 'var(--muted)', marginTop: 3 }}>
                Unlock every Pro feature for the rest of this billing period.
              </span>
            </span>
            <span style={{ font: '600 12px var(--head)', color: 'var(--accent-2)', flex: 'none', whiteSpace: 'nowrap' }}>
              {processing === 'upgrade' ? 'Processing…' : 'Upgrade'}
            </span>
          </button>
        )}

        {/* Plans */}
        {plansLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-48 rounded-2xl bg-bg-tertiary animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-4">
            {plans?.map((plan: any) => {
              const style = PLAN_STYLES[plan.key] || PLAN_STYLES.free;
              const isCurrent = currentSub?.plan_key === plan.key;
              const isUpgrade = !isCurrent && plan.price_inr > 0;

              return (
                <motion.div
                  key={plan.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`relative rounded-2xl border overflow-hidden ${
                    plan.key === 'pro'
                      ? 'border-accent-gold/30'
                      : plan.key === 'pro'
                      ? 'border-accent/30'
                      : 'border-bg-tertiary'
                  }`}
                >
                  {plan.key === 'pro' && (
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent-gold/50 via-accent-gold to-accent-gold/50" />
                  )}

                  <div className={`p-5 bg-gradient-to-b ${style.gradient}`}>
                    {/* Plan header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{style.icon}</span>
                        <h3 className="font-heading font-bold text-[18px] text-white">{plan.name}</h3>
                      </div>
                      <div className="text-right">
                        {plan.price_inr === 0 ? (
                          <p className="text-[14px] font-bold text-zinc-400">Free</p>
                        ) : (
                          <>
                            <p className="text-[20px] font-bold text-white font-mono">
                              ₹{plan.price_inr}<span className="text-[11px] text-zinc-500 font-normal">/mo</span>
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-1.5 mb-4">
                      {plan.features.map((f: string, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <svg width="12" height="12" viewBox="0 0 16 16" className={plan.key === 'free' ? 'text-zinc-600' : 'text-accent'}>
                            <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span className="text-[11px] text-zinc-400">{f}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action button */}
                    {isCurrent ? (
                      <div className="w-full py-2.5 rounded-xl bg-bg-secondary/50 border border-bg-tertiary text-center">
                        <span className="text-[12px] font-semibold text-zinc-500">Current Plan</span>
                      </div>
                    ) : isUpgrade ? (
                      <button
                        onClick={() => handleSubscribe(plan.key)}
                        disabled={processing === plan.key}
                        className={`w-full py-3 rounded-xl font-semibold text-[14px] active:scale-[0.98] transition-all ${
                          plan.key === 'pro'
                            ? 'bg-gradient-to-r from-accent-gold to-amber-500 text-black'
                            : 'bg-accent text-white'
                        } disabled:opacity-50`}
                      >
                        {processing === plan.key ? 'Processing...' : `Get ${plan.name}`}
                      </button>
                    ) : null}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-[12px] text-red-400 text-center">{error}</p>
        )}

        {/* Payment history */}
        <section data-testid="sub-history" style={{ marginTop: 4 }}>
          <p className="tlbl" style={{ marginBottom: 9, paddingLeft: 2 }}>Payment history</p>

          {historyLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[0, 1, 2].map(i => <SSSkeleton key={i} height={58} style={{ borderRadius: 16 }} />)}
            </div>
          ) : historyError ? (
            <SSError onRetry={() => refetchHistory()} testid="sub-history-error" />
          ) : !history || history.length === 0 ? (
            <SSEmpty
              icon={<Clock width={22} height={22} />}
              title="No payments yet"
              body="Once you subscribe or upgrade, every payment will be listed here for your records."
              testid="sub-history-empty"
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.map((p, i) => {
                const tone = STATUS_CHIP[p.status] || 'neutral';
                return (
                  <motion.div
                    key={p.id}
                    data-testid="sub-history-row"
                    className="ss-surface ss-recess"
                    style={{ borderRadius: 16, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 + i * 0.04, type: 'spring', stiffness: 240, damping: 26 }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: '600 13px var(--body)', color: 'var(--fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.plan_name}
                      </div>
                      <div style={{ font: '500 10.5px var(--mono)', color: 'var(--muted-2)', marginTop: 2 }}>
                        {fmtHistoryDate(p.created_at)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flex: 'none' }}>
                      <div style={{ font: '700 14px var(--mono)', color: 'var(--fg)', fontVariantNumeric: 'tabular-nums' }}>
                        ₹{p.amount_inr}
                      </div>
                      <span className={`ss-dchip ${tone}`} style={{ textTransform: 'capitalize' }}>
                        {p.status}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Info */}
        <div className="text-center space-y-1 pt-2">
          <p className="text-[10px] text-zinc-700">Secure payments via Razorpay</p>
          <p className="text-[10px] text-zinc-700">Cancel anytime · No hidden fees</p>
        </div>
      </motion.div>
    </AppShell>
  );
}
