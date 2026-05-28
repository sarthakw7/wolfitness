import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const programId = searchParams.get('program_id');

  if (!programId) {
    return new NextResponse('Program ID required', { status: 400 });
  }

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // If not logged in, we can't enroll. 
    // Usually, we should send them to login first.
    return redirect(`/auth/login?returnTo=/program/${programId}`);
  }

  // 1. Verify program is free
  const { data: program, error: programError } = await supabase
    .from('programs')
    .select('price')
    .eq('id', programId)
    .single();

  if (programError || !program) {
    return new NextResponse('Program not found', { status: 404 });
  }

  if (program.price !== 0) {
    return new NextResponse('Program is not free', { status: 403 });
  }

  // 2. Enroll the user
  const { error: enrollError } = await supabase
    .from('enrollments')
    .insert({
      user_id: session.user.id,
      program_id: programId,
      status: 'active'
    });

  // If already enrolled (unique constraint), just redirect to dashboard
  if (enrollError && !enrollError.message.includes('unique constraint')) {
    console.error('Enrollment Error:', enrollError);
    return new NextResponse('Enrollment failed', { status: 500 });
  }

  // 3. Success! Redirect to dashboard
  return redirect('/dashboard?success=true');
}
