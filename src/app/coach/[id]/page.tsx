import { createClient } from '@/lib/supabaseServer';
import { notFound } from 'next/navigation';
import { 
  Instagram, 
  Linkedin, 
  Globe, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Star,
  Dumbbell,
  Clock,
  TrendingUp,
  Quote,
  MessageCircle
} from 'lucide-react';
import Link from 'next/link';

import Navbar from '@/components/Navbar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const revalidate = 60; // Revalidate every minute

export default async function CoachProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  // 1. Fetch Coach & Profile Details
  const { data: coach, error: coachError } = await supabase
    .from('wff_creators')
    .select(`
      *,
      profiles (
        full_name,
        username,
        avatar_url,
        bio
      )
    `)
    .eq('id', id)
    .single();

  if (coachError || !coach) {
    notFound();
  }

  // 2. Fetch Published Programs
  const { data: programs } = await supabase
    .from('wff_programs')
    .select('*')
    .eq('creator_id', id)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  const profile = coach.profiles;

  // Mock Testimonials (for visual completeness)
  const testimonials = [
      { id: 1, text: "Changed my life! The programming is top notch.", author: "Sarah M.", role: "Client" },
      { id: 2, text: "Finally a coach who understands busy schedules.", author: "Mike T.", role: "Client" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Immersive Hero Header */}
      <div className="relative w-full bg-neutral-900 text-white overflow-hidden">
          {/* Background Layer */}
          <div className="absolute inset-0 z-0 opacity-20">
             {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Background" className="w-full h-full object-cover blur-xl scale-110" />
             ) : (
                <div className="w-full h-full bg-gradient-to-r from-neutral-800 to-stone-900" />
             )}
             <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>

          <div className="container relative z-10 max-w-6xl mx-auto px-4 py-12 md:py-20">
              <div className="flex flex-col md:flex-row gap-8 items-end">
                  <Avatar className="h-32 w-32 md:h-48 md:w-48 border-4 border-white/10 shadow-2xl shrink-0">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-5xl bg-neutral-800 text-white">
                          {profile?.full_name?.charAt(0)}
                      </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-4 pb-2 w-full">
                      <div>
                          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">{profile?.full_name}</h1>
                              {coach.is_verified && (
                                  <Badge className="bg-blue-500/20 text-blue-200 hover:bg-blue-500/30 border-blue-500/50 w-fit gap-1.5 px-3 py-1">
                                      <CheckCircle2 className="h-3.5 w-3.5" /> Verified Coach
                                  </Badge>
                              )}
                          </div>
                          <p className="text-xl text-white/60 font-medium">@{profile?.username}</p>
                      </div>

                      <p className="text-lg md:text-xl text-white/90 max-w-3xl leading-relaxed font-light">
                          {coach.headline || "Professional Fitness Coach"}
                      </p>

                      <div className="flex flex-wrap gap-4 pt-4">
                           {coach.social_instagram && (
                               <Link href={coach.social_instagram} target="_blank">
                                   <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/20 hover:text-white rounded-full">
                                       <Instagram className="h-4 w-4 mr-2" /> Instagram
                                   </Button>
                               </Link>
                           )}
                           {coach.social_linkedin && (
                               <Link href={coach.social_linkedin} target="_blank">
                                   <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/20 hover:text-white rounded-full">
                                       <Linkedin className="h-4 w-4 mr-2" /> LinkedIn
                                   </Button>
                               </Link>
                           )}
                           {coach.website && (
                               <Link href={coach.website} target="_blank">
                                   <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/20 hover:text-white rounded-full">
                                       <Globe className="h-4 w-4 mr-2" /> Website
                                   </Button>
                               </Link>
                           )}
                      </div>
                  </div>

                  <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
                      <Button size="lg" className="w-full bg-white text-black hover:bg-white/90 font-bold h-12 text-md shadow-lg shadow-white/10">
                          Book Consultation
                      </Button>
                      <Button variant="outline" size="lg" className="w-full bg-transparent border-white/20 text-white hover:bg-white/10 h-12">
                          <MessageCircle className="mr-2 h-4 w-4" /> Message
                      </Button>
                  </div>
              </div>
          </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: About & Stats */}
        <div className="lg:col-span-8 space-y-12">
            
            {/* About Section */}
            <section>
                <div className="flex items-center gap-2 mb-6">
                    <div className="h-8 w-1 bg-primary rounded-full" />
                    <h2 className="text-2xl font-bold">About Me</h2>
                </div>
                <div className="prose dark:prose-invert max-w-none text-lg text-muted-foreground leading-relaxed">
                    <p>{profile?.bio || "No biography available yet."}</p>
                </div>
                
                {/* Visual Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    <div className="bg-muted/30 rounded-xl p-4 flex flex-col items-center justify-center text-center border border-muted">
                        <span className="text-3xl font-bold text-primary">{coach.years_experience || "1+"}</span>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Years Exp.</span>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-4 flex flex-col items-center justify-center text-center border border-muted">
                        <span className="text-3xl font-bold text-primary">{programs?.length || 0}</span>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Programs</span>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-4 flex flex-col items-center justify-center text-center border border-muted">
                        <span className="text-3xl font-bold text-primary flex items-center">4.9 <Star className="h-4 w-4 ml-1 fill-current" /></span>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Rating</span>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-4 flex flex-col items-center justify-center text-center border border-muted">
                        <span className="text-3xl font-bold text-primary">150+</span>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Clients</span>
                    </div>
                </div>
            </section>

            <Separator />

            {/* Programs Section */}
            <section>
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-1 bg-primary rounded-full" />
                        <h2 className="text-2xl font-bold">Training Programs</h2>
                    </div>
                    <Badge variant="secondary" className="px-3">Latest Releases</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {programs && programs.length > 0 ? (
                        programs.map((program) => (
                            <Link key={program.id} href={`/program/${program.id}`}>
                                <Card className="flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group h-full overflow-hidden border-border/50">
                                    <div className="aspect-[16/9] bg-muted relative overflow-hidden">
                                        {program.image_url ? (
                                            <img src={program.image_url} alt={program.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-neutral-900 dark:to-neutral-800">
                                                <Dumbbell className="h-12 w-12 text-muted-foreground/30" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 left-3">
                                            <Badge className="bg-black/70 text-white hover:bg-black/80 backdrop-blur-sm border-none shadow-sm">
                                                {program.difficulty}
                                            </Badge>
                                        </div>
                                    </div>
                                    <CardHeader className="p-5 pb-2">
                                        <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">{program.title}</CardTitle>
                                        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground mt-3">
                                            <div className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded-md">
                                                <Clock className="h-3.5 w-3.5" />
                                                {program.duration_weeks} Weeks
                                            </div>
                                            {program.vibe_type && (
                                                <div className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded-md">
                                                    <TrendingUp className="h-3.5 w-3.5" />
                                                    {program.vibe_type}
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-5 pt-3 flex-1">
                                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                            {program.description}
                                        </p>
                                    </CardContent>
                                    <CardFooter className="p-5 pt-0 flex items-center justify-between mt-auto">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground">Access for</span>
                                            <span className="font-bold text-lg text-primary">
                                                {program.price === 0 ? 'Free' : `$${program.price}`}
                                            </span>
                                        </div>
                                        <Button size="sm" variant="secondary" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                            View Program
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full py-16 text-center bg-muted/10 rounded-2xl border-2 border-dashed">
                            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                <Dumbbell className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-medium mb-2">No programs published</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">This coach is currently working on their training content. Check back later!</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Testimonials (Mock) */}
            <section>
                <div className="flex items-center gap-2 mb-6">
                    <div className="h-8 w-1 bg-primary rounded-full" />
                    <h2 className="text-2xl font-bold">Client Success</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {testimonials.map((t) => (
                        <Card key={t.id} className="bg-primary/5 border-none">
                            <CardContent className="p-6">
                                <Quote className="h-8 w-8 text-primary/20 mb-4" />
                                <p className="text-lg font-medium italic mb-4">"{t.text}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                                        {t.author.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{t.author}</p>
                                        <p className="text-xs text-muted-foreground">{t.role}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>
        </div>

        {/* Right Column: Sticky Sidebar */}
        <div className="lg:col-span-4 space-y-8">
            <Card className="shadow-lg border-t-4 border-t-primary">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        Credentials
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div>
                         <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Certifications</p>
                         {coach.certifications ? (
                             <div className="flex flex-wrap gap-2">
                                 {coach.certifications.split(',').map((cert: string, i: number) => (
                                     <Badge key={i} variant="outline" className="bg-background">
                                         {cert.trim()}
                                     </Badge>
                                 ))}
                             </div>
                         ) : (
                             <p className="text-sm text-muted-foreground italic">No certifications listed.</p>
                         )}
                     </div>
                     <Separator />
                     <div>
                         <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Specializations</p>
                         <div className="flex flex-wrap gap-2">
                            {coach.specialization?.map((spec: string) => (
                                <Badge key={spec} variant="secondary" className="px-3 py-1 capitalize">
                                    {spec.replace('_', ' ')}
                                </Badge>
                            ))}
                         </div>
                     </div>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white border-none shadow-xl">
                <CardContent className="p-6">
                    <h3 className="text-lg font-bold mb-2">Private Coaching</h3>
                    <p className="text-sm text-white/70 mb-4">
                        Looking for a personalized plan? I offer 1-on-1 coaching slots for dedicated clients.
                    </p>
                    <Button variant="secondary" className="w-full font-bold">
                        Apply for 1-on-1
                    </Button>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}