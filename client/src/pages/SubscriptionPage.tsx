import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { AppShell } from '../components/layout/AppShell';

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

export function SubscriptionPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState('');

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => api.get('/subscription/plans').then(r => r.data),
  });

  const { data: currentSub } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: () => api.get('/subscription/status').then(r => r.data),
  });

  const handleSubscribe = async (planKey: string) => {
    setProcessing(planKey);
    setError('');

    try {
      const { data: order } = await api.post('/subscription/create-order', { plan_key: planKey });

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
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setProcessing(null);
    }
  };

  const cancelMutation = useMutation({
    mutationFn: () => api.post('/subscription/cancel'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscription-status'] }),
  });

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

        {/* Info */}
        <div className="text-center space-y-1 pt-2">
          <p className="text-[10px] text-zinc-700">Secure payments via Razorpay</p>
          <p className="text-[10px] text-zinc-700">Cancel anytime · No hidden fees</p>
        </div>
      </motion.div>
    </AppShell>
  );
}
