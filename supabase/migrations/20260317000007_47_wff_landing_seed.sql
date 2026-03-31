-- Migration 47: Seed WFF Landing Page Data
-- Populates the CMS with the current high-fidelity content.

INSERT INTO public.wff_landing_sections 
(type, title, subtitle, description, media_url, cta_text, cta_href, order_index, anchor_tag)
VALUES 
(
  'hero', 
  'Train' || CHR(10) || 'Without' || CHR(10) || 'Limits.', 
  'The Performance Protocol', 
  'The technical protocol for athletes who refuse to settle for average.', 
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop',
  'Join the Network',
  '/auth/signup',
  0,
  'hero'
),
(
  'photo_campaign',
  'Mindset Meets' || CHR(10) || 'Muscle.',
  '01 / The Integration',
  'WOLFITNESS links with the Signal Network to ensure your physical effort matches your mental authority.',
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop',
  'Get Started',
  '/auth/signup',
  1,
  'integration'
),
(
  'features',
  'High Fidelity' || CHR(10) || 'Performance.',
  '02 / Architecture',
  'The infrastructure of elite performance.',
  NULL,
  'Explore Marketplace',
  '/marketplace',
  2,
  'architecture'
),
(
  'photo_campaign',
  'Built By' || CHR(10) || 'The Elite.',
  '03 / Coaches',
  'Every program is created by Signal-verified coaches. Proven methodology, real results.',
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2070&auto=format&fit=crop',
  'Meet Coaches',
  '/marketplace',
  3,
  'coaches'
),
(
  'hero',
  'Earn Your' || CHR(10) || 'Place.',
  '04 / The Legacy',
  'Stop training. Start executing. The WOLFITNESS PROTOCOL is the technical system for those who refuse to settle for average.',
  NULL, -- Pure black background CTA
  'Join the Network',
  '/auth/signup',
  4,
  'legacy'
)
ON CONFLICT DO NOTHING;
