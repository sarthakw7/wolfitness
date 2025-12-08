import { createClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Activity, 
  Calendar, 
  Clock, 
  Dumbbell, 
  Flame, 
  MoreHorizontal, 
  TrendingUp, 
  Trophy, 
  User,
  CheckCircle2,
  Target
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Navbar from '@/components/Navbar';
import { VolumeChart } from '@/components/dashboard/VolumeChart';

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

  // Redirect coaches to their specific dashboard
  if (profile?.role === 'coach') {
    redirect('/dashboard/coach');
  }

  // Calculate derived metrics
  const bmi = (profile?.weight_kg && profile?.height_cm) 
    ? (profile.weight_kg / Math.pow(profile.height_cm / 100, 2)).toFixed(1) 
    : '--';

  const calculateAge = (dob: string) => {
      if (!dob) return '--';
      const birthDate = new Date(dob);
      const ageDifMs = Date.now() - birthDate.getTime();
      const ageDate = new Date(ageDifMs);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const age = calculateAge(profile?.date_of_birth);

  const formatGoal = (goal: string) => {
    switch (goal) {
      case 'hypertrophy': return 'Muscle Building';
      case 'strength': return 'Strength Training';
      case 'fat_loss': return 'Weight Loss';
      case 'endurance': return 'Endurance Training';
      default: return 'General Fitness';
    }
  };

  const formatExperience = (level: string) => {
      if (!level) return 'Beginner';
      return level.charAt(0).toUpperCase() + level.slice(1);
  };

  // Mock Data for Demo (Integrated with Real Data)
  const stats = [
    {
      title: "Workouts This Week",
      value: "3/4 Completed",
      change: "+1 from last week",
      icon: CheckCircle2,
      color: "text-blue-500",
    },
    {
      title: "Current Weight",
      value: profile?.weight_kg ? `${profile.weight_kg} kg` : '-- kg',
      change: "On track",
      icon: User,
      color: "text-green-500",
    },
    {
      title: "Active Streak",
      value: "12 Day Streak",
      change: "Keep it up!",
      icon: Flame,
      color: "text-orange-500",
    },
    {
      title: "Program Adherence",
      value: "92% Consistency",
      change: "Top 10%",
      icon: Target,
      color: "text-purple-500",
    },
  ];

  const recentWorkouts = [
    { name: "Upper Body Power", date: "Today, 9:00 AM", duration: "45 min", completed: true },
    { name: "Active Recovery", date: "Yesterday", duration: "30 min", completed: true },
    { name: "Lower Body Hypertrophy", date: "Mon, Oct 23", duration: "65 min", completed: true },
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
                        Welcome back, <span className="font-semibold text-foreground">{profile?.full_name || profile?.username || 'Athlete'}</span>. Ready to crush it today?
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Button>
                    <Button className="gap-2 shadow-lg shadow-primary/20">
                        <Dumbbell className="h-4 w-4" />
                        Start Workout
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
                    {/* Active Program */}
                    <Card className="border-none shadow-md overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <Trophy className="h-48 w-48" />
                        </div>
                        <CardHeader>
                            <CardTitle>Active Program</CardTitle>
                            <CardDescription>Hypertrophy Protocol v2 • Week 4 of 12</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6 relative z-10">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">Overall Progress</span>
                                    <span className="text-muted-foreground">32%</span>
                                </div>
                                <Progress value={32} className="h-3" />
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                    <div className="bg-background/50 rounded-lg p-4 border">
                                        <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Next Session</p>
                                        <h4 className="font-bold text-lg">Push Day (Chest & Tris)</h4>
                                        <p className="text-sm text-muted-foreground mt-1">45 mins • High Intensity</p>
                                    </div>
                                    <div className="bg-background/50 rounded-lg p-4 border flex flex-col justify-center">
                                        <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Focus</p>
                                        <div className="flex gap-2 flex-wrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                                {formatGoal(profile?.goal)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Analytics / Chart Placeholder */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle>Performance Trend</CardTitle>
                            <CardDescription>Volume load over the last 14 days</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 pt-0">
                            <VolumeChart />
                        </CardContent>
                    </Card>
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
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                                        {formatExperience(profile?.experience_level)}
                                    </span>
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

                    {/* Recent Activity */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Recent Activity</CardTitle>
                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {recentWorkouts.map((workout, i) => (
                                    <div key={i} className="flex items-start gap-4">
                                        <div className="mt-1 p-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                            <CheckCircleIcon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium leading-none">{workout.name}</p>
                                            <p className="text-xs text-muted-foreground">{workout.date} • {workout.duration}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Button variant="link" className="w-full mt-4 text-primary">
                                View All History
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    </div>
  );
}

// Helper icon component
function CheckCircleIcon(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    )
  }