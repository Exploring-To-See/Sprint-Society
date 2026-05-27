import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BottomNav } from './BottomNav';
import { FeedbackButton } from '../FeedbackButton';
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
  const isRunPage = location.pathname === '/run/track';

  const { data: balance } = useQuery({
    queryKey: ['kendu-balance'],
    queryFn: () => api.get('/kendu/balance').then(r => r.data),
    enabled: !!user && !isAdmin,
    staleTime: 60_000,
  });

  const profileImage = (user as any)?.profile_image_url;
  const userName = (user as any)?.name || '';
  const initial = userName.charAt(0).toUpperCase();

  return (
    <div className={`min-h-screen bg-bg-primary ${hideNav ? '' : 'pb-20'}`}>
      {/* Top header bar */}
      {user && !isAdmin && (
        <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top,8px)+8px)] pb-2 bg-bg-primary/90 backdrop-blur-md">
          {/* Profile avatar (left) */}
          <button
            onClick={() => navigate('/profile')}
            className="w-8 h-8 rounded-full overflow-hidden border border-bg-tertiary active:scale-95 transition-transform flex-shrink-0"
          >
            {profileImage ? (
              <img src={profileImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-bg-tertiary flex items-center justify-center text-[11px] font-bold text-zinc-400">
                {initial}
              </div>
            )}
          </button>

          {/* Kendu balance (right) */}
          {balance && balance.spendable_balance > 0 && (
            <button
              onClick={() => navigate('/rewards')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 active:scale-95 transition-all"
            >
              <span className="text-[11px] font-bold text-orange-400">{balance.spendable_balance}</span>
              <span className="text-[9px] text-zinc-500">K</span>
            </button>
          )}
        </div>
      )}

      <main className={`max-w-lg mx-auto px-4 pb-4 ${user && !isAdmin ? 'pt-14' : 'pt-5'}`}>
        {children}
      </main>

      {!hideNav && (
        <>
          <FeedbackButton />

          {/* Floating Run FAB */}
          {!isRunPage && user && !isAdmin && (
            <motion.button
              onClick={() => navigate('/run/track')}
              className="fixed bottom-[72px] left-1/2 -translate-x-1/2 z-50 w-14 h-14 rounded-full bg-accent flex items-center justify-center shadow-[0_0_24px_rgba(249,115,22,0.4)] active:scale-90 transition-transform"
              animate={{ boxShadow: ['0 0 16px rgba(249,115,22,0.3)', '0 0 28px rgba(249,115,22,0.5)', '0 0 16px rgba(249,115,22,0.3)'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </motion.button>
          )}

          <BottomNav />
        </>
      )}
    </div>
  );
}
