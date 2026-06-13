import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  feature: string;
  requiredPlan: 'base' | 'pro';
}

export function UpgradePrompt({ feature, requiredPlan }: UpgradePromptProps) {
  const navigate = useNavigate();

  return (
    <div className="card p-4 border-accent/20 bg-gradient-to-b from-accent/5 to-transparent space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">{requiredPlan === 'pro' ? '👑' : '⚡'}</span>
        <h3 className="text-[13px] font-semibold text-white">{requiredPlan === 'pro' ? 'Pro' : 'Base'} Feature</h3>
      </div>
      <p className="text-[12px] text-zinc-400">
        {feature} requires the {requiredPlan === 'pro' ? 'Pro' : 'Base'} plan.
      </p>
      <button
        onClick={() => navigate('/subscription')}
        className={`w-full py-2.5 rounded-xl font-semibold text-[12px] active:scale-[0.98] transition-all ${
          requiredPlan === 'pro'
            ? 'bg-gradient-to-r from-accent-gold to-amber-500 text-black'
            : 'bg-accent text-white'
        }`}
      >
        Upgrade to {requiredPlan === 'pro' ? 'Pro' : 'Base'} · ₹{requiredPlan === 'pro' ? '99' : '9'}/mo
      </button>
    </div>
  );
}
