'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient'; // Ensure this points to your client-side supabase client
import { Session, SupabaseClient } from '@supabase/supabase-js';

// Define the shape of our context
interface SupabaseContextType {
  supabase: SupabaseClient | null;
  session: Session | null;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children, initialSession }: { children: React.ReactNode; initialSession: Session | null }) {
  const [supabase] = useState(() => createClient()); // Initialize client-side Supabase
  const [session, setSession] = useState<Session | null>(initialSession);

  useEffect(() => {
    // Only update session if it changes, to avoid unnecessary re-renders
    if (session?.access_token !== initialSession?.access_token) {
        setSession(initialSession);
    }

    // Listen for auth changes and update the session state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, initialSession, session?.access_token]);

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
