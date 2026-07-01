import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import api from '../lib/api';

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
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {sent ? (
          <div className="text-center space-y-4">
            <div className="text-4xl mb-2">📧</div>
            <h1 className="font-heading text-2xl font-bold">Check your email</h1>
            <p className="text-white/50 text-sm">
              If an account exists with that email, we've sent a reset link. Check your inbox (and spam folder).
            </p>
            <Link to="/" className="block text-white/40 text-sm mt-6 hover:text-white transition-colors">
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-heading text-2xl font-bold mb-2">Reset password</h1>
            <p className="text-white/50 text-sm mb-6">Enter your email and we'll send a reset link.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-bg-secondary border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-colors"
                autoFocus
                required
              />

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <Button type="submit" fullWidth disabled={!email || loading}>
                {loading ? 'Sending...' : 'Send reset link'}
              </Button>
            </form>

            <Link to="/" className="block text-center text-white/40 text-sm mt-6 hover:text-white transition-colors">
              Back to login
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
