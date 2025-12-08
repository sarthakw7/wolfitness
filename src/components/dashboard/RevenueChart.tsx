'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const data = [
  { name: 'Jan', revenue: 2500 },
  { name: 'Feb', revenue: 3200 },
  { name: 'Mar', revenue: 2800 },
  { name: 'Apr', revenue: 3800 },
  { name: 'May', revenue: 4200 },
  { name: 'Jun', revenue: 3900 },
  { name: 'Jul', revenue: 4500 },
  { name: 'Aug', revenue: 4800 },
  { name: 'Sep', revenue: 4250 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border p-3 rounded-lg shadow-lg ring-1 ring-black/5">
        <p className="text-sm font-medium text-foreground mb-1">{label}</p>
        <p className="text-sm text-green-500 font-bold">
          ${payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export function RevenueChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 0,
          }}
        >
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
            tickFormatter={(value) => `$${value}`} 
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.4)' }} />
          <Bar
            dataKey="revenue"
            fill="hsl(142.1 76.2% 36.3%)" // Green-600
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
