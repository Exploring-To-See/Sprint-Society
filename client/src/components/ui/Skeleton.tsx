import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'line' | 'circle' | 'card';
}

export function Skeleton({ className = '', variant = 'line' }: SkeletonProps) {
  const baseClass = 'animate-pulse bg-bg-tertiary/60 rounded-lg';

  if (variant === 'circle') {
    return <div className={`${baseClass} rounded-full ${className}`} />;
  }

  if (variant === 'card') {
    return <div className={`${baseClass} rounded-xl ${className}`} />;
  }

  return <div className={`${baseClass} ${className}`} />;
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card p-4 space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${i === 0 ? 'w-1/3' : i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="flex rounded-xl bg-bg-secondary border border-bg-tertiary divide-x divide-bg-tertiary overflow-hidden">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex-1 p-4 space-y-2">
          <Skeleton className="h-2 w-12" />
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-3.5 flex items-center gap-3">
          <Skeleton variant="circle" className="w-9 h-9 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 p-4 animate-fade-in">
      <Skeleton variant="card" className="w-full h-14" />
      <Skeleton variant="card" className="w-full h-[88px]" />
      <div className="flex rounded-xl bg-bg-secondary border border-bg-tertiary divide-x divide-bg-tertiary overflow-hidden">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex-1 p-4 space-y-2">
            <Skeleton className="h-2 w-12" />
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
      <Skeleton variant="card" className="w-full h-32" />
      <Skeleton variant="card" className="w-full h-24" />
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="w-full h-[300px] bg-bg-tertiary/30 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-zinc-600 border-t-accent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-[11px] text-zinc-600">Loading map...</p>
      </div>
    </div>
  );
}
