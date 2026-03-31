import { createClient } from '@/lib/supabaseServer';

// ─── Program Service ────────────────────────────────────────────────

export async function getPublishedPrograms() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('wff_programs')
    .select(`
      *,
      wff_creators!creator_id (
        id, headline, is_verified,
        profiles:id ( full_name, username, avatar_url )
      )
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getProgramById(programId: string) {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from('wff_programs')
    .select(`
      *,
      wff_program_weeks (
        id, week_number, title,
        wff_program_days (
          id, day_number, title
        )
      )
    `)
    .eq('id', programId)
    .single();

  if (error) throw error;

  // Sort weeks and days
  if (data?.wff_program_weeks) {
    data.wff_program_weeks.sort((a: any, b: any) => a.week_number - b.week_number);
    data.wff_program_weeks.forEach((w: any) => {
      if (w.wff_program_days) {
        w.wff_program_days.sort((a: any, b: any) => a.day_number - b.day_number);
      }
    });
  }

  return data;
}

export async function getProgramsByCreator(creatorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('wff_programs')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getProgramCreator(creatorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('wff_creators')
    .select('id, headline, is_verified, profiles:id(full_name, username, avatar_url, bio)')
    .eq('id', creatorId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
