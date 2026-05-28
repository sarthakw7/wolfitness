import Link from 'next/link';
import { Dumbbell, ShieldCheck, LayoutDashboard } from 'lucide-react';
import { createClient } from '@/lib/supabaseServer';
import { LandingUserNav } from './LandingUserNav';

export async function LandingHeader() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  let isAdmin = false;
  let userProfile = null;

  if (session) {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('role, username, full_name')
        .eq('id', session.user.id)
        .single();
      
      userProfile = profile;
      isAdmin = profile?.role === 'admin';
    } catch (e) {
      console.error('Error fetching admin status:', e);
    }
  }

  const navLinks = [
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'Programs', href: '#' },
    { label: 'Community', href: '#' },
  ];

  return (
    <header className="absolute top-0 left-0 w-full z-50 grid grid-cols-3 items-center px-12 py-4">
      {/* LEFT: Nav Links */}
      <nav className="hidden lg:flex items-center gap-10">
        {navLinks.map(link => (
          <Link 
            key={link.label} 
            href={link.href} 
            className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-all"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* CENTER: Logo */}
      <div className="flex justify-center">
        <Link href="/" className="flex items-center gap-3">
          <div className="bg-white p-1.5">
            <Dumbbell className="h-4 w-4 text-black" suppressHydrationWarning />
          </div>
          <span className="text-sm font-black tracking-tighter uppercase text-white drop-shadow-sm font-display italic">
            WOLFITNESS
          </span>        </Link>
      </div>

      {/* RIGHT: Auth Actions */}
      <div className="flex justify-end items-center gap-6">
        {isAdmin && (
          <Link 
            href="/admin" 
            className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-blue-400 hover:text-blue-300 transition-colors border border-blue-400/20 px-4 py-2 bg-blue-400/5 hover:bg-blue-400/10"
          >
            <ShieldCheck className="h-3 w-3" suppressHydrationWarning />
            Admin
          </Link>
        )}

        {session ? (
          <div className="flex items-center gap-8 pl-8 border-l border-white/10">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-white/80 hover:text-white transition-colors"
            >
              <LayoutDashboard className="h-3 w-3" suppressHydrationWarning />
              Dashboard
            </Link>
            <LandingUserNav email={session.user.email} />
          </div>
        ) : (
          <div className="flex items-center gap-6">
            <Link 
              href="/auth/login" 
              className="text-[9px] font-black uppercase tracking-[0.4em] text-white/60 hover:text-white transition-all"
            >
              Sign In
            </Link>
            <Link 
              href="/onboarding/protocol" 
              className="h-11 px-8 flex items-center justify-center text-[9px] font-black uppercase tracking-[0.4em] bg-white text-black hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              Start Training
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
