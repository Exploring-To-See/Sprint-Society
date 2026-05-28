import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { AppShell } from '../components/layout/AppShell';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
};

const CATEGORIES = [
  { key: 'run_club', icon: '🏃', label: 'Run Club' },
  { key: 'training', icon: '🎯', label: 'Training' },
  { key: 'nutrition', icon: '🥗', label: 'Nutrition' },
  { key: 'wellness', icon: '🧘', label: 'Wellness' },
  { key: 'social', icon: '🎉', label: 'Social' },
  { key: 'brand', icon: '✨', label: 'Brand' },
  { key: 'custom', icon: '⭐', label: 'Other' },
] as const;

export function CreateCommunityPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [category, setCategory] = useState<string>('run_club');
  const [leaderName, setLeaderName] = useState('');
  const [contact, setContact] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.post('/communities/request', { name, purpose, category, leader_name: leaderName, contact }),
    onSuccess: () => setSubmitted(true),
    onError: (err: any) => setError(err.response?.data?.error || 'Submission failed'),
  });

  const canSubmit = name.trim().length >= 3 && purpose.trim().length >= 10 && leaderName.trim().length >= 2 && contact.trim().length >= 5;

  if (submitted) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
              <span className="text-[28px]">✓</span>
            </div>
            <h2 className="font-heading text-[20px] font-bold">Request Submitted!</h2>
            <p className="text-[13px] text-zinc-400 max-w-[280px]">
              We'll review your community request and get back to you soon. Quality communities make Sprint Society better for everyone.
            </p>
            <button
              onClick={() => navigate('/communities')}
              className="px-6 py-3 rounded-xl bg-accent text-white font-semibold text-[14px] active:scale-[0.98] transition-all"
            >
              Back to Communities
            </button>
          </motion.div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <motion.div initial="hidden" animate="show" className="space-y-5 pb-10">
        <motion.div variants={fadeUp}>
          <h1 className="font-heading text-[22px] font-bold">Request a Community</h1>
          <p className="text-[12px] text-zinc-500 mt-1">
            Communities are reviewed to keep quality high. Fill out this form and we'll get back to you.
          </p>
        </motion.div>

        {/* Community Name */}
        <motion.div variants={fadeUp} className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Community Name</label>
          <input
            type="text"
            placeholder="e.g., Morning Runners Delhi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl bg-bg-secondary border border-bg-tertiary text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none transition-colors"
          />
        </motion.div>

        {/* Purpose */}
        <motion.div variants={fadeUp} className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Purpose (What's it about?)</label>
          <textarea
            placeholder="Describe what this community is for, who it serves, and why it should exist..."
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            rows={3}
            className="w-full px-4 py-3.5 rounded-xl bg-bg-secondary border border-bg-tertiary text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none transition-colors resize-none"
          />
          <p className="text-[10px] text-zinc-700">{purpose.length}/200</p>
        </motion.div>

        {/* Category */}
        <motion.div variants={fadeUp} className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Category</label>
          <div className="grid grid-cols-4 gap-1.5">
            {CATEGORIES.map(c => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border transition-all active:scale-[0.97] ${
                  category === c.key
                    ? 'bg-accent/10 border-accent/40 text-white'
                    : 'bg-bg-secondary border-bg-tertiary text-zinc-500'
                }`}
              >
                <span className="text-base">{c.icon}</span>
                <span className="text-[11px] font-medium">{c.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Leader Name */}
        <motion.div variants={fadeUp} className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Your Name (Community Leader)</label>
          <input
            type="text"
            placeholder="Your full name"
            value={leaderName}
            onChange={(e) => setLeaderName(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl bg-bg-secondary border border-bg-tertiary text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none transition-colors"
          />
        </motion.div>

        {/* Contact */}
        <motion.div variants={fadeUp} className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Contact (Phone or Email)</label>
          <input
            type="text"
            placeholder="How we can reach you"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl bg-bg-secondary border border-bg-tertiary text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none transition-colors"
          />
        </motion.div>

        {/* Guidelines */}
        <motion.div variants={fadeUp}>
          <div className="rounded-xl bg-accent/5 border border-accent/10 p-4 space-y-2">
            <p className="text-[11px] font-bold text-accent">Community Guidelines</p>
            <ul className="text-[11px] text-zinc-400 space-y-1 list-disc list-inside">
              <li>Communities must serve a clear purpose for runners</li>
              <li>No spam, hate speech, or commercial-only content</li>
              <li>Leader is responsible for community culture</li>
              <li>Communities with no activity for 30 days may be archived</li>
            </ul>
          </div>
        </motion.div>

        {error && <p className="text-red-400 text-[12px] text-center">{error}</p>}

        <motion.div variants={fadeUp}>
          <button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
            className="w-full py-4 rounded-xl bg-accent text-white font-semibold text-[15px] disabled:opacity-30 active:scale-[0.98] transition-all"
          >
            {mutation.isPending ? 'Submitting...' : 'Submit Request'}
          </button>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
