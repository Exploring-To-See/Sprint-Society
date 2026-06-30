// Social — the club's people surface. One segmented control (the locked Pace/Load/HR
// glide-pill pattern) over five lanes: Feed · Discover · Following · Followers ·
// Leaderboard. Each lane is its own react-query key. Feed reuses <FeedPage/> verbatim so
// the kudos/comment behaviour is never reimplemented. Everything else is the V1 "ss" kit:
// neutral glass surfaces, mono/tabular numerals for ranks · XP · distance, no emoji.
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import api from '../lib/api';
import { ApiError } from '../lib/api';
import { AppShell } from '../components/layout/AppShell';
import { FeedPage } from './FeedPage';
import { SSSeg, SegItem } from '../components/ss/SSSeg';
import { SSSkeleton, SSEmpty, SSError } from '../components/ss/SSStates';
import { Trophy, Medal, Bolt, ChevronRight, Check, Flag } from '../components/ss/icons';

type SocialTab = 'feed' | 'discover' | 'following' | 'followers' | 'leaderboard';

const TABS: SegItem<SocialTab>[] = [
  { key: 'feed', label: 'Feed' },
  { key: 'discover', label: 'Discover' },
  { key: 'following', label: 'Following' },
  { key: 'followers', label: 'Followers' },
  { key: 'leaderboard', label: 'Board' },
];

/* ---------- API response shapes (verified against the route handlers) ---------- */

// GET /social/discover → ranked by XP desc, max 10 not-yet-followed runners
interface DiscoverRunner {
  id: number;
  name: string;
  profile_image_url: string | null;
  running_experience: string | null;
  current_level: number | null;
  total_xp: number | null;
  total_runs: number | string | null;
}

// GET /social/following + GET /social/followers
interface SocialUser {
  id: number;
  name: string;
  profile_image_url: string | null;
  current_level: number | null;
  total_xp: number | null;
}

// GET /gamification/leaderboard → top 50 by XP
interface LeaderRow {
  user_id: number;
  name: string;
  total_xp: number;
  current_level: number;
  tier: string;
  total_distance_km: number | string;
}

// GET /gamification/friend-streaks
interface FriendStreak {
  user_id: number;
  name: string;
  profile_image_url: string | null;
  streak_days: number;
  ran_today: boolean;
}
interface FriendStreaksData {
  friends_active_today: FriendStreak[];
  my_streak: number;
  total_friends_ran_today: number;
}

/* ---------- formatting helpers ---------- */

function fmtXp(xp: number | null | undefined): string {
  const n = Number(xp) || 0;
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString('en-US');
}
function fmtKm(km: number | string | null | undefined): string {
  const n = Number(km) || 0;
  return n.toFixed(n >= 100 ? 0 : 1);
}
function initials(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || '?';
}
function titleCase(s: string | null | undefined): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ---------- shared bits ---------- */

function Avatar({ url, name, size = 38 }: { url: string | null; name: string; size?: number }) {
  return (
    <div
      className="runico"
      style={{ width: size, height: size, borderRadius: size * 0.32, overflow: 'hidden', flex: 'none' }}
      aria-hidden="true"
    >
      {url ? (
        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ font: '700 12px var(--head)', color: 'var(--muted)' }}>{initials(name)}</span>
      )}
    </div>
  );
}

function FollowButton({ userId, isFollowing }: { userId: number; isFollowing: boolean }) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      isFollowing
        ? api.delete(`/social/follow/${userId}`)
        : api.post(`/social/follow/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['social', 'discover'] });
      qc.invalidateQueries({ queryKey: ['social', 'following'] });
      qc.invalidateQueries({ queryKey: ['social', 'followers'] });
      qc.invalidateQueries({ queryKey: ['gamification', 'friend-streaks'] });
    },
  });

  return (
    <button
      type="button"
      data-testid="social-follow-btn"
      onClick={(e) => {
        e.stopPropagation();
        if (!mutation.isPending) mutation.mutate();
      }}
      disabled={mutation.isPending}
      aria-pressed={isFollowing}
      aria-label={isFollowing ? 'Unfollow' : 'Follow'}
      className={`ss-btn ${isFollowing ? 'ss-btn-soft' : 'ss-btn-primary'}`}
      style={{ flex: 'none', height: 34, minWidth: 90, padding: '0 14px', fontSize: 12, opacity: mutation.isPending ? 0.6 : 1 }}
    >
      {isFollowing ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Check width={13} height={13} /> Following
        </span>
      ) : (
        'Follow'
      )}
    </button>
  );
}

interface UserRowProps {
  userId: number;
  name: string;
  avatarUrl: string | null;
  meta: string;
  index: number;
  rankNode?: React.ReactNode;
  rightNode?: React.ReactNode;
}

function UserRow({ userId, name, avatarUrl, meta, index, rankNode, rightNode }: UserRowProps) {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      data-testid="social-user-row"
      onClick={() => navigate(`/user/${userId}`)}
      className="ss-surface ss-recess"
      style={{
        borderRadius: 16, padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 12,
        width: '100%', textAlign: 'left', cursor: 'pointer',
      }}
      initial={reduce ? false : { opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.03 + Math.min(index, 12) * 0.035, type: 'spring', stiffness: 240, damping: 26 }}
    >
      {rankNode}
      <Avatar url={avatarUrl} name={name} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ font: '600 13.5px var(--body)', color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
        <p style={{ font: '500 11px var(--mono)', color: 'var(--muted-2)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{meta}</p>
      </div>
      {rightNode ?? <ChevronRight width={16} height={16} style={{ color: 'var(--muted-2)', flex: 'none' }} />}
    </motion.button>
  );
}

function ListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="ss-pad" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SSSkeleton key={i} height={62} style={{ borderRadius: 16 }} />
      ))}
    </div>
  );
}

function errMessage(e: unknown): string | undefined {
  return e instanceof ApiError ? e.message : undefined;
}

/* ---------- Friend-streaks strip (atop Discover) ---------- */

function FriendStreaksStrip() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery<FriendStreaksData>({
    queryKey: ['gamification', 'friend-streaks'],
    queryFn: () => api.get('/gamification/friend-streaks').then((r) => r.data),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
        {[0, 1, 2].map((i) => <SSSkeleton key={i} height={58} style={{ minWidth: 132, borderRadius: 14 }} />)}
      </div>
    );
  }

  const friends = data?.friends_active_today || [];
  const myStreak = data?.my_streak || 0;
  if (friends.length === 0 && myStreak === 0) return null;

  return (
    <section className="ss-rise" aria-label="Friends who ran today">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingLeft: 2 }}>
        <span className="tlbl">Ran in last 24h</span>
        {myStreak > 0 && (
          <span className="ss-dchip warn" style={{ color: 'var(--amber)' }}>
            <Bolt width={11} height={11} /> {myStreak}d you
          </span>
        )}
      </div>
      {friends.length > 0 ? (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
          {friends.map((f) => (
            <button
              key={f.user_id}
              type="button"
              onClick={() => navigate(`/user/${f.user_id}`)}
              className="ss-surface ss-recess"
              style={{ minWidth: 138, borderRadius: 14, padding: '9px 11px', display: 'flex', alignItems: 'center', gap: 9, flex: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <Avatar url={f.profile_image_url} name={f.name} size={32} />
              <div style={{ minWidth: 0 }}>
                <p style={{ font: '600 12px var(--body)', color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</p>
                <p style={{ font: '600 10px var(--mono)', color: 'var(--amber)', marginTop: 1, fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Bolt width={9} height={9} /> {f.streak_days}d streak
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <p style={{ font: '400 11.5px var(--body)', color: 'var(--muted-2)', paddingLeft: 2 }}>
          None of your crew has logged a run today yet.
        </p>
      )}
    </section>
  );
}

/* ---------- Discover tab ---------- */

function DiscoverTab() {
  const { data, isLoading, isError, error, refetch } = useQuery<DiscoverRunner[]>({
    queryKey: ['social', 'discover'],
    queryFn: () => api.get('/social/discover').then((r) => r.data),
  });

  return (
    <div data-testid="social-tab-discover" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <FriendStreaksStrip />

      {isLoading && <ListSkeleton />}
      {isError && <SSError onRetry={() => refetch()} message={errMessage(error)} testid="social-discover-error" />}

      {!isLoading && !isError && (data?.length ?? 0) === 0 && (
        <SSEmpty
          icon={<Bolt width={22} height={22} />}
          title="You're following everyone"
          body="There's no one new to suggest right now. Check back as more runners join the club."
          testid="social-discover-empty"
        />
      )}

      {!isLoading && !isError && (data?.length ?? 0) > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data!.map((u, i) => {
            const exp = titleCase(u.running_experience);
            const runs = Number(u.total_runs) || 0;
            const meta = [
              `Lvl ${u.current_level ?? 1}`,
              `${fmtXp(u.total_xp)} XP`,
              runs > 0 ? `${runs} ${runs === 1 ? 'run' : 'runs'}` : null,
              exp || null,
            ].filter(Boolean).join(' · ');
            return (
              <UserRow
                key={u.id}
                userId={u.id}
                name={u.name}
                avatarUrl={u.profile_image_url}
                meta={meta}
                index={i}
                rightNode={<FollowButton userId={u.id} isFollowing={false} />}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Following / Followers tabs ---------- */

function ConnectionsTab({ kind }: { kind: 'following' | 'followers' }) {
  const { data, isLoading, isError, error, refetch } = useQuery<SocialUser[]>({
    queryKey: ['social', kind],
    queryFn: () => api.get(`/social/${kind}`).then((r) => r.data),
  });

  const empty = kind === 'following'
    ? { title: 'You’re not following anyone yet', body: 'Head to Discover to find runners. Their runs will then show up in your feed.' }
    : { title: 'No followers yet', body: 'Keep logging runs and sharing cards — your crew will grow.' };

  return (
    <div data-testid={`social-tab-${kind}`}>
      {isLoading && <ListSkeleton />}
      {isError && <SSError onRetry={() => refetch()} message={errMessage(error)} testid={`social-${kind}-error`} />}

      {!isLoading && !isError && (data?.length ?? 0) === 0 && (
        <SSEmpty icon={<Flag width={22} height={22} />} title={empty.title} body={empty.body} testid={`social-${kind}-empty`} />
      )}

      {!isLoading && !isError && (data?.length ?? 0) > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data!.map((u, i) => (
            <UserRow
              key={u.id}
              userId={u.id}
              name={u.name}
              avatarUrl={u.profile_image_url}
              meta={`Lvl ${u.current_level ?? 1} · ${fmtXp(u.total_xp)} XP`}
              index={i}
              rightNode={kind === 'following' ? <FollowButton userId={u.id} isFollowing /> : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Leaderboard tab ---------- */

function rankColor(rank: number): string {
  if (rank === 1) return 'var(--amber)';
  if (rank <= 3) return 'var(--accent-2)';
  return 'var(--muted)';
}

function LeaderboardTab() {
  const { data, isLoading, isError, error, refetch } = useQuery<LeaderRow[]>({
    queryKey: ['gamification', 'leaderboard'],
    queryFn: () => api.get('/gamification/leaderboard').then((r) => r.data),
    staleTime: 60_000,
  });

  return (
    <div data-testid="social-tab-leaderboard">
      {isLoading && <ListSkeleton count={8} />}
      {isError && <SSError onRetry={() => refetch()} message={errMessage(error)} testid="social-leaderboard-error" />}

      {!isLoading && !isError && (data?.length ?? 0) === 0 && (
        <SSEmpty
          icon={<Trophy width={22} height={22} />}
          title="The board is empty"
          body="As runners earn XP, the top 50 will be ranked here. Log a run to claim a spot."
          testid="social-leaderboard-empty"
        />
      )}

      {!isLoading && !isError && (data?.length ?? 0) > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data!.map((row, i) => {
            const rank = i + 1;
            return (
              <UserRow
                key={row.user_id}
                userId={row.user_id}
                name={row.name}
                avatarUrl={null}
                meta={`${titleCase(row.tier)} · ${fmtKm(row.total_distance_km)} km · Lvl ${row.current_level}`}
                index={i}
                rankNode={
                  <span
                    aria-label={`Rank ${rank}`}
                    style={{
                      flex: 'none', width: 30, textAlign: 'center',
                      font: '700 15px var(--mono)', fontVariantNumeric: 'tabular-nums',
                      color: rankColor(rank), display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 2,
                    }}
                  >
                    {rank <= 3 ? <Medal width={17} height={17} style={{ color: rankColor(rank) }} /> : rank}
                  </span>
                }
                rightNode={
                  <span style={{ flex: 'none', textAlign: 'right' }}>
                    <span style={{ font: '700 14px var(--mono)', color: 'var(--fg)', fontVariantNumeric: 'tabular-nums', display: 'block' }}>{fmtXp(row.total_xp)}</span>
                    <span className="slbl" style={{ font: '600 9px var(--body)', color: 'var(--muted-2)' }}>XP</span>
                  </span>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Page ---------- */

export function SocialPage() {
  const [tab, setTab] = useState<SocialTab>('feed');

  const onChange = useCallback((k: SocialTab) => setTab(k), []);

  // Feed reuses <FeedPage/> wholesale (it ships its own AppShell + nav). We render the
  // segmented control as a sticky bar above it so the lane switcher stays reachable, and
  // never duplicate the feed's kudos/comment logic.
  if (tab === 'feed') {
    return (
      <div data-testid="social-tab-feed">
        <div
          style={{
            position: 'sticky', top: 'calc(env(safe-area-inset-top, 8px) + 56px)', zIndex: 30,
            maxWidth: 512, margin: '0 auto', padding: '0 16px',
            background: 'linear-gradient(180deg, var(--bg) 70%, transparent)',
            paddingTop: 4, paddingBottom: 6,
          }}
        >
          <SSSeg<SocialTab> items={TABS} value={tab} onChange={onChange} ariaLabel="Social sections" testid="social-tab" />
        </div>
        <FeedPage />
      </div>
    );
  }

  return (
    <AppShell>
      <div style={{ marginBottom: 14 }}>
        <SSSeg<SocialTab> items={TABS} value={tab} onChange={onChange} ariaLabel="Social sections" testid="social-tab" />
      </div>

      {tab === 'discover' && <DiscoverTab />}
      {tab === 'following' && <ConnectionsTab kind="following" />}
      {tab === 'followers' && <ConnectionsTab kind="followers" />}
      {tab === 'leaderboard' && <LeaderboardTab />}
    </AppShell>
  );
}
