// Non-blocking "verify your email" banner. Shows for logged-in users whose email
// is explicitly unverified (email_verified === 0/false). Dismissable per session;
// "Resend" hits POST /auth/resend-verification. Hidden on the verify page itself.
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const DISMISS_KEY = 'ss_verify_banner_dismissed';

export function VerifyEmailBanner() {
  const { user } = useAuth();
  const location = useLocation();
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === '1');
  const [sent, setSent] = useState(false);

  const resend = useMutation({
    mutationFn: () => api.post('/auth/resend-verification'),
    onSuccess: () => setSent(true),
  });

  const unverified = !!user && (user.email_verified === 0 || user.email_verified === false);
  const onVerifyRoute = location.pathname.startsWith('/verify-email');
  if (!unverified || dismissed || onVerifyRoute) return null;

  const dismiss = () => { sessionStorage.setItem(DISMISS_KEY, '1'); setDismissed(true); };

  return (
    <div
      role="status"
      data-testid="verify-email-banner"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 150,
        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
        background: 'linear-gradient(180deg, rgba(251,191,36,.16), rgba(251,191,36,.06))',
        borderBottom: '1px solid rgba(251,191,36,.28)', backdropFilter: 'blur(10px)',
      }}
    >
      <span style={{ font: '500 12px/1.35 var(--body)', color: 'var(--fg)', flex: 1, minWidth: 0 }}>
        {sent ? 'Verification email sent — check your inbox.' : 'Verify your email to secure your account.'}
      </span>
      {!sent && (
        <button
          onClick={() => resend.mutate()}
          disabled={resend.isPending}
          data-testid="verify-resend"
          style={{ flex: 'none', font: '600 12px var(--head)', color: 'var(--amber)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {resend.isPending ? 'Sending…' : 'Resend'}
        </button>
      )}
      <button onClick={dismiss} aria-label="Dismiss" data-testid="verify-dismiss" style={{ flex: 'none', width: 22, height: 22, borderRadius: 7, background: 'rgba(255,255,255,.08)', border: 'none', color: 'var(--muted)', cursor: 'pointer', font: '600 13px var(--head)' }}>×</button>
    </div>
  );
}
