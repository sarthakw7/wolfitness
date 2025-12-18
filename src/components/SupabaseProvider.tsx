'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient'; // Ensure this points to your client-side supabase client
import { Session, SupabaseClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

// Define the shape of our context
interface SupabaseContextType {
  supabase: SupabaseClient | null;
  session: Session | null;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children, initialSession }: { children: React.ReactNode; initialSession: Session | null }) {
  const [supabase] = useState(() => createClient()); // Initialize client-side Supabase
  const [session, setSession] = useState<Session | null>(initialSession);
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Only update session if it changes, to avoid unnecessary re-renders
    if (session?.access_token !== initialSession?.access_token) {
        setSession(initialSession);
    }

    // Listen for auth changes and update the session state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);

      // Handle React Query cache based on auth events
      if (event === 'SIGNED_IN') {
        // Force a re-fetch of the profile when user signs in
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        router.refresh();
      } else if (event === 'SIGNED_OUT') {
        // Clear all data when user signs out to prevent stale UI
        queryClient.removeQueries();
        queryClient.clear(); 
        router.refresh();
      } else if (event === 'TOKEN_REFRESHED') {
         // Good practice to ensure profile is fresh on token refresh too
         queryClient.invalidateQueries({ queryKey: ['profile'] });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, initialSession, session?.access_token, router, queryClient]);

  return (
    <SupabaseContext.Provider value={{ supabase, session }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}
