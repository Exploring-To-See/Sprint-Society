import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import api from '../../lib/api';
import { formatPace } from '../../lib/formatters';

export function PaceChart() {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['chart-data'],
    queryFn: () => api.get('/runs/chart-data?weeks=12').then(r => r.data),
  });

  if (isLoading) {
    return (
      <div className="h-[140px] flex items-center justify-center">
        <div className="flex gap-[3px] items-end">
          {[20, 35, 28, 42, 30, 38, 25, 40].map((h, i) => (
            <div
              key={i}
              className="w-[3px] rounded-full bg-bg-tertiary animate-pulse"
              style={{ height: h, animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-[140px] flex flex-col items-center justify-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-bg-tertiary flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 12L5.5 7L8.5 9.5L14 4" stroke="#3F3F46" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="text-[11px] text-zinc-600">Your pace trend will appear after a few runs</p>
      </div>
    );
  }

  const formatted = chartData.map((d: any) => ({
    date: new Date(d.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    pace: Math.round(d.average_pace_per_km),
    distance: (d.distance_meters / 1000).toFixed(1),
  }));

  return (
    <div className="h-[140px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 8, right: 4, bottom: 4, left: -10 }}>
          <defs>
            <linearGradient id="paceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F97316" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#F97316" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fill: '#3F3F46', fontSize: 9, fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            reversed
            tick={{ fill: '#3F3F46', fontSize: 9, fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatPace(v)}
            domain={['auto', 'auto']}
            width={40}
          />
          <Tooltip
            contentStyle={{
              background: '#131316',
              border: '1px solid #1E1E22',
              borderRadius: 10,
              fontSize: 11,
              padding: '8px 12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}
            labelStyle={{ color: '#71717A', fontSize: 10, marginBottom: 2 }}
            formatter={(value: number) => [formatPace(value) + '/km', 'Pace']}
          />
          <Area
            type="monotone"
            dataKey="pace"
            stroke="#F97316"
            strokeWidth={2}
            fill="url(#paceGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#F97316', stroke: '#131316', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
