import { useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Home', icon: '🏠' },
  { path: '/coaching', label: 'Coach', icon: '📈' },
  { path: '/runs', label: 'Runs', icon: '🏃' },
  { path: '/share', label: 'Share', icon: '🏆' },
  { path: '/profile', label: 'Profile', icon: '👤' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg-primary border-t border-bg-tertiary">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2 pb-[env(safe-area-inset-bottom,8px)]">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors ${
                isActive ? 'text-accent' : 'text-zinc-600'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
