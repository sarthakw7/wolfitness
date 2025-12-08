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

const features: { title: string; href: string; description: string }[] = [
  {
    title: 'AI Coaching',
    href: '#features',
    description: 'Personalized training plans powered by advanced algorithms.',
  },
  {
    title: 'Marketplace',
    href: '#marketplace',
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
  const [profile, setProfile] = React.useState<any>(null);

  React.useEffect(() => {
    async function fetchProfile() {
      if (session?.user) {
        const { data } = await supabase!.from('profiles').select('*').eq('id', session.user.id).single();
        setProfile(data);
      }
    }
    fetchProfile();
  }, [session, supabase]);

  const handleSignOut = async () => {
    await supabase!.auth.signOut();
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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 justify-between">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <div className="bg-primary p-1.5 rounded-lg">
                <Dumbbell className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="hidden font-bold sm:inline-block">WFF Ecosystem</span>
          </Link>
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Features</NavigationMenuTrigger>
                <NavigationMenuContent className="bg-white dark:bg-neutral-950">
                  <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <a
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                          href="/"
                        >
                          <Dumbbell className="h-6 w-6" />
                          <div className="mb-2 mt-4 text-lg font-medium">
                            WFF Ecosystem
                          </div>
                          <p className="text-sm leading-tight text-muted-foreground">
                            The future of connected fitness.
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
                <NavigationMenuLink className={navigationMenuTriggerStyle()} href="#coaches">
                  For Coaches
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
             <div className="px-7">
                <Link href="/" className="flex items-center" onClick={() => {}}>
                  <Dumbbell className="mr-2 h-5 w-5" />
                  <span className="font-bold">WFF Ecosystem</span>
                </Link>
             </div>
             <div className="flex flex-col gap-4 py-8 px-6">
                <Link href="#features" className="text-lg font-medium hover:text-primary">Features</Link>
                <Link href="#coaches" className="text-lg font-medium hover:text-primary">For Coaches</Link>
                {session ? (
                    <>
                        <Link href="/dashboard" className="text-lg font-medium hover:text-primary">Dashboard</Link>
                        <button onClick={handleSignOut} className="text-lg font-medium hover:text-primary text-left">Sign Out</button>
                    </>
                ) : (
                    <>
                        <Link href="/auth/login" className="text-lg font-medium hover:text-primary">Sign In</Link>
                        <Link href="/auth/signup" className="text-lg font-medium hover:text-primary">Get Started</Link>
                    </>
                )}
             </div>
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 items-center justify-end space-x-4">
            {session ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-12 pl-2 pr-4 rounded-full flex items-center gap-3 hover:bg-accent/50 transition-all duration-200">
                            <Avatar className="h-9 w-9 border border-primary/20 ring-2 ring-transparent group-hover:ring-primary/10 transition-all">
                                <AvatarImage src={profile?.avatar_url} alt={profile?.username || ''} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                                    {getInitials()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start text-left hidden sm:flex">
                                 <span className="text-sm font-semibold leading-none">{profile?.full_name || 'User'}</span>
                                 <span className="text-[10px] text-muted-foreground leading-none mt-1 font-medium">@{profile?.username || 'athlete'}</span>
                            </div>
                            <ChevronDown className="h-4 w-4 text-muted-foreground/70 hidden sm:block" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-white dark:bg-neutral-950 border shadow-md" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{profile?.full_name || 'User'}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {session.user.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard" className="cursor-pointer">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                <span>Dashboard</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/profile" className="cursor-pointer">
                                <User className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <div className="flex items-center space-x-2">
                    <Link href="/auth/login">
                        <Button variant="ghost" size="sm" className="hidden md:flex">
                            Sign In
                        </Button>
                    </Link>
                    <Link href="/auth/signup">
                        <Button size="sm">Get Started</Button>
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