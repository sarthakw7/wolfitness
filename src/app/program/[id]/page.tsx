import { createClient } from '@/lib/supabaseServer';
import { notFound, redirect } from 'next/navigation';
import { 
  Clock, 
  TrendingUp, 
  Dumbbell, 
  CheckCircle2, 
  ShieldCheck,
  PlayCircle,
  Unlock
} from 'lucide-react';
import Link from 'next/link';

import Navbar from '@/components/Navbar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export const revalidate = 60; 

// Simple server action to handle enrollment (mock payment)
async function enrollUser(programId: string) {
  'use server';
  
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth/login');
  }

  // 1. Check if already enrolled
  const { data: existing } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', session.user.id)
    .eq('program_id', programId)
    .single();

  if (existing) {
    redirect('/dashboard');
  }

  // 2. Create enrollment
  const { error } = await supabase
    .from('enrollments')
    .insert({
      user_id: session.user.id,
      program_id: programId,
      status: 'active'
    });

  if (error) {
    console.error(error);
    // In a real app we'd handle error UI better
    return { error: 'Failed to enroll' };
  }

  redirect('/dashboard');
}


export default async function ProgramDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { id } = await params;
  const { data: { session } } = await supabase.auth.getSession();

  // 1. Fetch Program Details with Coach Info
  const { data: program, error } = await supabase
    .from('programs')
    .select(`
      *,
      coaches (
        id,
        headline,
        profiles (
          full_name,
          username,
          avatar_url
        )
      ),
      program_weeks (
        id,
        week_number,
        title,
        program_days (
          id,
          day_number,
          title
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error || !program) {
    notFound();
  }

  // Sort structure
  const weeks = (program.program_weeks || []).sort((a: any, b: any) => a.week_number - b.week_number);
  weeks.forEach((w: any) => {
      w.program_days = (w.program_days || []).sort((a: any, b: any) => a.day_number - b.day_number);
  });

  // 2. Check if user is already enrolled
  let isEnrolled = false;
  if (session) {
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('program_id', id)
        .single();
      
      if (enrollment) isEnrolled = true;
  }

  const coachProfile = program.coaches?.profiles;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Header */}
      <div className="bg-muted/30 border-b">
        <div className="container max-w-5xl mx-auto px-4 py-12 md:py-16">
            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Program Image / Thumbnail */}
                <div className="w-full md:w-[400px] aspect-video md:aspect-[4/3] rounded-xl overflow-hidden shadow-2xl bg-muted relative shrink-0">
                     {program.image_url ? (
                        <img src={program.image_url} alt={program.title} className="w-full h-full object-cover" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 text-white">
                            <Dumbbell className="h-20 w-20 opacity-20" />
                        </div>
                     )}
                     <div className="absolute top-4 left-4">
                        <Badge className="bg-white/90 text-black hover:bg-white text-sm font-bold shadow-sm">
                            {program.difficulty}
                        </Badge>
                     </div>
                </div>

                {/* Info */}
                <div className="flex-1 space-y-6">
                    <div>
                        <Link href={`/coach/${program.coach_id}`} className="inline-flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity">
                            <Avatar className="h-6 w-6 border">
                                <AvatarImage src={coachProfile?.avatar_url || undefined} />
                                <AvatarFallback className="text-[10px]">
                                    {coachProfile?.full_name?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-muted-foreground">
                                by {coachProfile?.full_name}
                            </span>
                        </Link>
                        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
                            {program.title}
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            {program.description}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4 md:gap-8 border-y py-6">
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            <div>
                                <p className="text-sm font-medium leading-none">Duration</p>
                                <p className="text-sm text-muted-foreground">{program.duration_weeks} Weeks</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            <div>
                                <p className="text-sm font-medium leading-none">Intensity</p>
                                <p className="text-sm text-muted-foreground capitalize">{program.difficulty}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            <div>
                                <p className="text-sm font-medium leading-none">Guarantee</p>
                                <p className="text-sm text-muted-foreground">Verified Coach</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 bg-card p-6 rounded-xl border shadow-sm">
                        <div className="text-center sm:text-left flex-1">
                            <p className="text-sm text-muted-foreground font-medium mb-1">Total Price</p>
                            <p className="text-3xl font-extrabold text-foreground">
                                {program.price === 0 ? 'Free' : `$${program.price}`}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {program.price === 0 ? 'Instant access' : 'One-time payment'}
                            </p>
                        </div>
                        
                        <form action={enrollUser.bind(null, id)} className="w-full sm:w-auto">
                            {isEnrolled ? (
                                <Link href="/dashboard" className="w-full">
                                    <Button size="lg" className="h-14 px-8 text-lg w-full sm:min-w-[240px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/30 transition-all transform hover:-translate-y-0.5">
                                        <PlayCircle className="mr-2 h-6 w-6" />
                                        Continue Training
                                    </Button>
                                </Link>
                            ) : (
                                <Button 
                                    type="submit" 
                                    size="lg" 
                                    className="h-14 px-8 text-lg w-full sm:min-w-[240px] bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-700 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all transform hover:-translate-y-0.5 font-bold"
                                >
                                    {program.price === 0 ? (
                                        <>
                                            <Unlock className="mr-2 h-6 w-6" />
                                            Join for Free
                                        </>
                                    ) : (
                                        <>
                                            Get Access Now
                                        </>
                                    )}
                                </Button>
                            )}
                        </form>
                    </div>

                    <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-muted-foreground pt-2">
                         <ShieldCheck className="h-3.5 w-3.5" />
                         <span>30-Day Money-Back Guarantee • Secure Payment</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="container max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="md:col-span-2 space-y-8">
            <section>
                <h3 className="text-2xl font-bold mb-4">Program Syllabus</h3>
                <Card>
                    <CardContent className="p-0 divide-y">
                        {weeks.length > 0 ? (
                            weeks.map((week: any) => (
                                <div key={week.id} className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Badge variant="outline" className="h-6">Week {week.week_number}</Badge>
                                        <h4 className="font-semibold text-sm">{week.title}</h4>
                                    </div>
                                    
                                    <div className="grid gap-2 pl-2 border-l-2 border-muted ml-3">
                                        {week.program_days.length > 0 ? (
                                            week.program_days.map((day: any) => (
                                                <div key={day.id} className="flex items-center justify-between group">
                                                    <div className="text-sm font-medium pl-2">
                                                        Day {day.day_number}: {day.title}
                                                    </div>
                                                    
                                                    {isEnrolled ? (
                                                        <Link href={`/dashboard/workout/${day.id}`}>
                                                            <Button size="sm" variant="ghost" className="h-8 gap-1 text-primary hover:text-primary hover:bg-primary/10">
                                                                <PlayCircle className="h-4 w-4" /> Start
                                                            </Button>
                                                        </Link>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-[10px] h-5 bg-muted text-muted-foreground">
                                                            Locked
                                                        </Badge>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-muted-foreground pl-2 italic">Rest week or no workouts added.</p>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-muted-foreground">
                                <p>No syllabus content available yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>
        </div>

        <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        What's Included
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        <li className="flex gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                            <span>Full {program.duration_weeks}-week training schedule</span>
                        </li>
                        <li className="flex gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                            <span>Mobile-friendly workout logger</span>
                        </li>
                        <li className="flex gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                            <span>Video demonstrations for all exercises</span>
                        </li>
                        <li className="flex gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                            <span>Progress tracking & analytics</span>
                        </li>
                    </ul>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
