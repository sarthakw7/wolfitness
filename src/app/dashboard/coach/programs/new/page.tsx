'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSupabase } from '@/components/SupabaseProvider';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, UploadCloud } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

export default function NewProgramPage() {
  const router = useRouter();
  const { supabase, session } = useSupabase();
  const { data: profile } = useProfile();
  const [isLoading, setIsLoading] = useState(false);

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

  const onSubmit = async (data: ProgramFormValues) => {
    if (!session?.user) {
        toast.error("You must be logged in");
        return;
    }
    
    setIsLoading(true);

    try {
      // 1. Get the creator_id (which is the same as user_id in our one-to-one schema)
      // We should verify they are actually a coach, but RLS will also block if not.
      
      const { error } = await supabase!
        .from('wff_programs')
        .insert({
          creator_id: session.user.id,
          title: data.title,
          description: data.description,
          price: data.price,
          duration_weeks: data.duration_weeks,
          difficulty: data.difficulty,
          vibe_type: data.vibe_type,
          is_published: data.is_published,
          is_master_template: data.is_master_template,
          // image_url: TODO: Add file upload
        });

      if (error) throw error;

      toast.success('Program created successfully!');
      router.push('/dashboard/coach');
      router.refresh();
    } catch (error: any) {
      console.error('Error creating program:', error);
      toast.error('Failed to create program', {
        description: error.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
            <Link href="/dashboard/coach" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Create New Program</h1>
            <p className="text-muted-foreground mt-1">Design a new training system for your athletes.</p>
        </div>

        <Card className="border-none shadow-md">
            <CardHeader>
                <CardTitle>Program Details</CardTitle>
                <CardDescription>Fill in the core information about your workout program.</CardDescription>
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
                                        <Input placeholder="e.g. 12-Week Hypertrophy Masterclass" {...field} />
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
                                            placeholder="Describe the goals, methodology, and what athletes can expect..." 
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
                                        <FormDescription>Set to 0 for free programs.</FormDescription>
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
                                        <FormLabel>Vibe Style (Optional)</FormLabel>
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

                        <FormField
                            control={form.control}
                            name="is_published"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                            Publish immediately
                                        </FormLabel>
                                        <FormDescription>
                                            If checked, this program will be visible in the marketplace immediately.
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />

                        {profile?.role === 'mentor' && (
                            <FormField
                                control={form.control}
                                name="is_master_template"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-emerald-500/20 bg-emerald-500/5 p-4">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 mt-1"
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="text-emerald-600 dark:text-emerald-400 font-bold">
                                                Master Template (Franchise)
                                            </FormLabel>
                                            <FormDescription className="text-emerald-600/70 dark:text-emerald-400/70">
                                                Allow your enrolled Signal Coaches to clone and sell this program. You will receive a 10% royalty on their sales.
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        )}

                        <div className="flex justify-end pt-4">
                            <Button type="submit" size="lg" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud className="mr-2 h-4 w-4" />
                                        Create Program
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
