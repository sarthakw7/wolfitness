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
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

import Navbar from '@/components/Navbar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const revalidate = 60; // Revalidate every minute

export default async function CoachProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { id } = await params;

  // 1. Fetch Coach & Profile Details
  const { data: coach, error: coachError } = await supabase
    .from('coaches')
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
    .from('programs')
    .select('*')
    .eq('coach_id', id)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  const profile = coach.profiles;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero / Header Section */}
      <div className="bg-muted/30 border-b">
        <div className="container max-w-6xl mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row gap-8 items-start">
                <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-xl">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                        {profile?.full_name?.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-4">
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-3xl md:text-4xl font-bold">{profile?.full_name}</h1>
                            {coach.is_verified && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 gap-1">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Verified Coach
                                </Badge>
                            )}
                        </div>
                        <p className="text-lg text-muted-foreground font-medium">@{profile?.username}</p>
                    </div>

                    <p className="text-xl font-light text-foreground/90 max-w-2xl">
                        {coach.headline}
                    </p>

                    <div className="flex gap-4 text-sm text-muted-foreground">
                        {coach.years_experience && (
                            <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-amber-500" />
                                <span>{coach.years_experience} Exp</span>
                            </div>
                        )}
                        {/* Mock Location */}
                        <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>Global / Remote</span>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                         {coach.social_instagram && (
                             <Link href={coach.social_instagram} target="_blank">
                                 <Button variant="outline" size="icon" className="rounded-full">
                                     <Instagram className="h-4 w-4" />
                                 </Button>
                             </Link>
                         )}
                         {coach.social_linkedin && (
                             <Link href={coach.social_linkedin} target="_blank">
                                 <Button variant="outline" size="icon" className="rounded-full">
                                     <Linkedin className="h-4 w-4" />
                                 </Button>
                             </Link>
                         )}
                         {coach.website && (
                             <Link href={coach.website} target="_blank">
                                 <Button variant="outline" size="icon" className="rounded-full">
                                     <Globe className="h-4 w-4" />
                                 </Button>
                             </Link>
                         )}
                    </div>
                </div>

                <div className="w-full md:w-auto flex flex-col gap-3 min-w-[200px]">
                    <Button size="lg" className="w-full">Book Consultation</Button>
                    <Button variant="outline" size="lg" className="w-full">Message</Button>
                </div>
            </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Left Column: About & Stats */}
        <div className="md:col-span-2 space-y-12">
            
            {/* About Section */}
            <section>
                <h2 className="text-2xl font-bold mb-4">About</h2>
                <div className="prose dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                    <p>{profile?.bio || "No bio available."}</p>
                </div>
                
                <div className="mt-6 flex flex-wrap gap-2">
                    {coach.specialization?.map((spec: string) => (
                        <Badge key={spec} variant="secondary" className="px-3 py-1 text-sm capitalize">
                            {spec.replace('_', ' ')}
                        </Badge>
                    ))}
                </div>
            </section>

            <Separator />

            {/* Programs Section */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Training Programs</h2>
                    <Badge variant="outline">{programs?.length || 0} Available</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {programs && programs.length > 0 ? (
                        programs.map((program) => (
                            <Link key={program.id} href={`/program/${program.id}`}>
                                <Card className="flex flex-col hover:shadow-md transition-all cursor-pointer group h-full">
                                    <div className="aspect-video bg-muted relative overflow-hidden rounded-t-lg">
                                        {program.image_url ? (
                                            <img src={program.image_url} alt={program.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-neutral-900 dark:to-neutral-800">
                                                <Dumbbell className="h-10 w-10 text-muted-foreground/50" />
                                            </div>
                                        )}
                                        <Badge className="absolute top-3 right-3 bg-white/90 text-black dark:bg-black/80 dark:text-white hover:bg-white/90">
                                            {program.difficulty}
                                        </Badge>
                                    </div>
                                    <CardHeader className="p-4 pb-2">
                                        <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">{program.title}</CardTitle>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5" />
                                                {program.duration_weeks} Weeks
                                            </div>
                                            {program.vibe_type && (
                                                <div className="flex items-center gap-1">
                                                    <TrendingUp className="h-3.5 w-3.5" />
                                                    {program.vibe_type}
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-2 flex-1">
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {program.description}
                                        </p>
                                    </CardContent>
                                    <CardFooter className="p-4 pt-0 flex items-center justify-between mt-auto">
                                        <span className="font-bold text-lg">
                                            {program.price === 0 ? 'Free' : `$${program.price}`}
                                        </span>
                                        <Button size="sm">View Details</Button>
                                    </CardFooter>
                                </Card>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center bg-muted/20 rounded-xl border border-dashed">
                            <Dumbbell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                            <h3 className="text-lg font-medium">No programs yet</h3>
                            <p className="text-muted-foreground">This coach hasn't published any programs yet.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>

        {/* Right Column: Sticky Sidebar (Credentials etc) */}
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Certifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     {coach.certifications ? (
                         <div className="flex items-start gap-3">
                             <div className="mt-1 bg-green-100 dark:bg-green-900/30 p-1 rounded-full">
                                 <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                             </div>
                             <p className="text-sm">{coach.certifications}</p>
                         </div>
                     ) : (
                         <p className="text-sm text-muted-foreground italic">No certifications listed.</p>
                     )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Specializations</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                        {coach.specialization?.map((spec: string) => (
                            <li key={spec} className="flex items-center gap-2 text-sm">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                <span className="capitalize">{spec.replace('_', ' ')}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}
