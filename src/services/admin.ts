'use server'

import { createClient } from '@/lib/supabaseServer';

// ─── Admin Service (CMS & Moderation) ───────────────────────────────

export type LandingSection = {
  id: string;
  type: string;
  title: string | null;
  subtitle?: string | null;
  content?: any;
  image_url?: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type LandingSectionInsert = Partial<LandingSection>;

/**
 * Fetch all landing page sections for the home page.
 * Publicly accessible but ordered by admin-defined index.
 */
export async function getLandingSections(): Promise<LandingSection[]> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from('landing_sections')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Database error in getLandingSections:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    // Return empty array to trigger fallback UI instead of crashing
    return [];
  }
  
  // Map JSONB content to top-level fields for the frontend components
  return (data || []).map((section: any) => ({
    ...section,
    description: section.content?.description || section.subtitle,
    media_url: section.content?.media_url || section.image_url,
    cta_text: section.content?.cta_text,
    cta_href: section.content?.cta_href,
    anchor_tag: section.type
  }));
}

/**
 * Admin-only: Update or Create a landing section.
 */
export async function saveLandingSection(section: LandingSectionInsert) {
  const supabase = await createClient();
  
  const { data, error } = await (supabase as any)
    .from('landing_sections')
    .upsert(section)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Admin-only: Get all coaches for verification.
 */
export async function getAllCreators() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('coaches')
    .select(`
      *,
      users:id ( email, full_name, username, avatar_url )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return data as any;
}

/**
 * Admin-only: Verify or unverify a coach.
 */
export async function setCreatorVerification(creatorId: string, status: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('coaches')
    .update({ is_verified: status })
    .eq('id', creatorId);

  if (error) throw error;
}

/**
 * Admin-only: Platform Stats Overview.
 */
export async function getPlatformStats() {
  const supabase = await createClient();
  
  const [
    totalUsersResponse,
    totalProgramsResponse,
    totalEnrollmentsResponse
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('programs').select('*', { count: 'exact', head: true }),
    supabase.from('enrollments').select('*', { count: 'exact', head: true })
  ]);

  return {
    totalUsers: totalUsersResponse.count || 0,
    totalPrograms: totalProgramsResponse.count || 0,
    totalEnrollments: totalEnrollmentsResponse.count || 0,
  };
}
