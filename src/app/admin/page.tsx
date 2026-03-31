import { getEcosystemStats } from '@/services/admin';
import { Users, Dumbbell, CreditCard, ArrowUpRight } from 'lucide-react';

export default async function AdminOverviewPage() {
  const stats = await getEcosystemStats();

  const cards = [
    { label: 'Total Athletes', value: stats.totalUsers, icon: Users, trend: '+12%' },
    { label: 'Published Programs', value: stats.totalPrograms, icon: Dumbbell, trend: '+3' },
    { label: 'Active Enrollments', value: stats.totalEnrollments, icon: CreditCard, trend: '+24%' },
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-2">
        <span className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em]">
          Command Center
        </span>
        <h1 className="text-4xl font-black tracking-tighter uppercase font-display">
          Ecosystem Overview
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-card border-2 border-border p-8 space-y-6 group hover:border-foreground transition-all">
            <div className="flex justify-between items-start">
              <div className="bg-secondary p-3">
                <card.icon className="h-5 w-5 text-foreground" />
              </div>
              <span className="text-[10px] font-bold text-green-500 flex items-center gap-1">
                {card.trend} <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                {card.label}
              </p>
              <p className="text-4xl font-black tracking-tighter font-display">
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Placeholder */}
      <div className="space-y-6">
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border pb-4">
          Recent Network Activity
        </h3>
        <div className="bg-card border-2 border-border p-12 text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50">
            No recent alerts in the network.
          </p>
        </div>
      </div>
    </div>
  );
}
