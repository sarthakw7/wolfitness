import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface SectionProps {
  id?: string;
  title: string;
  subtitle?: string;
  description?: string;
  mediaUrl: string;
  ctaText?: string;
  ctaHref?: string;
}

export function CampaignSection({ 
  id, title, subtitle, description, mediaUrl, ctaText, ctaHref 
}: SectionProps) {
  return (
    <section id={id} className="relative w-full h-screen flex items-center justify-center overflow-hidden group">
      {/* Background with hover zoom */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 transition-transform duration-1000 group-hover:scale-105">
          <Image
            src={mediaUrl}
            alt={title}
            fill
            className="object-cover brightness-90"
            sizes="100vw"
            suppressHydrationWarning
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 opacity-60 group-hover:opacity-40 transition-opacity z-10" />
      </div>

      {/* Content at bottom */}
      <div className="relative z-20 text-center text-white space-y-4 px-6 max-w-5xl mx-auto mt-auto mb-32">
        <div className="space-y-1">
          <span className="text-[10px] font-bold tracking-[0.5em] uppercase opacity-70">
            {subtitle}
          </span>
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-[0.9] whitespace-pre-line">
            {title}
          </h2>
        </div>
        
        <p className="text-[9px] md:text-[10px] font-medium tracking-[0.3em] uppercase max-w-md mx-auto text-gray-300">
          {description}
        </p>

        <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
          {ctaText && ctaHref && (
            <Link href={ctaHref}>
              <Button size="lg" className="h-10 px-10 text-[10px] bg-white text-black hover:bg-gray-200 border-none rounded-none uppercase tracking-widest font-black transition-all">
                {ctaText}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
