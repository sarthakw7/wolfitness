import { createClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';

export type UserRole = 'consumer' | 'coach' | 'mentor' | 'admin';

export async function getSession() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getUserRole(): Promise<UserRole | null> {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  return profile?.role || null;
}

export async function protectRoute(allowedRoles: UserRole[] = []) {
  const session = await getSession();
  
  if (!session) {
    redirect('/auth/login');
  }

  if (allowedRoles.length > 0) {
    const role = await getUserRole();
    if (!role || !allowedRoles.includes(role)) {
      redirect('/dashboard'); // Or an unauthorized page
    }
  }

  return session;
}
