import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BottomNav } from './BottomNav';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

interface AppShellProps {
  children: ReactNode;
  hideNav?: boolean;
}

export function AppShell({ children, hideNav }: AppShellProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = (user as any)?.role === 'admin';

  const { data: unread } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => api.get('/notifications/unread-count').then(r => r.data),
    enabled: !!user && !isAdmin,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const unreadCount = unread?.count || 0;
  const profileImage = (user as any)?.profile_image_url;
  const userName = (user as any)?.name || 'Runner';
  const initials = userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className={`min-h-screen bg-bg-primary ${hideNav ? '' : 'pb-20'}`}>
      {user && !isAdmin && (
        <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top,8px)+8px)] pb-2 bg-bg-primary/90 backdrop-blur-md">
          {/* Left: Avatar → Profile */}
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2.5 active:scale-95 transition-transform"
          >
            {profileImage ? (
              <img src={profileImage} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-zinc-700" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-gold flex items-center justify-center text-[11px] font-bold text-white border-2 border-zinc-700">
                {initials}
              </div>
            )}
            <span className="text-[13px] font-bold text-white tracking-tight">
              <span className="text-accent">Sprint</span> Society
            </span>
          </button>

          {/* Right: Notifications */}
          <button
            onClick={() => navigate('/notifications')}
            className="relative w-8 h-8 flex items-center justify-center rounded-full active:scale-95 transition-transform"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent text-[9px] font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      <main className={`max-w-lg mx-auto px-4 pb-4 ${user && !isAdmin ? 'pt-14' : 'pt-5'}`}>
        {children}
      </main>

      {!hideNav && <BottomNav />}
    </div>
  );
}
