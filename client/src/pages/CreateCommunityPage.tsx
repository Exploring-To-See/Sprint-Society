import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { SSScreen } from '../components/ss/SSScreen';
import { Check } from '../components/ss/icons';
import { categoryIcon } from '../components/communities/categoryIcons';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
};

const CATEGORIES = [
  { key: 'run_club', label: 'Run Club' },
  { key: 'training', label: 'Training' },
  { key: 'nutrition', label: 'Nutrition' },
  { key: 'wellness', label: 'Wellness' },
  { key: 'social', label: 'Social' },
  { key: 'brand', label: 'Brand' },
  { key: 'custom', label: 'Other' },
] as const;

const labelStyle: React.CSSProperties = {
  display: 'block', font: '600 var(--lbl) var(--body)', textTransform: 'uppercase',
  letterSpacing: 'var(--trk-sm)', color: 'var(--muted)', marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '13px 14px', borderRadius: 13,
  background: 'rgba(255,255,255,.04)', border: '1px solid var(--hair)',
  font: '500 13.5px var(--body)', color: 'var(--fg)', outline: 'none',
};

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
    onError: (err: any) => setError(err?.message || 'Submission failed'),
  });

  const canSubmit = name.trim().length >= 3 && purpose.trim().length >= 10 && leaderName.trim().length >= 2 && contact.trim().length >= 5;

  if (submitted) {
    return (
      <SSScreen bodyLabel="Community request submitted">
        <div className="pad" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <span style={{ width: 56, height: 56, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'rgba(52,211,153,.14)', border: '1px solid rgba(52,211,153,.3)' }}>
              <Check width={24} height={24} style={{ color: 'var(--green)' }} />
            </span>
            <h2 style={{ font: '600 20px var(--head)', letterSpacing: '-.02em', color: 'var(--fg)', margin: 0 }}>
              Request Submitted!
            </h2>
            <p style={{ font: '400 13px var(--body)', color: 'var(--muted)', maxWidth: 280, lineHeight: 1.5, margin: 0 }}>
              We'll review your community request and get back to you soon. Quality communities make Sprint Society better for everyone.
            </p>
            <button
              className="ss-btn ss-btn-primary"
              style={{ height: 48, fontSize: 14.5, padding: '0 26px', flex: 'none' }}
              onClick={() => navigate('/communities')}
            >
              Back to Communities
            </button>
          </motion.div>
        </div>
      </SSScreen>
    );
  }

  return (
    <SSScreen bodyLabel="Request a community">
      <motion.div initial="hidden" animate="show" className="pad" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 6, paddingBottom: 30 }}>
        <motion.div variants={fadeUp}>
          <h1 style={{ font: '600 var(--m-lg) var(--head)', letterSpacing: '-.02em', color: 'var(--fg)', margin: 0 }}>
            Request a Community
          </h1>
          <p style={{ font: '400 12px var(--body)', color: 'var(--muted)', marginTop: 5, lineHeight: 1.5 }}>
            Communities are reviewed to keep quality high. Fill out this form and we'll get back to you.
          </p>
        </motion.div>

        {/* Community Name */}
        <motion.div variants={fadeUp}>
          <label style={labelStyle}>Community Name</label>
          <input
            type="text"
            placeholder="e.g., Morning Runners Delhi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
        </motion.div>

        {/* Purpose */}
        <motion.div variants={fadeUp}>
          <label style={labelStyle}>Purpose (What's it about?)</label>
          <textarea
            placeholder="Describe what this community is for, who it serves, and why it should exist..."
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: 'none' as const, fontFamily: 'var(--body)' }}
          />
          <p className="num" style={{ font: '500 10px var(--mono)', color: 'var(--muted-2)', margin: '5px 0 0' }}>
            {purpose.length}/200
          </p>
        </motion.div>

        {/* Category */}
        <motion.div variants={fadeUp}>
          <label style={labelStyle}>Category</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 7 }}>
            {CATEGORIES.map(c => {
              const Icon = categoryIcon(c.key);
              const on = category === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={`tile ${on ? '' : 'recess'}`}
                  style={{
                    alignItems: 'center', gap: 6, padding: '11px 4px', cursor: 'pointer',
                    borderColor: on ? 'rgba(249,115,22,.4)' : undefined,
                  }}
                  aria-pressed={on}
                >
                  <Icon width={16} height={16} style={{ color: on ? 'var(--accent-2)' : 'var(--muted-2)' }} />
                  <span style={{ font: '600 10.5px var(--body)', color: on ? 'var(--fg)' : 'var(--muted-2)', whiteSpace: 'nowrap' }}>
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Leader Name */}
        <motion.div variants={fadeUp}>
          <label style={labelStyle}>Your Name (Community Leader)</label>
          <input
            type="text"
            placeholder="Your full name"
            value={leaderName}
            onChange={(e) => setLeaderName(e.target.value)}
            style={inputStyle}
          />
        </motion.div>

        {/* Contact */}
        <motion.div variants={fadeUp}>
          <label style={labelStyle}>Contact (Phone or Email)</label>
          <input
            type="text"
            placeholder="How we can reach you"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            style={inputStyle}
          />
        </motion.div>

        {/* Guidelines */}
        <motion.div variants={fadeUp}>
          <div className="tile recess" style={{ gap: 8, padding: '14px 15px' }}>
            <p style={{ font: '700 var(--lbl) var(--body)', textTransform: 'uppercase', letterSpacing: 'var(--trk-sm)', color: 'var(--accent-2)', margin: 0 }}>
              Community Guidelines
            </p>
            <ul style={{ font: '400 11.5px var(--body)', color: 'var(--muted)', lineHeight: 1.6, margin: 0, paddingLeft: 16 }}>
              <li>Communities must serve a clear purpose for runners</li>
              <li>No spam, hate speech, or commercial-only content</li>
              <li>Leader is responsible for community culture</li>
              <li>Communities with no activity for 30 days may be archived</li>
            </ul>
          </div>
        </motion.div>

        {error && (
          <p style={{ font: '500 12px var(--body)', color: 'var(--amber)', textAlign: 'center', margin: 0 }}>{error}</p>
        )}

        <motion.div variants={fadeUp}>
          <button
            className="ss-btn ss-btn-primary"
            style={{ height: 50, fontSize: 15, width: '100%' }}
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
          >
            {mutation.isPending ? 'Submitting…' : 'Submit Request'}
          </button>
        </motion.div>
      </motion.div>
    </SSScreen>
  );
}
