import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Dedicated admin portal login (used by the VITE_ADMIN_ONLY deployment).
 *
 * Same backend + database as the main app, so signing in here as an admin
 * controls the whole application. Non-admin accounts are rejected.
 */
export function AdminLoginPage() {
  const { user, login, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Once authenticated as an admin, go straight to the panel.
  useEffect(() => {
    if (user?.role === 'admin') navigate('/admin', { replace: true });
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="animate-pulse text-4xl">⚡</div>
      </div>
    );
  }

  // Logged in but not an admin — this portal is admins-only.
  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-6 text-center">
        <span className="text-3xl mb-3">🔒</span>
        <h1 className="font-heading text-lg font-bold text-white">Administrators only</h1>
        <p className="text-[13px] text-zinc-500 mt-2 max-w-xs">
          You're signed in as <span className="text-zinc-300">{user.email}</span>, which isn't an
          admin account. Use an administrator login to access this portal.
        </p>
        <button
          onClick={logout}
          className="mt-5 px-4 py-2 rounded-lg bg-bg-secondary border border-bg-tertiary text-[12px] font-semibold text-zinc-300 active:scale-95"
        >
          Sign out
        </button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email.trim(), password);
      // redirect handled by the effect above once `user` updates
    } catch (err: any) {
      setError(err?.message || err?.response?.data?.error || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">⚡</div>
          <h1 className="font-heading text-xl font-bold text-white">Sprint Society</h1>
          <p className="text-[12px] uppercase tracking-widest text-accent mt-1">Admin Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Admin email"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            inputMode="email"
            required
            className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-bg-tertiary text-[14px] text-white placeholder:text-zinc-600 focus:border-accent focus:outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            required
            className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-bg-tertiary text-[14px] text-white placeholder:text-zinc-600 focus:border-accent focus:outline-none"
          />

          {error && <p className="text-[12px] text-red-400 px-1">{error}</p>}

          <button
            type="submit"
            disabled={busy || !email || !password}
            className="w-full py-3 rounded-xl bg-accent text-white text-[14px] font-semibold disabled:opacity-40 active:scale-95 transition-all"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-[11px] text-zinc-700 mt-6">
          Restricted access. Authorized administrators only.
        </p>
      </div>
    </div>
  );
}

export default AdminLoginPage;
