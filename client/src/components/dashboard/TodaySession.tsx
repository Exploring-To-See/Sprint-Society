// Today's-session hero — the ss-hero floating glass card with the readiness orb
// (reference: home.html .home-hero). Data: GET /training/week (unchanged).
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Gauge } from '../ss/Gauge';
import { SSSkeleton } from '../ss/SSStates';
import { Pulse, Play, ChevronRight } from '../ss/icons';

function formatPace(seconds: number): string {
  if (!seconds) return '--:--';
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

interface TodaySessionProps {
  streak?: number;
  readinessScore?: number;
  readinessLabel?: string;
}

export function TodaySession({ streak = 0, readinessScore, readinessLabel }: TodaySessionProps) {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['training-week'],
    queryFn: () => api.get('/training/week').then(r => r.data),
  });

  if (isLoading) {
    return <SSSkeleton height={196} style={{ borderRadius: 22, marginBottom: 11 }} />;
  }

  if (!data?.week) return null;

  const today = new Date().getDay() || 7;
  const todaySession = data.week.sessions.find((s: any) => s.day === today);
  if (!todaySession) return null;

  const isRest = todaySession.type === 'rest';

  const urgencyText = streak >= 7
    ? `Keep the ${streak}-day fire alive`
    : streak >= 3
      ? `Don't break your ${streak}-day streak`
      : null;

  return (
    <section
      className="ss-surface ss-hero"
      style={{ borderRadius: 22, padding: 16, marginBottom: 11 }}
      aria-label="Today's session"
      data-testid="today-session"
    >
      <div className="shead">
        <span className="sicon" style={{ background: 'rgba(249,115,22,.16)', borderColor: 'rgba(249,115,22,.28)' }}>
          <Pulse width={15} height={15} style={{ color: '#FB923C' }} />
        </span>
        <span className="slbl">Today · {data.week.phase} · W{data.current_week}/{data.total_weeks}</span>
        <span className={`ss-tag ${isRest ? 'full' : 'now'}`} style={{ marginLeft: 'auto' }}>
          {isRest ? 'Rest day' : "Today's session"}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        {readinessScore !== undefined ? (
          <Gauge
            value={readinessScore}
            display={String(Math.round(readinessScore))}
            caption={readinessLabel || 'Ready'}
            variant="live"
            ariaLabel={`Readiness ${Math.round(readinessScore)}`}
          />
        ) : (
          <Gauge
            value={(data.current_week / (data.total_weeks || 1)) * 100}
            display={`W${data.current_week}`}
            caption="Plan"
            variant="plan"
            ariaLabel={`Week ${data.current_week} of ${data.total_weeks}`}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ font: '500 22px var(--head)', letterSpacing: '-.02em', margin: '3px 0', color: '#ECECF2' }}>
            {todaySession.title}
          </h2>
          <div style={{
            font: '500 11.5px var(--body)', color: 'var(--muted)', marginBottom: 10,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {todaySession.description}
          </div>
          {!isRest && (
            <div className="sstats">
              {todaySession.target_pace_per_km ? (
                <div className="sstat">
                  <div className="v">{formatPace(todaySession.target_pace_per_km)}<small>/km</small></div>
                  <div className="k">Target</div>
                </div>
              ) : null}
              {todaySession.distance_km ? (
                <div className="sstat">
                  <div className="v">{todaySession.distance_km}<small>km</small></div>
                  <div className="k">Distance</div>
                </div>
              ) : null}
              {todaySession.rpe > 0 ? (
                <div className="sstat">
                  <div className="v">{todaySession.rpe}<small>/10</small></div>
                  <div className="k">Effort</div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {urgencyText && (
        <p style={{ font: '500 10.5px var(--body)', color: 'var(--amber)', marginTop: 10 }}>{urgencyText}</p>
      )}

      {!isRest && (
        <div style={{ display: 'flex', gap: 9, marginTop: 14 }}>
          <button className="ss-btn ss-btn-primary" onClick={() => navigate('/run/track')} data-testid="start-run">
            <Play width={16} height={16} /> Start run
          </button>
          <button className="ss-btn ss-btn-ghost" aria-label="View training plan" onClick={() => navigate('/plan')}>
            <ChevronRight width={18} height={18} />
          </button>
        </div>
      )}
    </section>
  );
}
