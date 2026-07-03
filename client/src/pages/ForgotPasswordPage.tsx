import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { SSAura } from '../components/ss/SSAura';
import { Send } from '../components/ss/icons';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '13px 14px', borderRadius: 13,
  background: 'rgba(255,255,255,.04)', border: '1px solid var(--hair)',
  font: '500 13.5px var(--body)', color: 'var(--fg)', outline: 'none',
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ss-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: '0 16px' }} aria-label="Reset password">
      <SSAura />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 380 }}
      >
        {sent ? (
          <div className="tile" style={{ alignItems: 'center', gap: 12, padding: '26px 20px', textAlign: 'center' }}>
            <span style={{ width: 48, height: 48, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'rgba(249,115,22,.14)', border: '1px solid rgba(249,115,22,.3)' }}>
              <Send width={20} height={20} style={{ color: 'var(--accent-2)' }} />
            </span>
            <h1 style={{ font: '600 22px var(--head)', letterSpacing: '-.02em', color: 'var(--fg)', margin: 0 }}>Check your email</h1>
            <p style={{ font: '400 13px var(--body)', color: 'var(--muted)', lineHeight: 1.55, margin: 0 }}>
              If an account exists with that email, we've sent a reset link. Check your inbox (and spam folder).
            </p>
            <Link to="/" style={{ font: '600 12.5px var(--body)', color: 'var(--muted-2)', marginTop: 8, textDecoration: 'none' }}>
              Back to login
            </Link>
          </div>
        ) : (
          <div className="tile" style={{ gap: 0, padding: '22px 20px' }}>
            <h1 style={{ font: '600 22px var(--head)', letterSpacing: '-.02em', color: 'var(--fg)', margin: '0 0 6px' }}>Reset password</h1>
            <p style={{ font: '400 12.5px var(--body)', color: 'var(--muted)', margin: '0 0 18px' }}>
              Enter your email and we'll send a reset link.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                autoFocus
                required
              />

              {error && <p style={{ font: '500 12px var(--body)', color: 'var(--amber)', margin: 0 }}>{error}</p>}

              <button type="submit" className="ss-btn ss-btn-primary" style={{ height: 48, fontSize: 14.5 }} disabled={!email || loading}>
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            <Link to="/" style={{ font: '600 12.5px var(--body)', color: 'var(--muted-2)', textAlign: 'center', marginTop: 16, textDecoration: 'none' }}>
              Back to login
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
