import Link from 'next/link';
import { 
  LayoutDashboard, 
  Layers, 
  Users, 
  Dumbbell, 
  Settings, 
  LogOut,
  ExternalLink
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuItems = [
    { label: 'Overview', icon: LayoutDashboard, href: '/admin' },
    { label: 'Landing Page', icon: Layers, href: '/admin/landing' },
    { label: 'Creators', icon: Users, href: '/admin/creators' },
    { label: 'Programs', icon: Dumbbell, href: '/admin/programs' },
    { label: 'Settings', icon: Settings, href: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border flex flex-col fixed inset-y-0 bg-card z-50">
        <div className="p-8 border-b border-border">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-foreground p-1.5 transition-transform group-hover:rotate-12">
              <Dumbbell className="h-4 w-4 text-background" />
            </div>
            <span className="text-sm font-black tracking-tighter uppercase font-display">WFF Admin</span>
          </Link>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-4 px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-border space-y-4">
          <Link
            href="/"
            className="flex items-center gap-4 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-all"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View Site
          </Link>
          <button className="flex items-center gap-4 px-4 py-3 w-full text-[10px] font-black uppercase tracking-[0.2em] text-destructive hover:bg-destructive/5 transition-all">
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-12 bg-background">
        {children}
      </main>
    </div>
  );
}
