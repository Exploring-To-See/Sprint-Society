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
      <div className="h-36 flex items-center justify-center text-zinc-600 text-sm">
        {isLoading ? 'Loading...' : 'Run data will appear here'}
      </div>
    );
  }

  const formatted = chartData.map((d: any) => ({
    date: new Date(d.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    pace: Math.round(d.average_pace_per_km),
    distance: (d.distance_meters / 1000).toFixed(1),
  }));

  return (
    <div className="h-36">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formatted} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fill: '#52525B', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            reversed
            tick={{ fill: '#52525B', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatPace(v)}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{ background: '#18181B', border: '1px solid #27272A', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#A1A1AA' }}
            formatter={(value: number) => [formatPace(value) + '/km', 'Pace']}
          />
          <Line
            type="monotone"
            dataKey="pace"
            stroke="#F97316"
            strokeWidth={2}
            dot={{ fill: '#F97316', r: 3 }}
            activeDot={{ r: 5, fill: '#F97316', stroke: '#09090B', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
