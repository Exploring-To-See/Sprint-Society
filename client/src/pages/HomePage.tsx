import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export function HomePage() {
  const { login } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8 w-full max-w-sm"
      >
        <div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="text-6xl mb-4"
          >
            ⚡
          </motion.div>
          <h1 className="font-heading text-4xl font-bold">
            Sprint <span className="text-accent-green">Society</span>
          </h1>
          <p className="text-white/50 mt-3 text-sm leading-relaxed">
            AI-powered run club. Track your runs, level up your fitness, transform your pace.
          </p>
          <p className="text-white/30 text-xs mt-2">For the runners, by the runners.</p>
        </div>

        {!showLogin ? (
          <div className="space-y-3">
            <Button fullWidth size="lg" onClick={() => window.location.href = '/register'}>
              Join Sprint Society
            </Button>
            <Button fullWidth variant="ghost" onClick={() => setShowLogin(true)}>
              Already a member? Log in
            </Button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-3"
          >
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-bg-secondary border border-white/10 text-white placeholder:text-white/30 focus:border-accent-green/50 focus:outline-none"
              autoFocus
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-bg-secondary border border-white/10 text-white placeholder:text-white/30 focus:border-accent-green/50 focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button fullWidth size="lg" onClick={handleLogin} disabled={loading}>
              {loading ? 'Logging in...' : 'Log in'}
            </Button>
            <Link to="/forgot-password" className="block text-center text-white/40 text-xs hover:text-white/60 transition-colors">
              Forgot password?
            </Link>
            <Button fullWidth variant="ghost" onClick={() => setShowLogin(false)}>
              ← Back
            </Button>
          </motion.div>
        )}

        <p className="text-white/15 text-xs">A product by Kendu Entertainment</p>
      </motion.div>
    </div>
  );
}
