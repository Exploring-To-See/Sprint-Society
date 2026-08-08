// Hosted Google / session bridge for the Capacitor APK & iOS shells.
//
// Flow:
//  1. Native app opens https://app.sprintsociety.in/native-auth?redirect=in.sprintsociety.app://auth
//  2. User signs in with Google (GIS works on the real web origin) or email
//  3. We bounce back to the deep-link with ?token=JWT so the native shell can
//     store the session in its own (localhost) localStorage.
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { useAuth } from '../context/AuthContext';

const DEFAULT_REDIRECT = 'in.sprintsociety.app://auth';

export function NativeAuthPage() {
  const [params] = useSearchParams();
  const { login, token, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectBase = params.get('redirect') || DEFAULT_REDIRECT;
  const mode = params.get('mode') === 'signup' ? 'signup' : 'signin';

  function bounceWithToken(jwt: string, isNew?: boolean) {
    const url = new URL(redirectBase);
    url.searchParams.set('token', jwt);
    if (isNew) url.searchParams.set('isNew', '1');
    window.location.href = url.toString();
  }

  // If the user is already signed in on the web origin, bounce immediately.
  useEffect(() => {
    if (token) bounceWithToken(token);
  }, [token]);

  async function handleEmailLogin() {
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      const jwt = localStorage.getItem('sprint_society_token');
      if (jwt) bounceWithToken(jwt);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100dvh', background: 'var(--bg, #09090B)', color: 'var(--fg, #fff)',
      display: 'flex', flexDirection: 'column', padding: '32px 24px',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ maxWidth: 380, margin: 'auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Sprint Society</h1>
          <p style={{ fontSize: 13, opacity: 0.65, marginTop: 6 }}>
            {mode === 'signup' ? 'Create your account to continue in the app' : 'Sign in to continue in the app'}
          </p>
        </div>

        <GoogleSignInButton
          text={mode === 'signup' ? 'signup_with' : 'signin_with'}
          onSuccess={(isNew) => {
            const jwt = localStorage.getItem('sprint_society_token');
            if (jwt) bounceWithToken(jwt, isNew);
          }}
          onError={(msg) => setError(msg)}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.12)' }} />
          <span style={{ fontSize: 11, opacity: 0.5 }}>or email</span>
          <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.12)' }} />
        </div>

        <input
          type="email"
          inputMode="email"
          autoCapitalize="none"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
          style={inputStyle}
        />

        {error && <p style={{ color: '#fbbf24', fontSize: 13, textAlign: 'center', margin: 0 }}>{error}</p>}

        <button
          type="button"
          onClick={handleEmailLogin}
          disabled={loading || !email || !password}
          style={{
            height: 48, borderRadius: 999, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(90deg,#f97316,#fb923c)', color: '#fff',
            fontWeight: 700, fontSize: 15, opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Signing in…' : user ? 'Continue to app' : 'Continue'}
        </button>

        <p style={{ fontSize: 11, opacity: 0.45, textAlign: 'center', margin: 0 }}>
          You’ll return to the Sprint Society app after signing in.
        </p>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  height: 48, borderRadius: 14, border: '1px solid rgba(255,255,255,.12)',
  background: 'rgba(255,255,255,.04)', color: '#fff', padding: '0 14px',
  fontSize: 15, outline: 'none', width: '100%', boxSizing: 'border-box',
};
