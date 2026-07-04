// Community card — recess glass row (reference: communities.html .cm-row).
import { Check } from '../ss/icons';
import { categoryIcon } from './categoryIcons';

interface CommunityCardProps {
  community: any;
  onClick: () => void;
}

export function CommunityCard({ community, onClick }: CommunityCardProps) {
  const Icon = categoryIcon(community.category);

  return (
    <button
      onClick={onClick}
      className="tile recess"
      style={{ borderRadius: 18, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}
      data-testid={`community-card-${community.id}`}
    >
      {/* Avatar */}
      <span className="runico" style={{ width: 40, height: 40, borderRadius: 12, overflow: 'hidden' }}>
        {community.avatar_url ? (
          <img src={community.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
        ) : (
          <Icon width={17} height={17} style={{ color: 'var(--muted)' }} />
        )}
      </span>

      {/* Info */}
      <span style={{ flex: 1, minWidth: 0, display: 'block' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ font: '600 13.5px var(--head)', color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {community.name}
          </span>
          {community.is_verified && (
            <svg width="13" height="13" viewBox="0 0 16 16" style={{ color: 'var(--accent-2)', flexShrink: 0 }} aria-label="Verified">
              <path d="M8 1l1.5 2.5L12.5 4l-.5 3 2 2.5-2.5 1.5L11 14l-3-1-3 1-.5-3L2 9.5 4 7l-.5-3 3-.5L8 1z" fill="currentColor" />
              <path d="M6 8l1.5 1.5L10 6.5" stroke="var(--bg)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        <span style={{
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          font: '400 11px/1.5 var(--body)', color: 'var(--muted)', marginTop: 3,
        }}>
          {community.description || `A ${String(community.category).replace('_', ' ')} community`}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 7 }}>
          <span className="num" style={{ font: '600 10.5px var(--mono)', color: 'var(--muted-2)' }}>
            {community.member_count} {community.member_count === 1 ? 'member' : 'members'}
          </span>
          {community.is_member && (
            <span className="ss-tag go"><Check width={9} height={9} /> Joined</span>
          )}
        </span>
      </span>
    </button>
  );
}
