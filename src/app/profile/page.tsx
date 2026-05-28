'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSupabase } from '@/components/SupabaseProvider';
import { toast } from 'sonner';
import { Loader2, Save, User, Utensils } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from '@/components/Navbar';

// --- SCHEMAS ---

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  bio: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  goal: z.string().optional(),
});

const nutritionSchema = z.object({
  dietary_preference: z.string().optional(),
  allergies: z.string().optional(), // We'll handle comma-separated string to array
  daily_calorie_target: z.string().optional(),
  daily_protein_target: z.string().optional(),
  daily_carbs_target: z.string().optional(),
  daily_fat_target: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type NutritionFormValues = z.infer<typeof nutritionSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { supabase, session } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // --- FORMS ---

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      username: '',
      bio: '',
      height: '',
      weight: '',
      goal: '',
    },
  });

  const nutritionForm = useForm<NutritionFormValues>({
    resolver: zodResolver(nutritionSchema),
    defaultValues: {
      dietary_preference: '',
      allergies: '',
      daily_calorie_target: '',
      daily_protein_target: '',
      daily_carbs_target: '',
      daily_fat_target: '',
    },
  });

  // --- DATA LOADING ---

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user.id) return;

      try {
        const { data, error } = await supabase!
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;

        if (data) {
          profileForm.reset({
            full_name: data.full_name || '',
            username: data.username || '',
            bio: data.bio || '',
            height: data.height_cm?.toString() || '',
            weight: data.weight_kg?.toString() || '',
            goal: data.goal || '',
          });

          nutritionForm.reset({
            dietary_preference: data.dietary_preference || 'omnivore',
            allergies: data.allergies?.join(', ') || '',
            daily_calorie_target: data.daily_calorie_target?.toString() || '',
            daily_protein_target: data.daily_protein_target?.toString() || '',
            daily_carbs_target: data.daily_carbs_target?.toString() || '',
            daily_fat_target: data.daily_fat_target?.toString() || '',
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
  }, [session, supabase, profileForm, nutritionForm]);

  // --- HANDLERS ---

  const onProfileSubmit = async (data: ProfileFormValues) => {
    if (!session?.user) return;

    try {
      const { error } = await supabase!
        .from('users')
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
      router.refresh();
    } catch (err: any) {
      toast.error('Failed to update profile', { description: err.message });
    }
  };

  const onNutritionSubmit = async (data: NutritionFormValues) => {
    if (!session?.user) return;

    try {
      const { error } = await supabase!
        .from('users')
        .update({
          dietary_preference: data.dietary_preference,
          allergies: data.allergies ? data.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
          daily_calorie_target: data.daily_calorie_target ? parseInt(data.daily_calorie_target) : null,
          daily_protein_target: data.daily_protein_target ? parseInt(data.daily_protein_target) : null,
          daily_carbs_target: data.daily_carbs_target ? parseInt(data.daily_carbs_target) : null,
          daily_fat_target: data.daily_fat_target ? parseInt(data.daily_fat_target) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);

      if (error) throw error;

      toast.success('Nutrition settings updated');
    } catch (err: any) {
      toast.error('Failed to update nutrition', { description: err.message });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop() || 'png';
      const filePath = `${session?.user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase!
        .storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase!
        .storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase!
        .from('users')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', session?.user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success('Avatar updated!');
      router.refresh();
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
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your account settings and profile preferences.</p>
          </div>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" /> Profile
              </TabsTrigger>
              <TabsTrigger value="nutrition" className="flex items-center gap-2">
                <Utensils className="h-4 w-4" /> Nutrition
              </TabsTrigger>
            </TabsList>

            {/* --- PROFILE TAB --- */}
            <TabsContent value="profile" className="space-y-6 mt-6">
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
                        {profileForm.getValues('full_name')?.charAt(0) || 'U'}
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

                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-8">
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={profileForm.control}
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
                          control={profileForm.control}
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
                        control={profileForm.control}
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
                          control={profileForm.control}
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
                          control={profileForm.control}
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
                          control={profileForm.control}
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

                      <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                        {profileForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* --- NUTRITION TAB --- */}
            <TabsContent value="nutrition" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Nutrition Profile</CardTitle>
                  <CardDescription>Calibrate your fuel and set dietary preferences.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...nutritionForm}>
                    <form onSubmit={nutritionForm.handleSubmit(onNutritionSubmit)} className="space-y-8">
                      <div className="grid gap-6 md:grid-cols-2">
                        <FormField
                          control={nutritionForm.control}
                          name="dietary_preference"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dietary Preference</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select preference" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-white dark:bg-neutral-950 border shadow-md">
                                  <SelectItem value="omnivore">Omnivore (Everything)</SelectItem>
                                  <SelectItem value="vegetarian">Vegetarian</SelectItem>
                                  <SelectItem value="vegan">Vegan</SelectItem>
                                  <SelectItem value="keto">Keto</SelectItem>
                                  <SelectItem value="paleo">Paleo</SelectItem>
                                  <SelectItem value="pescatarian">Pescatarian</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={nutritionForm.control}
                          name="allergies"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Allergies / Restrictions</FormLabel>
                              <FormControl>
                                <Input placeholder="Dairy, Gluten, Nuts..." {...field} />
                              </FormControl>
                              <FormDescription>Separate with commas.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="pt-4 border-t border-border">
                        <h3 className="text-lg font-bold mb-4">Daily Macro Targets</h3>
                        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                          <FormField
                            control={nutritionForm.control}
                            name="daily_calorie_target"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Calories (kcal)</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="2500" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={nutritionForm.control}
                            name="daily_protein_target"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Protein (g)</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="180" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={nutritionForm.control}
                            name="daily_carbs_target"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Carbs (g)</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="250" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={nutritionForm.control}
                            name="daily_fat_target"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fat (g)</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="70" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Button type="submit" disabled={nutritionForm.formState.isSubmitting}>
                        {nutritionForm.formState.isSubmitting ? 'Updating...' : 'Save Nutrition Settings'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
