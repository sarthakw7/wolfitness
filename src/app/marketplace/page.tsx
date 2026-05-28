import { createClient } from '@/lib/supabaseServer';
import { MarketplaceGrid } from '@/components/marketplace/MarketplaceGrid';
import Navbar from '@/components/Navbar';

export const revalidate = 0; // Ensure fresh data on every request

export default async function MarketplacePage() {
  const supabase = await createClient();

  // Fetch coaches with their profile data and endorsement status
  const { data: coaches, error } = await supabase
    .from('coaches')
    .select(`
      id,
      specializations,
      years_experience,
      headline,
      is_verified,
      users (
        full_name,
        username,
        avatar_url,
        role
      )
    `);

  if (error) {
    console.error('Error fetching coaches:', error);
  }

  // Combine real and handle potential nulls
  const displayCoaches: any[] = coaches || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <MarketplaceGrid initialCoaches={displayCoaches} />
    </div>
  );
}
