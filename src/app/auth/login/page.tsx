'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/SupabaseProvider';
import Link from 'next/link';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Dumbbell, ArrowRight } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

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

const loginSchema = z.object({
  identifier: z.string().min(2, { message: "Email or username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    let email = data.identifier;

    if (!email.includes('@')) {
      try {
        const { data: profile, error } = await supabase!
          .from('users')
          .select('email')
          .eq('username', data.identifier)
          .single();

        if (error || !profile) {
          toast.error('Username not found', {
             description: "Please check your username or try logging in with email."
          });
          return;
        }
        email = profile.email;
      } catch (err) {
        toast.error('Error looking up username');
        return;
      }
    }

    const { error } = await supabase!.auth.signInWithPassword({ email: email, password: data.password });
    if (error) {
      toast.error('Login failed', {
          description: error.message
      });
      return;
    }
    
    toast.success('Welcome back.');
    await queryClient.invalidateQueries(); 
    router.refresh();
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-foreground text-background items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
        </div>
        <div className="relative z-10 px-16 space-y-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="bg-background p-2">
              <Dumbbell className="h-6 w-6 text-foreground" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase font-display">WOLFITNESS</span>
          </Link>
          <h1 className="text-6xl font-black tracking-tighter leading-[0.85] uppercase font-display">
            Welcome<br />Back.
          </h1>
          <p className="text-lg font-bold uppercase tracking-tight text-background/50 max-w-sm">
            Continue your mastery. Every rep matters.
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
            <h2 className="text-3xl font-black tracking-tighter uppercase font-display">Sign In</h2>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
              Enter your credentials to continue
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Email or Username</FormLabel>
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
                        placeholder="••••••••" 
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
                {form.formState.isSubmitting ? "Authenticating..." : "Sign In"}
                {!form.formState.isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          </Form>

          <div className="text-center space-y-4 pt-4 border-t border-border">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
              Don&apos;t have an account?
            </p>
            <Link href="/auth/signup" className="block">
              <Button variant="outline" className="w-full h-12 text-[12px] font-black uppercase tracking-[0.15em] border-2">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
