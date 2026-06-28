import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { OfferCard } from '../components/kendu/OfferCard';
import { RedeemModal } from '../components/kendu/RedeemModal';
import { KenduHistory } from '../components/kendu/KenduHistory';
import { AppShell } from '../components/layout/AppShell';

type Tab = 'marketplace' | 'actions' | 'history';

// Social-feature spend actions (Create Community, Host Event, Priority RSVP) are
// omitted while the social feature is hidden from the live app. Re-add when it ships.
const SPEND_ACTIONS = [
  { key: 'challenge', icon: '⚔️', label: '1v1 Challenge', cost: '5-50', description: 'Stake Kendu, compete head-to-head', route: '/challenges' },
  { key: 'card-skin', icon: '🎨', label: 'Premium Card Skin', cost: 40, description: 'Unlock exclusive share templates', route: null },
  { key: 'ai-dive', icon: '🧠', label: 'AI Deep Dive', cost: 30, description: 'Extended AI coach session', route: null },
  { key: 'group-challenge', icon: '👥', label: 'Group Challenge', cost: 50, description: 'Challenge multiple runners at once', route: null },
] as const;

export function RewardsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('marketplace');
  const [eventFilter, setEventFilter] = useState<string>('');

  const { data: balance } = useQuery({
    queryKey: ['kendu-balance'],
    queryFn: () => api.get('/kendu/balance').then(r => r.data),
  });

  const { data: offers, isLoading } = useQuery({
    queryKey: ['kendu-offers', eventFilter],
    queryFn: () => api.get(`/kendu/offers${eventFilter ? `?eventId=${eventFilter}` : ''}`).then(r => r.data),
    enabled: activeTab === 'marketplace',
  });

  const handleRedeem = async (offerId: number) => {
    try {
      const res = await api.post('/kendu/redeem', { offerId });
      queryClient.invalidateQueries({ queryKey: ['kendu-balance'] });
      queryClient.invalidateQueries({ queryKey: ['kendu-offers'] });
      return res.data;
    } catch (e: any) {
      return null;
    }
  };

  return (
    <AppShell>
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate(-1)} className="text-zinc-400 text-lg">&larr;</button>
        <h1 className="text-[16px] font-bold text-zinc-100">Kendu Store</h1>
      </div>

      {/* Balance Banner */}
      {balance && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-4 p-4 rounded-xl bg-gradient-to-r from-orange-500/15 to-amber-500/5 border border-orange-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Spendable Balance</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-bold text-orange-400">{balance.spendable_balance.toLocaleString()}</span>
                <span className="text-[11px] text-zinc-500">Kendu</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[12px] text-zinc-300 font-semibold">Level {balance.current_level}</p>
              <p className="text-[10px] text-zinc-500">🔥 {balance.current_streak_days}d streak</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mx-4 mt-4 p-1 rounded-xl bg-bg-secondary border border-bg-tertiary">
        {([['marketplace', 'Rewards'], ['actions', 'Spend'], ['history', 'History']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all ${
              activeTab === key
                ? 'bg-orange-500/20 text-orange-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 mt-4">
        {activeTab === 'history' && <KenduHistory />}

        {activeTab === 'marketplace' && (
          <>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-[140px] rounded-xl bg-bg-tertiary/50 animate-pulse" />
                ))}
              </div>
            ) : offers && offers.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {offers.map((offer: any) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    userBalance={balance?.spendable_balance || 0}
                    onRedeem={() => setSelectedOffer(offer)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-3xl mb-2">🏪</p>
                <p className="text-[13px] text-zinc-400 font-medium">No brand offers yet</p>
                <p className="text-[11px] text-zinc-500 mt-1">Rewards from Decathlon, Red Bull & more coming soon</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'actions' && (
          <div className="space-y-2">
            <p className="text-[11px] text-zinc-500 mb-3">Spend your Kendu on in-app features</p>
            {SPEND_ACTIONS.map(action => {
              const cost = typeof action.cost === 'number' ? action.cost : 0;
              const canAfford = typeof action.cost === 'number' ? (balance?.spendable_balance ?? 0) >= cost : true;

              return (
                <motion.button
                  key={action.key}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => action.route && navigate(action.route)}
                  disabled={!action.route}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-bg-secondary border border-bg-tertiary hover:border-zinc-600 transition-all text-left disabled:opacity-60"
                >
                  <span className="text-xl w-8 text-center">{action.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-zinc-200">{action.label}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{action.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-[12px] font-bold ${canAfford ? 'text-orange-400' : 'text-zinc-600'}`}>
                      {action.cost}
                    </p>
                    <p className="text-[11px] text-zinc-600">Kendu</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Redeem Modal */}
      <RedeemModal
        isOpen={!!selectedOffer}
        onClose={() => setSelectedOffer(null)}
        offer={selectedOffer}
        onConfirm={handleRedeem}
      />
    </div>
    </AppShell>
  );
}
