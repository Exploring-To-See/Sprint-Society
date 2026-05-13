import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import api from '../lib/api';

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
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {success ? (
          <div className="text-center space-y-4">
            <div className="text-4xl mb-2">✓</div>
            <h1 className="font-heading text-2xl font-bold">Password updated</h1>
            <p className="text-white/50 text-sm">You can now log in with your new password.</p>
            <Link to="/">
              <Button fullWidth className="mt-4">Go to login</Button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-heading text-2xl font-bold mb-2">Set new password</h1>
            <p className="text-white/50 text-sm mb-6">Choose a strong password (6+ characters).</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-bg-secondary border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-colors"
                autoFocus
                required
                minLength={6}
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-bg-secondary border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-colors"
                required
                minLength={6}
              />

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <Button type="submit" fullWidth disabled={!password || !confirm || loading}>
                {loading ? 'Updating...' : 'Update password'}
              </Button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
