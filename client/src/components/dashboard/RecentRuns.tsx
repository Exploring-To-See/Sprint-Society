// Recent runs — .run rows inside a recess well (reference: home.html).
// Data: GET /runs?limit=3 (unchanged).
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { SSSkeleton } from '../ss/SSStates';
import { RunGlyph, ChevronRight } from '../ss/icons';

function formatPace(seconds: number): string {
  if (!seconds || seconds <= 0) return '—';
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString('en-IN', { weekday: 'short' });
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function RecentRuns() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['recent-runs'],
    queryFn: () => api.get('/runs?limit=3').then(r => r.data),
  });

  if (isLoading) {
    return <SSSkeleton height={168} style={{ borderRadius: 18 }} />;
  }

  const runs = Array.isArray(data) ? data : data?.runs || [];

  if (runs.length === 0) {
    return (
      <div className="tile recess" style={{ borderRadius: 18, padding: 20, alignItems: 'center', textAlign: 'center' }}>
        <p style={{ font: '500 13px var(--body)', color: 'var(--muted)' }}>No runs yet</p>
        <button
          onClick={() => navigate('/run/track')}
          style={{ marginTop: 8, background: 'none', border: 'none', cursor: 'pointer', font: '600 12px var(--head)', color: 'var(--accent-2)', display: 'inline-flex', alignItems: 'center', gap: 3, minHeight: 44 }}
        >
          Start your first run <ChevronRight width={12} height={12} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="railhead" style={{ margin: '0 0 9px' }}>
        <span className="rt">Recent runs</span>
        <button className="more" onClick={() => navigate('/runs')}>
          See all <ChevronRight width={12} height={12} />
        </button>
      </div>
      <div className="tile recess" style={{ borderRadius: 18, padding: '4px 13px' }}>
        {runs.slice(0, 3).map((run: any) => {
          const km = (run.distance_meters / 1000).toFixed(1);
          const pace = run.moving_time_seconds && run.distance_meters
            ? run.moving_time_seconds / (run.distance_meters / 1000)
            : 0;
          return (
            <button
              key={run.id}
              className="run"
              onClick={() => navigate('/runs')}
              style={{ cursor: 'pointer', textAlign: 'left', minHeight: 48 }}
            >
              <span className="runico"><RunGlyph width={15} height={15} style={{ color: 'var(--muted)' }} /></span>
              <span className="ri">
                <span className="t"><b>{km} km</b> · <b>{formatPace(pace)}/km</b></span>
                <span className="s" style={{ display: 'block' }}>{formatDate(run.start_date)}</span>
              </span>
              <span className="rt">{Math.floor(run.moving_time_seconds / 60)}m</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
