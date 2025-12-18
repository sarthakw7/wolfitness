'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSupabase } from '@/components/SupabaseProvider';
import { toast } from 'sonner';
import { CheckCircle2, Dumbbell, Activity, Zap, Flame } from 'lucide-react';

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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const assessmentSchema = z.object({
  gender: z.string().min(1, 'Gender is required'),
  dob: z.string().min(1, 'Date of birth is required'),
  height: z.string().min(1, 'Height is required'),
  weight: z.string().min(1, 'Weight is required'),
  goal: z.string().min(1, 'Primary goal is required'),
  experience_level: z.string().min(1, 'Experience level is required'),
  equipment_access: z.string().min(1, 'Equipment access is required'),
  injuries: z.string().optional(),
});

type AssessmentFormValues = z.infer<typeof assessmentSchema>;

export default function AssessmentPage() {
  const router = useRouter();
  const { supabase, session } = useSupabase();

  const form = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      gender: '',
      dob: '',
      height: '',
      weight: '',
      goal: '',
      experience_level: '',
      equipment_access: '',
      injuries: '',
    },
  });

  const onSubmit = async (data: AssessmentFormValues) => {
    if (!session?.user) return;

    try {
      // 1. Calculate "Vibe" (Simple logic for now, can be expanded later)
      let calculatedVibe = 'Balanced';
      if (data.goal === 'hypertrophy' || data.goal === 'strength') calculatedVibe = 'Power';
      if (data.goal === 'endurance' || data.goal === 'fat_loss') calculatedVibe = 'Endurance';
      
      // 2. Insert into vibe_assessments table
      const { error: assessmentError } = await supabase!
        .from('vibe_assessments')
        .insert({
          user_id: session.user.id,
          answers: data as any, // Store full form data as JSON
          calculated_vibe: calculatedVibe,
        });

      if (assessmentError) throw assessmentError;

      // 3. Update profiles table
      const { error: profileError } = await supabase!
        .from('profiles')
        .update({
          gender: data.gender,
          date_of_birth: data.dob,
          height_cm: parseFloat(data.height),
          weight_kg: parseFloat(data.weight),
          goal: data.goal,
          experience_level: data.experience_level,
          equipment_access: [data.equipment_access],
          injuries: data.injuries ? [data.injuries] : [],
          vibe_type: calculatedVibe, // Store the result in profile for quick access
        })
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      toast.success('Profile complete!', { description: `Your Vibe: ${calculatedVibe}` });
      router.push('/dashboard');
    } catch (err: any) {
      toast.error('Failed to save', { description: err.message });
    }
  };

  const goals = [
    { value: 'hypertrophy', label: 'Build Muscle', desc: 'Focus on size & aesthetics', icon: Dumbbell },
    { value: 'strength', label: 'Get Stronger', desc: 'Focus on power & 1RM', icon: Zap },
    { value: 'fat_loss', label: 'Lose Fat', desc: 'Burn calories & lean out', icon: Flame },
    { value: 'endurance', label: 'Endurance', desc: 'Stamina & conditioning', icon: Activity },
  ];

  const experienceLevels = [
    { value: 'beginner', label: 'Beginner', desc: '0-6 months' },
    { value: 'intermediate', label: 'Intermediate', desc: '6 months - 2 years' },
    { value: 'advanced', label: 'Advanced', desc: '2+ years' },
  ];

  const equipmentOptions = [
    { value: 'commercial_gym', label: 'Commercial Gym', desc: 'Full access' },
    { value: 'home_gym', label: 'Home Gym', desc: 'Rack, weights' },
    { value: 'minimalist', label: 'Minimalist', desc: 'Bodyweight/Bands' },
  ];

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
      <Card className="w-full max-w-3xl shadow-xl border-none">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Vibe Assessment</CardTitle>
          <CardDescription>Let's personalize your WFF experience. This takes about 1 minute.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
              
              {/* SECTION 1: BIOMETRICS */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">1. Physical Profile</h3>
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

              {/* SECTION 2: GOAL */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">2. Primary Goal</h3>
                <FormField
                    control={form.control}
                    name="goal"
                    render={({ field }) => (
                        <FormItem>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {goals.map((item) => (
                                    <div
                                        key={item.value}
                                        onClick={() => field.onChange(item.value)}
                                        className={`
                                            relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                                            ${field.value === item.value 
                                                ? "border-amber-600 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 shadow-md ring-1 ring-amber-600" 
                                                : "border-muted bg-card hover:border-amber-600/50 hover:bg-accent"
                                            }
                                        `}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <item.icon className={`h-6 w-6 ${field.value === item.value ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`} />
                                            {field.value === item.value && <CheckCircle2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
                                        </div>
                                        <span className={`font-bold ${field.value === item.value ? "text-amber-900 dark:text-amber-100" : "text-foreground"}`}>{item.label}</span>
                                        <span className={`text-sm ${field.value === item.value ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground"}`}>{item.desc}</span>
                                    </div>
                                ))}
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
              </div>

              <Separator />

              {/* SECTION 3: EXPERIENCE */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">3. Training Context</h3>
                
                <FormField
                    control={form.control}
                    name="experience_level"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>Experience Level</FormLabel>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {experienceLevels.map((level) => (
                                    <div
                                        key={level.value}
                                        onClick={() => field.onChange(level.value)}
                                        className={`
                                            flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer text-center transition-all
                                            ${field.value === level.value 
                                                ? "border-amber-600 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 font-bold shadow-sm" 
                                                : "border-muted bg-card hover:bg-accent hover:border-amber-600/30"
                                            }
                                        `}
                                    >
                                        <span>{level.label}</span>
                                        <span className={`text-xs font-normal ${field.value === level.value ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground"}`}>{level.desc}</span>
                                    </div>
                                ))}
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="equipment_access"
                    render={({ field }) => (
                        <FormItem className="space-y-3 pt-4">
                            <FormLabel>Equipment Access</FormLabel>
                            <div className="grid grid-cols-1 gap-3">
                                {equipmentOptions.map((eq) => (
                                    <div
                                        key={eq.value}
                                        onClick={() => field.onChange(eq.value)}
                                        className={`
                                            flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all w-full text-left
                                            ${field.value === eq.value 
                                                ? "border-amber-600 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 shadow-sm" 
                                                : "border-muted bg-card hover:bg-accent hover:border-amber-600/30"
                                            }
                                        `}
                                    >
                                        <div className={`
                                            h-4 w-4 rounded-full border mr-3 flex items-center justify-center shrink-0 transition-colors
                                            ${field.value === eq.value ? "border-amber-600 bg-amber-600" : "border-muted-foreground bg-transparent"}
                                        `}>
                                            {field.value === eq.value && <div className="h-2 w-2 bg-white rounded-full" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`font-medium ${field.value === eq.value ? "text-amber-900 dark:text-amber-100" : "text-foreground"}`}>{eq.label}</span>
                                            <span className={`text-xs ${field.value === eq.value ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground"}`}>{eq.desc}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="injuries"
                    render={({ field }) => (
                        <FormItem className="pt-4">
                            <FormLabel>Injuries or Limitations</FormLabel>
                            <FormControl>
                                <Textarea 
                                    placeholder="Describe any injuries..." 
                                    className="resize-none" 
                                    {...field} 
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
              </div>

              <Button size="lg" type="submit" className="w-full text-lg h-12" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving Profile...' : 'Complete Profile'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}