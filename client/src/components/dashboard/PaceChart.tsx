import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../lib/api';
import { formatPace } from '../../lib/formatters';

export function PaceChart() {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['chart-data'],
    queryFn: () => api.get('/runs/chart-data?weeks=8').then(r => r.data),
  });

  if (isLoading || !chartData || chartData.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-white/30 text-sm">
        {isLoading ? 'Loading...' : 'Complete your first run to see trends'}
      </div>
    );
  }

  const formatted = chartData.map((d: any) => ({
    date: new Date(d.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    pace: Math.round(d.average_pace_per_km),
    distance: (d.distance_meters / 1000).toFixed(1),
  }));

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formatted} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fill: '#6B6B80', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            reversed
            tick={{ fill: '#6B6B80', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatPace(v)}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{ background: '#12121A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: '#A0A0B0' }}
            formatter={(value: number) => [formatPace(value) + '/km', 'Pace']}
          />
          <Line
            type="monotone"
            dataKey="pace"
            stroke="#39FF14"
            strokeWidth={2}
            dot={{ fill: '#39FF14', r: 3 }}
            activeDot={{ r: 5, fill: '#39FF14', stroke: '#0A0A0F', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
