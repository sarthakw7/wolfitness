import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Database } from '@/types/database';

// Routes that require authentication
const PRIVATE_ROUTES = ['/dashboard', '/profile', '/onboarding', '/admin'];

// Routes that should redirect logged-in users away
const AUTH_ROUTES = ['/auth/login', '/auth/signup'];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: 'sb-wolfitness-auth-token',
      },
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set(name, value, options);
        },
        remove(name: string, options: any) {
          res.cookies.set(name, '', options);
        },
      },
    }
  );

  // Refresh session - Important for @supabase/ssr to handle cookie refreshing
  const { data: { session } } = await supabase.auth.getSession();
  const pathname = req.nextUrl.pathname;

  // ─── GUARD 1: Protected routes require auth ────────────────────────
  const isPrivateRoute = PRIVATE_ROUTES.some(route => pathname.startsWith(route));
  if (isPrivateRoute && !session) {
    const redirectUrl = new URL('/auth/login', req.url);
    redirectUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // ─── GUARD 2: Logged-in users shouldn't see auth pages ────────────
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // ─── GUARD 3: Role & Onboarding Validation ────────────────────────
  if (session && (isPrivateRoute || pathname === '/')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, vibe_type')
      .eq('id', session.user.id)
      .single();

    // Admin Guard
    if (pathname.startsWith('/admin') && profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Role-based dashboard routing (only if exactly /dashboard)
    if (pathname === '/dashboard') {
      if (profile?.role === 'coach' || profile?.role === 'mentor') {
        return NextResponse.redirect(new URL('/dashboard/coach', req.url));
      }
    }

    // Onboarding Guard: If consumer hasn't finished assessment, force it
    if (
      profile?.role === 'consumer' && 
      !profile?.vibe_type && 
      !pathname.startsWith('/onboarding') && 
      pathname !== '/'
    ) {
      return NextResponse.redirect(new URL('/onboarding/role', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api).*)',
  ],
};
