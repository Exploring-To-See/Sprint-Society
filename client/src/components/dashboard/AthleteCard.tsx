// Athlete card — the VO₂-max hero identity tile (reference: home.html .ath-hero).
// Data: GET /coaching/tier + GET /runs/stats + GET /profiling/dna (unchanged).
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export function AthleteCard() {
  const { user } = useAuth();

  const { data: tier } = useQuery({
    queryKey: ['tier'],
    queryFn: () => api.get('/coaching/tier').then(r => r.data).catch(() => null),
  });

  const { data: stats } = useQuery({
    queryKey: ['run-stats'],
    queryFn: () => api.get('/runs/stats').then(r => r.data).catch(() => null),
  });

  const { data: dna } = useQuery({
    queryKey: ['profiling-dna'],
    queryFn: () => api.get('/profiling/dna').then(r => r.data).catch(() => null),
  });

  const name = (user as any)?.name || 'Runner';
  const profileImage = (user as any)?.profile_image_url;
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  const tierName = tier?.tier || dna?.tier || 'Beginner';
  const vo2max = tier?.estimated_vo2max || dna?.estimated_vo2max || null;
  const ageGrade = tier?.age_graded_percentage || null;
  const vdot = tier?.vdot || dna?.vdot || null;
  const bestPace = stats?.best_pace || null;
  const totalKm = stats?.total_distance ? (stats.total_distance / 1000).toFixed(0) : '0';

  function formatPace(sec: number | null): string {
    if (!sec || sec <= 0) return '—';
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  if (!vo2max && !stats?.total_runs) return null;

  const cells: { v: string; k: string }[] = [
    { v: ageGrade ? `${Math.round(ageGrade)}%` : '—', k: 'Age grade' },
    { v: vdot ? vdot.toFixed(1) : '—', k: 'VDOT' },
    { v: formatPace(bestPace), k: 'Best /km' },
    { v: totalKm, k: 'Total km' },
  ];

  return (
    <section className="tile" style={{ borderRadius: 18, padding: '16px 14px', alignItems: 'center', textAlign: 'center' }} aria-label="Athlete card" data-testid="athlete-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%' }}>
        {profileImage ? (
          <img
            src={profileImage}
            alt=""
            loading="lazy"
            style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', flex: 'none', border: '1px solid var(--hair)' }}
          />
        ) : (
          <span aria-hidden="true" style={{
            width: 46, height: 46, borderRadius: '50%', flex: 'none', display: 'grid', placeItems: 'center',
            background: 'linear-gradient(135deg,var(--accent),var(--violet))', font: '700 15px var(--head)', color: '#fff',
          }}>
            {initials}
          </span>
        )}
        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <p style={{ font: '600 15px var(--head)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
          <p className="num" style={{ font: '500 11px var(--mono)', color: 'var(--muted)' }}>{totalKm} km lifetime</p>
        </div>
        <span className="ss-tag now">{tierName}</span>
      </div>

      <div className="num" style={{ font: '700 42px var(--mono)', lineHeight: 1, margin: '14px 0 3px' }}>
        {vo2max ? vo2max.toFixed(1) : '—'}
      </div>
      <div style={{
        font: '600 var(--lbl) var(--body)', textTransform: 'uppercase', letterSpacing: 'var(--trk-sm)',
        color: 'var(--muted-2)', display: 'flex', alignItems: 'center', gap: 6,
      }}>
        VO₂ max
        {dna?.vo2max_change ? (
          <span className="ss-dchip good">+{dna.vo2max_change.toFixed(1)}</span>
        ) : null}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 2, width: '100%', marginTop: 12, borderTop: '1px solid var(--hair)', paddingTop: 10 }}>
        {cells.map((c) => (
          <div key={c.k} style={{ padding: '4px 2px', textAlign: 'center' }}>
            <div className="num" style={{ font: '700 14px var(--mono)' }}>{c.v}</div>
            <div style={{ font: '600 8.5px var(--body)', textTransform: 'uppercase', letterSpacing: 'var(--trk-sm)', color: 'var(--muted-2)', marginTop: 4 }}>{c.k}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
