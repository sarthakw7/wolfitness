import Link from 'next/link';
import { ShieldAlert, Clock, CheckCircle2, ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';

export const revalidate = 0;

export default function CoachPendingPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-xl w-full space-y-12 text-center">
          
          {/* Status Icon */}
          <div className="relative inline-block">
            <div className="h-32 w-32 rounded-none border-2 border-amber-500/20 flex items-center justify-center bg-amber-500/5 animate-pulse">
                <ShieldAlert className="h-16 w-16 text-amber-500" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-black p-1">
                <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </div>

          {/* Text Content */}
          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-amber-500/60">
                Verification Status: Pending
            </span>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.85] font-display italic">
                Awaiting<br />Review.
            </h1>
            <p className="text-xs md:text-sm font-bold uppercase tracking-widest text-white/40 max-w-md mx-auto leading-relaxed">
                Your application has been received. Our team is currently vetting your credentials to ensure platform integrity.
            </p>
          </div>

          {/* Checklist */}
          <div className="grid grid-cols-1 gap-4 max-w-sm mx-auto">
             <div className="flex items-center gap-4 p-4 border border-white/5 bg-white/5 text-left group">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest">Profile Created</p>
                    <p className="text-[9px] font-bold text-white/30 uppercase">Completed successfully</p>
                </div>
             </div>
             <div className="flex items-center gap-4 p-4 border border-amber-500/20 bg-amber-500/5 text-left">
                <Clock className="h-5 w-5 text-amber-500 shrink-0 animate-spin-slow" />
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest">Admin Vetting</p>
                    <p className="text-[9px] font-bold text-amber-500/50 uppercase">Estimated: 24-48 Hours</p>
                </div>
             </div>
          </div>

          {/* Actions */}
          <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
             <Link href="/dashboard/coach">
                <Button className="h-12 px-8 rounded-none bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    Refresh Dashboard
                </Button>
             </Link>
             <Link href="/onboarding/coach">
                <Button variant="outline" className="h-12 px-8 rounded-none border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                    Update Application
                </Button>
             </Link>
          </div>

          <div className="pt-12">
            <Link href="/" className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 hover:text-white transition-colors flex items-center justify-center gap-2">
                <ArrowLeft className="h-3 w-3" /> Back to Home
            </Link>
          </div>

        </div>
      </main>

      {/* Decorative Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
}
