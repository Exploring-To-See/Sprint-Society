import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

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
        variants={stagger}
        initial="hidden"
        animate="show"
        className="space-y-8 w-full max-w-sm"
      >
        <motion.div variants={fadeUp} className="flex flex-col items-center">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-10 h-10 rounded-[10px] bg-accent flex items-center justify-center">
              <span className="text-lg font-heading font-bold text-black">K</span>
            </div>
            <h1 className="font-heading text-[26px] font-bold tracking-tight">
              Sprint <span className="text-accent">Society</span>
            </h1>
          </div>
          <p className="text-zinc-500 text-[13px]">
            AI-powered run club
          </p>
        </motion.div>

        {!showLogin ? (
          <motion.div variants={fadeUp} className="space-y-3">
            <Button fullWidth size="lg" onClick={() => window.location.href = '/register'}>
              Join Sprint Society
            </Button>
            <Button fullWidth variant="ghost" onClick={() => setShowLogin(true)}>
              Already a member? Log in
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-bg-secondary border border-bg-tertiary text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none transition-colors"
              autoFocus
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-bg-secondary border border-bg-tertiary text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button fullWidth size="lg" onClick={handleLogin} disabled={loading}>
              {loading ? 'Logging in...' : 'Log in'}
            </Button>
            <Link to="/forgot-password" className="block text-center text-zinc-500 text-xs hover:text-zinc-300 transition-colors">
              Forgot password?
            </Link>
            <button
              onClick={() => setShowLogin(false)}
              className="w-full text-center text-zinc-500 text-sm py-2 hover:text-zinc-300 transition-colors"
            >
              ← Back
            </button>
          </motion.div>
        )}

        <motion.p variants={fadeUp} className="text-zinc-700 text-[11px]">
          by Kendu Entertainment
        </motion.p>
      </motion.div>
    </div>
  );
}
