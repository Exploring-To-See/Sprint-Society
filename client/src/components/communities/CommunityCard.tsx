const CATEGORY_STYLES: Record<string, { icon: string; color: string; bg: string }> = {
  run_club: { icon: '🏃', color: 'text-accent', bg: 'bg-accent/10' },
  training: { icon: '🎯', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  nutrition: { icon: '🥗', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  wellness: { icon: '🧘', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  social: { icon: '🎉', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  brand: { icon: '✨', color: 'text-rose-400', bg: 'bg-rose-400/10' },
  custom: { icon: '⭐', color: 'text-zinc-400', bg: 'bg-zinc-400/10' },
};

interface CommunityCardProps {
  community: any;
  onClick: () => void;
}

export function CommunityCard({ community, onClick }: CommunityCardProps) {
  const style = CATEGORY_STYLES[community.category] || CATEGORY_STYLES.custom;

  return (
    <button
      onClick={onClick}
      className="w-full text-left card p-4 transition-all active:scale-[0.98] hover:border-zinc-700"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`w-11 h-11 rounded-xl ${style.bg} flex items-center justify-center shrink-0`}>
          {community.avatar_url ? (
            <img src={community.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
          ) : (
            <span className="text-lg">{style.icon}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[14px] text-white truncate">{community.name}</h3>
            {community.is_verified && (
              <svg width="14" height="14" viewBox="0 0 16 16" className="text-accent shrink-0">
                <path d="M8 1l1.5 2.5L12.5 4l-.5 3 2 2.5-2.5 1.5L11 14l-3-1-3 1-.5-3L2 9.5 4 7l-.5-3 3-.5L8 1z" fill="currentColor"/>
                <path d="M6 8l1.5 1.5L10 6.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">{community.description || `A ${community.category.replace('_', ' ')} community`}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] text-zinc-600">
              {community.member_count} {community.member_count === 1 ? 'member' : 'members'}
            </span>
            {community.is_member && (
              <span className="text-[10px] font-semibold text-accent">Joined</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
