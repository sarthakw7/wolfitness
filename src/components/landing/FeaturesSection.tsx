import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Zap, Dumbbell } from 'lucide-react';

interface SectionProps {
  id?: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
}

export function FeaturesSection({ 
  id, title, subtitle, ctaText, ctaHref 
}: SectionProps) {
  const features = [
    { 
      title: "Vibe Engine", 
      desc: "Proprietary biometrics mapping tailored to your specific performance intent.",
      num: "01",
      icon: BrainCircuit,
    },
    { 
      title: "Bio-Sync", 
      desc: "Real-time physical effort metrics synchronized with Signal professional tracking.",
      num: "02",
      icon: Zap,
    },
    { 
      title: "Global SSO", 
      desc: "One high-performance identity across the entire mastery ecosystem.",
      num: "03",
      icon: Dumbbell,
    }
  ];

  return (
    <section id={id} className="w-full py-32 bg-background relative overflow-hidden">
      <div className="w-full px-6 sm:px-12 md:px-20 lg:px-32">
        <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-20">
          <div className="space-y-4">
            <span className="text-[10px] font-black tracking-[0.4em] uppercase text-muted-foreground">
              {subtitle}
            </span>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.85] uppercase font-display whitespace-pre-line">
              {title}
            </h2>
          </div>
          {ctaText && ctaHref && (
            <Link href={ctaHref}>
              <Button variant="ghost" className="text-[11px] font-black uppercase tracking-widest h-auto p-0 hover:bg-transparent transition-colors">
                {ctaText} →
              </Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-background p-12 md:p-16 space-y-10 group hover:bg-foreground transition-all duration-500 cursor-default">
              <div className="flex items-center justify-between">
                <span className="text-4xl font-black tracking-tighter opacity-10 group-hover:opacity-100 group-hover:text-background transition-all">
                  {feature.num}
                </span>
                <feature.icon className="h-5 w-5 text-muted-foreground group-hover:text-background transition-colors" suppressHydrationWarning />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl md:text-3xl font-black tracking-tighter uppercase font-display group-hover:text-background transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground font-bold uppercase text-xs tracking-tight leading-relaxed group-hover:text-background/60 transition-colors">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
