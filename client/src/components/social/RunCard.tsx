import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { formatPace, formatDistance, formatDuration, formatDate } from '../../lib/formatters';
import { Button } from '../ui/Button';

interface RunCardProps {
  run: {
    distance_meters: number;
    moving_time_seconds: number;
    average_pace_per_km: number;
    start_date: string;
    map_polyline?: string;
    elevation_gain?: number;
  };
  userName: string;
  streak?: number;
  tier?: string;
  improvement?: number;
}

export function RunCard({ run, userName, streak, tier, improvement }: RunCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, backgroundColor: '#0A0A0F' });
      const link = document.createElement('a');
      link.download = `sprint-society-${formatDate(run.start_date).replace(/\s/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
    }
    setDownloading(false);
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, backgroundColor: '#0A0A0F' });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'sprint-society-run.png', { type: 'image/png' });
      if (navigator.share) {
        await navigator.share({ files: [file], title: 'My Sprint Society Run' });
      }
    } catch (err) {
      handleDownload();
    }
  };

  return (
    <div className="space-y-4">
      {/* The card itself */}
      <div
        ref={cardRef}
        className="relative w-full aspect-[9/16] max-w-[360px] mx-auto rounded-3xl overflow-hidden bg-bg-primary p-6 flex flex-col"
        style={{ background: 'linear-gradient(180deg, #0A0A0F 0%, #12121A 50%, #0A0A0F 100%)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-accent-green text-xl">⚡</span>
          <span className="font-heading font-bold text-sm tracking-tight">
            Sprint <span className="text-accent-green">Society</span>
          </span>
        </div>

        {/* Route placeholder */}
        <div className="flex-1 flex items-center justify-center mb-6">
          {run.map_polyline ? (
            <div className="w-full h-full flex items-center justify-center text-accent-green/20">
              <svg viewBox="0 0 200 200" className="w-full h-full max-h-[200px]">
                <path
                  d="M 20 180 Q 50 100 80 120 T 140 80 T 180 40"
                  fill="none"
                  stroke="#39FF14"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.6"
                />
              </svg>
            </div>
          ) : (
            <div className="w-32 h-32 rounded-full border-2 border-accent-green/20 flex items-center justify-center">
              <span className="text-4xl">🏃</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <div className="text-center">
            <p className="font-mono text-4xl font-bold text-white">{formatDistance(run.distance_meters)}</p>
            <p className="text-white/40 text-xs uppercase tracking-wider mt-1">Distance</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center bg-bg-tertiary/50 rounded-xl p-3">
              <p className="font-mono text-xl font-bold">{formatDuration(run.moving_time_seconds)}</p>
              <p className="text-white/40 text-[10px] uppercase">Time</p>
            </div>
            <div className="text-center bg-bg-tertiary/50 rounded-xl p-3">
              <p className="font-mono text-xl font-bold">{formatPace(run.average_pace_per_km)}</p>
              <p className="text-white/40 text-[10px] uppercase">Pace /km</p>
            </div>
          </div>

          {/* Badges row */}
          <div className="flex items-center justify-center gap-3 text-xs">
            {streak && streak > 0 && (
              <span className="bg-bg-tertiary/50 px-2 py-1 rounded-full">🔥 {streak} day streak</span>
            )}
            {tier && (
              <span className="bg-bg-tertiary/50 px-2 py-1 rounded-full capitalize">
                {tier === 'advanced' ? '👑' : tier === 'intermediate' ? '⚡' : '🌱'} {tier}
              </span>
            )}
            {improvement && improvement > 0 && (
              <span className="bg-bg-tertiary/50 px-2 py-1 rounded-full text-accent-green">
                ↑ {improvement}%
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
          <p className="text-white/60 text-xs">{userName}</p>
          <p className="text-white/30 text-xs">{formatDate(run.start_date)}</p>
        </div>

        <p className="text-center text-white/15 text-[11px] mt-3">Kendu Entertainment</p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 max-w-[360px] mx-auto">
        <Button onClick={handleDownload} variant="secondary" fullWidth disabled={downloading}>
          {downloading ? 'Saving...' : 'Download'}
        </Button>
        <Button onClick={handleShare} fullWidth>
          Share
        </Button>
      </div>
    </div>
  );
}
