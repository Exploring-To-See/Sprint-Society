import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';

export function StravaCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Connecting to Strava...');

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setStatus('No authorization code received');
      return;
    }

    api.post('/strava/callback', { code })
      .then((res) => {
        setStatus(`Connected! Synced ${res.data.activities_synced} activities.`);
        setTimeout(() => navigate('/dashboard'), 1500);
      })
      .catch(() => {
        setStatus('Failed to connect. Please try again.');
        setTimeout(() => navigate('/profile'), 2000);
      });
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="text-center">
        <div className="animate-pulse text-4xl mb-4">⚡</div>
        <p className="text-white/70">{status}</p>
      </div>
    </div>
  );
}
