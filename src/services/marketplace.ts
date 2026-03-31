import { createClient } from '@/lib/supabaseServer';

// ─── Marketplace / Creator Service ──────────────────────────────────

export async function getAllCreators() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('wff_creators')
    .select(`
      id,
      specialization,
      years_experience,
      headline,
      is_verified,
      endorsed_by_mentor_id,
      profiles:id (
        full_name,
        username,
        avatar_url,
        role
      )
    `);

  if (error) throw error;
  return data || [];
}

export async function getCreatorById(creatorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('wff_creators')
    .select(`
      *,
      profiles:id (
        full_name,
        username,
        avatar_url,
        bio,
        role
      )
    `)
    .eq('id', creatorId)
    .single();

  if (error) throw error;
  return data;
}

export async function getCreatorVerification(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('wff_creators')
    .select('is_verified')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data?.is_verified || false;
}
