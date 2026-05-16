import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/api';

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export function ReadinessCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['readiness'],
    queryFn: () => api.get('/training/readiness').then(r => r.data),
  });

  if (isLoading || !data) return null;

  const colors = {
    green: { bg: 'bg-accent-green/10', border: 'border-accent-green/20', text: 'text-accent-green', dot: 'bg-accent-green' },
    yellow: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-400' },
    red: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', dot: 'bg-red-400' },
  };

  const c = colors[data.color as keyof typeof colors] || colors.green;

  return (
    <motion.div variants={fadeUp} className={`${c.bg} border ${c.border} rounded-xl p-4 flex items-center gap-3`}>
      <div className={`w-3 h-3 rounded-full ${c.dot}`} />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${c.text}`}>{data.label}</span>
          <span className="text-[11px] text-zinc-500">Readiness {data.score}%</span>
        </div>
        <p className="text-[12px] text-zinc-400 mt-0.5">{data.recommendation}</p>
      </div>
    </motion.div>
  );
}
