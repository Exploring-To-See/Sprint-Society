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

  return (
    <div className="rounded-2xl bg-[#0a0a0f] border border-accent/20 p-5 relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-accent/[0.03] to-transparent pointer-events-none" />

      {/* Header: SS branding + Tier */}
      <div className="flex items-center justify-between mb-4 relative">
        <span className="text-[11px] font-bold text-accent uppercase tracking-[0.2em]">Sprint Society</span>
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-accent/10 border border-accent/20 text-accent uppercase tracking-wider">
          {tierName}
        </span>
      </div>

      {/* Name + Photo */}
      <div className="flex items-center gap-3 mb-5 relative">
        {profileImage ? (
          <img src={profileImage} alt="" className="w-11 h-11 rounded-full object-cover border-2 border-accent/30" loading="lazy" />
        ) : (
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-accent to-accent-gold flex items-center justify-center text-[14px] font-bold text-white border-2 border-accent/30">
            {initials}
          </div>
        )}
        <div>
          <p className="text-[14px] font-bold text-white">{name}</p>
          <p className="text-[11px] text-zinc-500">{totalKm}km lifetime</p>
        </div>
      </div>

      {/* Hero VO2 */}
      <div className="text-center mb-4 relative">
        <div className="text-[42px] font-extralight tracking-tight text-white leading-none">
          {vo2max ? vo2max.toFixed(1) : '—'}
        </div>
        <p className="text-[10px] text-zinc-500 mt-1">
          VO₂ Max
          {dna?.vo2max_change ? (
            <span className="text-accent-green ml-1">↑ {dna.vo2max_change.toFixed(1)}</span>
          ) : null}
        </p>
      </div>

      {/* Stats row */}
      <div className="flex justify-between pt-3 border-t border-white/[0.05] relative">
        <div className="text-center">
          <p className="text-[13px] font-bold text-white">{ageGrade ? `${Math.round(ageGrade)}%` : '—'}</p>
          <p className="text-[7px] text-zinc-600 mt-0.5">Age Grade</p>
        </div>
        <div className="text-center">
          <p className="text-[13px] font-bold text-white">{vdot ? vdot.toFixed(1) : '—'}</p>
          <p className="text-[7px] text-zinc-600 mt-0.5">VDOT</p>
        </div>
        <div className="text-center">
          <p className="text-[13px] font-bold text-white">{formatPace(bestPace)}</p>
          <p className="text-[7px] text-zinc-600 mt-0.5">Best /km</p>
        </div>
        <div className="text-center">
          <p className="text-[13px] font-bold text-white">{totalKm}</p>
          <p className="text-[7px] text-zinc-600 mt-0.5">Total km</p>
        </div>
      </div>
    </div>
  );
}
