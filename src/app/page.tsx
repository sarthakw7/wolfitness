import { getLandingSections } from '@/services/admin';
import { HeroSection } from '@/components/landing/HeroSection';
import { CampaignSection } from '@/components/landing/CampaignSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // ISR

export default async function Home() {
  let sections: any[] = [];
  try {
    sections = await getLandingSections();
  } catch (error) {
    console.error('Failed to fetch landing sections:', error);
  }

  // Fallback content if database is empty
  const displaySections = sections.length > 0 ? sections : [
    {
      id: 'fallback-hero',
      type: 'hero',
      title: 'Train\nWithout\nLimits.',
      subtitle: 'The Performance System',
      description: 'The technical system for athletes who refuse to settle for average.',
      media_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop',
      cta_text: 'Join the Network',
      cta_href: '/auth/signup',
      anchor_tag: 'hero'
    },
    {
      id: 'fallback-integration',
      type: 'photo_campaign',
      title: 'Mindset Meets\nMuscle.',
      subtitle: '01 / The Integration',
      description: 'WOLFITNESS links with the Signal Network to ensure your physical effort matches your mental authority.',
      media_url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop',
      cta_text: 'Get Started',
      cta_href: '/auth/signup',
      anchor_tag: 'integration'
    },
    {
      id: 'fallback-features',
      type: 'features',
      title: 'High Fidelity\nPerformance.',
      subtitle: '02 / Architecture',
      cta_text: 'Explore Marketplace',
      cta_href: '/marketplace',
      anchor_tag: 'architecture'
    },
    {
      id: 'fallback-coaches',
      type: 'photo_campaign',
      title: 'Built By\nThe Elite.',
      subtitle: '03 / Coaches',
      description: 'Every program is created by Signal-verified coaches. Proven methodology, real results.',
      media_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2070&auto=format&fit=crop',
      cta_text: 'Meet Coaches',
      cta_href: '/marketplace',
      anchor_tag: 'coaches'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Cinematic Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.04] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <LandingHeader />

      <main className="flex-1 w-full relative">
        <div className="flex flex-col">
          {displaySections.map((section, index) => {
            const commonProps = {
              key: section.id,
              id: section.anchor_tag || undefined,
              title: section.title || '',
              subtitle: section.subtitle || undefined,
              description: section.description || undefined,
              ctaText: section.cta_text || undefined,
              ctaHref: section.cta_href || undefined,
            };

            switch (section.type) {
              case 'hero':
                return (
                  <HeroSection 
                    {...commonProps} 
                    mediaUrl={section.media_url || undefined} 
                    priority={index === 0} 
                  />
                );
              case 'photo_campaign':
              case 'video_campaign':
                return (
                  <CampaignSection 
                    {...commonProps} 
                    mediaUrl={section.media_url || ''} 
                  />
                );
              case 'features':
                return (
                  <FeaturesSection {...commonProps} />
                );
              default:
                return null;
            }
          })}
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
