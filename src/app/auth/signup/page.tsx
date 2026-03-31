'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/SupabaseProvider';
import Link from 'next/link';
import { toast } from 'sonner';
import { Dumbbell, ArrowRight } from 'lucide-react';

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
import { SocialAuth } from '@/components/auth/SocialAuth';

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters').optional().or(z.literal('')),
  username: z.string().min(3, 'Username must be at least 3 characters').optional().or(z.literal('')),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { supabase } = useSupabase();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      full_name: "",
      username: "",
    },
  });

  const onSubmit = async (values: SignupFormValues) => {
    try {
      const { data, error } = await supabase!.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { full_name: values.full_name, username: values.username },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
        }
      });

      if (error) throw error;

      if (data.session) {
         toast.success("Account created.");
         router.push('/onboarding/role');
      } else {
         toast.success("Check your email", {
             description: "We've sent you a verification link."
         });
         router.push('/auth/verify');
      }
    } catch (err: any) {
      toast.error('Signup failed', {
          description: err.message
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-foreground text-background items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
        </div>
        <div className="relative z-10 px-16 space-y-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="bg-background p-2">
              <Dumbbell className="h-6 w-6 text-foreground" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase font-display">WOLFITNESS</span>
          </Link>
          <h1 className="text-6xl font-black tracking-tighter leading-[0.85] uppercase font-display">
            Start Your<br />Mastery.
          </h1>
          <p className="text-lg font-bold uppercase tracking-tight text-background/50 max-w-sm">
            Join the elite network of performance-driven individuals.
          </p>
          </div>
          </div>

          {/* Right Panel — Form */}
          <div className="flex-1 flex items-center justify-center px-6 py-16 lg:px-16">
          <div className="w-full max-w-md space-y-10">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <div className="bg-foreground p-2">
              <Dumbbell className="h-5 w-5 text-background" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase font-display">WOLFITNESS</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tighter uppercase font-display">Create Account</h2>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
              Start your journey today
            </p>
          </div>

          <SocialAuth />
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
                Or
              </span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="John Doe" 
                          className="h-12 bg-secondary/50 border-border text-sm font-medium placeholder:text-muted-foreground/50" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Username</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="johndoe" 
                          className="h-12 bg-secondary/50 border-border text-sm font-medium placeholder:text-muted-foreground/50" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="name@example.com" 
                        className="h-12 bg-secondary/50 border-border text-sm font-medium placeholder:text-muted-foreground/50" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Min 8 characters" 
                        className="h-12 bg-secondary/50 border-border text-sm font-medium placeholder:text-muted-foreground/50" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-14 text-[13px] font-black uppercase tracking-[0.2em] transition-all"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Creating Account..." : "Create Account"}
                {!form.formState.isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>            </form>
          </Form>

          <div className="text-center space-y-4 pt-4 border-t border-border">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
              Already have an account?
            </p>
            <Link href="/auth/login" className="block">
              <Button variant="outline" className="w-full h-12 text-[12px] font-black uppercase tracking-[0.15em] border-2">
                Sign In Instead
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
