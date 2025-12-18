import { createClient } from '@/lib/supabaseServer';
import { MarketplaceGrid } from '@/components/marketplace/MarketplaceGrid';
import Navbar from '@/components/Navbar';

export const revalidate = 0; // Ensure fresh data on every request

export default async function MarketplacePage() {
  const supabase = await createClient();

  // Fetch coaches with their profile data
  const { data: coaches, error } = await supabase
    .from('coaches')
    .select(`
      id,
      specialization,
      years_experience,
      headline,
      profiles (
        full_name,
        username,
        avatar_url
      )
    `);

  if (error) {
    console.error('Error fetching coaches:', error);
  }

  // Mock Data to fill the grid for Demo
  const mockCoaches = [
    {
      id: 'mock-1',
      specialization: ['bodybuilding', 'nutrition'],
      years_experience: '5-10 Years',
      headline: 'IFBB Pro helping you build your dream physique.',
      profiles: { full_name: 'Alex Kovacs', username: 'alex_lifts', avatar_url: null }
    },
    {
      id: 'mock-2',
      specialization: ['yoga', 'mobility'],
      years_experience: '10+ Years',
      headline: 'Restore your movement and find inner peace.',
      profiles: { full_name: 'Sarah Jenkins', username: 'sarah_yoga', avatar_url: null }
    },
    {
      id: 'mock-3',
      specialization: ['crossfit', 'strength'],
      years_experience: '3-5 Years',
      headline: 'High intensity training for high performance athletes.',
      profiles: { full_name: 'Marcus Reed', username: 'marcus_cf', avatar_url: null }
    },
    {
        id: 'mock-4',
        specialization: ['weight_loss', 'lifestyle'],
        years_experience: '0-2 Years',
        headline: 'Sustainable weight loss for busy moms.',
        profiles: { full_name: 'Emily Blunt', username: 'emily_fit', avatar_url: null }
      },
  ];

  // Combine real and mock data, mapping any raw DB results to the shape expected by the grid if needed
  // Since the query structure matches the mock structure roughly, we just spread them.
  // We need to ensure 'profiles' object is flattened or handled in the Grid component. 
  // The Grid component expects: { id, specialization, ..., profiles: { ... } } which matches the query.
  
  const displayCoaches: any[] = [...(coaches || []), ...mockCoaches];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <MarketplaceGrid initialCoaches={displayCoaches} />
    </div>
  );
}
