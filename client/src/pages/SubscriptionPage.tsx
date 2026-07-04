import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { SSScreen } from '../components/ss/SSScreen';
import { SSSkeleton, SSEmpty, SSError } from '../components/ss/SSStates';
import { Clock, Bolt, Check, RunGlyph, Crown } from '../components/ss/icons';

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Per-plan look: crafted icon + the semantic tint that leads each card.
const PLAN_STYLES: Record<string, { Icon: (p: React.SVGProps<SVGSVGElement>) => JSX.Element; tint: string; border: string; text: string }> = {
  free: { Icon: RunGlyph, tint: 'rgba(255,255,255,.04)', border: 'var(--hair)', text: 'var(--muted)' },
  base: { Icon: Bolt, tint: 'rgba(249,115,22,.14)', border: 'rgba(249,115,22,.3)', text: 'var(--accent-2)' },
  pro: { Icon: Crown, tint: 'rgba(251,191,36,.14)', border: 'rgba(251,191,36,.3)', text: 'var(--amber)' },
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
    <SSScreen active="home" bodyLabel="Subscription">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ss-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 24 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', paddingTop: 6 }}>
          <h1 style={{ font: '600 var(--m-hero) var(--head)', letterSpacing: '-.02em' }}>Upgrade your run</h1>
          <p style={{ font: '500 12px var(--body)', color: 'var(--muted)', marginTop: 4 }}>Unlock the full Sprint Society experience</p>
        </div>

        {/* Current plan indicator */}
        {currentSub && currentSub.plan_key !== 'free' && (
          <div className="tile recess" style={{ borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 }}>
            {(() => {
              const cur = PLAN_STYLES[currentSub.plan_key] || PLAN_STYLES.base;
              return (
                <span className="ticon" style={{ background: cur.tint, borderColor: cur.border }}>
                  <cur.Icon width={14} height={14} style={{ color: cur.text }} />
                </span>
              );
            })()}
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', font: '600 12.5px var(--body)', color: 'var(--fg)' }}>Current: {currentSub.plan_name}</span>
              <span className="num" style={{ display: 'block', font: '500 10px var(--mono)', color: 'var(--muted-2)', marginTop: 2 }}>
                {currentSub.days_remaining} days remaining
                {currentSub.auto_renew ? ' · Auto-renews' : ' · Cancels at end'}
              </span>
            </span>
            {currentSub.auto_renew && (
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                style={{ background: 'none', border: 'none', cursor: 'pointer', font: '500 10.5px var(--body)', color: 'var(--muted-2)', minHeight: 34, padding: '0 6px' }}
              >
                {cancelMutation.isPending ? 'Cancelling…' : 'Cancel'}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[0, 1, 2].map(i => <SSSkeleton key={i} height={192} style={{ borderRadius: 22 }} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {plans?.map((plan: any) => {
              const style = PLAN_STYLES[plan.key] || PLAN_STYLES.free;
              const isCurrent = currentSub?.plan_key === plan.key;
              const isUpgrade = !isCurrent && plan.price_inr > 0;
              const isPro = plan.key === 'pro';

              return (
                <motion.section
                  key={plan.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`ss-surface${isPro ? ' ss-hero' : plan.key === 'free' ? ' ss-recess' : ''}`}
                  style={{ borderRadius: 22, padding: 16, ...(isPro ? {} : plan.key === 'base' ? { borderColor: 'rgba(249,115,22,.2)' } : {}) }}
                  aria-label={`${plan.name} plan`}
                >
                  {/* Plan header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span className="ticon" style={{ background: style.tint, borderColor: style.border }}>
                        <style.Icon width={14} height={14} style={{ color: style.text }} />
                      </span>
                      <h3 style={{ font: '600 17px var(--head)', letterSpacing: '-.01em', color: 'var(--fg)' }}>{plan.name}</h3>
                    </div>
                    {plan.price_inr === 0 ? (
                      <p style={{ font: '600 14px var(--head)', color: 'var(--muted)' }}>Free</p>
                    ) : (
                      <p className="num" style={{ font: '700 20px var(--mono)', color: 'var(--fg)' }}>
                        ₹{plan.price_inr}<small style={{ font: '500 11px var(--mono)', color: 'var(--muted)' }}>/mo</small>
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
                    {plan.features.map((f: string, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Check width={11} height={11} style={{ color: plan.key === 'free' ? 'var(--muted-2)' : 'var(--accent-2)', flex: 'none' }} />
                        <span style={{ font: '400 11.5px var(--body)', color: 'var(--muted)' }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action button */}
                  {isCurrent ? (
                    <div className="ss-btn ss-btn-soft" style={{ height: 44, cursor: 'default', color: 'var(--muted)' }}>
                      Current plan
                    </div>
                  ) : isUpgrade ? (
                    <button
                      onClick={() => handleSubscribe(plan.key)}
                      disabled={processing === plan.key}
                      className="ss-btn ss-btn-primary"
                      style={{ width: '100%', ...(isPro ? { background: 'linear-gradient(135deg,var(--amber),var(--accent-2))', boxShadow: '0 10px 26px -10px rgba(251,191,36,.55)' } : {}) }}
                      data-testid={`sub-get-${plan.key}`}
                    >
                      {processing === plan.key ? 'Processing…' : `Get ${plan.name}`}
                    </button>
                  ) : null}
                </motion.section>
              );
            })}
          </div>
        )}

        {/* Error */}
        {error && (
          <p style={{ font: '500 12px var(--body)', color: 'var(--amber)', textAlign: 'center' }} role="alert">{error}</p>
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
        <div style={{ textAlign: 'center', paddingTop: 6 }}>
          <p style={{ font: '500 10px var(--body)', color: 'var(--muted-2)' }}>Secure payments via Razorpay</p>
          <p style={{ font: '500 10px var(--body)', color: 'var(--muted-2)', marginTop: 3 }}>Cancel anytime · No hidden fees</p>
        </div>
      </motion.div>
    </SSScreen>
  );
}
