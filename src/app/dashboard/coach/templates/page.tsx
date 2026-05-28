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
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  const role = profile?.role as string;

  if (role !== 'coach') {
    redirect('/dashboard');
  }

  // Check verification
  const { data: creatorData } = await supabase
    .from('coaches')
    .select('is_verified')
    .eq('id', session.user.id)
    .single();

  if (!creatorData?.is_verified) {
    redirect('/onboarding/coach');
  }

  // Fetch all programs that can be used as templates (for now, any program)
  const { data: templates } = await supabase
    .from('programs')
    .select(`
        *,
        users!programs_creator_id_fkey(full_name, avatar_url)
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />
      
      <main className="container max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <Library className="w-4 h-4" />
                <span className="text-xs font-bold tracking-widest uppercase">Program Hub</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Program Templates</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              Clone and customize existing programs to quickly launch new variations.
            </p>
          </div>
        </div>

        {!templates || templates.length === 0 ? (
            <div className="py-20 text-center border border-dashed rounded-2xl bg-background/50">
                <ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold">No Templates Available</h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-md mx-auto">
                    There are currently no published programs available to use as templates.
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
                                    <ShieldCheck className="w-3 h-3 mr-1" /> Template
                                </Badge>
                            </div>
                        </div>
                        <CardHeader>
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                                    By {(template as any).users?.full_name || 'Coach'}
                                </p>
                                <span className="font-bold text-foreground">${template.price.toFixed(2)}</span>
                            </div>
                            <CardTitle className="text-xl leading-tight group-hover:text-indigo-600 transition-colors">{template.title}</CardTitle>
                            <CardDescription className="line-clamp-2 mt-2 text-sm">
                                {template.description || "A proven template ready to be customized and sold."}
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
