'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSupabase } from '@/components/SupabaseProvider';
import { toast } from 'sonner';
import { Dumbbell, Zap, Flame, Activity, ArrowRight } from 'lucide-react';

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
      let calculatedVibe = 'Balanced';
      if (data.goal === 'hypertrophy' || data.goal === 'strength') calculatedVibe = 'Power';
      if (data.goal === 'endurance' || data.goal === 'fat_loss') calculatedVibe = 'Endurance';
      
      const { error: assessmentError } = await supabase!
        .from('onboarding_assessments')
        .insert({
          user_id: session.user.id,
          raw_answers: data as any,
          calculated_vibe: calculatedVibe,
        });

      if (assessmentError) throw assessmentError;

      const { error: profileError } = await supabase!
        .from('fitness_profiles')
        .update({
          gender: data.gender,
          date_of_birth: data.dob,
          height_cm: parseFloat(data.height),
          weight_kg: parseFloat(data.weight),
          primary_goal: data.goal,
          experience_level: data.experience_level,
          equipment_access: [data.equipment_access],
          injuries: data.injuries ? [data.injuries] : [],
          vibe_type: calculatedVibe,
        })
        .eq('user_id', session.user.id);

      if (profileError) throw profileError;

      toast.success('Assessment complete.', { description: `Your Vibe: ${calculatedVibe}` });
      router.push('/dashboard');
    } catch (err: any) {
      toast.error('Failed to save', { description: err.message });
    }
  };

  const goals = [
    { value: 'hypertrophy', label: 'Build Muscle', desc: 'Size & aesthetics', icon: Dumbbell },
    { value: 'strength', label: 'Get Stronger', desc: 'Power & 1RM', icon: Zap },
    { value: 'fat_loss', label: 'Lose Fat', desc: 'Burn & lean out', icon: Flame },
    { value: 'endurance', label: 'Endurance', desc: 'Stamina & conditioning', icon: Activity },
  ];

  const experienceLevels = [
    { value: 'beginner', label: 'Beginner', desc: '0-6 Months' },
    { value: 'intermediate', label: 'Intermediate', desc: '6M - 2Y' },
    { value: 'advanced', label: 'Advanced', desc: '2+ Years' },
  ];

  const equipmentOptions = [
    { value: 'commercial_gym', label: 'Commercial Gym', desc: 'Full access to all equipment' },
    { value: 'home_gym', label: 'Home Gym', desc: 'Rack, barbell, weights' },
    { value: 'minimalist', label: 'Minimalist', desc: 'Bodyweight & bands only' },
  ];

  return (
    <div className="min-h-screen bg-background py-16 px-6">
      <div className="max-w-2xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <span className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em]">
            Step 02 / Calibration
          </span>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.85] uppercase font-display">
            Vibe<br />Assessment.
          </h1>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide max-w-md mx-auto">
            We need your data to calibrate the perfect training. Takes 60 seconds.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-16">
            
            {/* SECTION 1: BIOMETRICS */}
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-3xl font-black tracking-tighter text-muted-foreground/20">01</span>
                <h3 className="text-sm font-black uppercase tracking-[0.2em]">Physical Profile</h3>
              </div>
              <div className="border-t border-border pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Biological Sex</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 bg-secondary/50 border-border">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
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
                        <FormLabel className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" className="h-12 bg-secondary/50 border-border" {...field} />
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
                        <FormLabel className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Height (CM)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="175" className="h-12 bg-secondary/50 border-border" {...field} />
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
                        <FormLabel className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Weight (KG)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="70" className="h-12 bg-secondary/50 border-border" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </section>

            {/* SECTION 2: GOAL */}
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-3xl font-black tracking-tighter text-muted-foreground/20">02</span>
                <h3 className="text-sm font-black uppercase tracking-[0.2em]">Primary Goal</h3>
              </div>
              <div className="border-t border-border pt-6">
                <FormField
                  control={form.control}
                  name="goal"
                  render={({ field }) => (
                    <FormItem>
                      <div className="grid grid-cols-2 gap-3">
                        {goals.map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => field.onChange(item.value)}
                            className={`
                              relative flex flex-col p-5 border-2 text-left transition-all duration-200
                              ${field.value === item.value
                                ? 'border-foreground bg-foreground text-background'
                                : 'border-border bg-card hover:border-foreground/30'
                              }
                            `}
                          >
                            <item.icon className={`h-5 w-5 mb-4 ${field.value === item.value ? 'text-background' : 'text-foreground'}`} />
                            <span className="text-sm font-black uppercase tracking-tight">{item.label}</span>
                            <span className={`text-[11px] font-medium mt-1 ${field.value === item.value ? 'text-background/60' : 'text-muted-foreground'}`}>{item.desc}</span>
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {/* SECTION 3: EXPERIENCE & EQUIPMENT */}
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-3xl font-black tracking-tighter text-muted-foreground/20">03</span>
                <h3 className="text-sm font-black uppercase tracking-[0.2em]">Training Context</h3>
              </div>
              <div className="border-t border-border pt-6 space-y-8">
                <FormField
                  control={form.control}
                  name="experience_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Experience Level</FormLabel>
                      <div className="grid grid-cols-3 gap-3">
                        {experienceLevels.map((level) => (
                          <button
                            key={level.value}
                            type="button"
                            onClick={() => field.onChange(level.value)}
                            className={`
                              flex flex-col items-center justify-center p-4 border-2 text-center transition-all
                              ${field.value === level.value
                                ? 'border-foreground bg-foreground text-background'
                                : 'border-border bg-card hover:border-foreground/30'
                              }
                            `}
                          >
                            <span className="text-sm font-black uppercase tracking-tight">{level.label}</span>
                            <span className={`text-[10px] font-medium mt-1 ${field.value === level.value ? 'text-background/60' : 'text-muted-foreground'}`}>{level.desc}</span>
                          </button>
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
                    <FormItem>
                      <FormLabel className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Equipment Access</FormLabel>
                      <div className="space-y-2">
                        {equipmentOptions.map((eq) => (
                          <button
                            key={eq.value}
                            type="button"
                            onClick={() => field.onChange(eq.value)}
                            className={`
                              flex items-center gap-4 p-4 border-2 w-full text-left transition-all
                              ${field.value === eq.value
                                ? 'border-foreground bg-foreground text-background'
                                : 'border-border bg-card hover:border-foreground/30'
                              }
                            `}
                          >
                            <div className={`
                              h-4 w-4 border-2 flex items-center justify-center shrink-0
                              ${field.value === eq.value ? 'border-background bg-background' : 'border-muted-foreground'}
                            `}>
                              {field.value === eq.value && <div className="h-2 w-2 bg-foreground" />}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-black uppercase tracking-tight">{eq.label}</span>
                              <span className={`text-[11px] font-medium ${field.value === eq.value ? 'text-background/60' : 'text-muted-foreground'}`}>{eq.desc}</span>
                            </div>
                          </button>
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
                    <FormItem>
                      <FormLabel className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Injuries or Limitations</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe any injuries or physical limitations..." 
                          className="resize-none bg-secondary/50 border-border min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <Button 
              type="submit" 
              className="w-full h-16 text-[14px] font-black uppercase tracking-[0.2em] transition-all" 
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Calibrating...' : 'Complete Assessment'}
              {!form.formState.isSubmitting && <ArrowRight className="ml-2 h-5 w-5" />}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}