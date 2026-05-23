import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';

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
    <motion.div variants={fadeUp} className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-4">
      <h3 className="text-xs text-zinc-400 uppercase tracking-wider font-mono mb-3">{title}</h3>

      {localItems.length === 0 && !editing && (
        <p className="text-sm text-zinc-500 italic mb-3">No items yet. Tap edit to add.</p>
      )}

      <div className="space-y-2 mb-3">
        {localItems.map((item, i) => (
          <div
            key={`${field}-${i}`}
            className="flex items-center justify-between bg-bg-tertiary/50 rounded-lg px-3 py-2 group hover:bg-bg-tertiary transition-colors"
          >
            <span className="text-sm text-white flex-1">{item}</span>
            {editing && (
              <button
                onClick={() => handleRemove(i)}
                className="ml-2 text-zinc-500 hover:text-red-400 transition-colors text-lg leading-none"
                aria-label={`Remove ${item}`}
              >
                &times;
              </button>
            )}
          </div>
        ))}
      </div>

      {editing && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={placeholder}
            className="flex-1 bg-bg-tertiary border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-accent transition-colors"
          />
          <Button size="sm" onClick={handleAdd} disabled={!newItem.trim() || saving}>
            Add
          </Button>
        </div>
      )}

      <button
        onClick={() => setEditing(!editing)}
        className="mt-3 text-xs text-accent hover:text-accent-warm transition-colors font-medium"
      >
        {editing ? 'Done' : 'Edit'}
      </button>
    </motion.div>
  );
}

// --- Main Page ---
export function AIProfilePage() {
  const { user } = useAuth();
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
      <AppShell>
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-56 bg-bg-secondary rounded-lg" />
          <div className="h-32 bg-bg-secondary rounded-2xl" />
          <div className="h-24 bg-bg-secondary rounded-2xl" />
          <div className="h-24 bg-bg-secondary rounded-2xl" />
          <div className="h-24 bg-bg-secondary rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="text-4xl mb-4">😵</div>
          <h2 className="text-lg font-semibold text-white mb-2">Something went wrong</h2>
          <p className="text-sm text-zinc-400 mb-6">{error}</p>
          <Button onClick={fetchProfile}>Try Again</Button>
        </div>
      </AppShell>
    );
  }

  // --- Empty / First-time State ---
  if (!profile) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="text-5xl mb-4">🧠</div>
          <h2 className="text-lg font-semibold text-white mb-2">No AI Profile Yet</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Start chatting with your AI coach to build your profile. The more you talk, the more personalized your coaching becomes.
          </p>
          <Button onClick={() => window.location.href = '/coaching'}>Start Coaching</Button>
        </div>
      </AppShell>
    );
  }

  const { usage_stats } = profile;
  const usagePercent = usage_stats?.today
    ? Math.min((usage_stats.today.used / usage_stats.today.limit) * 100, 100)
    : 0;

  const tierColors: Record<string, string> = {
    advanced: 'text-accent-gold',
    intermediate: 'text-accent',
    beginner: 'text-accent-green',
  };

  return (
    <AppShell>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🧠</span>
          <div>
            <h1 className="text-xl font-bold text-white font-heading">What Your AI Coach Knows</h1>
            <p className="text-xs text-zinc-400">
              Last updated {profile.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'never'}
            </p>
          </div>
        </motion.div>

        {/* Section 1: Runner Summary */}
        <motion.div
          variants={fadeUp}
          className="bg-gradient-to-br from-accent/5 via-bg-secondary to-bg-secondary border border-bg-tertiary rounded-2xl p-4"
        >
          <h3 className="text-xs text-zinc-400 uppercase tracking-wider font-mono mb-3">Runner Summary</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] text-zinc-500">Name</p>
              <p className="text-sm text-white font-medium">{profile.user?.name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-[11px] text-zinc-500">Tier</p>
              <p className={`text-sm font-medium capitalize ${tierColors[profile.user?.tier?.toLowerCase()] || 'text-white'}`}>
                {profile.user?.tier || 'Unclassified'}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-zinc-500">VDOT</p>
              <p className="text-sm text-white font-medium">{profile.user?.vdot || '--'}</p>
            </div>
            <div>
              <p className="text-[11px] text-zinc-500">Fitness Level</p>
              <p className="text-sm text-white font-medium capitalize">{profile.user?.fitness_level || '--'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[11px] text-zinc-500">Experience</p>
              <p className="text-sm text-white font-medium">{profile.user?.experience || '--'}</p>
            </div>
          </div>
          {profile.running_profile && (
            <div className="mt-3 pt-3 border-t border-bg-tertiary grid grid-cols-3 gap-2">
              <div>
                <p className="text-[11px] text-zinc-500">Weekly</p>
                <p className="text-sm text-white font-medium">{profile.running_profile.weekly_km} km</p>
              </div>
              <div>
                <p className="text-[11px] text-zinc-500">Preferred</p>
                <p className="text-sm text-white font-medium">{profile.running_profile.preferred_distance}</p>
              </div>
              <div>
                <p className="text-[11px] text-zinc-500">Pace Zone</p>
                <p className="text-sm text-white font-medium">{profile.running_profile.pace_zone}</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Section 2: Health Notes */}
        <EditableList
          title="Health Notes"
          items={profile.health_notes || []}
          field="health_notes"
          onSave={handleSave}
          saving={saving}
          placeholder="e.g., Knee pain after 10km..."
        />

        {/* Section 3: Goals */}
        <EditableList
          title="Running Goals"
          items={profile.goals || []}
          field="goals"
          onSave={handleSave}
          saving={saving}
          placeholder="e.g., Sub-25 min 5K by December..."
        />

        {/* Section 4: Diet Preferences */}
        <EditableList
          title="Diet Preferences"
          items={profile.diet_preferences || []}
          field="diet_preferences"
          onSave={handleSave}
          saving={saving}
          placeholder="e.g., Vegetarian, no dairy..."
        />

        {/* Section 5: Personal Context */}
        <EditableList
          title="Personal Context"
          items={profile.personal_context || []}
          field="personal_context"
          onSave={handleSave}
          saving={saving}
          placeholder="e.g., Work 9-6, can only run mornings..."
        />

        {/* Section 6: AI Insights (read-only) */}
        <motion.div variants={fadeUp} className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-4">
          <h3 className="text-xs text-zinc-400 uppercase tracking-wider font-mono mb-3">AI Insights</h3>
          {(!profile.conversation_insights || profile.conversation_insights.length === 0) ? (
            <p className="text-sm text-zinc-500 italic">
              No insights yet. Keep chatting with your coach to build context.
            </p>
          ) : (
            <div className="space-y-3">
              {profile.conversation_insights.map((insight, i) => (
                <div key={`insight-${i}`} className="flex gap-3">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-accent mt-2" />
                  <p className="text-sm text-zinc-300">{insight}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Section 7: Usage Stats */}
        <motion.div variants={fadeUp} className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-4">
          <h3 className="text-xs text-zinc-400 uppercase tracking-wider font-mono mb-3">Usage Stats</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm text-zinc-300">Messages today</span>
                <span className="text-sm text-white font-medium">
                  {usage_stats?.today?.used ?? 0}/{usage_stats?.today?.limit ?? 30}
                </span>
              </div>
              <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent to-accent-warm rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${usagePercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-zinc-400">Total messages</span>
              <span className="text-sm text-white">{usage_stats?.total_messages ?? 0}</span>
            </div>
          </div>
        </motion.div>

        {/* Footer Note */}
        <motion.p variants={fadeUp} className="text-xs text-zinc-500 text-center px-4 pb-4">
          This helps your AI coach give personalized advice. The more it knows, the better it coaches.
        </motion.p>
      </motion.div>
    </AppShell>
  );
}
