import { createClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CloneButton } from './CloneButton';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Dumbbell, Calendar, Library } from 'lucide-react';

export const revalidate = 0;

export default async function TemplatesPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect('/auth/login');

  // Verify they are a coach
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'coach' && profile?.role !== 'mentor') {
    redirect('/dashboard');
  }

  // Check verification
  const { data: creatorData } = await supabase
    .from('wff_creators')
    .select('is_verified, endorsed_by_mentor_id')
    .eq('id', session.user.id)
    .single();

  if (!creatorData?.is_verified) {
    redirect('/onboarding/coach');
  }

  // Find mentors this coach is connected to. 
  // 1. Check Signal enrollments
  const { data: enrollments } = await (supabase as any)
    .from('enrollments')
    .select('mentor_id')
    .eq('coach_id', session.user.id)
    .eq('status', 'active');
  
  const mentorIds = (enrollments || []).map((e: any) => e.mentor_id);
  
  // 2. Add the mentor who endorsed them (if not already in list)
  if (creatorData.endorsed_by_mentor_id && !mentorIds.includes(creatorData.endorsed_by_mentor_id)) {
      mentorIds.push(creatorData.endorsed_by_mentor_id);
  }

  // Fetch Master Templates from those Mentors
  let templates: any[] = [];
  if (mentorIds.length > 0) {
      const { data } = await supabase
        .from('wff_programs')
        .select(`
            *,
            profiles!wff_programs_creator_id_fkey(full_name, avatar_url)
        `)
        .in('creator_id', mentorIds)
        .eq('is_master_template', true)
        .order('created_at', { ascending: false });
        
      templates = data || [];
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />
      
      <main className="container max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <Library className="w-4 h-4" />
                <span className="text-xs font-bold tracking-widest uppercase">Franchise Hub</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Master Templates</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              Clone proven frameworks from your Elite Mentors. Modify them for your niche, and sell them instantly. Revenue is automatically split 80/10/10 via Stripe.
            </p>
          </div>
        </div>

        {templates.length === 0 ? (
            <div className="py-20 text-center border border-dashed rounded-2xl bg-background/50">
                <ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold">No Templates Available</h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-md mx-auto">
                    You do not have any active Master Templates available from your Signal Mentors. Ensure you are enrolled with a Mentor on Signal who has published templates.
                </p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                    <Card key={template.id} className="flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-all group border-border/50">
                        <div className="h-40 bg-indigo-500/10 relative overflow-hidden flex items-center justify-center">
                            {template.image_url ? (
                                <img src={template.image_url} alt={template.title} className="object-cover w-full h-full opacity-50" />
                            ) : (
                                <Dumbbell className="w-12 h-12 text-indigo-500/20" />
                            )}
                            <div className="absolute top-4 left-4">
                                <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20">
                                    <ShieldCheck className="w-3 h-3 mr-1" /> Mentor Proven
                                </Badge>
                            </div>
                        </div>
                        <CardHeader>
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                                    By {template.profiles?.full_name || 'Mentor'}
                                </p>
                                <span className="font-bold text-foreground">${template.price.toFixed(2)}</span>
                            </div>
                            <CardTitle className="text-xl leading-tight group-hover:text-indigo-600 transition-colors">{template.title}</CardTitle>
                            <CardDescription className="line-clamp-2 mt-2 text-sm">
                                {template.description || "A proven master template ready to be customized and sold to your audience."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground bg-muted/50 p-3 rounded-lg">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-foreground/70" />
                                    {template.duration_weeks} Weeks
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Dumbbell className="w-3.5 h-3.5 text-foreground/70" />
                                    <span className="capitalize">{template.difficulty}</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-0 pb-6 px-6">
                            <CloneButton templateId={template.id} />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        )}
      </main>
    </div>
  );
}
