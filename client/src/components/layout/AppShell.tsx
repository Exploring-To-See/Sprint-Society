import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BottomNav } from './BottomNav';
import { ChatFAB } from '../chat/ChatFAB';
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
  const isAdmin = (user as any)?.role === 'admin';

  const { data: balance } = useQuery({
    queryKey: ['kendu-balance'],
    queryFn: () => api.get('/kendu/balance').then(r => r.data),
    enabled: !!user && !isAdmin,
    staleTime: 60_000,
  });

  return (
    <div className={`min-h-screen bg-bg-primary ${hideNav ? '' : 'pb-20'}`}>
      {user && !isAdmin && balance && (
        <button
          onClick={() => navigate('/rewards')}
          className="fixed top-3 right-3 z-40 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm active:scale-95 transition-all"
        >
          <span className="text-[11px] font-bold text-orange-400">{balance.spendable_balance}</span>
          <span className="text-[9px] text-zinc-500">K</span>
        </button>
      )}
      <main className="max-w-lg mx-auto px-4 pt-5 pb-4">
        {children}
      </main>
      {!hideNav && (
        <>
          <FeedbackButton />
          <ChatFAB />
          <BottomNav />
        </>
      )}
    </div>
  );
}
