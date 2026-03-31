'use server'

import { createClient } from '@/lib/supabaseServer';
import { Database } from '@/types/database';

// ─── Admin Service (CMS & Moderation) ───────────────────────────────

type LandingSection = Database['public']['Tables']['wff_landing_sections']['Row'];
type LandingSectionInsert = Database['public']['Tables']['wff_landing_sections']['Insert'];

/**
 * Fetch all landing page sections for the home page.
 * Publicly accessible but ordered by admin-defined index.
 */
export async function getLandingSections(): Promise<LandingSection[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('wff_landing_sections')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Admin-only: Update or Create a landing section.
 */
export async function saveLandingSection(section: LandingSectionInsert) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('wff_landing_sections')
    .upsert(section)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Admin-only: Get all WFF creators (coaches) for verification.
 */
export async function getAllCreators() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('wff_creators')
    .select(`
      *,
      profiles:id ( email, full_name, username, avatar_url )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Type hint for the complex joined query
  return data as (Database['public']['Tables']['wff_creators']['Row'] & {
    profiles: Pick<Database['public']['Tables']['profiles']['Row'], 'email' | 'full_name' | 'username' | 'avatar_url'> | null
  })[] || [];
}

/**
 * Admin-only: Verify or unverify a coach.
 */
export async function setCreatorVerification(creatorId: string, status: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('wff_creators')
    .update({ is_verified: status })
    .eq('id', creatorId);

  if (error) throw error;
}

/**
 * Admin-only: Ecosystem Stats Overview.
 */
export async function getEcosystemStats() {
  const supabase = await createClient();
  
  const [
    totalUsersResponse,
    totalProgramsResponse,
    totalEnrollmentsResponse
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('wff_programs').select('*', { count: 'exact', head: true }),
    supabase.from('wff_enrollments').select('*', { count: 'exact', head: true })
  ]);

  return {
    totalUsers: totalUsersResponse.count || 0,
    totalPrograms: totalProgramsResponse.count || 0,
    totalEnrollments: totalEnrollmentsResponse.count || 0,
  };
}
