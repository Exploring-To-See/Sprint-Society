// Communities (/communities) — rebuilt on ss-base (reference: communities.html).
// Hooks preserved: GET /communities {category} + GET /communities/my.
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { SSScreen } from '../components/ss/SSScreen';
import { CommunityCard } from '../components/communities/CommunityCard';
import { SSSkeleton, SSEmpty } from '../components/ss/SSStates';
import { CommunityOutline, Plus, ChevronRight, RunGlyph, Target, Leaf, Heart, Spark } from '../components/ss/icons';

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

export const CATEGORY_ICONS: Record<string, (p: React.SVGProps<SVGSVGElement>) => JSX.Element> = {
  run_club: RunGlyph,
  training: Target,
  nutrition: Leaf,
  wellness: Heart,
  social: CommunityOutline,
  brand: Spark,
  custom: Spark,
};

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
    <SSScreen active="community" bodyLabel="Communities">
      <motion.div variants={stagger} initial="hidden" animate="show" className="ss-pad" style={{ display: 'flex', flexDirection: 'column', gap: 13, paddingBottom: 24 }}>
        <motion.div variants={fadeUp} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <h1 style={{ font: '600 var(--m-lg) var(--head)', letterSpacing: '-.02em' }}>Communities</h1>
            <p style={{ font: '500 11.5px var(--body)', color: 'var(--muted)', marginTop: 2 }}>Find your people, build your circle</p>
          </div>
          <button
            onClick={() => navigate('/communities/create')}
            className="ss-qchip accent"
            style={{ height: 38, padding: '0 13px 0 10px' }}
            data-testid="communities-create"
          >
            <span className="qi"><Plus width={13} height={13} style={{ color: 'var(--accent-2)' }} /></span>
            Create
          </button>
        </motion.div>

        {/* My communities */}
        {myCommunities && myCommunities.length > 0 && (
          <motion.div variants={fadeUp}>
            <p className="tlbl" style={{ marginBottom: 8 }}>Your communities</p>
            <div className="tile recess" style={{ borderRadius: 18, padding: '2px 13px' }}>
              {myCommunities.map((c: any, i: number) => {
                const Icon = CATEGORY_ICONS[c.category] || Spark;
                return (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/communities/${c.id}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 11, width: '100%', minHeight: 56,
                      padding: '10px 0', textAlign: 'left', cursor: 'pointer',
                      borderBottom: i === myCommunities.length - 1 ? 'none' : '1px solid var(--hair)',
                    }}
                    data-testid={`my-community-${c.id}`}
                  >
                    <span className="runico" style={{ width: 36, height: 36, borderRadius: 11 }}>
                      <Icon width={16} height={16} style={{ color: 'var(--accent-2)' }} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0, font: '600 13px var(--head)', color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.name}
                    </span>
                    {typeof c.member_count === 'number' && (
                      <span className="num" style={{ font: '600 11px var(--mono)', color: 'var(--muted)' }}>
                        {c.member_count}
                        <small style={{ font: '500 9px var(--body)', color: 'var(--muted-2)', textTransform: 'uppercase', letterSpacing: 'var(--trk-sm)', marginLeft: 3 }}>members</small>
                      </span>
                    )}
                    <ChevronRight width={14} height={14} style={{ color: 'var(--muted-2)', flex: 'none' }} />
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Category filters */}
        <motion.div variants={fadeUp} style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setActiveCategory(c.key)}
              className={`ss-tab${activeCategory === c.key ? ' on' : ''}`}
              aria-pressed={activeCategory === c.key}
            >
              {c.label}
            </button>
          ))}
        </motion.div>

        {/* Loading */}
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[0, 1, 2].map(i => <SSSkeleton key={i} height={88} style={{ borderRadius: 18 }} />)}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!data?.communities || data.communities.length === 0) && (
          <SSEmpty
            icon={<CommunityOutline width={22} height={22} />}
            title="No communities yet"
            body="They're coming — watch this space. New crews will appear here the moment they open up."
            testid="communities-empty"
          />
        )}

        {/* Community cards */}
        {!isLoading && data?.communities?.length > 0 && (
          <motion.div variants={fadeUp}>
            <p className="tlbl" style={{ marginBottom: 8 }}>Discover</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {data.communities.map((community: any) => (
                <CommunityCard key={community.id} community={community} onClick={() => navigate(`/communities/${community.id}`)} />
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </SSScreen>
  );
}
