'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/SupabaseProvider';
import Link from 'next/link';
import { toast } from 'sonner';
import { Dumbbell } from 'lucide-react';

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

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters').optional().or(z.literal('')),
  username: z.string().min(3, 'Username must be at least 3 characters').optional().or(z.literal(''))
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
         toast.success("Account created successfully!");
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
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="bg-primary p-2 rounded-xl mb-4">
             <Dumbbell className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
          <CardDescription className="text-center">
            Start your journey with us today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
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
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
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
                    <FormLabel>Username (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Creating account..." : "Sign up"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
            <div className="flex items-center w-full gap-2">
                <div className="h-px bg-border flex-1" />
                <span className="text-xs uppercase text-muted-foreground whitespace-nowrap">
                    Already have an account?
                </span>
                <div className="h-px bg-border flex-1" />
            </div>
            <Link href="/auth/login" className="w-full">
                <Button variant="outline" className="w-full">
                    Sign in instead
                </Button>
            </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
