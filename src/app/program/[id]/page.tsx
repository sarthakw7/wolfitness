import { createClient } from '@/lib/supabaseServer';
import { notFound, redirect } from 'next/navigation';
import { 
  Clock, 
  TrendingUp, 
  Dumbbell, 
  CheckCircle2, 
  ShieldCheck,
  PlayCircle,
  Unlock,
  Star,
  Users,
  Calendar,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

import Navbar from '@/components/Navbar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
    return { error: 'Failed to enroll' };
  }

  redirect('/dashboard');
}


export default async function ProgramDetailsPage({ params }: { params: Promise<{ id: string }> }) {
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
          avatar_url,
          bio
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
  const coachHeadline = program.coaches?.headline;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Immersive Hero Header */}
      <div className="relative w-full bg-neutral-900 text-white overflow-hidden">
          {/* Background Layer */}
          <div className="absolute inset-0 z-0 opacity-40">
             {program.image_url ? (
                <img src={program.image_url} alt="Background" className="w-full h-full object-cover blur-sm scale-105" />
             ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-900 to-indigo-950" />
             )}
             <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>

          <div className="container relative z-10 max-w-6xl mx-auto px-4 py-16 md:py-24">
              <div className="flex flex-col md:flex-row gap-8 md:items-end">
                  {/* Thumbnail Card */}
                  <div className="w-full md:w-[320px] aspect-[3/4] md:aspect-[4/5] rounded-xl overflow-hidden shadow-2xl border-4 border-white/10 shrink-0 bg-neutral-800 relative group">
                        {program.image_url ? (
                            <img src={program.image_url} alt={program.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-white/5">
                                <Dumbbell className="h-20 w-20 opacity-30 mb-4" />
                                <span className="text-white/30 font-bold uppercase tracking-widest">Cover</span>
                            </div>
                        )}
                        <div className="absolute top-3 right-3">
                            <Badge className="bg-white/90 text-black hover:bg-white font-bold backdrop-blur-md">
                                {program.difficulty}
                            </Badge>
                        </div>
                  </div>

                  {/* Header Content */}
                  <div className="flex-1 space-y-6 pb-4">
                      <div className="flex flex-wrap gap-2 text-sm font-medium text-white/70 uppercase tracking-wider">
                          <span className="bg-white/10 px-2 py-1 rounded">{program.vibe_type || 'General Fitness'}</span>
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> 120+ Enrolled</span>
                          <span className="flex items-center gap-1 text-yellow-400"><Star className="h-3 w-3 fill-current" /> 4.9</span>
                      </div>
                      
                      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-white drop-shadow-lg">
                          {program.title}
                      </h1>
                      
                      <p className="text-lg md:text-xl text-white/80 max-w-2xl leading-relaxed">
                          {program.description}
                      </p>

                      <div className="flex items-center gap-4 pt-4">
                          <Avatar className="h-12 w-12 border-2 border-white/20">
                              <AvatarImage src={coachProfile?.avatar_url || undefined} />
                              <AvatarFallback>{coachProfile?.full_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                              <p className="text-white font-bold leading-none">{coachProfile?.full_name}</p>
                              <p className="text-white/60 text-sm mt-1">{coachHeadline || 'Certified Coach'}</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="container max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* Left Column: Syllabus & Details */}
              <div className="lg:col-span-8 space-y-12">
                  
                  {/* Key Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="bg-muted/30 border-none">
                          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                              <Calendar className="h-6 w-6 text-primary" />
                              <div>
                                  <p className="text-xs text-muted-foreground uppercase font-bold">Duration</p>
                                  <p className="font-bold">{program.duration_weeks} Weeks</p>
                              </div>
                          </CardContent>
                      </Card>
                      <Card className="bg-muted/30 border-none">
                          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                              <Dumbbell className="h-6 w-6 text-primary" />
                              <div>
                                  <p className="text-xs text-muted-foreground uppercase font-bold">Workouts</p>
                                  <p className="font-bold">{weeks.reduce((acc: number, w: any) => acc + (w.program_days?.length || 0), 0)} Sessions</p>
                              </div>
                          </CardContent>
                      </Card>
                      <Card className="bg-muted/30 border-none">
                          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                              <TrendingUp className="h-6 w-6 text-primary" />
                              <div>
                                  <p className="text-xs text-muted-foreground uppercase font-bold">Level</p>
                                  <p className="font-bold capitalize">{program.difficulty}</p>
                              </div>
                          </CardContent>
                      </Card>
                      <Card className="bg-muted/30 border-none">
                          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                              <ShieldCheck className="h-6 w-6 text-primary" />
                              <div>
                                  <p className="text-xs text-muted-foreground uppercase font-bold">Access</p>
                                  <p className="font-bold">Lifetime</p>
                              </div>
                          </CardContent>
                      </Card>
                  </div>

                  {/* Syllabus Accordion */}
                  <section>
                      <div className="flex items-center justify-between mb-6">
                          <h3 className="text-2xl font-bold">Program Syllabus</h3>
                          <Badge variant="outline">{weeks.length} Modules</Badge>
                      </div>
                      
                      <Accordion type="single" collapsible className="w-full space-y-4">
                          {weeks.length > 0 ? (
                              weeks.map((week: any, i: number) => (
                                  <AccordionItem key={week.id} value={`item-${week.id}`} className="border rounded-lg px-4 bg-card shadow-sm">
                                      <AccordionTrigger className="hover:no-underline py-4">
                                          <div className="flex flex-col items-start text-left gap-1">
                                              <span className="text-xs font-bold text-primary uppercase tracking-wider">Week {week.week_number}</span>
                                              <span className="font-semibold text-lg">{week.title}</span>
                                          </div>
                                      </AccordionTrigger>
                                      <AccordionContent className="pb-4">
                                          <div className="space-y-1 pt-2">
                                              {week.program_days?.map((day: any) => (
                                                  <div key={day.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-md transition-colors group">
                                                      <div className="flex items-center gap-3">
                                                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                              {day.day_number}
                                                          </div>
                                                          <span className="font-medium text-sm md:text-base">{day.title}</span>
                                                      </div>
                                                      {isEnrolled ? (
                                                          <Link href={`/dashboard/workout/${day.id}`}>
                                                              <Button size="sm" variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity h-8">
                                                                  Start <PlayCircle className="ml-1 h-3.5 w-3.5" />
                                                              </Button>
                                                          </Link>
                                                      ) : (
                                                          <LockIcon />
                                                      )}
                                                  </div>
                                              ))}
                                              {(!week.program_days || week.program_days.length === 0) && (
                                                  <p className="text-sm text-muted-foreground italic pl-3">Recovery week or content coming soon.</p>
                                              )}
                                          </div>
                                      </AccordionContent>
                                  </AccordionItem>
                              ))
                          ) : (
                              <div className="p-8 text-center border-2 border-dashed rounded-xl">
                                  <p className="text-muted-foreground">Curriculum content is being updated.</p>
                              </div>
                          )}
                      </Accordion>
                  </section>

                  {/* Meet the Coach */}
                  <section>
                      <h3 className="text-2xl font-bold mb-6">Meet Your Coach</h3>
                      <div className="bg-card border rounded-xl p-6 flex flex-col md:flex-row gap-6 items-start shadow-sm">
                          <Avatar className="h-20 w-20 md:h-24 md:w-24">
                              <AvatarImage src={coachProfile?.avatar_url || undefined} />
                              <AvatarFallback className="text-xl">{coachProfile?.full_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                              <div>
                                  <h4 className="text-xl font-bold">{coachProfile?.full_name}</h4>
                                  <p className="text-primary font-medium">{coachHeadline}</p>
                              </div>
                              <p className="text-muted-foreground leading-relaxed text-sm">
                                  {coachProfile?.bio || "Experienced coach dedicated to helping you reach your fitness goals through structured programming and consistent effort."}
                              </p>
                              <Link href={`/coach/${program.coach_id}`} className="inline-block mt-2">
                                  <Button variant="link" className="px-0 h-auto font-semibold">View Coach Profile <ChevronRight className="h-4 w-4" /></Button>
                              </Link>
                          </div>
                      </div>
                  </section>
              </div>

              {/* Right Column: Sticky CTA */}
              <div className="lg:col-span-4 relative">
                  <div className="sticky top-24 space-y-6">
                      <Card className="border-none shadow-xl bg-card overflow-hidden ring-1 ring-black/5">
                          <CardHeader className="bg-muted/30 pb-6 border-b">
                              <CardTitle className="text-lg">Full Access</CardTitle>
                              <CardDescription>Get started immediately</CardDescription>
                          </CardHeader>
                          <CardContent className="pt-6 space-y-6">
                              <div>
                                  <div className="flex items-baseline gap-1">
                                      <span className="text-4xl font-extrabold">{program.price === 0 ? 'Free' : `$${program.price}`}</span>
                                      {program.price > 0 && <span className="text-muted-foreground">/ one-time</span>}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                      {program.price === 0 ? 'No credit card required' : 'Secure payment via Stripe'}
                                  </p>
                              </div>

                              <form action={enrollUser.bind(null, id)}>
                                  {isEnrolled ? (
                                      <Link href="/dashboard" className="w-full block">
                                          <Button size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 text-md">
                                              Go to Dashboard
                                          </Button>
                                      </Link>
                                  ) : (
                                      <Button 
                                          type="submit" 
                                          size="lg" 
                                          className="w-full font-bold h-12 text-md shadow-lg shadow-primary/20 transition-transform active:scale-95"
                                      >
                                          {program.price === 0 ? 'Join for Free' : 'Enroll Now'}
                                      </Button>
                                  )}
                              </form>

                              <Separator />

                              <ul className="space-y-3 text-sm">
                                  <li className="flex gap-3">
                                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                      <span>Lifetime program access</span>
                                  </li>
                                  <li className="flex gap-3">
                                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                      <span>{weeks.length} weeks of workouts</span>
                                  </li>
                                  <li className="flex gap-3">
                                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                      <span>Video demonstrations</span>
                                  </li>
                                  <li className="flex gap-3">
                                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                      <span>Mobile app access</span>
                                  </li>
                              </ul>
                          </CardContent>
                          <CardFooter className="bg-muted/30 py-4 text-xs text-center text-muted-foreground justify-center">
                              <ShieldCheck className="h-3 w-3 mr-1.5" /> 30-Day Satisfaction Guarantee
                          </CardFooter>
                      </Card>

                      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/50">
                          <p className="text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
                              <InfoIcon className="h-4 w-4 shrink-0 mt-0.5" />
                              <span>Have questions? Contact the coach directly after enrollment for support.</span>
                          </p>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}

function LockIcon() {
    return (
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Unlock className="h-3.5 w-3.5" />
        </div>
    )
}

function InfoIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
        </svg>
    )
}