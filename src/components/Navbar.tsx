'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, Dumbbell, LogOut, User, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useSupabase } from '@/components/SupabaseProvider';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';
import { useQueryClient } from '@tanstack/react-query';

const features: { title: string; href: string; description: string }[] = [
  {
    title: 'AI Coaching',
    href: '#features',
    description: 'Personalized training plans powered by advanced algorithms.',
  },
  {
    title: 'Marketplace',
    href: '/marketplace',
    description: 'Buy and sell premium workout programs and nutrition guides.',
  },
  {
    title: 'Analytics',
    href: '#analytics',
    description: 'Track your progress with professional-grade performance metrics.',
  },
];

export default function Navbar() {
  const { supabase, session } = useSupabase();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = React.useState(false);
  
  const { data: profile } = useProfile();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await supabase!.auth.signOut();
    queryClient.removeQueries();
    router.push('/');
    toast.success('Signed out successfully');
  };

  const getInitials = () => {
    if (profile?.full_name) {
        const parts = profile.full_name.split(' ');
        if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        return profile.full_name.substring(0, 2).toUpperCase();
    }
    return session?.user.email?.substring(0, 2).toUpperCase() || 'U';
  };

  if (!mounted) {
    return null; 
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md shadow-sm transition-all duration-300">
      <div className="container flex h-16 items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 justify-between">
        {/* Logo & Desktop Nav */}
        <div className="mr-4 hidden md:flex" suppressHydrationWarning>
          <Link href="/" className="mr-8 flex items-center space-x-2 group">
            <div className="bg-primary/10 p-1.5 rounded-xl group-hover:bg-primary/20 transition-colors">
                <Dumbbell className="h-5 w-5 text-primary" />
            </div>
            <span className="hidden font-extrabold sm:inline-block tracking-tight text-lg">
              WFF <span className="text-primary">Ecosystem</span>
            </span>
          </Link>
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent hover:bg-muted/50">Features</NavigationMenuTrigger>
                <NavigationMenuContent className="bg-white dark:bg-zinc-950 border-border/50">
                  <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <a
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                          href="/"
                        >
                          <Dumbbell className="h-6 w-6 text-primary mb-4" />
                          <div className="mb-2 text-lg font-medium">
                            WFF Ecosystem
                          </div>
                          <p className="text-sm leading-tight text-muted-foreground">
                            The future of connected fitness. Train smarter, not harder.
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    {features.map((feature) => (
                      <ListItem
                        key={feature.title}
                        title={feature.title}
                        href={feature.href}
                      >
                        {feature.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/marketplace" className={navigationMenuTriggerStyle()}>
                    Marketplace
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Mobile Menu Trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0 bg-background/95 backdrop-blur-xl">
             <div className="px-7">
                <Link href="/" className="flex items-center space-x-2" onClick={() => {}}>
                  <div className="bg-primary/10 p-1.5 rounded-lg">
                      <Dumbbell className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-bold text-lg">WFF Ecosystem</span>
                </Link>
             </div>
             <div className="flex flex-col gap-6 py-8 px-6">
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Menu</h4>
                    <Link href="#features" className="block text-lg font-medium hover:text-primary transition-colors">Features</Link>
                    <Link href="/marketplace" className="block text-lg font-medium hover:text-primary transition-colors">Marketplace</Link>
                </div>
                
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Account</h4>
                    {profile ? (
                        <>
                            <Link href="/dashboard" className="block text-lg font-medium hover:text-primary transition-colors">Dashboard</Link>
                            <button onClick={handleSignOut} className="block text-lg font-medium hover:text-primary text-left transition-colors text-red-500">Sign Out</button>
                        </>
                    ) : (
                        <>
                            <Link href="/auth/login" className="block text-lg font-medium hover:text-primary transition-colors">Sign In</Link>
                            <Link href="/auth/signup" className="block text-lg font-medium hover:text-primary transition-colors">Get Started</Link>
                        </>
                    )}
                </div>
             </div>
          </SheetContent>
        </Sheet>

        {/* User Auth Buttons */}
        <div className="flex flex-1 items-center justify-end space-x-4">
            {profile ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 pl-2 pr-3 rounded-full flex items-center gap-2 hover:bg-muted/50 transition-all duration-200 border border-transparent hover:border-border/50">
                            <Avatar className="h-8 w-8 border border-border shadow-sm">
                                <AvatarImage src={profile?.avatar_url} alt={profile?.username || ''} />
                                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-xs">
                                    {getInitials()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start text-left hidden sm:flex">
                                 <span className="text-sm font-semibold leading-none">{profile?.full_name?.split(' ')[0] || 'User'}</span>
                            </div>
                            <ChevronDown className="h-3 w-3 text-muted-foreground/70 hidden sm:block" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-white dark:bg-zinc-950 border shadow-lg rounded-xl p-1" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal p-2">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{profile?.full_name || 'User'}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {profile?.email || session?.user?.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="-mx-1" />
                        <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                            <Link href="/dashboard">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                <span>Dashboard</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                            <Link href="/profile">
                                <User className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="-mx-1" />
                        <DropdownMenuItem onClick={handleSignOut} className="rounded-lg cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <div className="flex items-center space-x-3">
                    <Link href="/auth/login">
                        <Button variant="ghost" size="sm" className="hidden md:flex font-medium text-muted-foreground hover:text-foreground">
                            Sign In
                        </Button>
                    </Link>
                    <Link href="/auth/signup">
                        <Button size="sm" className="font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                            Get Started
                        </Button>
                    </Link>
                </div>
            )}
        </div>
      </div>
    </header>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'>
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = 'ListItem';
