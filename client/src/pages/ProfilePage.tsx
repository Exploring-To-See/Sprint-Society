import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { SSScreen } from '../components/ss/SSScreen';
import { SSSkeleton, SSEmpty, SSError } from '../components/ss/SSStates';
import {
  Spark, Bell, Lock, Crown, Camera, Pin, Calendar, ChevronRight, Check, Bolt, Chart, Pulse,
} from '../components/ss/icons';
import type { Achievement, PersonalRecord, UserXP } from '../../../shared/types';

// --- Animations ---
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
};

// Tier → semantic ss-tag recipe (green / orange / amber — same mapping the old page used)
const TIER_TAG: Record<string, string> = {
  beginner: 'go',
  intermediate: 'now',
  advanced: 'maybe',
};

// --- Count-up Hook ---
function useCountUp(target: number, duration = 1200, enabled = true): number {
  const [value, setValue] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || target === 0) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        ref.current = requestAnimationFrame(animate);
      }
    };
    ref.current = requestAnimationFrame(animate);
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, [target, duration, enabled]);

  return value;
}

// --- Helpers ---
function formatPace(seconds: number): string {
  if (!seconds || seconds <= 0) return '--:--';
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

// Section head — matches the reference sechead (caps label + optional action link)
function SecHead({ label, action, onAction }: { label: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-baseline justify-between" style={{ margin: '0 0 9px' }}>
      <span style={{ font: '600 var(--lbl) var(--body)', textTransform: 'uppercase', letterSpacing: 'var(--trk-sm)', color: 'var(--muted)' }}>
        {label}
      </span>
      {action && (
        <button
          onClick={onAction}
          style={{ font: '600 11px var(--body)', color: 'var(--violet-2)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
        >
          {action}
          <ChevronRight width={12} height={12} />
        </button>
      )}
    </div>
  );
}

// --- Components ---

function CountUpStat({ label, value, unit, accent }: { label: string; value: number; unit?: string; accent?: boolean }) {
  const animated = useCountUp(value);
  return (
    <div className="flex-1 text-center" style={{ padding: '12px 4px' }}>
      <div className="flex items-baseline justify-center" style={{ gap: 2 }}>
        <span className="num" style={{ font: '700 20px var(--mono)', color: accent ? 'var(--accent-2)' : 'var(--fg)' }}>
          {animated}
        </span>
        {unit && <span style={{ font: '500 10px var(--mono)', color: 'var(--muted-2)' }}>{unit}</span>}
      </div>
      <p style={{ font: '600 var(--lbl) var(--body)', textTransform: 'uppercase', letterSpacing: 'var(--trk-sm)', color: 'var(--muted-2)', marginTop: 5 }}>{label}</p>
    </div>
  );
}

function KenduBalanceCard() {
  const { data: kendu } = useQuery({
    queryKey: ['kendu-balance'],
    queryFn: () => api.get('/kendu/balance').then(r => r.data).catch(() => null),
  });
  const navigate = useNavigate();

  if (!kendu) return null;

  return (
    <motion.div variants={fadeUp}>
      <button
        onClick={() => navigate('/rewards')}
        className="tile recess w-full"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: '14px 15px', cursor: 'pointer', textAlign: 'left' }}
        data-testid="profile-kendu"
      >
        <span style={{ width: 38, height: 38, borderRadius: 11, flex: 'none', display: 'grid', placeItems: 'center', background: 'rgba(249,115,22,.14)', border: '1px solid rgba(249,115,22,.28)' }}>
          <Bolt width={17} height={17} style={{ color: 'var(--accent-2)' }} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="num" style={{ font: '700 var(--m-lg) var(--mono)', lineHeight: 1, display: 'flex', alignItems: 'baseline', gap: 5 }}>
            {kendu.spendable_balance || 0}
            <small style={{ font: '600 10px var(--body)', textTransform: 'uppercase', letterSpacing: 'var(--trk-sm)', color: 'var(--accent-2)' }}>Kendu</small>
          </div>
          <div className="num" style={{ font: '500 10.5px var(--mono)', color: 'var(--muted-2)', marginTop: 3 }}>
            Earned {kendu.lifetime_earned || 0} · Spent {(kendu.lifetime_earned || 0) - (kendu.spendable_balance || 0)}
          </div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, font: '600 10.5px var(--body)', color: 'var(--violet-2)' }}>
          History <ChevronRight width={12} height={12} />
        </span>
      </button>
    </motion.div>
  );
}

function RunningDNACard({ dna, tier }: { dna: any; tier: string }) {
  const tagCls = TIER_TAG[tier] || 'go';

  return (
    <motion.div variants={fadeUp} className="tile" style={{ padding: '16px 14px' }}>
      <div className="thead" style={{ marginBottom: 12 }}>
        <span className="ticon">
          <Spark width={13} height={13} style={{ color: 'var(--violet-2)' }} />
        </span>
        <span className="tlbl">Running DNA</span>
        <span className={`ss-tag ${tagCls}`} style={{ marginLeft: 'auto', textTransform: 'capitalize' }}>{tier}</span>
      </div>

      {dna?.estimated_vo2max && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ flex: 'none' }}>
            <p className="num" style={{ font: '700 42px var(--mono)', lineHeight: 1, color: 'var(--fg)', margin: 0 }}>
              {dna.estimated_vo2max}
            </p>
            <div style={{ font: '600 var(--lbl) var(--body)', textTransform: 'uppercase', letterSpacing: 'var(--trk-sm)', color: 'var(--muted-2)', marginTop: 5 }}>
              VO₂ Max
            </div>
          </div>
          {dna.pace_zones && (
            <div style={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { label: 'Easy', value: dna.pace_zones.easy, color: 'var(--green)' },
                { label: 'Tempo', value: dna.pace_zones.tempo, color: 'var(--amber)' },
                { label: 'Interval', value: dna.pace_zones.interval, color: 'var(--accent-2)' },
                { label: 'Race', value: dna.pace_zones.race, color: 'var(--fg)' },
              ].map(z => (
                <div key={z.label} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '7px 9px', borderRadius: 9, background: 'rgba(255,255,255,.04)', border: '1px solid var(--hair)' }}>
                  <span style={{ font: '500 10px var(--body)', color: 'var(--muted-2)' }}>{z.label}</span>
                  <span className="num" style={{ font: '700 11px var(--mono)', color: z.color }}>{z.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {dna?.personality_tags && dna.personality_tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          {dna.personality_tags.slice(0, 5).map((tag: string) => (
            <span key={tag} className="ss-dchip neutral">{tag}</span>
          ))}
        </div>
      )}

      {dna?.ai_coach_name && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--hair)' }}>
          <span style={{ font: '500 10px var(--body)', color: 'var(--muted-2)' }}>Coach</span>
          <span style={{ font: '600 11.5px var(--body)', color: 'var(--accent-2)' }}>{dna.ai_coach_name}</span>
        </div>
      )}
    </motion.div>
  );
}

function PRBoard({ records }: { records: any }) {
  const navigate = useNavigate();
  const racePRs: PersonalRecord[] = records?.race_prs || [];

  const prMap: Record<string, PersonalRecord | undefined> = {
    '5K': racePRs.find(r => r.category === '5k' || r.distance_meters === 5000),
    '10K': racePRs.find(r => r.category === '10k' || r.distance_meters === 10000),
    'Half': racePRs.find(r => r.category === 'half_marathon' || r.distance_meters === 21097),
    'Marathon': racePRs.find(r => r.category === 'marathon' || r.distance_meters === 42195),
  };

  return (
    <motion.div variants={fadeUp}>
      <SecHead label="Personal records" action="See all" onAction={() => navigate('/records')} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap)' }}>
        {Object.entries(prMap).map(([label, pr]) => (
          <div key={label} className="tile recess" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '12px 13px' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ font: '500 10px var(--body)', color: 'var(--muted-2)' }}>{label}</div>
              <div className="num" style={{ font: '700 15px var(--mono)', color: 'var(--fg)', marginTop: 3 }}>
                {pr ? pr.formatted : '--:--'}
              </div>
            </div>
            {pr?.improvement && pr.improvement.percent > 0 && (
              <span className="ss-dchip good">{pr.improvement.percent.toFixed(1)}%</span>
            )}
            {!pr && (
              <span style={{ font: '500 9px var(--mono)', color: 'var(--muted-2)', whiteSpace: 'nowrap' }}>No data</span>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function AchievementShowcase({ achievements }: { achievements: Achievement[] }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { data: badgeCollection } = useQuery({
    queryKey: ['badge-collection'],
    queryFn: () => api.get('/gamification/badge-collection').then(r => r.data).catch(() => null),
  });

  if (!badgeCollection && (!achievements || achievements.length === 0)) return null;

  const categories = badgeCollection?.categories || {};
  const categoryNames = Object.keys(categories);
  const displayCategory = activeCategory || categoryNames[0] || 'running';
  const badges = categories[displayCategory] || [];
  const summary = badgeCollection?.summary;

  return (
    <motion.div variants={fadeUp}>
      <div className="flex items-baseline justify-between" style={{ margin: '0 0 9px' }}>
        <span style={{ font: '600 var(--lbl) var(--body)', textTransform: 'uppercase', letterSpacing: 'var(--trk-sm)', color: 'var(--muted)' }}>
          Badge collection
        </span>
        {summary && (
          <span className="num" style={{ font: '600 10px var(--mono)', color: 'var(--muted-2)' }}>
            {summary.earned}/{summary.total} ({summary.completion_percent}%)
          </span>
        )}
      </div>

      {/* Category tabs */}
      {categoryNames.length > 0 && (
        <div className="flex overflow-x-auto" style={{ gap: 6, paddingBottom: 8, scrollbarWidth: 'none' }}>
          {categoryNames.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`ss-tab ${displayCategory === cat ? 'on' : ''}`}
              style={{ textTransform: 'capitalize' }}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      )}

      {/* Badge grid — badge.icon is server data (the badge artwork), not decorative UI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8 }}>
        {badges.map((badge: any) => (
          <div
            key={badge.id}
            className="tile recess"
            style={{ alignItems: 'center', gap: 4, padding: '10px 6px', opacity: badge.earned ? 1 : 0.4 }}
          >
            <span style={{ fontSize: 20, filter: badge.earned ? 'none' : 'grayscale(1)' }}>{badge.icon}</span>
            <span style={{ font: '500 7.5px var(--body)', color: 'var(--muted-2)', textAlign: 'center', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '100%' }}>
              {badge.name}
            </span>
            {badge.is_rare && badge.earned && (
              <span className="ss-prtag" style={{ position: 'absolute', top: 4, right: 4, fontSize: 7 }}>Rare</span>
            )}
            {badge.earned && (
              <span className="num" style={{ font: '500 7px var(--mono)', color: 'var(--muted-2)' }}>{badge.rarity_percent}% have this</span>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function CommunitiesList({ communities }: { communities: { id: number; name: string; category: string }[] }) {
  const navigate = useNavigate();
  if (!communities || communities.length === 0) return null;

  return (
    <motion.div variants={fadeUp}>
      <SecHead label="Communities" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {communities.map((c) => (
          <button key={c.id} onClick={() => navigate(`/communities/${c.id}`)} className="ss-qchip">
            <span>{c.name}</span>
            <span style={{ font: '500 10.5px var(--body)', color: 'var(--muted-2)', textTransform: 'capitalize' }}>
              {c.category.replace('_', ' ')}
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// Settings row — the reference .set-row recipe as a React atom
function SetRow({ icon, title, sub, onClick, trailing }: {
  icon: React.ReactNode; title: string; sub?: string; onClick?: () => void; trailing?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full"
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '13px 4px', width: '100%',
        textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid var(--hair)',
        color: 'inherit', fontFamily: 'inherit', cursor: 'pointer',
      }}
    >
      <span style={{ width: 30, height: 30, borderRadius: 9, flex: 'none', display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.05)', border: '1px solid var(--hair)' }}>
        {icon}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', font: '600 13px var(--body)', color: 'var(--fg)' }}>{title}</span>
        {sub && <span style={{ display: 'block', font: '500 10.5px var(--body)', color: 'var(--muted-2)', marginTop: 2 }}>{sub}</span>}
      </span>
      {trailing}
      <ChevronRight width={15} height={15} style={{ color: 'var(--muted-2)', flex: 'none' }} />
    </button>
  );
}

const COACHES = [
  { name: 'The Scientist', vibe: 'Data-driven. Logical.' },
  { name: 'The Energizer', vibe: 'Fun. Lively. Action.' },
  { name: 'The Warrior', vibe: 'No excuses. Grind.' },
  { name: 'The Sage', vibe: 'Patient. Wise. Recovery.' },
];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 12px', borderRadius: 11,
  background: 'rgba(255,255,255,.04)', border: '1px solid var(--hair)',
  font: '500 13px var(--body)', color: 'var(--fg)', outline: 'none',
};

function SettingsSection() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [showCoachPicker, setShowCoachPicker] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: dnaProfile } = useQuery({
    queryKey: ['profiling-dna'],
    queryFn: () => api.get('/profiling/dna').then(r => r.data).catch(() => null),
  });

  const coachMutation = useMutation({
    mutationFn: (coachName: string) => api.put('/profiling/coach', { ai_coach_name: coachName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiling-dna'] });
      setShowCoachPicker(false);
    },
  });

  const handleChangePassword = async () => {
    setLoading(true);
    setPasswordErr('');
    setPasswordMsg('');
    try {
      const { data } = await api.put('/auth/change-password', { currentPassword, newPassword });
      setPasswordMsg(data.message || 'Password updated');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setShowPassword(false), 2000);
    } catch (err: any) {
      setPasswordErr(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div variants={fadeUp}>
      <SecHead label="Settings" />
      <div className="tile recess" style={{ padding: '2px 13px' }}>

        {/* AI Coach picker */}
        {!showCoachPicker ? (
          <SetRow
            icon={<Spark width={15} height={15} style={{ color: 'var(--violet-2)' }} />}
            title="AI Coach"
            sub={dnaProfile?.ai_coach_name || 'Not assigned'}
            onClick={() => setShowCoachPicker(true)}
          />
        ) : (
          <div style={{ padding: '13px 4px', borderBottom: '1px solid var(--hair)' }}>
            <p style={{ font: '600 var(--lbl) var(--body)', textTransform: 'uppercase', letterSpacing: 'var(--trk-sm)', color: 'var(--muted)', marginBottom: 9 }}>
              Choose your coach
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {COACHES.map(c => {
                const selected = dnaProfile?.ai_coach_name === c.name;
                return (
                  <button
                    key={c.name}
                    onClick={() => coachMutation.mutate(c.name)}
                    disabled={coachMutation.isPending}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 11px', borderRadius: 11,
                      background: selected ? 'rgba(249,115,22,.1)' : 'rgba(255,255,255,.03)',
                      border: `1px solid ${selected ? 'rgba(249,115,22,.3)' : 'var(--hair)'}`,
                      cursor: 'pointer', textAlign: 'left', color: 'inherit', fontFamily: 'inherit',
                      opacity: coachMutation.isPending ? 0.6 : 1,
                    }}
                  >
                    <Spark width={14} height={14} style={{ color: selected ? 'var(--accent-2)' : 'var(--violet-2)', flex: 'none' }} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', font: '600 12.5px var(--body)', color: 'var(--fg)' }}>{c.name}</span>
                      <span style={{ display: 'block', font: '500 10.5px var(--body)', color: 'var(--muted-2)', marginTop: 1 }}>{c.vibe}</span>
                    </span>
                    {selected && <Check width={13} height={13} style={{ color: 'var(--accent-2)', flex: 'none' }} />}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowCoachPicker(false)}
              style={{ font: '600 11px var(--body)', color: 'var(--muted-2)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 9 }}
            >
              Cancel
            </button>
          </div>
        )}

        <SetRow
          icon={<Bell width={15} height={15} style={{ color: 'var(--muted)' }} />}
          title="Notifications"
          onClick={() => navigate('/notifications')}
        />

        <SetRow
          icon={<Crown width={15} height={15} style={{ color: 'var(--amber)' }} />}
          title="Subscription"
          onClick={() => navigate('/subscription')}
        />

        <SetRow
          icon={<Chart width={15} height={15} style={{ color: 'var(--muted)' }} />}
          title="Progress & Journey"
          onClick={() => navigate('/progress')}
        />

        <SetRow
          icon={<Pulse width={15} height={15} style={{ color: 'var(--muted)' }} />}
          title="Heart Rate Zones"
          onClick={() => navigate('/heart-rate')}
        />

        {/* Change password */}
        {!showPassword ? (
          <SetRow
            icon={<Lock width={15} height={15} style={{ color: 'var(--muted)' }} />}
            title="Change Password"
            onClick={() => setShowPassword(true)}
          />
        ) : (
          <div style={{ padding: '13px 4px', borderBottom: '1px solid var(--hair)', display: 'flex', flexDirection: 'column', gap: 9 }}>
            <input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="New password (6+ chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={inputStyle}
            />
            {passwordErr && <p style={{ font: '500 11px var(--body)', color: 'var(--amber)' }}>{passwordErr}</p>}
            {passwordMsg && <p style={{ font: '500 11px var(--body)', color: 'var(--green)' }}>{passwordMsg}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="ss-btn ss-btn-primary"
                style={{ height: 40, fontSize: 13, flex: 1 }}
                onClick={handleChangePassword}
                disabled={!currentPassword || newPassword.length < 6 || loading}
              >
                {loading ? 'Saving…' : 'Update'}
              </button>
              <button
                className="ss-btn ss-btn-soft"
                style={{ height: 40, fontSize: 13, flex: 1 }}
                onClick={() => setShowPassword(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Logout */}
        <SetRow
          icon={<Lock width={15} height={15} style={{ color: 'var(--amber)' }} />}
          title="Log Out"
          onClick={logout}
        />
      </div>
    </motion.div>
  );
}

// --- XP History (last 50 xp_transactions from GET /gamification/history) ---

interface XpTransaction {
  id: number;
  amount: number;
  source: string;
  description: string | null;
  created_at: string;
}

// Humanize the machine `source` (e.g. "run_completed" → "Run completed") so a row
// always has a readable label even when `description` is empty.
function humanizeSource(source: string): string {
  if (!source) return 'XP earned';
  return source
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatXpDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function XpHistorySection() {
  const { data, isLoading, isError, refetch } = useQuery<XpTransaction[]>({
    queryKey: ['xp-history'],
    queryFn: () => api.get('/gamification/history').then((r) => r.data),
  });

  return (
    <motion.div variants={fadeUp} className="space-y-2" data-testid="profile-xp-history">
      <SecHead label="XP History" />

      {isLoading && (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <SSSkeleton key={i} height={52} style={{ borderRadius: 14 }} />
          ))}
        </div>
      )}

      {!isLoading && isError && (
        <SSError onRetry={() => refetch()} message="We couldn’t load your XP history just now." testid="profile-xp-history-error" />
      )}

      {!isLoading && !isError && (!data || data.length === 0) && (
        <SSEmpty
          icon={<Spark width={22} height={22} />}
          title="No XP yet"
          body="Log a run or unlock an achievement and your XP will start stacking up here."
          testid="profile-xp-history-empty"
        />
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <div className="ss-surface ss-recess ss-rise" style={{ borderRadius: 16, overflow: 'hidden' }}>
          {data.map((tx, i) => {
            const label = tx.description?.trim() || humanizeSource(tx.source);
            const positive = tx.amount >= 0;
            return (
              <div
                key={tx.id}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5"
                style={{ borderTop: i === 0 ? 'none' : '1px solid var(--hair)' }}
              >
                <div className="min-w-0">
                  <p style={{ font: '600 12.5px var(--body)', color: 'var(--fg)' }} className="truncate">
                    {label}
                  </p>
                  <p style={{ font: '500 10px var(--mono)', color: 'var(--muted-2)', marginTop: 2 }}>
                    {humanizeSource(tx.source)} · {formatXpDate(tx.created_at)}
                  </p>
                </div>
                <span
                  className="flex-none"
                  style={{
                    font: '700 12.5px var(--mono)',
                    fontVariantNumeric: 'tabular-nums',
                    color: positive ? 'var(--green)' : 'var(--amber)',
                  }}
                >
                  {positive ? '+' : ''}{tx.amount} XP
                </span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// --- Main Profile Page ---

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch own profile using user id
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['my-profile', (user as any)?.id],
    queryFn: () => api.get(`/profile/${(user as any)?.id}`).then(r => r.data),
    enabled: !!(user as any)?.id,
  });

  // Fetch AI profiling DNA
  const { data: dna } = useQuery({
    queryKey: ['profiling-dna'],
    queryFn: () => api.get('/profiling/dna').then(r => r.data).catch(() => null),
  });

  // Fetch XP / gamification
  const { data: xp } = useQuery<UserXP>({
    queryKey: ['xp'],
    queryFn: () => api.get('/gamification/xp').then(r => r.data),
  });

  // Fetch records
  const { data: records } = useQuery({
    queryKey: ['records'],
    queryFn: () => api.get('/records').then(r => r.data).catch(() => null),
  });

  // Fetch achievements
  const { data: achievements } = useQuery<Achievement[]>({
    queryKey: ['achievements'],
    queryFn: () => api.get('/gamification/achievements').then(r => r.data).catch(() => []),
  });

  // Fetch run stats
  const { data: stats } = useQuery({
    queryKey: ['run-stats'],
    queryFn: () => api.get('/runs/stats').then(r => r.data).catch(() => null),
  });

  // Communities come from the profile query response

  if (profileLoading) {
    return (
      <SSScreen bodyLabel="Profile">
        <div className="pad" style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <SSSkeleton height={64} style={{ width: 64, borderRadius: '50%' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SSSkeleton height={18} style={{ width: 140 }} />
              <SSSkeleton height={12} style={{ width: 90 }} />
            </div>
          </div>
          <SSSkeleton height={160} style={{ borderRadius: 18 }} />
          <SSSkeleton height={72} style={{ borderRadius: 18 }} />
          <SSSkeleton height={120} style={{ borderRadius: 18 }} />
        </div>
      </SSScreen>
    );
  }

  const currentTier: string = profile?.current_tier || dna?.tier || 'beginner';
  const tierTag = TIER_TAG[currentTier] || 'go';
  const totalKm = stats?.total_distance ? Math.round(stats.total_distance / 1000) : (profile?.total_distance_km || 0);
  const avgPace = stats?.avg_pace || 0;
  const consistencyPercent = stats?.consistency_percent || 0;
  const longestStreak = xp?.longest_streak_days || 0;
  const currentLevel = xp?.current_level || 1;
  const memberSince = profile?.created_at || profile?.joined_at || (user as any)?.created_at;

  return (
    <SSScreen bodyLabel="Profile">
      <motion.div variants={stagger} initial="hidden" animate="show" className="pad" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 6, paddingBottom: 24 }}>

        {/* === HEADER === */}
        <motion.div variants={fadeUp} className="tile" style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: '16px 14px' }}>
          {/* Avatar — tappable to upload photo */}
          <label
            style={{
              position: 'relative', width: 64, height: 64, borderRadius: '50%', flex: 'none', overflow: 'hidden',
              display: 'grid', placeItems: 'center', cursor: 'pointer',
              background: 'linear-gradient(135deg,var(--accent),var(--violet))',
              border: '1px solid var(--hair)',
            }}
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              data-testid="profile-photo-input"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  // Downscale on-device: phone camera shots are 3-8MB and were
                  // rejected outright by the old 2MB check. 512px JPEG lands
                  // around 40-120KB — no rejection path needed at all.
                  const dataUrl = await new Promise<string>((resolve, reject) => {
                    const img = new Image();
                    const url = URL.createObjectURL(file);
                    img.onload = () => {
                      const side = Math.min(img.width, img.height);
                      const target = 512;
                      const canvas = document.createElement('canvas');
                      canvas.width = target; canvas.height = target;
                      const ctx = canvas.getContext('2d')!;
                      // Center-crop to square, then scale.
                      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, target, target);
                      URL.revokeObjectURL(url);
                      resolve(canvas.toDataURL('image/jpeg', 0.85));
                    };
                    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('unreadable image')); };
                    img.src = url;
                  });
                  await api.patch('/profile/photo', { photo: dataUrl });
                  queryClient.invalidateQueries({ queryKey: ['my-profile'] });
                  // Topbar avatar renders from AuthContext — refresh it too.
                  refreshUser();
                } catch (err) {
                  alert(err instanceof Error && err.message !== 'unreadable image' ? err.message : 'Could not use that image — try another photo.');
                }
                e.target.value = '';
              }}
            />
            {(profile?.profile_image_url || (user as any)?.profile_image_url) ? (
              <img
                src={profile?.profile_image_url || (user as any)?.profile_image_url}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ font: '700 22px var(--head)', color: '#fff' }}>
                {(profile?.name || user?.name)?.[0]?.toUpperCase() || '?'}
              </span>
            )}
            {/* Always-visible camera chip — the old hover-only overlay was
                invisible on touch screens, so nobody knew the avatar was tappable. */}
            <div
              style={{
                position: 'absolute', right: -1, bottom: -1, width: 22, height: 22, borderRadius: '50%',
                display: 'grid', placeItems: 'center', background: 'var(--accent)',
                border: '2px solid var(--bg, #0B0A16)', boxShadow: '0 2px 6px rgba(0,0,0,.4)',
              }}
            >
              <Camera width={11} height={11} style={{ color: '#fff' }} />
            </div>
          </label>

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ font: '600 var(--m-lg) var(--head)', letterSpacing: '-.02em', color: 'var(--fg)', margin: '0 0 5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile?.name || user?.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
              <span className={`ss-tag ${tierTag}`} style={{ textTransform: 'capitalize' }}>{currentTier}</span>
              <span className="num" style={{ font: '600 10px var(--mono)', color: 'var(--muted-2)' }}>L{currentLevel}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 7 }}>
              {profile?.city && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: '500 10.5px var(--body)', color: 'var(--muted-2)', whiteSpace: 'nowrap' }}>
                  <Pin width={11} height={11} />
                  {profile.city}
                </span>
              )}
              {memberSince && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: '500 10.5px var(--body)', color: 'var(--muted-2)', whiteSpace: 'nowrap' }}>
                  <Calendar width={11} height={11} />
                  Since {new Date(memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* === RUNNING DNA CARD === */}
        {(dna || currentTier) && (
          <RunningDNACard dna={dna} tier={currentTier} />
        )}

        {/* === KENDU BALANCE (only place it shows outside of earn) === */}
        <KenduBalanceCard />

        {/* === STATS SECTION (count-up) === */}
        <motion.div variants={fadeUp} className="tile recess" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <CountUpStat label="Total KM" value={totalKm} unit="km" />
            <div style={{ borderLeft: '1px solid var(--hair)', borderRight: '1px solid var(--hair)' }}>
              <CountUpStat label="Level" value={currentLevel} accent />
            </div>
            <CountUpStat label="Streak" value={xp?.current_streak_days || 0} unit="d" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1px solid var(--hair)' }}>
            <div className="text-center" style={{ padding: '12px 4px' }}>
              <span className="num" style={{ font: '700 20px var(--mono)', color: 'var(--fg)' }}>
                {avgPace ? formatPace(avgPace) : '--:--'}
              </span>
              <p style={{ font: '600 var(--lbl) var(--body)', textTransform: 'uppercase', letterSpacing: 'var(--trk-sm)', color: 'var(--muted-2)', marginTop: 5 }}>Avg Pace</p>
            </div>
            <div style={{ borderLeft: '1px solid var(--hair)', borderRight: '1px solid var(--hair)' }}>
              <CountUpStat label="Consistency" value={consistencyPercent} unit="%" />
            </div>
            <CountUpStat label="Best Streak" value={longestStreak} unit="d" />
          </div>
        </motion.div>

        {/* === PERSONAL RECORDS === */}
        {records && <PRBoard records={records} />}

        {/* === AI PROFILE — one profile: the DNA card above shows it, this
              single action re-runs the wizard. (The old separate /ai-profile
              page is folded in here.) === */}
        <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={() => navigate('/profiling')}
            className="tile w-full"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: '13px 14px', cursor: 'pointer', textAlign: 'left' }}
            data-testid="profile-update-ai"
          >
            <span style={{ width: 32, height: 32, borderRadius: 10, flex: 'none', display: 'grid', placeItems: 'center', background: 'rgba(124,107,240,.16)', border: '1px solid rgba(124,107,240,.28)' }}>
              <Spark width={15} height={15} style={{ color: 'var(--violet-2)' }} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', font: '600 13px var(--body)', color: 'var(--fg)' }}>Update AI Profile</span>
              <span style={{ display: 'block', font: '500 10.5px var(--body)', color: 'var(--muted-2)', marginTop: 2 }}>Re-analyze your running DNA</span>
            </span>
            <ChevronRight width={15} height={15} style={{ color: 'var(--violet-2)', flex: 'none' }} />
          </button>
        </motion.div>

        {/* === ACHIEVEMENTS SHOWCASE === */}
        {achievements && achievements.length > 0 && (
          <AchievementShowcase achievements={achievements} />
        )}

        {/* === XP HISTORY === */}
        <XpHistorySection />

        {/* === COMMUNITIES === */}
        <CommunitiesList communities={profile?.communities || []} />

        {/* === SETTINGS === */}
        <SettingsSection />

        {/* Footer */}
        <p style={{ textAlign: 'center', font: '500 10px var(--body)', color: 'var(--muted-2)', opacity: 0.6, margin: '10px 0 4px' }}>
          Sprint Society v1.0 — Kendu Entertainment
        </p>
      </motion.div>
    </SSScreen>
  );
}
