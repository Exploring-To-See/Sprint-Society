import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/api';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
};

const READINESS = {
  green: {
    gradient: 'from-accent-green/8 to-transparent',
    border: 'border-accent-green/15',
    text: 'text-accent-green',
    dot: 'bg-accent-green',
    ring: 'ring-accent-green/20',
  },
  yellow: {
    gradient: 'from-amber-400/8 to-transparent',
    border: 'border-amber-400/15',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
    ring: 'ring-amber-400/20',
  },
  red: {
    gradient: 'from-red-400/8 to-transparent',
    border: 'border-red-400/15',
    text: 'text-red-400',
    dot: 'bg-red-400',
    ring: 'ring-red-400/20',
  },
};

export function ReadinessCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['readiness'],
    queryFn: () => api.get('/training/readiness').then(r => r.data),
  });

  if (isLoading) {
    return (
      <motion.div variants={fadeUp} className="h-[68px] rounded-xl bg-bg-secondary border border-bg-tertiary animate-pulse" />
    );
  }

  if (!data) return null;

  const c = READINESS[data.color as keyof typeof READINESS] || READINESS.green;

  return (
    <motion.div
      variants={fadeUp}
      className={`relative overflow-hidden rounded-xl border ${c.border} bg-gradient-to-r ${c.gradient} p-4`}
    >
      <div className="flex items-center gap-3">
        {/* Animated pulse dot */}
        <div className="relative">
          <div className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
          <motion.div
            className={`absolute inset-0 rounded-full ${c.dot} opacity-40`}
            animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[13px] font-bold ${c.text}`}>{data.label}</span>
            <span className="text-[10px] font-mono text-zinc-600 tabular-nums">{data.score}%</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{data.recommendation}</p>
        </div>
      </div>
    </motion.div>
  );
}
