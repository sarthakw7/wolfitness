import { createClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { SmartLogInput } from '@/components/dashboard/SmartLogInput';
import Link from 'next/link';
import { BotMessageSquare, Activity } from 'lucide-react';

export const metadata = {
  title: 'Nutrition Hub | WFF',
};

export default async function NutritionDashboardPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <main className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tighter">Nutrition Hub</h1>
          <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest mt-1">
            Fuel optimization matrix
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <SmartLogInput />
            
            {/* Macro Visualization Frame */}
            <div className="bg-zinc-950 border border-zinc-900 p-8 text-center mt-6 flex flex-col items-center justify-center min-h-[200px]">
                <Activity className="h-8 w-8 text-zinc-700 mb-4" />
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500">Metrics Syncing...</h3>
                <p className="text-xs font-bold text-zinc-600 mt-2 uppercase tracking-widest">Logging fuel targets above will populate databank</p>
            </div>
          </div>

          <div className="md:col-span-1 space-y-4 shadow-xl shadow-emerald-900/5">
            <Link href="/dashboard/nutrition/chat" className="group block h-full">
              <div className="bg-emerald-950/20 border border-emerald-900/50 p-6 flex flex-col justify-between h-full hover:bg-emerald-900/20 transition-all duration-300">
                <div>
                    <BotMessageSquare className="h-8 w-8 text-emerald-500 mb-4 group-hover:scale-110 transition-transform" />
                    <h2 className="text-lg font-black uppercase tracking-tighter text-emerald-400">Consult AI Coach</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-2 line-clamp-3">
                        Launch a real-time neural session to get elite guidance on your next meal or macro split.
                    </p>
                </div>
                <div className="mt-8">
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-500 border-b border-emerald-500/30 pb-1 group-hover:border-emerald-500 transition-colors">
                        Initialize Session →
                    </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
