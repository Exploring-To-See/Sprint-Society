// SSScreen — the redesigned app shell: fixed aurora field, sticky Home-identical chrome
// (brand wordmark · notification bell + badge · avatar), a scrolling body that clears the
// floating nav, and the locked Glide-Pill nav. Pages compose their content inside.
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SSAura } from './SSAura';
import { SSNav, SSTab } from './SSNav';
import { Bell } from './icons';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

interface SSScreenProps {
  children: ReactNode;
  active?: SSTab;
  hideNav?: boolean;
  bodyLabel?: string;
  flush?: boolean;
}

export function SSScreen({ children, active, hideNav, bodyLabel, flush }: SSScreenProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { data: unread } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => api.get('/notifications/unread-count').then((r) => r.data),
    enabled: !!user && !isAdmin,
    staleTime: 60_000,
  });
  const unreadCount: number = unread?.count || 0;

  const name = user?.name?.trim() || 'Runner';
  const initials = name
    ? name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'R';

  return (
    <div className="ss-screen">
      <SSAura />

      <header className="topbar ss-topbar">
        <button
          className="brand"
          aria-label="Sprint Society home"
          data-testid="ss-brand"
          onClick={() => navigate('/dashboard')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <b>Sprint</b> Society
        </button>
        <div className="icons">
          <button
            className="iconbtn"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            data-testid="ss-bell"
            onClick={() => navigate('/notifications')}
          >
            <Bell width={17} height={17} stroke="var(--muted)" />
            {unreadCount > 0 && (
              <span className="ss-badge" aria-hidden="true">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>
          {user?.profile_image_url ? (
            <button className="avatar" aria-label="Your profile" data-testid="ss-avatar" onClick={() => navigate('/profile')} style={{ padding: 0, overflow: 'hidden' }}>
              <img src={user.profile_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ) : (
            <button className="avatar" aria-label="Your profile" data-testid="ss-avatar" onClick={() => navigate('/profile')}>
              {initials}
            </button>
          )}
        </div>
      </header>

      <main className="ss-body" style={flush ? { paddingBottom: 0 } : undefined} aria-label={bodyLabel}>
        {children}
      </main>

      {!hideNav && <SSNav active={active} />}
    </div>
  );
}
