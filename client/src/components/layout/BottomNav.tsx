import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Home', icon: HomeIcon },
  { path: '/events', label: 'Events', icon: EventsIcon },
  { path: '/communities', label: 'Society', icon: SocietyIcon },
  { path: '/train', label: 'Train', icon: TrainIcon },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg-primary/95 backdrop-blur-lg border-t border-bg-tertiary/50">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1.5 pb-[calc(env(safe-area-inset-bottom,6px)+4px)]">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center gap-[3px] px-4 py-1.5 transition-colors active:scale-95"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full bg-accent"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon active={isActive} />
              <span className={`text-[9px] font-semibold tracking-wide ${
                isActive ? 'text-white' : 'text-zinc-600'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
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

function TrainIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={active ? 'text-accent' : 'text-zinc-600'}>
      <rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0}
      />
      <path d="M3 8H17" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7 4V2M13 4V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="7" cy="12" r="1" fill="currentColor"/>
      <circle cx="10" cy="12" r="1" fill="currentColor"/>
    </svg>
  );
}

function EventsIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={active ? 'text-accent' : 'text-zinc-600'}>
      <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0}
      />
      <path d="M3 8H17" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7 2.5V5M13 2.5V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="10" cy="12.5" r="1.5" fill="currentColor"/>
    </svg>
  );
}

function SocietyIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={active ? 'text-accent' : 'text-zinc-600'}>
      <circle cx="10" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5"
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0}
      />
      <circle cx="5" cy="9" r="2" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="15" cy="9" r="2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M3 16c0-2 1.5-3.5 3.5-3.5M17 16c0-2-1.5-3.5-3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M6 17c0-2.5 1.8-4 4-4s4 1.5 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={active ? 'text-accent' : 'text-zinc-600'}>
      <circle cx="10" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0}
      />
      <path d="M4 17C4 14.2386 6.68629 12 10 12C13.3137 12 16 14.2386 16 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
