-- Seed default landing page sections
INSERT INTO public.landing_sections (section_key, type, title, subtitle, order_index, is_active, content)
VALUES 
(
    'hero-main',
    'hero', 
    'Train\nWithout\nLimits.', 
    'The Performance System', 
    0, 
    true, 
    '{"description": "The technical system for athletes who refuse to settle for average.", "media_url": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop", "cta_text": "Join the Network", "cta_href": "/auth/signup"}'::jsonb
),
(
    'campaign-integration',
    'photo_campaign', 
    'Mindset Meets\nMuscle.', 
    '01 / The Integration', 
    1, 
    true, 
    '{"description": "WOLFITNESS links with the Signal Network to ensure your physical effort matches your mental authority.", "media_url": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop", "cta_text": "Get Started", "cta_href": "/auth/signup"}'::jsonb
),
(
    'features-main',
    'features', 
    'High Fidelity\nPerformance.', 
    '02 / Architecture', 
    2, 
    true, 
    '{"cta_text": "Explore Marketplace", "cta_href": "/marketplace"}'::jsonb
),
(
    'campaign-coaches',
    'photo_campaign', 
    'Built By\nThe Elite.', 
    '03 / Coaches', 
    3, 
    true, 
    '{"description": "Every program is created by Signal-verified coaches. Proven methodology, real results.", "media_url": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2070&auto=format&fit=crop", "cta_text": "Meet Coaches", "cta_href": "/marketplace"}'::jsonb
)
ON CONFLICT (section_key) DO UPDATE 
SET 
    type = EXCLUDED.type,
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    content = EXCLUDED.content,
    order_index = EXCLUDED.order_index;
