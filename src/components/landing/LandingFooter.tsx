import Link from 'next/link';
import { Dumbbell, ArrowRight, Instagram, Twitter, Youtube } from 'lucide-react';

export function LandingFooter() {
  const footerLinks = [
    {
      title: 'Network',
      links: [
        { label: 'Marketplace', href: '/marketplace' },
        { label: 'Join Now', href: '/auth/signup' },
        { label: 'Signal Mentors', href: '#' },
        { label: 'Programs', href: '#' },
      ]
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', href: '#' },
        { label: 'Contact Us', href: '#' },
        { label: 'FAQ', href: '#' },
        { label: 'Community', href: '#' },
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'Our Story', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms of Service', href: '#' },
      ]
    }
  ];

  return (
    <footer className="bg-white text-black border-t border-black/5 pt-16 pb-8 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          {/* Newsletter */}
          <div className="md:col-span-5 space-y-6">
            <div className="space-y-3">
              <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400">Join the Network</h4>
              <h2 className="text-2xl font-black tracking-tighter uppercase italic leading-none">
                Get early access<br />to new programs.
              </h2>
              <p className="text-[10px] text-gray-500 max-w-sm leading-relaxed uppercase tracking-widest font-medium">
                Sign up for exclusive access to verified programs, elite coaches, and ecosystem updates.
              </p>
            </div>
            <form className="flex gap-0 max-w-sm border-b border-black pb-1.5 group">
              <input 
                type="email" 
                placeholder="ENTER YOUR EMAIL" 
                className="flex-1 bg-transparent border-none outline-none text-[9px] font-bold tracking-widest placeholder:text-gray-300 uppercase"
              />
              <button type="submit" className="px-2 hover:translate-x-1 transition-transform">
                <ArrowRight size={14} suppressHydrationWarning />
              </button>
            </form>
          </div>

          {/* Nav Links */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {footerLinks.map((column) => (
              <div key={column.title} className="space-y-4">
                <h4 className="text-[9px] font-black uppercase tracking-[0.3em]">{column.title}</h4>
                <ul className="space-y-2 text-[9px] font-bold uppercase tracking-widest text-gray-500">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="hover:text-black transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-black/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-black p-1">
                <Dumbbell className="h-3 w-3 text-white" suppressHydrationWarning />
              </div>
              <span className="text-sm font-black tracking-tighter uppercase">WOLFITNESS</span>
              </Link>
              <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-gray-400">
              &copy; 2026 WOLFITNESS. The Global Mastery Network.
              </p>          </div>
          <div className="flex gap-6 items-center">
            <Link href="#" className="text-gray-400 hover:text-black transition-colors"><Instagram size={16} suppressHydrationWarning /></Link>
            <Link href="#" className="text-gray-400 hover:text-black transition-colors"><Twitter size={16} suppressHydrationWarning /></Link>
            <Link href="#" className="text-gray-400 hover:text-black transition-colors"><Youtube size={16} suppressHydrationWarning /></Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
