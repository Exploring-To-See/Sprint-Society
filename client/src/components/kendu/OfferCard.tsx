import { motion } from 'framer-motion';
import { Bolt } from '../ss/icons';

interface Offer {
  id: number;
  brand_name: string;
  offer_title: string;
  description: string;
  kendu_cost: number;
  rupee_value: number;
  remaining_quantity: number;
  total_quantity: number;
  user_redeemed: boolean;
}

interface Props {
  offer: Offer;
  userBalance: number;
  onRedeem: (offerId: number) => void;
}

export function OfferCard({ offer, userBalance, onRedeem }: Props) {
  const canAfford = userBalance >= offer.kendu_cost;
  const isAvailable = offer.remaining_quantity > 0 && !offer.user_redeemed;
  const deficit = offer.kendu_cost - userBalance;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`tile ${isAvailable && canAfford ? '' : 'recess'}`}
      style={{ gap: 10, padding: 14, opacity: isAvailable && canAfford ? 1 : 0.9 }}
    >
      {/* Locked overlay */}
      {(!canAfford || !isAvailable) && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'grid', placeItems: 'center', background: 'rgba(5,5,11,.45)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)', borderRadius: 'inherit' }}>
          {offer.user_redeemed ? (
            <span className="ss-tag go">Already redeemed</span>
          ) : offer.remaining_quantity <= 0 ? (
            <span className="ss-tag full">Out of stock</span>
          ) : (
            <span className="ss-tag maybe">{deficit.toLocaleString()} more Kendu needed</span>
          )}
        </div>
      )}

      {/* Brand + Title */}
      <div>
        <p style={{ font: '600 var(--lbl) var(--body)', textTransform: 'uppercase', letterSpacing: 'var(--trk-sm)', color: 'var(--muted-2)', margin: 0 }}>
          {offer.brand_name}
        </p>
        <p style={{ font: '600 14px var(--body)', color: 'var(--fg)', margin: '3px 0 0' }}>{offer.offer_title}</p>
        {offer.description && (
          <p style={{ font: '400 11px var(--body)', color: 'var(--muted)', margin: '5px 0 0', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {offer.description}
          </p>
        )}
      </div>

      {/* Cost + Value */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Bolt width={13} height={13} style={{ color: 'var(--accent-2)' }} />
          <span className="num" style={{ font: '700 14px var(--mono)', color: 'var(--accent-2)' }}>
            {offer.kendu_cost.toLocaleString()}
          </span>
        </span>
        {offer.rupee_value > 0 && (
          <span className="num" style={{ font: '500 10.5px var(--mono)', color: 'var(--muted-2)' }}>
            Worth ₹{offer.rupee_value}
          </span>
        )}
      </div>

      {/* Stock + Redeem */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="num" style={{ font: '500 10px var(--mono)', color: 'var(--muted-2)' }}>
          {offer.remaining_quantity}/{offer.total_quantity} left
        </span>
        {isAvailable && canAfford && (
          <button
            onClick={() => onRedeem(offer.id)}
            className="ss-btn ss-btn-primary"
            style={{ height: 36, fontSize: 12.5, flex: 'none', padding: '0 18px' }}
          >
            Redeem
          </button>
        )}
      </div>
    </motion.div>
  );
}
