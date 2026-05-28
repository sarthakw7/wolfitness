'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSupabase } from '@/components/SupabaseProvider';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const programSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  duration_weeks: z.coerce.number().min(1, 'Duration must be at least 1 week'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  vibe_type: z.string().optional(),
  is_published: z.boolean().default(false),
  is_master_template: z.boolean().default(false),
});

type ProgramFormValues = z.infer<typeof programSchema>;

export default function ProgramSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { supabase, session } = useSupabase();
  const { data: profile } = useProfile();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProgramFormValues>({
    resolver: zodResolver(programSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      duration_weeks: 4,
      difficulty: 'intermediate',
      vibe_type: 'Balanced',
      is_published: false,
      is_master_template: false,
    },
  });

  useEffect(() => {
    if (id && supabase) {
        fetchProgram();
    }
  }, [id, supabase]);

  const fetchProgram = async () => {
      try {
          const { data, error } = await supabase!
            .from('programs')
            .select('*')
            .eq('id', id)
            .single();
          
          if (error) throw error;

          form.reset({
              title: data.title,
              description: data.description || '',
              price: data.price,
              duration_weeks: data.duration_weeks || 4,
              difficulty: data.difficulty || 'intermediate',
              vibe_type: data.vibe_type || 'Balanced',
              is_published: data.is_published || false,
              is_master_template: data.is_master_template || false,
          });
      } catch (error: any) {
          toast.error('Failed to load program');
          router.push('/dashboard/coach');
      } finally {
          setIsLoading(false);
      }
  };

  const onSubmit = async (data: ProgramFormValues) => {
    setIsSaving(true);
    try {
      const { error } = await supabase!
        .from('programs')
        .update({
          title: data.title,
          description: data.description,
          price: data.price,
          duration_weeks: data.duration_weeks,
          difficulty: data.difficulty,
          vibe_type: data.vibe_type,
          is_published: data.is_published,
          is_master_template: data.is_master_template,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Program updated successfully!');
      router.refresh();
    } catch (error: any) {
      toast.error('Failed to update', { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
      try {
          const { error } = await supabase!
            .from('programs')
            .delete()
            .eq('id', id);
          
          if (error) throw error;
          
          toast.success('Program deleted');
          router.push('/dashboard/coach');
      } catch (error: any) {
          toast.error('Delete failed', { description: error.message });
      }
  };

  if (isLoading) {
      return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
            <div>
                <Link href="/dashboard/coach" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Edit Details</h1>
                <p className="text-muted-foreground mt-1">Manage metadata and visibility for "{form.getValues('title')}".</p>
            </div>
            <Link href={`/dashboard/coach/programs/${id}/edit`}>
                <Button variant="outline">Open Builder</Button>
            </Link>
        </div>

        <div className="grid gap-6">
            <Card className="border-none shadow-md">
                <CardHeader>
                    <CardTitle>General Information</CardTitle>
                    <CardDescription>Update the core details of your program.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Program Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. 12-Week Hypertrophy" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea 
                                                className="min-h-[120px] resize-y"
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Price ($)</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                                    <Input type="number" min="0" step="0.01" className="pl-7" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="duration_weeks"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Duration (Weeks)</FormLabel>
                                            <FormControl>
                                                <Input type="number" min="1" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="difficulty"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Difficulty Level</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select level" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="beginner">Beginner</SelectItem>
                                                    <SelectItem value="intermediate">Intermediate</SelectItem>
                                                    <SelectItem value="advanced">Advanced</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="vibe_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Vibe Style</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select style" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Balanced">Balanced</SelectItem>
                                                    <SelectItem value="Power">Power / Strength</SelectItem>
                                                    <SelectItem value="Endurance">Endurance / Cardio</SelectItem>
                                                    <SelectItem value="Zen">Zen / Yoga</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Separator />

                            <FormField
                                control={form.control}
                                name="is_published"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">
                                                Publish to Marketplace
                                            </FormLabel>
                                            <FormDescription>
                                                Make this program visible to all users.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            {profile?.role === 'coach' && (
                                <FormField
                                    control={form.control}
                                    name="is_master_template"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2">
                                                    Master Template (Franchise)
                                                </FormLabel>
                                                <FormDescription className="text-emerald-600/70 dark:text-emerald-400/70">
                                                    Allow your enrolled Signal Coaches to clone and sell this program. You will receive a 10% royalty on their sales.
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            )}

                            <div className="flex justify-end pt-4">
                                <Button type="submit" size="lg" disabled={isSaving}>
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50 dark:bg-red-950/10">
                <CardHeader>
                    <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                    <CardDescription>Irreversible actions.</CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Permanently delete this program and all its data.</p>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Program
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the program, all its workouts, and remove it from any enrolled users.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
            </Card>
        </div>
      </div>
    </div>
  );
}