import { createClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  MoreHorizontal,
  User,
  Activity
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import { RevenueChart } from '@/components/dashboard/RevenueChart';

export default async function CoachDashboardPage() {
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

  if (profile?.role !== 'coach') {
      redirect('/dashboard'); // Redirect consumers back to their dashboard
  }

  const calculateAge = (dob: string) => {
      if (!dob) return '--';
      const birthDate = new Date(dob);
      const ageDifMs = Date.now() - birthDate.getTime();
      const ageDate = new Date(ageDifMs);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const bmi = (profile?.weight_kg && profile?.height_cm) 
    ? (profile.weight_kg / Math.pow(profile.height_cm / 100, 2)).toFixed(1) 
    : '--';
  
  const age = calculateAge(profile?.date_of_birth);

  // Coach Mock Data
  const stats = [
    {
      title: "Total Revenue",
      value: "$4,250",
      change: "+15% this month",
      icon: DollarSign,
      color: "text-green-500",
    },
    {
      title: "Active Clients",
      value: "24",
      change: "+2 new this week",
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Client Retention",
      value: "96%",
      change: "Top 5% of coaches",
      icon: TrendingUp,
      color: "text-purple-500",
    },
    {
      title: "Pending Check-ins",
      value: "5",
      change: "Requires attention",
      icon: AlertCircle,
      color: "text-orange-500",
    },
  ];

  const recentCheckins = [
    { client: "Sarah J.", status: "Completed", time: "2 hours ago", notes: "Feeling great, hit PR on squats!" },
    { client: "Mike T.", status: "Missed", time: "Yesterday", notes: "Missed workout due to travel." },
    { client: "Jessica L.", status: "Completed", time: "1 day ago", notes: "Shoulder felt a bit tight." },
  ];

  return (
    <div className="min-h-screen bg-muted/20">
        <Navbar />
        
        <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Coach Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Welcome back, Coach <span className="font-semibold text-foreground">{profile?.full_name || profile?.username}</span>. You have 5 check-ins to review.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2">
                        <Calendar className="h-4 w-4" />
                        Schedule
                    </Button>
                    <Button className="gap-2 shadow-lg shadow-primary/20">
                        <Users className="h-4 w-4" />
                        Add Client
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
                                    <span className={stat.color === "text-orange-500" ? "text-orange-500" : "text-green-500 font-medium"}>{stat.change}</span>
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

                    {/* Revenue Chart Placeholder */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle>Revenue Overview</CardTitle>
                            <CardDescription>Monthly earnings over the last 9 months</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 pt-0">
                            <RevenueChart />
                        </CardContent>
                    </Card>

                    {/* Recent Check-ins */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle>Recent Client Check-ins</CardTitle>
                            <CardDescription>Latest updates from your roster</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {recentCheckins.map((checkin, i) => (
                                    <div key={i} className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                                        <Avatar>
                                            <AvatarFallback>{checkin.client.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium">{checkin.client}</p>
                                                <span className="text-xs text-muted-foreground">{checkin.time}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-1">{checkin.notes}</p>
                                            <div className="mt-2 flex gap-2">
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                                    checkin.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                                }`}>
                                                    {checkin.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                                <p className="font-bold text-lg">{profile?.full_name || 'Coach'}</p>
                                <p className="text-sm text-muted-foreground">@{profile?.username || 'username'}</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                        {profile?.role || 'Coach'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Personal Stats Card */}
                    <Card className="border-none shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle>Personal Stats</CardTitle>
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

                    {/* Quick Actions */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                             <Button variant="outline" className="w-full justify-start">Create New Program</Button>
                             <Button variant="outline" className="w-full justify-start">Review Applications</Button>
                             <Button variant="outline" className="w-full justify-start">Manage Payments</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    </div>
  );
}
