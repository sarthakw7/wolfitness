import { createClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/onboarding/role';
  
  // Use NEXT_PUBLIC_APP_URL to ensure we redirect back to the correct local/prod environment
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data?.user) {
      // 1. Check if user already has a role
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      // 2. Determine redirect: if role exists, go to dashboard. If not, go to next (onboarding).
      if (profile?.role) {
          const isCoach = (profile.role as string) === 'coach';
          const dashboardUrl = isCoach ? '/dashboard/coach' : '/dashboard';
          return NextResponse.redirect(`${appUrl}${dashboardUrl}`);
      }

      return NextResponse.redirect(`${appUrl}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${appUrl}/auth/auth-code-error`);
}
