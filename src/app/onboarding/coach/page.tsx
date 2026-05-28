'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSupabase } from '@/components/SupabaseProvider';
import { toast } from 'sonner';
import { CheckCircle2, Dumbbell, Trophy, Users, Globe } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const coachSchema = z.object({
  // Personal Stats
  gender: z.string().min(1, 'Gender is required'),
  dob: z.string().min(1, 'Date of birth is required'),
  height: z.string().min(1, 'Height is required'),
  weight: z.string().min(1, 'Weight is required'),
  
  // Professional
  specializations: z.array(z.string()).min(1, 'Select at least one specializations'),
  years_experience: z.string().min(1, 'Experience is required'),
  certifications: z.string().min(1, 'Please list your certifications'),
  headline: z.string().min(10, 'Headline must be at least 10 characters'),
  social_instagram: z.string().optional(),
  website: z.string().optional(),
});

type CoachFormValues = z.infer<typeof coachSchema>;

export default function CoachOnboardingPage() {
  const router = useRouter();
  const { supabase, session } = useSupabase();

  const form = useForm<CoachFormValues>({
    resolver: zodResolver(coachSchema),
    defaultValues: {
      gender: '',
      dob: '',
      height: '',
      weight: '',
      specializations: [],
      years_experience: '',
      certifications: '',
      headline: '',
      social_instagram: '',
      website: '',
    },
  });

  const onSubmit = async (data: CoachFormValues) => {
    if (!session?.user) return;

    try {
      // 1. Update Fitness Profile for health data
      const { error: fitnessError } = await supabase!
        .from('fitness_profiles')
        .upsert({
          user_id: session.user.id,
          gender: data.gender,
          date_of_birth: data.dob,
          height_cm: parseFloat(data.height),
          weight_kg: parseFloat(data.weight),
        });

      if (fitnessError) throw fitnessError;

      // 2. Update Professional Data in 'coaches'
      const { error: coachError } = await supabase!
        .from('coaches')
        .upsert({
          id: session.user.id,
          specializations: data.specializations,
          years_experience: parseInt(data.years_experience.split('-')[0]) || 1, // Extract number from range
          certifications: data.certifications.split(',').map(c => c.trim()), // Convert to array
          headline: data.headline,
          social_links: {
            instagram: data.social_instagram ? `https://instagram.com/${data.social_instagram.replace('@', '')}` : undefined,
            website: data.website,
          },
        });

      if (coachError) throw coachError;

      toast.success('Coach profile active!', { description: 'Welcome to the team.' });
      router.push('/dashboard/coach');
    } catch (err: any) {
      console.error('Coach onboarding error:', err);
      toast.error('Failed to save profile', { 
        description: err.message || 'Unknown error. Check console/database.' 
      });
    }
  };

  const specializations = [
    { value: 'bodybuilding', label: 'Bodybuilding', icon: Dumbbell },
    { value: 'powerlifting', label: 'Powerlifting', icon: Trophy },
    { value: 'crossfit', label: 'CrossFit', icon: Users },
    { value: 'weight_loss', label: 'Weight Loss', icon: CheckCircle2 },
    { value: 'yoga', label: 'Yoga & Mobility', icon: Globe },
    { value: 'rehab', label: 'Rehab', icon: CheckCircle2 },
  ];

  const experienceLevels = [
    { value: '0-2', label: '0-2 Years', desc: 'Just starting out' },
    { value: '3-5', label: '3-5 Years', desc: 'Established' },
    { value: '5-10', label: '5-10 Years', desc: 'Expert' },
    { value: '10+', label: '10+ Years', desc: 'Master Coach' },
  ];

  // Helper to toggle specializations in array
  const toggleSpecialization = (value: string, current: string[], onChange: (val: string[]) => void) => {
    if (current.includes(value)) {
      onChange(current.filter((i) => i !== value));
    } else {
      onChange([...current, value]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
      <Card className="w-full max-w-3xl shadow-xl border-none">
        <CardHeader className="bg-slate-900 text-white rounded-t-xl p-8">
          <CardTitle className="text-3xl font-bold">Coach Profile</CardTitle>
          <CardDescription className="text-slate-300">Set up your professional storefront and personal profile.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
                console.log('Validation errors:', errors);
                toast.error('Please check the form', { description: Object.values(errors).map(e => e.message).join(', ') });
            })} className="space-y-10">
              
              {/* 0. PERSONAL STATS (NEW) */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Biological Sex</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-white dark:bg-neutral-950 border shadow-md">
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="dob"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Date of Birth</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="height"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Height (cm)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="175" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Weight (kg)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="70" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
              </div>

              <Separator />

              {/* 1. EXPERTISE */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">1. Area of Expertise</h3>
                
                <FormField
                    control={form.control}
                    name="specializations"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Specialization (Select all that apply)</FormLabel>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {specializations.map((item) => (
                                    <div
                                        key={item.value}
                                        onClick={() => toggleSpecialization(item.value, field.value || [], field.onChange)}
                                        className={`
                                            flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all
                                            ${(field.value || []).includes(item.value)
                                                ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-bold shadow-sm" 
                                                : "border-muted bg-card hover:border-blue-600/30 hover:bg-accent"
                                            }
                                        `}
                                    >
                                        <item.icon className="h-6 w-6 mb-2" />
                                        <span className="text-sm">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="years_experience"
                    render={({ field }) => (
                        <FormItem className="mt-4">
                            <FormLabel>Coaching Experience</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-white dark:bg-neutral-950 border shadow-md">
                                    {experienceLevels.map((level) => (
                                        <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
              </div>

              <Separator />

              {/* 2. CREDENTIALS */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">2. Credentials & Bio</h3>
                
                <FormField
                    control={form.control}
                    name="headline"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Professional Headline</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Helping busy professionals lose weight in 90 days." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="certifications"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Certifications</FormLabel>
                            <FormControl>
                                <Textarea placeholder="List your certifications (e.g., NASM CPT, CSCS, Precision Nutrition)..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
              </div>

              <Separator />

              {/* 3. SOCIALS */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">3. Social Presence</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="social_instagram"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Instagram Handle (Optional)</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-muted-foreground">@</span>
                                        <Input className="pl-8" placeholder="username" {...field} />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Website (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://yourwebsite.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
              </div>

              <Button size="lg" type="submit" className="w-full text-lg h-12 bg-slate-900 hover:bg-slate-800 text-white" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating Storefront...' : 'Launch Coach Profile'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
