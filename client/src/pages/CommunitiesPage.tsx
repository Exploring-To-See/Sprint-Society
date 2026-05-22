import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { AppShell } from '../components/layout/AppShell';
import { CommunityCard } from '../components/communities/CommunityCard';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
};

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'run_club', label: 'Run Clubs' },
  { key: 'training', label: 'Training' },
  { key: 'nutrition', label: 'Nutrition' },
  { key: 'wellness', label: 'Wellness' },
  { key: 'social', label: 'Social' },
] as const;

export function CommunitiesPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['communities', activeCategory],
    queryFn: () => api.get('/communities', {
      params: { category: activeCategory === 'all' ? undefined : activeCategory }
    }).then(r => r.data),
  });

  const { data: myCommunities } = useQuery({
    queryKey: ['my-communities'],
    queryFn: () => api.get('/communities/my').then(r => r.data),
  });

  return (
    <AppShell>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4 pb-6">
        <motion.div variants={fadeUp} className="flex items-start justify-between">
          <div>
            <h1 className="font-heading text-[22px] font-bold">Communities</h1>
            <p className="text-[11px] text-zinc-600 mt-0.5">Find your people, build your circle</p>
          </div>
          <button
            onClick={() => navigate('/communities/create')}
            className="px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent text-[11px] font-semibold active:scale-95 transition-all"
          >
            + Create
          </button>
        </motion.div>

        {/* My communities (compact horizontal scroll) */}
        {myCommunities && myCommunities.length > 0 && (
          <motion.div variants={fadeUp}>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">Your communities</h3>
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
              {myCommunities.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/communities/${c.id}`)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-bg-secondary border border-bg-tertiary whitespace-nowrap shrink-0 active:scale-95 transition-all"
                >
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-[9px]">{getCategoryIcon(c.category)}</span>
                  </div>
                  <span className="text-[11px] font-medium text-zinc-300">{c.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Category filters */}
        <motion.div variants={fadeUp} className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setActiveCategory(c.key)}
              className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all active:scale-95 ${
                activeCategory === c.key
                  ? 'bg-accent text-white'
                  : 'bg-bg-secondary border border-bg-tertiary text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {c.label}
            </button>
          ))}
        </motion.div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-4 animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-bg-tertiary" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-32 bg-bg-tertiary rounded" />
                    <div className="h-3 w-20 bg-bg-tertiary rounded" />
                  </div>
                </div>
                <div className="h-3 w-full bg-bg-tertiary rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!data?.communities || data.communities.length === 0) && (
          <motion.div variants={fadeUp} className="flex flex-col items-center py-16 gap-3">
            <div className="w-12 h-12 rounded-xl bg-bg-secondary border border-bg-tertiary flex items-center justify-center">
              <span className="text-2xl">🏘️</span>
            </div>
            <p className="text-[13px] text-zinc-500 text-center max-w-[260px]">
              No communities yet. They're coming — watch this space.
            </p>
          </motion.div>
        )}

        {/* Community cards */}
        {!isLoading && (
          <motion.div variants={fadeUp}>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-3">Discover</h3>
          </motion.div>
        )}
        {data?.communities?.map((community: any) => (
          <motion.div key={community.id} variants={fadeUp}>
            <CommunityCard community={community} onClick={() => navigate(`/communities/${community.id}`)} />
          </motion.div>
        ))}
      </motion.div>
    </AppShell>
  );
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    run_club: '🏃', training: '🎯', nutrition: '🥗', wellness: '🧘', social: '🎉', brand: '✨', custom: '⭐',
  };
  return icons[category] || '⭐';
}
