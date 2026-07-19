import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useState, ComponentType, SVGProps } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { OfferCard } from '../components/kendu/OfferCard';
import { RedeemModal } from '../components/kendu/RedeemModal';
import { KenduHistory } from '../components/kendu/KenduHistory';
import { SSScreen } from '../components/ss/SSScreen';
import { SSSeg } from '../components/ss/SSSeg';
import { SSSkeleton, SSEmpty } from '../components/ss/SSStates';
import {
  ArrowLeft, Bolt, Flame, Crown, Spark, Send, Trophy, Medal, CommunityOutline,
} from '../components/ss/icons';

type Tab = 'marketplace' | 'actions' | 'history';

type SsIcon = ComponentType<SVGProps<SVGSVGElement>>;

const SPEND_ACTIONS: readonly {
  key: string; Icon: SsIcon; label: string; cost: number | string; description: string; route: string | null;
}[] = [
  // Every tile routes to the surface where the spend ACTUALLY happens (card
  // skins on Share, AI deep dive in Coach chat, boost/sponsor inside a
  // community, challenge stakes on Challenges). Actions with no real spend
  // flow in the app (host event, priority RSVP, group challenge) are not
  // listed — no dead or misleading buttons.
  { key: 'community', Icon: CommunityOutline, label: 'Request Community', cost: 'Free', description: 'Apply to start your own run club', route: '/communities/create' },
  { key: 'challenge', Icon: Medal, label: '1v1 Challenge', cost: '5-50', description: 'Stake Kendu, compete head-to-head', route: '/challenges' },
  { key: 'card-skin', Icon: Crown, label: 'Premium Card Skin', cost: 40, description: 'Unlock exclusive share templates', route: '/share' },
  { key: 'ai-dive', Icon: Spark, label: 'AI Deep Dive', cost: 30, description: 'Extended AI coach session', route: '/coach' },
  { key: 'boost', Icon: Send, label: 'Boost Post', cost: 10, description: 'Pin your post to top for 24h', route: '/communities' },
  { key: 'sponsor', Icon: Trophy, label: 'Sponsor Leaderboard', cost: 500, description: 'Your name on community board 7 days', route: '/communities' },
];

export function RewardsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('marketplace');
  const [eventFilter] = useState<string>('');

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
    <SSScreen bodyLabel="Kendu Store">
      <div className="pad" style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 6, paddingBottom: 24 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--hair)', background: 'var(--glass)', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--muted)', flex: 'none' }}
          >
            <ArrowLeft width={16} height={16} />
          </button>
          <h1 style={{ font: '600 var(--m-lg) var(--head)', letterSpacing: '-.02em', color: 'var(--fg)', margin: 0 }}>
            Kendu Store
          </h1>
        </div>

        {/* Balance banner */}
        {balance && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="tile"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: '14px 15px' }}
          >
            <span style={{ width: 38, height: 38, borderRadius: 11, flex: 'none', display: 'grid', placeItems: 'center', background: 'rgba(249,115,22,.14)', border: '1px solid rgba(249,115,22,.28)' }}>
              <Bolt width={17} height={17} style={{ color: 'var(--accent-2)' }} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: '600 var(--lbl) var(--body)', textTransform: 'uppercase', letterSpacing: 'var(--trk-sm)', color: 'var(--muted-2)' }}>
                Spendable balance
              </div>
              <div className="num" style={{ font: '700 var(--m-lg) var(--mono)', lineHeight: 1, marginTop: 3, display: 'flex', alignItems: 'baseline', gap: 5 }}>
                {balance.spendable_balance.toLocaleString()}
                <small style={{ font: '600 10px var(--body)', textTransform: 'uppercase', letterSpacing: 'var(--trk-sm)', color: 'var(--accent-2)' }}>Kendu</small>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="num" style={{ font: '600 11px var(--mono)', color: 'var(--fg)' }}>Level {balance.current_level}</div>
              <span className="ss-dchip warn" style={{ marginTop: 4 }}>
                <Flame width={10} height={10} /> {balance.current_streak_days}d
              </span>
            </div>
          </motion.div>
        )}

        {/* Sub-tabs — one segmented glide-pill */}
        <SSSeg<Tab>
          items={[
            { key: 'marketplace', label: 'Rewards' },
            { key: 'actions', label: 'Spend' },
            { key: 'history', label: 'History' },
          ]}
          value={activeTab}
          onChange={setActiveTab}
          ariaLabel="Kendu store sections"
          testid="rewards-seg"
        />

        {/* Content */}
        {activeTab === 'history' && <KenduHistory />}

        {activeTab === 'marketplace' && (
          isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[0, 1, 2].map(i => <SSSkeleton key={i} height={132} style={{ borderRadius: 18 }} />)}
            </div>
          ) : offers && offers.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
            <SSEmpty
              icon={<Trophy width={22} height={22} />}
              title="No brand offers yet"
              body="Rewards from Decathlon, Red Bull & more coming soon."
              testid="rewards-empty"
            />
          )
        )}

        {activeTab === 'actions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <p style={{ font: '500 11px var(--body)', color: 'var(--muted)', margin: '0 0 2px' }}>
              Spend your Kendu on in-app features
            </p>
            {SPEND_ACTIONS.map(action => {
              const cost = typeof action.cost === 'number' ? action.cost : 0;
              const canAfford = typeof action.cost === 'number' ? (balance?.spendable_balance ?? 0) >= cost : true;
              const { Icon } = action;

              return (
                <motion.button
                  key={action.key}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => action.route && navigate(action.route)}
                  disabled={!action.route}
                  className="tile"
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: action.route ? 'pointer' : 'default', textAlign: 'left', opacity: action.route ? 1 : 0.55 }}
                >
                  <span style={{ width: 32, height: 32, borderRadius: 10, flex: 'none', display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.05)', border: '1px solid var(--hair)' }}>
                    <Icon width={15} height={15} style={{ color: action.key === 'ai-dive' ? 'var(--violet-2)' : 'var(--muted)' }} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', font: '600 13px var(--body)', color: 'var(--fg)' }}>{action.label}</span>
                    <span style={{ display: 'block', font: '500 10.5px var(--body)', color: 'var(--muted-2)', marginTop: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {action.description}
                    </span>
                  </span>
                  <span style={{ textAlign: 'right', flex: 'none' }}>
                    <span className="num" style={{ display: 'block', font: '700 12.5px var(--mono)', color: canAfford ? 'var(--accent-2)' : 'var(--muted-2)' }}>
                      {action.cost}
                    </span>
                    <span style={{ display: 'block', font: '500 9px var(--body)', textTransform: 'uppercase', letterSpacing: 'var(--trk-sm)', color: 'var(--muted-2)', marginTop: 1 }}>
                      Kendu
                    </span>
                  </span>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Redeem Modal */}
        <RedeemModal
          isOpen={!!selectedOffer}
          onClose={() => setSelectedOffer(null)}
          offer={selectedOffer}
          onConfirm={handleRedeem}
        />
      </div>
    </SSScreen>
  );
}
