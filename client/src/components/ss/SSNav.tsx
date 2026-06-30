// Locked Glide-Pill floating nav (UI-UX §5). 5 items verbatim: Home · AI Coach ·
// Run (center FAB) · Community · Events. ONE active signal — a neutral frosted pill
// (Motion FLIP-glides via layoutId) behind the active icon + outline→fill swap.
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HomeOutline, HomeFill, CoachOutline, CoachFill,
  CommunityOutline, CommunityFill, EventsOutline, EventsFill, RunGlyph,
} from './icons';

export type SSTab = 'home' | 'coach' | 'community' | 'events';

const ITEMS: { key: SSTab; path: string; label: string; Out: typeof HomeOutline; Fill: typeof HomeFill }[] = [
  { key: 'home', path: '/dashboard', label: 'Home', Out: HomeOutline, Fill: HomeFill },
  { key: 'coach', path: '/coach', label: 'AI Coach', Out: CoachOutline, Fill: CoachFill },
  { key: 'community', path: '/social', label: 'Community', Out: CommunityOutline, Fill: CommunityFill },
  { key: 'events', path: '/events', label: 'Events', Out: EventsOutline, Fill: EventsFill },
];

export function SSNav({ active }: { active?: SSTab }) {
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  return (
    <div className="f2-nav" data-testid="ss-nav">
      <div className="f2-cap">
        <div className="f2-row">
          {ITEMS.slice(0, 2).map((it) => (
            <NavItem key={it.key} item={it} active={active === it.key} onClick={() => navigate(it.path)} reduce={!!reduce} />
          ))}
          <div className="f2-slot" aria-hidden="true" />
          {ITEMS.slice(2).map((it) => (
            <NavItem key={it.key} item={it} active={active === it.key} onClick={() => navigate(it.path)} reduce={!!reduce} />
          ))}
        </div>
      </div>
      <button
        className="f2-fab"
        aria-label="Start a run"
        data-testid="ss-nav-run"
        onClick={() => navigate('/run/track')}
      >
        <RunGlyph width={22} height={22} style={{ marginLeft: 1 }} />
      </button>
    </div>
  );
}

function NavItem({
  item, active, onClick, reduce,
}: {
  item: (typeof ITEMS)[number]; active: boolean; onClick: () => void; reduce: boolean;
}) {
  const { Out, Fill, label } = item;
  return (
    <button
      className={`f2-it${active ? ' on' : ''}`}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      data-testid={`ss-nav-${item.key}`}
      onClick={onClick}
    >
      {active && (
        <motion.span
          layoutId="ss-navpill"
          className="ss-navpill"
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 480, damping: 38 }}
        />
      )}
      <span className="f2-ico" style={{ zIndex: 1 }}>
        <Out className="f2-out" width={24} height={24} />
        <Fill className="f2-fill" width={24} height={24} />
      </span>
    </button>
  );
}
