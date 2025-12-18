'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/SupabaseProvider';
import Link from 'next/link';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Dumbbell } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

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

    // Simple check: if it doesn't look like an email, assume it's a username
    if (!email.includes('@')) {
      try {
        const { data: profile, error } = await supabase!
          .from('profiles')
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
    
    toast.success('Welcome back!');
    
    // Force refresh of session and queries
    await queryClient.invalidateQueries(); 
    router.refresh(); // Update server components
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="bg-primary p-2 rounded-xl mb-4">
            <Dumbbell className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email or Username</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
            <div className="flex items-center w-full gap-2">
                <div className="h-px bg-border flex-1" />
                <span className="text-xs uppercase text-muted-foreground whitespace-nowrap">
                    Don't have an account?
                </span>
                <div className="h-px bg-border flex-1" />
            </div>
            <Link href="/auth/signup" className="w-full">
                <Button variant="outline" className="w-full">
                    Sign up for free
                </Button>
            </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
