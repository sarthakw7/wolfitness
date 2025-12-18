'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSupabase } from '@/components/SupabaseProvider';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Navbar from '@/components/Navbar';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  bio: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  // Biometrics
  height: z.string().optional(),
  weight: z.string().optional(),
  goal: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { supabase, session } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      username: '',
      bio: '',
      website: '',
      height: '',
      weight: '',
      goal: '',
    },
  });

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user.id) return;

      try {
        const { data, error } = await supabase!
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;

        if (data) {
          form.reset({
            full_name: data.full_name || '',
            username: data.username || '',
            bio: data.bio || '',
            website: data.website || '',
            height: data.height_cm?.toString() || '',
            weight: data.weight_kg?.toString() || '',
            goal: data.goal || '',
          });
          setAvatarUrl(data.avatar_url);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Could not load profile');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [session, supabase, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!session?.user) return;

    try {
      const { error } = await supabase!
        .from('profiles')
        .update({
          full_name: data.full_name,
          username: data.username,
          bio: data.bio,
          height_cm: data.height ? parseFloat(data.height) : null,
          weight_kg: data.weight ? parseFloat(data.weight) : null,
          goal: data.goal,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      router.refresh(); // Refresh server components to show new data in Navbar
    } catch (err: any) {
      toast.error('Failed to update profile', { description: err.message });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${session?.user.id}/${Math.random()}.${fileExt}`;

      // 1. Upload to Storage
      const { error: uploadError } = await supabase!
        .storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase!
        .storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update Profile
      const { error: updateError } = await supabase!
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', session?.user.id);

      if (updateError) {
        throw updateError;
      }

      setAvatarUrl(publicUrl);
      toast.success('Avatar updated!');
      router.refresh(); // Sync Navbar
    } catch (error: any) {
      toast.error('Error uploading avatar', { description: error.message });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/20">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />
      
      <main className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your account settings and profile preferences.</p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>This is how others will see you on the site.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-8 flex items-center gap-6">
                    <Avatar className="h-24 w-24 border-4 border-background shadow-sm">
                        <AvatarImage src={avatarUrl || ''} />
                        <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                            {form.getValues('full_name')?.charAt(0) || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <label htmlFor="avatar-upload">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="cursor-pointer" 
                                    disabled={uploading} 
                                    asChild
                                >
                                    <span>
                                        {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        {uploading ? 'Uploading...' : 'Change Avatar'}
                                    </span>
                                </Button>
                            </label>
                            <input
                                type="file"
                                id="avatar-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                disabled={uploading}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">JPG, GIF or PNG. Max 1MB.</p>
                    </div>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                        control={form.control}
                        name="full_name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Your name" {...field} />
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
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                                <Input placeholder="username" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Tell us a little bit about yourself" className="resize-none" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-3">
                        <FormField
                        control={form.control}
                        name="height"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Height (cm)</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} />
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
                                <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="goal"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Primary Goal</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select goal" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-white dark:bg-neutral-950 border shadow-md">
                                <SelectItem value="hypertrophy">Build Muscle</SelectItem>
                                <SelectItem value="strength">Get Stronger</SelectItem>
                                <SelectItem value="fat_loss">Lose Fat</SelectItem>
                                <SelectItem value="endurance">Endurance</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>

                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? (
                          <>Saving...</>
                      ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" /> Save Changes
                          </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
