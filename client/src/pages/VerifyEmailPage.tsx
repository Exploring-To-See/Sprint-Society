// /verify-email?token=... — public landing for the link in the verification email.
// Calls GET /auth/verify-email, shows success/failure, routes back into the app.
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Check } from '../components/ss/icons';

type Status = 'checking' | 'ok' | 'fail';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setStatus('fail'); setMessage('This link is missing its token.'); return; }
    api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((r) => { setStatus('ok'); setMessage(r.data?.message || 'Email verified.'); })
      .catch((e) => { setStatus('fail'); setMessage(e?.message || 'Invalid or expired verification link.'); });
  }, [params]);

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', color: 'var(--fg)', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div className="ss-surface ss-rise" style={{ borderRadius: 22, padding: 28, maxWidth: 380, width: '100%', textAlign: 'center' }} data-testid="verify-email">
        <div
          className="ticon"
          style={{
            width: 56, height: 56, borderRadius: 18, margin: '0 auto 16px', display: 'grid', placeItems: 'center',
            color: status === 'ok' ? 'var(--green)' : status === 'fail' ? 'var(--amber)' : 'var(--muted)',
            background: status === 'ok' ? 'rgba(57,255,20,.12)' : 'transparent',
          }}
        >
          {status === 'ok' ? <Check width={26} height={26} /> : status === 'checking' ? <span className="ss-typing"><i /><i /><i /></span> : '!'}
        </div>
        <h1 style={{ font: '700 20px var(--head)', letterSpacing: '-.02em' }}>
          {status === 'ok' ? 'Email verified' : status === 'fail' ? 'Couldn’t verify' : 'Verifying…'}
        </h1>
        <p style={{ font: '400 13px/1.6 var(--body)', color: 'var(--muted)', marginTop: 8 }}>{message}</p>
        {status !== 'checking' && (
          <button className="ss-btn ss-btn-primary" style={{ height: 46, marginTop: 20, width: '100%' }} onClick={() => navigate('/dashboard')} data-testid="verify-continue">
            Continue to Sprint Society
          </button>
        )}
      </div>
    </div>
  );
}
