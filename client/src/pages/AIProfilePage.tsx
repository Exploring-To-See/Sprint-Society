import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { SSScreen } from '../components/ss/SSScreen';
import { SSSkeleton, SSEmpty, SSError } from '../components/ss/SSStates';
import { Spark } from '../components/ss/icons';

// --- Animations ---
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
};

// --- Types ---
interface AIProfile {
  user: {
    name: string;
    tier: string;
    vdot: number | null;
    fitness_level: string;
    experience: string;
  };
  health_notes: string[];
  goals: string[];
  diet_preferences: string[];
  personal_context: string[];
  conversation_insights: string[];
  running_profile: {
    weekly_km: number;
    preferred_distance: string;
    pace_zone: string;
  } | null;
  updated_at: string;
  usage_stats: {
    today: { used: number; limit: number };
    total_messages: number;
    total_tokens: number;
  };
}

const TIER_COLOR: Record<string, string> = {
  advanced: 'var(--amber)',
  intermediate: 'var(--accent-2)',
  beginner: 'var(--green)',
};

const sectionLabel: React.CSSProperties = {
  font: '600 var(--lbl) var(--mono)', textTransform: 'uppercase',
  letterSpacing: 'var(--trk-sm)', color: 'var(--muted)', margin: '0 0 11px',
};

const kStyle: React.CSSProperties = { font: '500 10.5px var(--body)', color: 'var(--muted-2)', margin: 0 };
const vStyle: React.CSSProperties = { font: '600 13px var(--body)', color: 'var(--fg)', margin: '2px 0 0' };

const inputStyle: React.CSSProperties = {
  flex: 1, minWidth: 0, padding: '10px 12px', borderRadius: 11,
  background: 'rgba(255,255,255,.04)', border: '1px solid var(--hair)',
  font: '500 13px var(--body)', color: 'var(--fg)', outline: 'none',
};

// --- Editable List Component ---
function EditableList({
  title,
  items,
  field,
  onSave,
  saving,
  placeholder,
}: {
  title: string;
  items: string[];
  field: string;
  onSave: (field: string, value: string[]) => void;
  saving: boolean;
  placeholder: string;
}) {
  const [localItems, setLocalItems] = useState<string[]>(items);
  const [newItem, setNewItem] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const handleAdd = () => {
    if (!newItem.trim()) return;
    const updated = [...localItems, newItem.trim()];
    setLocalItems(updated);
    setNewItem('');
    onSave(field, updated);
  };

  const handleRemove = (index: number) => {
    const updated = localItems.filter((_, i) => i !== index);
    setLocalItems(updated);
    onSave(field, updated);
  };

  return (
    <motion.div variants={fadeUp} className="tile" style={{ padding: '14px 15px' }}>
      <h3 style={sectionLabel}>{title}</h3>

      {localItems.length === 0 && !editing && (
        <p style={{ font: '400 12.5px var(--body)', color: 'var(--muted-2)', fontStyle: 'italic', margin: '0 0 10px' }}>
          No items yet. Tap edit to add.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: localItems.length > 0 ? 10 : 0 }}>
        {localItems.map((item, i) => (
          <div
            key={`${field}-${i}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '9px 12px', borderRadius: 11, background: 'rgba(255,255,255,.04)', border: '1px solid var(--hair)' }}
          >
            <span style={{ font: '500 12.5px var(--body)', color: 'var(--fg)', flex: 1, minWidth: 0 }}>{item}</span>
            {editing && (
              <button
                onClick={() => handleRemove(i)}
                aria-label={`Remove ${item}`}
                style={{ font: '500 16px var(--body)', lineHeight: 1, color: 'var(--muted-2)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', flex: 'none' }}
              >
                &times;
              </button>
            )}
          </div>
        ))}
      </div>

      {editing && (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={placeholder}
            style={inputStyle}
          />
          <button
            className="ss-btn ss-btn-primary"
            style={{ height: 40, fontSize: 12.5, flex: 'none', padding: '0 16px' }}
            onClick={handleAdd}
            disabled={!newItem.trim() || saving}
          >
            Add
          </button>
        </div>
      )}

      <button
        onClick={() => setEditing(!editing)}
        style={{ font: '600 11.5px var(--body)', color: 'var(--accent-2)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 10, padding: 0 }}
      >
        {editing ? 'Done' : 'Edit'}
      </button>
    </motion.div>
  );
}

// --- Main Page ---
export function AIProfilePage() {
  const [profile, setProfile] = useState<AIProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/ai/profile');
      setProfile(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load AI profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (field: string, value: string[]) => {
    try {
      setSaving(true);
      await api.patch('/ai/profile', { field, value });
      // Update local state
      if (profile) {
        setProfile({ ...profile, [field]: value });
      }
    } catch (err: any) {
      // Revert on error - refetch
      fetchProfile();
    } finally {
      setSaving(false);
    }
  };

  // --- Loading State ---
  if (loading) {
    return (
      <SSScreen bodyLabel="AI profile">
        <div className="pad" style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 10 }}>
          <SSSkeleton height={32} style={{ width: 220, borderRadius: 10 }} />
          <SSSkeleton height={128} style={{ borderRadius: 18 }} />
          <SSSkeleton height={96} style={{ borderRadius: 18 }} />
          <SSSkeleton height={96} style={{ borderRadius: 18 }} />
          <SSSkeleton height={96} style={{ borderRadius: 18 }} />
        </div>
      </SSScreen>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <SSScreen bodyLabel="AI profile">
        <div className="pad" style={{ paddingTop: 40 }}>
          <SSError onRetry={fetchProfile} message={error} testid="ai-profile-error" />
        </div>
      </SSScreen>
    );
  }

  // --- Empty / First-time State ---
  if (!profile) {
    return (
      <SSScreen bodyLabel="AI profile">
        <div className="pad" style={{ paddingTop: 40 }}>
          <SSEmpty
            icon={<Spark width={22} height={22} />}
            title="No AI Profile Yet"
            body="Start chatting with your AI coach to build your profile. The more you talk, the more personalized your coaching becomes."
            testid="ai-profile-empty"
          />
          <button
            className="ss-btn ss-btn-primary"
            style={{ height: 46, fontSize: 14, width: '100%', marginTop: 14 }}
            onClick={() => { window.location.href = '/coaching'; }}
          >
            Start Coaching
          </button>
        </div>
      </SSScreen>
    );
  }

  const { usage_stats } = profile;
  const usagePercent = usage_stats?.today
    ? Math.min((usage_stats.today.used / usage_stats.today.limit) * 100, 100)
    : 0;

  return (
    <SSScreen bodyLabel="What your AI coach knows">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="pad"
        style={{ display: 'flex', flexDirection: 'column', gap: 13, paddingTop: 6, paddingBottom: 24 }}
      >
        {/* Header — violet = the AI signal */}
        <motion.div variants={fadeUp} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 40, height: 40, borderRadius: 12, flex: 'none', display: 'grid', placeItems: 'center', background: 'rgba(124,107,240,.16)', border: '1px solid rgba(124,107,240,.28)' }}>
            <Spark width={18} height={18} style={{ color: 'var(--violet-2)' }} />
          </span>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ font: '600 var(--m-lg) var(--head)', letterSpacing: '-.02em', color: 'var(--fg)', margin: 0 }}>
              What Your AI Coach Knows
            </h1>
            <p style={{ font: '400 11px var(--body)', color: 'var(--muted-2)', marginTop: 2 }}>
              Last updated {profile.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'never'}
            </p>
          </div>
        </motion.div>

        {/* Section 1: Runner Summary */}
        <motion.div variants={fadeUp} className="tile" style={{ padding: '14px 15px' }}>
          <h3 style={sectionLabel}>Runner Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
            <div>
              <p style={kStyle}>Name</p>
              <p style={vStyle}>{profile.user?.name || 'Unknown'}</p>
            </div>
            <div>
              <p style={kStyle}>Tier</p>
              <p style={{ ...vStyle, textTransform: 'capitalize', color: TIER_COLOR[profile.user?.tier?.toLowerCase()] || 'var(--fg)' }}>
                {profile.user?.tier || 'Unclassified'}
              </p>
            </div>
            <div>
              <p style={kStyle}>VDOT</p>
              <p className="num" style={{ ...vStyle, font: '700 13px var(--mono)' }}>{profile.user?.vdot || '--'}</p>
            </div>
            <div>
              <p style={kStyle}>Fitness Level</p>
              <p style={{ ...vStyle, textTransform: 'capitalize' }}>{profile.user?.fitness_level || '--'}</p>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <p style={kStyle}>Experience</p>
              <p style={vStyle}>{profile.user?.experience || '--'}</p>
            </div>
          </div>
          {profile.running_profile && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--hair)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <div>
                <p style={kStyle}>Weekly</p>
                <p className="num" style={{ ...vStyle, font: '700 13px var(--mono)' }}>{profile.running_profile.weekly_km} km</p>
              </div>
              <div>
                <p style={kStyle}>Preferred</p>
                <p style={vStyle}>{profile.running_profile.preferred_distance}</p>
              </div>
              <div>
                <p style={kStyle}>Pace Zone</p>
                <p style={vStyle}>{profile.running_profile.pace_zone}</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Sections 2–5: editable lists */}
        <EditableList
          title="Health Notes"
          items={profile.health_notes || []}
          field="health_notes"
          onSave={handleSave}
          saving={saving}
          placeholder="e.g., Knee pain after 10km..."
        />
        <EditableList
          title="Running Goals"
          items={profile.goals || []}
          field="goals"
          onSave={handleSave}
          saving={saving}
          placeholder="e.g., Sub-25 min 5K by December..."
        />
        <EditableList
          title="Diet Preferences"
          items={profile.diet_preferences || []}
          field="diet_preferences"
          onSave={handleSave}
          saving={saving}
          placeholder="e.g., Vegetarian, no dairy..."
        />
        <EditableList
          title="Personal Context"
          items={profile.personal_context || []}
          field="personal_context"
          onSave={handleSave}
          saving={saving}
          placeholder="e.g., Work 9-6, can only run mornings..."
        />

        {/* Section 6: AI Insights (read-only, violet-tinted — the AI signal) */}
        <motion.div variants={fadeUp} className="tile" style={{ padding: '14px 15px', borderColor: 'rgba(124,107,240,.18)' }}>
          <h3 style={{ ...sectionLabel, color: 'var(--violet-2)' }}>AI Insights</h3>
          {(!profile.conversation_insights || profile.conversation_insights.length === 0) ? (
            <p style={{ font: '400 12.5px var(--body)', color: 'var(--muted-2)', fontStyle: 'italic', margin: 0 }}>
              No insights yet. Keep chatting with your coach to build context.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {profile.conversation_insights.map((insight, i) => (
                <div key={`insight-${i}`} style={{ display: 'flex', gap: 10 }}>
                  <span style={{ flex: 'none', width: 7, height: 7, borderRadius: '50%', background: 'var(--violet-2)', marginTop: 6 }} />
                  <p style={{ font: '400 12.5px var(--body)', color: 'var(--fg)', lineHeight: 1.5, margin: 0 }}>{insight}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Section 7: Usage Stats */}
        <motion.div variants={fadeUp} className="tile recess" style={{ padding: '14px 15px' }}>
          <h3 style={sectionLabel}>Usage Stats</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
                <span style={{ font: '500 12.5px var(--body)', color: 'var(--fg)' }}>Messages today</span>
                <span className="num" style={{ font: '700 12.5px var(--mono)', color: 'var(--fg)' }}>
                  {usage_stats?.today?.used ?? 0}/{usage_stats?.today?.limit ?? 30}
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 4, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
                <motion.div
                  style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,var(--accent),var(--accent-2))' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${usagePercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ font: '500 12px var(--body)', color: 'var(--muted)' }}>Total messages</span>
              <span className="num" style={{ font: '600 12px var(--mono)', color: 'var(--fg)' }}>{usage_stats?.total_messages ?? 0}</span>
            </div>
          </div>
        </motion.div>

        {/* Footer Note */}
        <motion.p variants={fadeUp} style={{ font: '400 11px var(--body)', color: 'var(--muted-2)', textAlign: 'center', padding: '0 16px 8px', margin: 0 }}>
          This helps your AI coach give personalized advice. The more it knows, the better it coaches.
        </motion.p>
      </motion.div>
    </SSScreen>
  );
}
