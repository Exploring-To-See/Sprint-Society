import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
async function toJpeg(node: HTMLElement, options?: Record<string, any>): Promise<string> {
  const { toJpeg: fn } = await import('html-to-image');
  return fn(node, options);
}
import api from '../lib/api';
import { AppShell } from '../components/layout/AppShell';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { KenduSpendConfirmModal } from '../components/kendu/KenduSpendConfirmModal';
import { formatPace, formatDistance, formatDuration, formatDate } from '../lib/formatters';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const fadeUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.15 } } };

import { RouteShape } from '../components/share/RouteShape';

type TemplateName = 'dark_minimal' | 'gradient_pace' | 'achievement' | 'streak_fire' | 'race_recap' | 'photo_route' | 'neon_glow' | 'gold_elite' | 'midnight_run';

const TEMPLATES: { key: TemplateName; label: string; icon: string; premium?: boolean }[] = [
  { key: 'dark_minimal', label: 'Dark', icon: '🖤' },
  { key: 'gradient_pace', label: 'Gradient', icon: '🌈' },
  { key: 'photo_route', label: 'Photo', icon: '📸' },
  { key: 'achievement', label: 'Achievement', icon: '🏆' },
  { key: 'streak_fire', label: 'Streak', icon: '🔥' },
  { key: 'race_recap', label: 'Recap', icon: '📊' },
  { key: 'neon_glow', label: 'Neon', icon: '💜', premium: true },
  { key: 'gold_elite', label: 'Gold', icon: '👑', premium: true },
  { key: 'midnight_run', label: 'Midnight', icon: '🌙', premium: true },
];

function CardTemplate({ template, run, userName, streak, tier, backgroundImage }: {
  template: TemplateName;
  run: any;
  userName: string;
  streak?: number;
  tier?: string;
  backgroundImage?: string | null;
}) {
  const distance = formatDistance(run.distance_meters);
  const pace = formatPace(run.average_pace_per_km);
  const duration = formatDuration(run.moving_time_seconds);
  const date = formatDate(run.start_date);
  const hasRoute = !!run.map_polyline;

  if (template === 'photo_route') {
    return (
      <div className="relative w-full aspect-[9/16] rounded-3xl overflow-hidden flex flex-col justify-end">
        {backgroundImage ? (
          <img src={backgroundImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-zinc-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        {hasRoute && (
          <div className="absolute inset-0 flex items-center justify-center">
            <RouteShape polyline={run.map_polyline} width={280} height={280} strokeColor="#ffffff" strokeWidth={3} opacity={backgroundImage ? 0.5 : 0.15} />
          </div>
        )}
        <div className="relative z-10 p-6 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center">
              <p className="font-mono text-lg font-bold text-white">{distance}</p>
              <p className="text-white/50 text-[10px] uppercase">km</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center">
              <p className="font-mono text-lg font-bold text-white">{pace}</p>
              <p className="text-white/50 text-[10px] uppercase">/km</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center">
              <p className="font-mono text-lg font-bold text-white">{duration}</p>
              <p className="text-white/50 text-[10px] uppercase">time</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <p className="text-white/80 text-xs font-medium">{userName}</p>
            <span className="font-heading text-[11px] font-bold text-white/60 tracking-tight">Sprint Society</span>
          </div>
        </div>
      </div>
    );
  }

  if (template === 'gradient_pace') {
    return (
      <div className="relative w-full aspect-[9/16] rounded-3xl overflow-hidden flex flex-col p-6"
        style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #FF2E63 50%, #7B2FFF 100%)' }}>
        <div className="flex items-center gap-2 mb-auto">
          <span className="font-heading font-bold text-sm text-white/90 tracking-tight">Sprint Society</span>
        </div>
        <div className="space-y-6">
          <div>
            <p className="text-white/50 text-[10px] uppercase tracking-[0.2em]">Pace</p>
            <p className="font-mono text-5xl font-black text-white">{pace}</p>
            <p className="text-white/40 text-xs mt-1">/km</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <p className="font-mono text-xl font-bold text-white">{distance}</p>
              <p className="text-white/50 text-[11px] uppercase">km</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <p className="font-mono text-xl font-bold text-white">{duration}</p>
              <p className="text-white/50 text-[11px] uppercase">time</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <p className="text-white/70 text-xs font-medium">{userName}</p>
            <p className="text-white/40 text-xs">{date}</p>
          </div>
        </div>
        <p className="text-center text-white/20 text-[11px] mt-4">Kendu Entertainment</p>
      </div>
    );
  }

  if (template === 'achievement') {
    return (
      <div className="relative w-full aspect-[9/16] rounded-3xl overflow-hidden flex flex-col items-center justify-center p-6"
        style={{ background: 'linear-gradient(180deg, #1A1A2E 0%, #0F0F1A 100%)' }}>
        <div className="absolute top-6 left-6 flex items-center gap-2">
          <span className="font-heading font-bold text-sm text-accent-gold tracking-tight">Sprint Society</span>
        </div>
        <div className="w-24 h-24 rounded-full bg-accent-gold/10 border-2 border-accent-gold/40 flex items-center justify-center mb-6">
          <span className="text-4xl">🏆</span>
        </div>
        <p className="text-accent-gold text-[10px] font-bold uppercase tracking-[0.2em] mb-2">New Achievement</p>
        <p className="font-mono text-3xl font-black text-white mb-1">{distance} km</p>
        <p className="text-zinc-400 text-sm mb-6">in {duration} at {pace}/km</p>
        <div className="flex gap-2">
          {streak && streak > 0 && (
            <span className="bg-accent-gold/10 border border-accent-gold/20 px-3 py-1 rounded-full text-[10px] text-accent-gold font-semibold">
              🔥 {streak} day streak
            </span>
          )}
          {tier && (
            <span className="bg-accent-gold/10 border border-accent-gold/20 px-3 py-1 rounded-full text-[10px] text-accent-gold font-semibold capitalize">
              {tier}
            </span>
          )}
        </div>
        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
          <p className="text-zinc-500 text-xs">{userName}</p>
          <p className="text-zinc-600 text-xs">{date}</p>
        </div>
        <p className="absolute bottom-2 text-zinc-700 text-[11px]">Kendu Entertainment</p>
      </div>
    );
  }

  if (template === 'streak_fire') {
    const streakDays = streak || 0;
    return (
      <div className="relative w-full aspect-[9/16] rounded-3xl overflow-hidden flex flex-col p-6"
        style={{ background: 'linear-gradient(180deg, #1A0A00 0%, #FF4500 150%)' }}>
        <div className="flex items-center gap-2 mb-auto">
          <span className="font-heading font-bold text-sm text-orange-300 tracking-tight">Sprint Society</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <span className="text-6xl mb-4">{streakDays >= 30 ? '🌟' : streakDays >= 14 ? '⚡' : '🔥'}</span>
          <p className="font-mono text-6xl font-black text-white">{streakDays}</p>
          <p className="text-orange-200/60 text-sm uppercase tracking-wider mt-2">Day Streak</p>
        </div>
        <div className="space-y-3">
          <div className="flex gap-[3px]">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className={`flex-1 h-6 rounded ${i < Math.min(streakDays, 7) ? 'bg-orange-400/60' : 'bg-white/5'}`} />
            ))}
          </div>
          <div className="bg-white/5 rounded-xl p-3 flex justify-between">
            <div className="text-center">
              <p className="font-mono text-lg font-bold text-white">{distance}</p>
              <p className="text-white/40 text-[11px] uppercase">today</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-lg font-bold text-white">{pace}</p>
              <p className="text-white/40 text-[11px] uppercase">pace</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-lg font-bold text-white">{duration}</p>
              <p className="text-white/40 text-[11px] uppercase">time</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-orange-200/60 text-xs">{userName}</p>
            <p className="text-orange-200/30 text-xs">{date}</p>
          </div>
        </div>
        <p className="text-center text-orange-200/15 text-[11px] mt-3">Kendu Entertainment</p>
      </div>
    );
  }

  if (template === 'race_recap') {
    return (
      <div className="relative w-full aspect-[9/16] rounded-3xl overflow-hidden flex flex-col p-6"
        style={{ background: 'linear-gradient(180deg, #0A1628 0%, #0F0F1A 100%)' }}>
        <div className="flex items-center justify-between mb-6">
          <span className="font-heading font-bold text-sm text-blue-300 tracking-tight">Sprint Society</span>
          <span className="text-[10px] text-blue-300/60 font-mono">{date}</span>
        </div>
        <p className="text-blue-300/60 text-[10px] uppercase tracking-[0.2em] mb-2">Race Recap</p>
        <p className="font-heading text-2xl font-bold text-white mb-6">{userName}'s Run</p>
        <div className="flex-1 flex flex-col justify-center gap-4">
          <div className="bg-blue-500/5 border border-blue-500/15 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-blue-200/50 text-[10px] uppercase">Distance</span>
              <span className="font-mono text-2xl font-bold text-white">{distance} <span className="text-sm text-blue-300/50">km</span></span>
            </div>
            <div className="h-[1px] bg-blue-500/10" />
            <div className="flex items-center justify-between">
              <span className="text-blue-200/50 text-[10px] uppercase">Avg Pace</span>
              <span className="font-mono text-2xl font-bold text-white">{pace} <span className="text-sm text-blue-300/50">/km</span></span>
            </div>
            <div className="h-[1px] bg-blue-500/10" />
            <div className="flex items-center justify-between">
              <span className="text-blue-200/50 text-[10px] uppercase">Duration</span>
              <span className="font-mono text-2xl font-bold text-white">{duration}</span>
            </div>
            {run.elevation_gain > 0 && (
              <>
                <div className="h-[1px] bg-blue-500/10" />
                <div className="flex items-center justify-between">
                  <span className="text-blue-200/50 text-[10px] uppercase">Elevation</span>
                  <span className="font-mono text-2xl font-bold text-white">{Math.round(run.elevation_gain)} <span className="text-sm text-blue-300/50">m</span></span>
                </div>
              </>
            )}
          </div>
          <div className="flex gap-2 justify-center">
            {streak && streak > 0 && (
              <span className="bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-[10px] text-blue-300 font-semibold">
                🔥 {streak}d streak
              </span>
            )}
            {tier && (
              <span className="bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-[10px] text-blue-300 font-semibold capitalize">
                {tier}
              </span>
            )}
          </div>
        </div>
        <p className="text-center text-blue-300/15 text-[11px] mt-3">Kendu Entertainment</p>
      </div>
    );
  }

  if (template === 'neon_glow') {
    return (
      <div className="relative w-full aspect-[9/16] rounded-3xl overflow-hidden flex flex-col p-6"
        style={{ background: 'linear-gradient(135deg, #0D001A 0%, #1A0033 50%, #330066 100%)' }}>
        <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(ellipse at 30% 70%, #A855F7, transparent 60%)' }} />
        <div className="relative z-10 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-auto">
            <span className="font-heading font-bold text-sm text-purple-300/90 tracking-tight">Sprint Society</span>
            <span className="text-[11px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full font-bold">PRO</span>
          </div>
          <div className="space-y-5">
            <div className="text-center">
              <p className="font-mono text-5xl font-black text-white" style={{ textShadow: '0 0 20px #A855F7, 0 0 40px #7C3AED' }}>{distance}</p>
              <p className="text-purple-300/50 text-xs uppercase tracking-[0.3em] mt-2">kilometers</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-center">
                <p className="font-mono text-xl font-bold text-white">{duration}</p>
                <p className="text-purple-300/40 text-[11px] uppercase">time</p>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-center">
                <p className="font-mono text-xl font-bold text-white">{pace}</p>
                <p className="text-purple-300/40 text-[11px] uppercase">/km</p>
              </div>
            </div>
          </div>
          <div className="mt-auto pt-4 flex items-center justify-between">
            <p className="text-purple-200/60 text-xs">{userName}</p>
            <p className="text-purple-300/30 text-xs">{date}</p>
          </div>
        </div>
      </div>
    );
  }

  if (template === 'gold_elite') {
    return (
      <div className="relative w-full aspect-[9/16] rounded-3xl overflow-hidden flex flex-col p-6"
        style={{ background: 'linear-gradient(180deg, #1A1500 0%, #2D2200 50%, #1A1500 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(ellipse at 50% 30%, #FFD700, transparent 60%)' }} />
        <div className="relative z-10 flex-1 flex flex-col">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-2xl">👑</span>
            <span className="font-heading font-bold text-base text-amber-200 tracking-tight">Elite Runner</span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-6">
              <div>
                <p className="font-mono text-6xl font-black text-amber-100">{distance}</p>
                <p className="text-amber-400/40 text-xs uppercase tracking-[0.2em] mt-1">km conquered</p>
              </div>
              <div className="flex gap-4 justify-center">
                <div>
                  <p className="font-mono text-lg font-bold text-amber-200">{pace}</p>
                  <p className="text-amber-500/40 text-[11px]">PACE</p>
                </div>
                <div className="w-px bg-amber-500/20" />
                <div>
                  <p className="font-mono text-lg font-bold text-amber-200">{duration}</p>
                  <p className="text-amber-500/40 text-[11px]">TIME</p>
                </div>
              </div>
              {streak && streak > 0 && (
                <p className="text-amber-400/60 text-xs">🔥 {streak}-day streak</p>
              )}
            </div>
          </div>
          <div className="mt-auto pt-4 border-t border-amber-500/10 text-center">
            <p className="text-amber-200/60 text-xs font-semibold">{userName}</p>
            <p className="text-amber-500/20 text-[11px] mt-0.5">{date} · Sprint Society</p>
          </div>
        </div>
      </div>
    );
  }

  if (template === 'midnight_run') {
    return (
      <div className="relative w-full aspect-[9/16] rounded-3xl overflow-hidden flex flex-col p-6"
        style={{ background: 'linear-gradient(180deg, #020617 0%, #0F172A 40%, #1E293B 100%)' }}>
        <div className="absolute top-0 left-0 right-0 h-1/3 opacity-30" style={{ background: 'radial-gradient(ellipse at 50% 0%, #3B82F6, transparent 70%)' }} />
        <div className="relative z-10 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-auto">
            <span className="text-lg">🌙</span>
            <span className="font-heading font-bold text-sm text-blue-200/80 tracking-tight">Midnight Run</span>
          </div>
          <div className="space-y-5">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/5">
              <p className="text-blue-100/40 text-[10px] uppercase tracking-wider">Distance</p>
              <p className="font-mono text-4xl font-black text-white mt-1">{distance} <span className="text-lg text-blue-300/40">km</span></p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/5 rounded-xl p-2.5 text-center">
                <p className="font-mono text-sm font-bold text-white">{pace}</p>
                <p className="text-blue-300/30 text-[11px]">PACE</p>
              </div>
              <div className="bg-white/5 rounded-xl p-2.5 text-center">
                <p className="font-mono text-sm font-bold text-white">{duration}</p>
                <p className="text-blue-300/30 text-[11px]">TIME</p>
              </div>
              <div className="bg-white/5 rounded-xl p-2.5 text-center">
                <p className="font-mono text-sm font-bold text-white">{streak || 0}d</p>
                <p className="text-blue-300/30 text-[11px]">STREAK</p>
              </div>
            </div>
          </div>
          <div className="mt-auto pt-4 flex items-center justify-between">
            <p className="text-blue-200/50 text-xs">{userName}</p>
            <p className="text-blue-300/20 text-xs">{date}</p>
          </div>
        </div>
      </div>
    );
  }

  // Default: dark_minimal (original RunCard style)
  return (
    <div className="relative w-full aspect-[9/16] rounded-3xl overflow-hidden flex flex-col p-6"
      style={{ background: 'linear-gradient(180deg, #0A0A0F 0%, #12121A 50%, #0A0A0F 100%)' }}>
      <div className="flex items-center gap-2 mb-6">
        <span className="text-accent-green text-xl">⚡</span>
        <span className="font-heading font-bold text-sm tracking-tight">
          Sprint <span className="text-accent-green">Society</span>
        </span>
      </div>
      <div className="flex-1 flex items-center justify-center mb-6 relative">
        {hasRoute ? (
          <RouteShape polyline={run.map_polyline} width={200} height={160} strokeColor="#22c55e" strokeWidth={2.5} opacity={0.4} />
        ) : (
          <div className="w-32 h-32 rounded-full border-2 border-accent-green/20 flex items-center justify-center">
            <span className="text-4xl">🏃</span>
          </div>
        )}
      </div>
      <div className="space-y-4">
        <div className="text-center">
          <p className="font-mono text-4xl font-bold text-white">{distance}</p>
          <p className="text-white/40 text-xs uppercase tracking-wider mt-1">Distance</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center bg-white/5 rounded-xl p-3">
            <p className="font-mono text-xl font-bold">{duration}</p>
            <p className="text-white/40 text-[10px] uppercase">Time</p>
          </div>
          <div className="text-center bg-white/5 rounded-xl p-3">
            <p className="font-mono text-xl font-bold">{pace}</p>
            <p className="text-white/40 text-[10px] uppercase">Pace /km</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 text-xs">
          {streak && streak > 0 && (
            <span className="bg-white/5 px-2 py-1 rounded-full">🔥 {streak}d</span>
          )}
          {tier && (
            <span className="bg-white/5 px-2 py-1 rounded-full capitalize">
              {tier === 'advanced' ? '👑' : tier === 'intermediate' ? '⚡' : '🌱'} {tier}
            </span>
          )}
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
        <p className="text-white/60 text-xs">{userName}</p>
        <p className="text-white/30 text-xs">{date}</p>
      </div>
      <p className="text-center text-white/15 text-[11px] mt-3">Kendu Entertainment</p>
    </div>
  );
}

export function SharePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<TemplateName>('dark_minimal');
  const [downloading, setDownloading] = useState(false);
  const [skinToBuy, setSkinToBuy] = useState<TemplateName | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { data } = useQuery({
    queryKey: ['runs-for-share'],
    queryFn: () => api.get('/runs?limit=10').then(r => r.data),
  });

  // Auto-select most recent run when data loads
  useEffect(() => {
    if (!data || selectedRunId) return;
    const runs = data?.runs || data || [];
    if (runs.length > 0) setSelectedRunId(runs[0].id);
  }, [data, selectedRunId]);

  const { data: xp } = useQuery({
    queryKey: ['xp'],
    queryFn: () => api.get('/gamification/xp').then(r => r.data),
  });

  const { data: tier } = useQuery({
    queryKey: ['tier'],
    queryFn: () => api.get('/coaching/tier').then(r => r.data),
  });

  const { data: kenduBalance } = useQuery({
    queryKey: ['kendu-balance'],
    queryFn: () => api.get('/kendu/balance').then(r => r.data),
  });

  const { data: ownedSkins = [] } = useQuery({
    queryKey: ['owned-skins'],
    queryFn: () => api.get('/kendu/skins').then(r => r.data).catch(() => []),
  });

  const buySkinMutation = useMutation({
    mutationFn: (skinId: string) => api.post('/kendu/spend/card-skin', { skinId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kendu-balance'] });
      queryClient.invalidateQueries({ queryKey: ['owned-skins'] });
      if (skinToBuy) setActiveTemplate(skinToBuy);
      setSkinToBuy(null);
    },
  });

  const selectedRun = data?.find ? data.find((r: any) => r.id === selectedRunId) : data?.runs?.find((r: any) => r.id === selectedRunId);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toJpeg(cardRef.current, {
        pixelRatio: 3,
        quality: 0.92,
        width: cardRef.current.offsetWidth,
        height: cardRef.current.offsetHeight,
        style: { transform: 'none', margin: '0' },
      });
      const link = document.createElement('a');
      link.download = `sprint-society-run-${selectedRunId}.jpg`;
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
      const dataUrl = await toJpeg(cardRef.current, { pixelRatio: 3, quality: 0.92 });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'sprint-society-run.jpg', { type: 'image/jpeg' });
      if (navigator.share) {
        await navigator.share({ files: [file], title: 'My Sprint Society Run' });
      } else {
        handleDownload();
      }
    } catch {
      handleDownload();
    }
  };

  const runs = data?.runs || data || [];

  return (
    <AppShell>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
        <motion.div variants={fadeUp}>
          <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-600">Social</p>
          <h1 className="font-heading text-xl font-bold mt-0.5">Share Your Run</h1>
        </motion.div>

        {!selectedRun ? (
          <>
            <motion.p variants={fadeUp} className="text-zinc-500 text-sm">
              Pick a run to create a shareable card
            </motion.p>
            <motion.div variants={fadeUp} className="space-y-2">
              {runs.map((run: any) => (
                <button
                  key={run.id}
                  onClick={() => setSelectedRunId(run.id)}
                  className="w-full card p-4 text-left hover:border-zinc-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                        <span className="text-sm">🏃</span>
                      </div>
                      <div>
                        <p className="font-mono text-sm font-bold">{(run.distance_meters / 1000).toFixed(1)} km</p>
                        <p className="text-[11px] text-zinc-500">{formatDate(run.start_date)}</p>
                      </div>
                    </div>
                    <span className="text-zinc-600 text-sm">→</span>
                  </div>
                </button>
              ))}
              {runs.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-3xl mb-3">🏆</p>
                  <p className="text-zinc-500 text-sm">Complete a run first</p>
                  <p className="text-zinc-600 text-xs mt-1">Then come back to create shareable cards</p>
                </div>
              )}
            </motion.div>
          </>
        ) : (
          <motion.div variants={fadeUp} className="space-y-4">
            <button
              onClick={() => setSelectedRunId(null)}
              className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors"
            >
              ← Pick different run
            </button>

            {/* Template selector */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
              {TEMPLATES.map(t => {
                const isOwned = !t.premium || (ownedSkins as string[]).includes(t.key);
                const isLocked = t.premium && !isOwned;
                return (
                  <button
                    key={t.key}
                    onClick={() => {
                      if (isLocked) {
                        setSkinToBuy(t.key);
                      } else {
                        setActiveTemplate(t.key);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                      activeTemplate === t.key
                        ? 'bg-accent/10 text-accent border border-accent/20'
                        : isLocked
                          ? 'bg-orange-500/5 text-orange-400/60 border border-orange-500/20'
                          : 'bg-bg-secondary text-zinc-500 border border-bg-tertiary hover:text-zinc-300'
                    }`}
                  >
                    <span>{t.icon}</span>
                    {t.label}
                    {isLocked && <span className="text-[11px] ml-0.5">🔒</span>}
                  </button>
                );
              })}
            </div>

            {/* Background image picker for photo template */}
            {activeTemplate === 'photo_route' && (
              <div className="max-w-[320px] mx-auto">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return; }
                    const reader = new FileReader();
                    reader.onload = () => setBackgroundImage(reader.result as string);
                    reader.readAsDataURL(file);
                  }}
                />
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full py-2.5 rounded-lg border border-dashed border-zinc-700 text-[11px] font-semibold text-zinc-400 hover:text-accent hover:border-accent/30 transition-colors mb-3"
                >
                  {backgroundImage ? '📸 Change background photo' : '📸 Add background photo'}
                </button>
              </div>
            )}

            {/* Card preview */}
            <div ref={cardRef} className="max-w-[320px] mx-auto">
              <CardTemplate
                template={activeTemplate}
                run={selectedRun}
                userName={user?.name || 'Runner'}
                streak={xp?.current_streak_days}
                tier={tier?.tier}
                backgroundImage={activeTemplate === 'photo_route' ? backgroundImage : null}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 max-w-[320px] mx-auto">
              <Button onClick={handleDownload} variant="secondary" fullWidth disabled={downloading}>
                {downloading ? 'Saving...' : 'Download'}
              </Button>
              <Button onClick={handleShare} fullWidth>
                Share
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>

      <KenduSpendConfirmModal
        isOpen={skinToBuy !== null}
        onClose={() => setSkinToBuy(null)}
        onConfirm={() => skinToBuy && buySkinMutation.mutate(skinToBuy)}
        title="Unlock Premium Skin"
        description={`Unlock the "${TEMPLATES.find(t => t.key === skinToBuy)?.label}" card template forever`}
        cost={40}
        currentBalance={kenduBalance?.spendable_balance ?? 0}
        loading={buySkinMutation.isPending}
      />
    </AppShell>
  );
}
