import { motion } from 'framer-motion';

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
      className={`rounded-xl border p-4 space-y-3 relative overflow-hidden ${
        isAvailable && canAfford
          ? 'bg-bg-secondary border-bg-tertiary hover:border-orange-500/30 transition-colors'
          : 'bg-bg-secondary/60 border-bg-tertiary/50'
      }`}
    >
      {/* Locked overlay */}
      {(!canAfford || !isAvailable) && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] rounded-xl flex items-center justify-center z-10">
          <div className="text-center px-4">
            {offer.user_redeemed ? (
              <p className="text-[11px] text-emerald-400 font-semibold">Already redeemed</p>
            ) : offer.remaining_quantity <= 0 ? (
              <p className="text-[11px] text-zinc-400 font-semibold">Out of stock</p>
            ) : (
              <p className="text-[11px] text-orange-400 font-semibold">
                {deficit.toLocaleString()} more Kendu needed
              </p>
            )}
          </div>
        </div>
      )}

      {/* Brand + Title */}
      <div>
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">{offer.brand_name}</p>
        <p className="text-[14px] font-semibold text-zinc-200 mt-0.5">{offer.offer_title}</p>
        {offer.description && (
          <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{offer.description}</p>
        )}
      </div>

      {/* Cost + Value */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🔥</span>
          <span className="text-[14px] font-bold text-orange-400">{offer.kendu_cost.toLocaleString()}</span>
        </div>
        {offer.rupee_value > 0 && (
          <span className="text-[11px] text-zinc-500">Worth ₹{offer.rupee_value}</span>
        )}
      </div>

      {/* Stock + Redeem */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-500">
          {offer.remaining_quantity}/{offer.total_quantity} left
        </span>
        {isAvailable && canAfford && (
          <button
            onClick={() => onRedeem(offer.id)}
            className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-[11px] font-semibold hover:bg-orange-600 transition-colors"
          >
            Redeem
          </button>
        )}
      </div>
    </motion.div>
  );
}
