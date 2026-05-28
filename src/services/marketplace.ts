import { createClient } from '@/lib/supabaseServer';

// ─── Marketplace / Creator Service ──────────────────────────────────

export async function getAllCreators() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('coaches')
    .select(`
      id,
      specializations,
      years_experience,
      headline,
      is_verified,
      users:id (
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
    .from('coaches')
    .select(`
      *,
      users:id (
        full_name,
        username,
        avatar_url,
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
    .from('coaches')
    .select('is_verified')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data?.is_verified || false;
}
