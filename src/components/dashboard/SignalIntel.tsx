'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Target, Zap, Award, BarChart3 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export function SignalIntel() {
  const { supabase, session } = useSupabase();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEcosystemIntel() {
      if (!session?.user) return;

      try {
        // 1. Get Mentor Info and Assessment from unified database
        const { data: profile } = await supabase!
          .from('profiles')
          .select('vibe_type, goal')
          .eq('id', session.user.id)
          .single();

        const { data: enrollment } = await (supabase as any)
          .from('enrollments')
          .select('mentor_id, profiles!mentor_id(full_name, avatar_url)')
          .eq('coach_id', session.user.id)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle();

        // 2. Get Directive Completion Stats (Discipline Score)
        const { data: directives } = await supabase!
          .from('directives')
          .select('status')
          .eq('coach_id', session.user.id);

        const total = directives?.length || 0;
        const completed = directives?.filter(d => d.status === 'completed').length || 0;
        const disciplineScore = total > 0 ? Math.round((completed / total) * 100) : 0;

        setData({
          mentorName: enrollment?.profiles?.full_name,
          vibeType: profile?.vibe_type || 'Uncalibrated',
          disciplineScore,
          totalDirectives: total,
          completedDirectives: completed
        });
      } catch (error) {
        console.error('Error fetching ecosystem intel:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchEcosystemIntel();
  }, [session, supabase]);

  if (loading) return (
    <Card className="border-none shadow-sm animate-pulse">
        <div className="h-48 bg-muted rounded-xl" />
    </Card>
  );

  return (
    <Card className="border-none shadow-sm bg-zinc-950 text-white overflow-hidden relative">
      {/* Abstract Background Decoration */}
      <div className="absolute top-0 right-0 p-4 opacity-[0.05] pointer-events-none">
        <ShieldCheck className="w-24 h-24 text-emerald-500" />
      </div>

      <CardHeader className="pb-4 border-b border-white/5">
        <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-2">
                <Zap className="w-3 h-3 fill-emerald-500" /> Signal Authority
            </CardTitle>
            <Badge variant="outline" className="text-[8px] border-emerald-500/30 text-emerald-500 font-bold">ECOSYSTEM SYNC</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        {/* Mentor Info */}
        <div className="space-y-1">
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Assigned Mentor</p>
            <p className="text-sm font-black text-white uppercase tracking-tight">
                {data?.mentorName || 'No Mentor Assigned'}
            </p>
        </div>

        {/* Discipline Score */}
        <div className="space-y-3">
            <div className="flex justify-between items-end">
                <div className="space-y-1">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Award className="w-3 h-3 text-emerald-500" /> Discipline Score
                    </p>
                    <p className="text-2xl font-black text-white">{data?.disciplineScore}%</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-emerald-500 uppercase">{data?.completedDirectives}/{data?.totalDirectives} DONE</p>
                </div>
            </div>
            <Progress value={data?.disciplineScore} className="h-1 bg-white/5 rounded-none" />
        </div>

        {/* Vibe Status */}
        <div className="pt-2 grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Target className="w-3 h-3 text-emerald-500" /> Current Vibe
                </p>
                <p className="text-xs font-black text-zinc-200 uppercase">{data?.vibeType}</p>
            </div>
            <div className="space-y-1">
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                    <BarChart3 className="w-3 h-3 text-emerald-500" /> Reliability
                </p>
                <p className="text-xs font-black text-zinc-200 uppercase">
                    {data?.disciplineScore > 80 ? 'HIGH' : data?.disciplineScore > 50 ? 'STABLE' : 'LOW'}
                </p>
            </div>
        </div>

        <div className="pt-4 border-t border-white/5">
            <p className="text-[8px] text-zinc-600 font-bold leading-relaxed uppercase">
                Data synchronized with Signal Mental Authority Network. Keep your discipline high to unlock elite systems.
            </p>
        </div>
      </CardContent>
    </Card>
  );
}
