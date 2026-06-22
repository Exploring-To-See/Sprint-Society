import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 z-50 bg-bg-primary/95 backdrop-blur-lg border-t border-bg-tertiary/50">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1.5 pb-[calc(env(safe-area-inset-bottom,6px)+4px)]">
        <NavButton active={isActive('/dashboard')} onClick={() => navigate('/dashboard')} label="Home">
          <HomeIcon active={isActive('/dashboard')} />
        </NavButton>

        {/* RUN — Center primary action */}
        <button
          aria-label="Start a run"
          onClick={() => navigate('/run/track')}
          className="relative -mt-5 flex flex-col items-center gap-[2px] active:scale-90 transition-transform"
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${
            isActive('/run') ? 'bg-accent shadow-accent/40' : 'bg-accent/90 shadow-accent/30'
          }`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <span className="text-[11px] font-bold text-accent">Run</span>
        </button>

        <NavButton active={isActive('/coach')} onClick={() => navigate('/coach')} label="AI Coach">
          <CoachIcon active={isActive('/coach')} />
        </NavButton>

        <NavButton active={isActive('/social') || isActive('/communities')} onClick={() => navigate('/social')} label="Social">
          <SocialIcon active={isActive('/social') || isActive('/communities')} />
        </NavButton>
      </div>
    </nav>
  );
}

function NavButton({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button aria-label={label} onClick={onClick} className="relative flex flex-col items-center gap-[3px] px-3 py-1.5 transition-colors active:scale-95">
      {active && (
        <motion.div
          layoutId="nav-indicator"
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full bg-accent"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      {children}
      <span className={`text-[11px] font-semibold tracking-wide ${active ? 'text-white' : 'text-zinc-600'}`}>
        {label}
      </span>
    </button>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={active ? 'text-accent' : 'text-zinc-600'}>
      <path d="M3 8.5L10 3L17 8.5V16C17 16.5523 16.5523 17 16 17H4C3.44772 17 3 16.5523 3 16V8.5Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0}
      />
      <path d="M8 17V11H12V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function SocialIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={active ? 'text-accent' : 'text-zinc-600'}>
      <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
      <circle cx="14" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
      <path d="M2.5 16c0-2.2 2-3.5 4.5-3.5s4.5 1.3 4.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12.5 13c2-.2 5 .8 5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CoachIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={active ? 'text-accent' : 'text-zinc-600'}>
      <path d="M10 2L12 6L16 6.5L13 9.5L14 14L10 12L6 14L7 9.5L4 6.5L8 6L10 2Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0}
      />
      <path d="M10 15V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

