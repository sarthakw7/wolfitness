import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { ArrowRight, BarChart3, BrainCircuit, CheckCircle2, Users, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32 bg-background">
            {/* Gradient Background */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/10 rounded-full blur-3xl opacity-50" />
            </div>

            <div className="container relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto px-4">
                <Badge variant="secondary" className="mb-6 px-4 py-1 text-sm rounded-full">
                    v1 Public Beta is Live
                </Badge>
                
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl mb-6">
                    Train Smarter. <br className="hidden md:block" />
                    <span className="text-primary">Perform Better.</span>
                </h1>
                
                <p className="mx-auto max-w-[700px] text-lg text-muted-foreground sm:text-xl mb-10">
                    The most advanced global fitness ecosystem. Combine AI-driven coaching, 
                    performance analytics, and a community training network to reach your peak.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Link href="/auth/signup">
                        <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
                            Start Free Trial
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                    <Link href="#features">
                        <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-base rounded-full">
                            View Features
                        </Button>
                    </Link>
                </div>
            </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-muted/50">
            <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-primary font-semibold tracking-wide uppercase mb-2">The Ecosystem</h2>
                    <p className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                        Everything you need to excel
                    </p>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                        A unified platform designed for athletes and creators alike.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card className="border-none shadow-md bg-background">
                        <CardHeader>
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                <BrainCircuit className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle>AI-Driven Coaching</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-base">
                                Our Vibe Engine analyzes your goals and biometrics to recommend the perfect training program and adjust it in real-time.
                            </CardDescription>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md bg-background">
                        <CardHeader>
                            <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <CardTitle>Performance Analytics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-base">
                                Track every rep, set, and session. Visualize your progress with professional-grade insights and trend analysis.
                            </CardDescription>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md bg-background">
                        <CardHeader>
                            <div className="h-12 w-12 rounded-lg bg-pink-500/10 flex items-center justify-center mb-4">
                                <Users className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                            </div>
                            <CardTitle>Community Network</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-base">
                                Connect with elite coaches and like-minded athletes. Share workouts, compete on leaderboards, and stay motivated.
                            </CardDescription>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

        {/* Vibe Section */}
        <section className="py-24 relative overflow-hidden">
            <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
                    <div className="mb-12 lg:mb-0">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
                            Find Your Vibe
                        </h2>
                        <p className="text-lg text-muted-foreground mb-8">
                            Training isn't one-size-fits-all. Our proprietary Vibe Assessment matches you with programs that fit your specific style, goals, and available equipment.
                        </p>
                        <ul className="space-y-4 mb-8">
                            {['Personalized Recommendations', 'Adaptive Difficulty', 'Lifestyle Integration'].map((item, i) => (
                                <li key={i} className="flex items-center">
                                    <CheckCircle2 className="h-5 w-5 text-primary mr-3" />
                                    <span className="text-foreground">{item}</span>
                                </li>
                            ))}
                        </ul>
                        <Link href="/auth/signup">
                            <Button variant="link" className="pl-0 text-primary text-lg h-auto p-0 font-semibold">
                                Take the assessment <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 rounded-2xl blur-3xl opacity-20 transform rotate-3"></div>
                        <div className="relative bg-card border rounded-xl p-8 shadow-2xl">
                            {/* Mockup of Vibe UI */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b pb-4">
                                    <span className="text-muted-foreground text-sm font-medium">Vibe Score</span>
                                    <span className="text-green-500 font-mono font-bold">98/100</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                                            <span>Strength</span>
                                            <span>85%</span>
                                        </div>
                                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                            <div className="h-full bg-primary w-[85%] rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                                            <span>Endurance</span>
                                            <span>60%</span>
                                        </div>
                                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                            <div className="h-full bg-purple-500 w-[60%] rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                                            <span>Mobility</span>
                                            <span>92%</span>
                                        </div>
                                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                            <div className="h-full bg-pink-500 w-[92%] rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4 bg-muted/50 -mx-8 -mb-8 p-6 rounded-b-xl border-t mt-4">
                                    <p className="font-semibold mb-1 text-foreground">Recommended Program</p>
                                    <p className="text-muted-foreground text-sm">Hypertrophy Protocol v2 • 4 Days/Week</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary py-20">
            <div className="container max-w-4xl mx-auto px-4 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl mb-6">
                    Ready to level up?
                </h2>
                <p className="text-primary-foreground/80 text-xl mb-10 max-w-2xl mx-auto">
                    Join the WFF Ecosystem today and start your journey to peak performance.
                </p>
                <Link href="/auth/signup">
                    <Button size="lg" variant="secondary" className="h-14 px-8 text-lg rounded-full font-semibold shadow-xl">
                        Get Started Now
                    </Button>
                </Link>
            </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background py-12">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Product</h3>
                    <ul className="space-y-2">
                        <li><Link href="#" className="text-sm text-foreground hover:text-primary transition-colors">Features</Link></li>
                        <li><Link href="#" className="text-sm text-foreground hover:text-primary transition-colors">Pricing</Link></li>
                        <li><Link href="#" className="text-sm text-foreground hover:text-primary transition-colors">Marketplace</Link></li>
                    </ul>
                </div>
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Company</h3>
                    <ul className="space-y-2">
                        <li><Link href="#" className="text-sm text-foreground hover:text-primary transition-colors">About</Link></li>
                        <li><Link href="#" className="text-sm text-foreground hover:text-primary transition-colors">Careers</Link></li>
                        <li><Link href="#" className="text-sm text-foreground hover:text-primary transition-colors">Contact</Link></li>
                    </ul>
                </div>
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Legal</h3>
                    <ul className="space-y-2">
                        <li><Link href="#" className="text-sm text-foreground hover:text-primary transition-colors">Privacy</Link></li>
                        <li><Link href="#" className="text-sm text-foreground hover:text-primary transition-colors">Terms</Link></li>
                    </ul>
                </div>
                <div>
                    <Link href="/" className="flex items-center space-x-2 mb-4">
                        <div className="bg-primary p-1 rounded-md">
                            <Dumbbell className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <span className="font-bold">WFF Ecosystem</span>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                        &copy; 2025 WFF Ecosystem. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}
