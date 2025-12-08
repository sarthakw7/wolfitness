'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const data = [
  { name: 'Mon', volume: 4000 },
  { name: 'Tue', volume: 3000 },
  { name: 'Wed', volume: 2000 },
  { name: 'Thu', volume: 2780 },
  { name: 'Fri', volume: 1890 },
  { name: 'Sat', volume: 2390 },
  { name: 'Sun', volume: 3490 },
  { name: 'Mon', volume: 4200 },
  { name: 'Tue', volume: 4800 },
  { name: 'Wed', volume: 3800 },
  { name: 'Thu', volume: 5100 },
  { name: 'Fri', volume: 4300 },
  { name: 'Sat', volume: 5800 },
  { name: 'Sun', volume: 6100 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border p-3 rounded-lg shadow-lg ring-1 ring-black/5">
        <p className="text-sm font-medium text-foreground mb-1">{label}</p>
        <p className="text-sm text-primary font-bold">
          {payload[0].value.toLocaleString()} kg
        </p>
      </div>
    );
  }
  return null;
};

export function VolumeChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="name" 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            tickMargin={10}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => `${value / 1000}k`} 
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="volume"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorVolume)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
