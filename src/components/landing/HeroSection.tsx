import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface SectionProps {
  id?: string;
  title: string;
  subtitle?: string;
  description?: string;
  mediaUrl?: string;
  ctaText?: string;
  ctaHref?: string;
  priority?: boolean;
}

export function HeroSection({ 
  id, title, subtitle, description, mediaUrl, ctaText, ctaHref, priority 
}: SectionProps) {
  const isDark = !mediaUrl; // If no media, it's a pure dark CTA style

  return (
    <section id={id} className={`relative w-full h-screen flex items-center justify-center overflow-hidden ${isDark ? 'bg-foreground' : ''}`}>
      {/* Background */}
      {mediaUrl && (
        <div className="absolute inset-0 z-0">
          <Image
            src={mediaUrl}
            alt={title}
            fill
            className="object-cover brightness-90"
            sizes="100vw"
            priority={priority}
            suppressHydrationWarning
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 z-10" />
        </div>
      )}

      {/* Hero Content */}
      <div className={`relative z-20 text-center space-y-4 px-6 max-w-5xl mx-auto mt-auto mb-32 ${isDark ? 'text-background' : 'text-white'}`}>
        <span className={`text-[10px] font-bold tracking-[0.4em] uppercase opacity-70 ${isDark ? 'text-background/50' : ''}`}>
          {subtitle}
        </span>
        <h1 className="text-6xl md:text-[8rem] lg:text-[10rem] font-black tracking-tighter uppercase leading-[0.8] whitespace-pre-line font-display">
          {title}
        </h1>
        <p className={`text-[10px] md:text-xs font-medium tracking-[0.2em] uppercase max-w-xl mx-auto ${isDark ? 'text-background/50' : 'text-gray-300'}`}>
          {description}
        </p>
        <div className="pt-10 flex flex-col sm:flex-row gap-6 justify-center">
          {ctaText && ctaHref && (
            <Link href={ctaHref}>
              <Button size="lg" className={`h-12 px-12 text-[10px] border-none rounded-none uppercase tracking-widest font-black transition-all ${isDark ? 'bg-background text-foreground hover:bg-gray-200' : 'bg-white text-black hover:bg-gray-200'}`}>
                {ctaText}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Scroll Indicator (Only for top hero) */}
      {priority && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 text-white/50 z-20">
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold">Discover</span>
          <div className="w-[1px] h-12 bg-white/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-white animate-slide-down" />
          </div>
        </div>
      )}
    </section>
  );
}
