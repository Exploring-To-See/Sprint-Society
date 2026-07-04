import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { SSAura } from '../components/ss/SSAura';
import { Check } from '../components/ss/icons';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '13px 14px', borderRadius: 13,
  background: 'rgba(255,255,255,.04)', border: '1px solid var(--hair)',
  font: '500 13.5px var(--body)', color: 'var(--fg)', outline: 'none',
};

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ss-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: '0 16px' }} aria-label="Set new password">
      <SSAura />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 380 }}
      >
        {success ? (
          <div className="tile" style={{ alignItems: 'center', gap: 12, padding: '26px 20px', textAlign: 'center' }}>
            <span style={{ width: 48, height: 48, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'rgba(52,211,153,.14)', border: '1px solid rgba(52,211,153,.3)' }}>
              <Check width={20} height={20} style={{ color: 'var(--green)' }} />
            </span>
            <h1 style={{ font: '600 22px var(--head)', letterSpacing: '-.02em', color: 'var(--fg)', margin: 0 }}>Password updated</h1>
            <p style={{ font: '400 13px var(--body)', color: 'var(--muted)', margin: 0 }}>
              You can now log in with your new password.
            </p>
            <Link to="/" style={{ width: '100%', marginTop: 8, textDecoration: 'none' }}>
              <span className="ss-btn ss-btn-primary" style={{ height: 48, fontSize: 14.5, width: '100%' }}>Go to login</span>
            </Link>
          </div>
        ) : (
          <div className="tile" style={{ gap: 0, padding: '22px 20px' }}>
            <h1 style={{ font: '600 22px var(--head)', letterSpacing: '-.02em', color: 'var(--fg)', margin: '0 0 6px' }}>Set new password</h1>
            <p style={{ font: '400 12.5px var(--body)', color: 'var(--muted)', margin: '0 0 18px' }}>
              Choose a strong password (6+ characters).
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                autoFocus
                required
                minLength={6}
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                style={inputStyle}
                required
                minLength={6}
              />

              {error && <p style={{ font: '500 12px var(--body)', color: 'var(--amber)', margin: 0 }}>{error}</p>}

              <button type="submit" className="ss-btn ss-btn-primary" style={{ height: 48, fontSize: 14.5 }} disabled={!password || !confirm || loading}>
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
}
