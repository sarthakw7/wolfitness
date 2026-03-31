'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Quote, PlayCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function DailySignal() {
  const { supabase, session } = useSupabase();
  const [signal, setSignal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSignal() {
      if (!session?.user) return;

      try {
        // 1. Find if this user is enrolled with a mentor in Signal
        const { data: enrollment } = await (supabase as any)
          .from('enrollments')
          .select('mentor_id, profiles!mentor_id(full_name)')
          .eq('coach_id', session.user.id)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle();

        if (enrollment?.mentor_id) {
          // 2. Fetch the latest signal from that mentor
          const { data: latestSignal } = await supabase!
            .from('mentor_signals')
            .select('*')
            .eq('mentor_id', enrollment.mentor_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (latestSignal) {
            setSignal({
              ...latestSignal,
              mentor_name: enrollment.profiles?.full_name
            });
          }
        }
      } catch (error) {
        console.error('Error fetching daily signal:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSignal();
  }, [session, supabase]);

  if (loading || !signal) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-zinc-950 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)] overflow-hidden">
        <div className="bg-emerald-500/10 px-4 py-2 flex items-center justify-between border-b border-emerald-500/10">
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-emerald-500 fill-emerald-500" />
            <span className="text-[10px] font-black tracking-[0.2em] text-emerald-500 uppercase">Incoming Signal</span>
          </div>
          <span className="text-[9px] font-bold text-emerald-500/50 uppercase tracking-widest">
            {signal.mentor_name}
          </span>
        </div>
        <CardContent className="p-6 space-y-4">
          <div className="relative">
            <Quote className="absolute -top-2 -left-2 w-8 h-8 text-emerald-500/5 rotate-180" />
            <p className="text-lg md:text-xl font-bold tracking-tight text-zinc-100 leading-tight italic">
              "{signal.quote}"
            </p>
          </div>
          
          {signal.video_url && (
            <a 
              href={signal.video_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-emerald-500 transition-colors group w-fit"
            >
              <PlayCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Watch Video Briefing
            </a>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
