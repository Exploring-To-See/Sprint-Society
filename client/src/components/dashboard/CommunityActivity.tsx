import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

function formatTimeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

export function CommunityActivity() {
  const navigate = useNavigate();

  const { data: myCommunities } = useQuery({
    queryKey: ['my-communities'],
    queryFn: () => api.get('/communities/my').then(r => r.data),
  });

  if (!myCommunities?.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading font-semibold text-[14px]">Your communities</h3>
        <button onClick={() => navigate('/communities')} className="text-[10px] text-accent font-semibold">
          Browse
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {myCommunities.slice(0, 5).map((c: any) => (
          <button
            key={c.id}
            onClick={() => navigate(`/communities/${c.id}`)}
            className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl bg-bg-secondary border border-bg-tertiary shrink-0 min-w-[72px] active:scale-95 transition-all"
          >
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
              <span className="text-sm">{getCategoryIcon(c.category)}</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-medium truncate max-w-[60px]">{c.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    run_club: '🏃', training: '🎯', nutrition: '🥗', wellness: '🧘', social: '🎉', brand: '✨', custom: '⭐',
  };
  return icons[category] || '⭐';
}
