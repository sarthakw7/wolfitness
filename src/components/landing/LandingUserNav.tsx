'use client';

import { useSupabase } from '@/components/SupabaseProvider';
import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

interface LandingUserNavProps {
  email?: string;
}

export function LandingUserNav({ email }: LandingUserNavProps) {
  const { supabase } = useSupabase();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase!.auth.signOut();
    router.refresh();
    toast.success('Signed out of WOLFITNESS.');
  };

  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
          <UserIcon className="h-3 w-3 text-white" />
        </div>
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50">
          {email?.split('@')[0]}
        </span>
      </div>
      
      <button 
        onClick={handleSignOut}
        className="text-[9px] font-black uppercase tracking-[0.2em] text-red-400 hover:text-red-300 transition-colors flex items-center gap-2 border-l border-white/10 pl-6"
      >
        <LogOut className="h-3 w-3" />
        Log Out
      </button>
    </div>
  );
}
