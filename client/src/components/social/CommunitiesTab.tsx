import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

export function CommunitiesTab() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['communities'],
    queryFn: () => api.get('/communities').then(r => r.data).catch(() => ({ joined: [], discover: [] })),
  });

  const joined = data?.joined || data?.communities?.filter((c: any) => c.is_member) || [];
  const discover = data?.discover || data?.communities?.filter((c: any) => !c.is_member) || [];

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-bg-secondary animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="px-3 py-2.5 rounded-lg bg-bg-secondary border border-bg-tertiary text-[11px] text-zinc-600">
        🔍 Search communities...
      </div>

      {/* My Communities */}
      {joined.length > 0 && (
        <div>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2">My Communities</p>
          <div className="space-y-2">
            {joined.map((c: any) => (
              <button
                key={c.id}
                onClick={() => navigate(`/communities/${c.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-bg-secondary border border-bg-tertiary active:scale-[0.98] transition-transform text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-gold flex items-center justify-center text-[16px]">
                  {c.emoji || '🏃'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-white truncate">{c.name}</p>
                  <p className="text-[9px] text-zinc-600">{c.member_count} members</p>
                </div>
                {c.unread_posts > 0 && (
                  <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Discover */}
      {discover.length > 0 && (
        <div>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Discover</p>
          <div className="space-y-2">
            {discover.slice(0, 5).map((c: any) => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-bg-secondary border border-bg-tertiary">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[16px]">
                  {c.emoji || '📈'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-white truncate">{c.name}</p>
                  <p className="text-[9px] text-zinc-600">{c.member_count} members</p>
                </div>
                <button
                  onClick={() => navigate(`/communities/${c.id}`)}
                  className="px-3 py-1.5 rounded-md bg-accent/10 border border-accent/20 text-[9px] font-bold text-accent"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {joined.length === 0 && discover.length === 0 && (
        <div className="text-center py-8">
          <p className="text-2xl mb-2">👥</p>
          <p className="text-[12px] font-bold text-zinc-400">No communities yet</p>
          <p className="text-[10px] text-zinc-600 mt-1">Communities will appear here as they're created.</p>
        </div>
      )}
    </div>
  );
}
