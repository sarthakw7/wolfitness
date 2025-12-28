import { createClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Activity, 
  Calendar, 
  Dumbbell, 
  Flame, 
  MoreHorizontal, 
  Target,
  Trophy, 
  User,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import { VolumeChart } from '@/components/dashboard/VolumeChart';
import { WorkoutHeatmap } from '@/components/dashboard/WorkoutHeatmap';

export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (profile?.role === 'coach') {
    redirect('/dashboard/coach');
  }

  // Fetch enrollments
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      *,
      programs (
        id,
        title,
        difficulty,
        duration_weeks
      )
    `)
    .eq('user_id', session.user.id);

  // --- ANALYTICS DATA FETCHING ---
  // Fetch logs for the last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { data: logs } = await supabase
    .from('user_workout_logs')
    .select('completed_at, weight_kg, reps_completed')
    .eq('user_id', session.user.id)
    .gte('completed_at', ninetyDaysAgo.toISOString());

  // Process Logs
  const processedLogs = (logs || []).map(log => ({
      date: new Date(log.completed_at).toISOString().split('T')[0],
      volume: (log.weight_kg || 0) * (log.reps_completed || 0)
  }));

  // 1. Heatmap Data (Daily Volume)
  const dailyVolume = processedLogs.reduce((acc, log) => {
      acc[log.date] = (acc[log.date] || 0) + log.volume;
      return acc;
  }, {} as Record<string, number>);

  const heatmapData = Object.entries(dailyVolume).map(([date, volume]) => ({ date, volume }));

  // 2. Weekly Volume Chart
  const weeklyVolume = processedLogs.reduce((acc, log) => {
      const date = new Date(log.date);
      // Get start of week (Sunday)
      const day = date.getDay();
      const diff = date.getDate() - day; // adjust when day is sunday
      const weekStart = new Date(date.setDate(diff)).toISOString().split('T')[0];
      
      acc[weekStart] = (acc[weekStart] || 0) + log.volume;
      return acc;
  }, {} as Record<string, number>);

  // Fill in last 7 weeks for chart
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - (i * 7));
      const day = d.getDay();
      const diff = d.getDate() - day;
      const weekStart = new Date(d.setDate(diff)).toISOString().split('T')[0];
      
      chartData.push({
          name: new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          volume: weeklyVolume[weekStart] || 0
      });
  }

  // 3. Streak Calculation
  let currentStreak = 0;
  const today = new Date().toISOString().split('T')[0];
  const sortedDates = Object.keys(dailyVolume).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  if (sortedDates.length > 0) {
      // Check if worked out today or yesterday to keep streak alive
      const lastWorkout = sortedDates[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastWorkout === today || lastWorkout === yesterdayStr) {
          currentStreak = 1;
          // Count backwards
          let checkDate = new Date(lastWorkout);
          for (let i = 1; i < sortedDates.length; i++) {
              checkDate.setDate(checkDate.getDate() - 1);
              const checkStr = checkDate.toISOString().split('T')[0];
              if (sortedDates.includes(checkStr)) {
                  currentStreak++;
              } else {
                  break;
              }
          }
      }
  }

  // Derived Stats
  const totalWorkouts = Object.keys(dailyVolume).length;
  const totalVolume = Object.values(dailyVolume).reduce((a, b) => a + b, 0);

  // Formatting
  const calculateAge = (dob: string) => {
      if (!dob) return '--';
      const birthDate = new Date(dob);
      const ageDifMs = Date.now() - birthDate.getTime();
      const ageDate = new Date(ageDifMs);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
  };
  const age = calculateAge(profile?.date_of_birth);
  const bmi = (profile?.weight_kg && profile?.height_cm) 
    ? (profile.weight_kg / Math.pow(profile.height_cm / 100, 2)).toFixed(1) 
    : '--';

  const stats = [
    {
      title: "Active Streak",
      value: `${currentStreak} Days`,
      change: currentStreak > 3 ? "On fire! 🔥" : "Keep going!",
      icon: Flame,
      color: "text-orange-500",
    },
    {
      title: "Total Workouts",
      value: totalWorkouts.toString(),
      change: "Last 90 Days",
      icon: Dumbbell,
      color: "text-blue-500",
    },
    {
      title: "Total Volume",
      value: `${(totalVolume / 1000).toFixed(1)}k kg`,
      change: "Lifetime Load",
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      title: "Current Weight",
      value: profile?.weight_kg ? `${profile.weight_kg} kg` : '-- kg',
      change: "Body Metric",
      icon: User,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="min-h-screen bg-muted/20">
        <Navbar />
        
        <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Welcome back, <span className="font-semibold text-foreground">{profile?.full_name || profile?.username || 'Athlete'}</span>. 
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2" suppressHydrationWarning>
                        <Calendar className="h-4 w-4" />
                        {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat, index) => (
                    <Card key={index} className="border-none shadow-sm">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                    <span className="text-muted-foreground">{stat.change}</span>
                                </p>
                            </div>
                            <div className={`h-12 w-12 rounded-full bg-secondary/50 flex items-center justify-center ${stat.color}`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Column */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Analytics Section */}
                    <div className="grid gap-4">
                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle>Activity Heatmap</CardTitle>
                                <CardDescription>Workout consistency over the last 90 days</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <WorkoutHeatmap logs={heatmapData} todayStr={today} />
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle>Volume Trend</CardTitle>
                                <CardDescription>Weekly volume load (kg x reps)</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 pt-0">
                                <VolumeChart data={chartData} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* My Programs List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold">My Programs</h2>
                            <Link href="/marketplace">
                                <Button variant="ghost" size="sm">Browse More</Button>
                            </Link>
                        </div>

                        {enrollments && enrollments.length > 0 ? (
                            enrollments.map((enrollment) => {
                                const prog = enrollment.programs;
                                return (
                                    <Card key={enrollment.id} className="border-none shadow-md overflow-hidden relative group">
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-lg">{prog.title}</CardTitle>
                                                    <CardDescription className="capitalize">
                                                        {prog.difficulty} • {prog.duration_weeks} Weeks
                                                    </CardDescription>
                                                </div>
                                                <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'}>
                                                    {enrollment.status || 'Active'}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="text-sm text-muted-foreground">
                                                    <span className="font-medium text-foreground">0%</span> Complete
                                                </div>
                                                <Link href={`/program/${prog.id}`}>
                                                    <Button size="sm" className="gap-2">
                                                        <Dumbbell className="h-4 w-4" /> Open Program
                                                    </Button>
                                                </Link>
                                            </div>
                                            <Progress value={0} className="h-1.5 mt-4" />
                                        </CardContent>
                                    </Card>
                                );
                            })
                        ) : (
                            <Card className="border-dashed shadow-sm">
                                <CardContent className="py-8 text-center">
                                    <p className="text-muted-foreground mb-4">You aren't enrolled in any programs yet.</p>
                                    <Link href="/marketplace">
                                        <Button>Find a Program</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-8">
                     {/* Profile Card */}
                     <Card className="border-none shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle>My Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center gap-4">
                            <Avatar className="h-16 w-16 border-2 border-primary">
                                <AvatarImage src={profile?.avatar_url} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                                    {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || <User />}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-bold text-lg">{profile?.full_name || 'Athlete'}</p>
                                <p className="text-sm text-muted-foreground">@{profile?.username || 'username'}</p>
                                <div className="mt-2 flex items-center gap-2">
                                    {profile?.role === 'coach' && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                            Coach
                                        </span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bio-Metrics Card */}
                    <Card className="border-none shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle>Bio-Metrics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-background rounded-lg p-3 border">
                                    <p className="text-xs text-muted-foreground">BMI</p>
                                    <p className="text-lg font-bold">{bmi}</p>
                                </div>
                                <div className="bg-background rounded-lg p-3 border">
                                    <p className="text-xs text-muted-foreground">Age</p>
                                    <p className="text-lg font-bold">{age}</p>
                                </div>
                                <div className="bg-background rounded-lg p-3 border">
                                    <p className="text-xs text-muted-foreground">Height</p>
                                    <p className="text-lg font-bold">{profile?.height_cm ? `${profile.height_cm} cm` : '--'}</p>
                                </div>
                                <div className="bg-background rounded-lg p-3 border">
                                    <p className="text-xs text-muted-foreground">Gender</p>
                                    <p className="text-lg font-bold capitalize">{profile?.gender || '--'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    </div>
  );
}
