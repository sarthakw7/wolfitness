import { createClient } from '@/lib/supabaseServer';

// ─── Enrollment Service ─────────────────────────────────────────────

export async function getEnrollmentsByUser(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('wff_enrollments')
    .select(`
      *,
      programs:program_id (
        id, title, difficulty, duration_weeks
      )
    `)
    .eq('user_id', userId);

  if (error) throw error;
  return data || [];
}

export async function checkEnrollment(userId: string, programId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('wff_enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('program_id', programId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function getEnrollmentCountForProgram(programId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('wff_enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('program_id', programId);

  if (error) throw error;
  return count || 0;
}

export async function getActiveClientCount(creatorId: string) {
  const supabase = await createClient();
  
  // Get all program IDs by this creator
  const { data: programs } = await supabase
    .from('wff_programs')
    .select('id')
    .eq('creator_id', creatorId);

  if (!programs || programs.length === 0) return 0;

  const programIds = programs.map(p => p.id);
  const { count, error } = await supabase
    .from('wff_enrollments')
    .select('id', { count: 'exact', head: true })
    .in('program_id', programIds)
    .eq('status', 'active');

  if (error) throw error;
  return count || 0;
}
