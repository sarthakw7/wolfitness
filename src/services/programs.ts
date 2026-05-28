import { createClient } from '@/lib/supabaseServer';

// ─── Program Service ────────────────────────────────────────────────

export async function getPublishedPrograms() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('programs')
    .select(`
      *,
      coaches!creator_id (
        id, headline, is_verified,
        users:id ( full_name, username, avatar_url )
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
    .from('programs')
    .select(`
      *,
      program_weeks (
        id, week_number, title,
        program_days (
          id, day_number, title
        )
      )
    `)
    .eq('id', programId)
    .single();

  if (error) throw error;

  // Sort weeks and days
  if (data?.program_weeks) {
    data.program_weeks.sort((a: any, b: any) => a.week_number - b.week_number);
    data.program_weeks.forEach((w: any) => {
      if (w.program_days) {
        w.program_days.sort((a: any, b: any) => a.day_number - b.day_number);
      }
    });
  }

  return data;
}

export async function getProgramsByCreator(creatorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getProgramCreator(creatorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('coaches')
    .select('id, headline, is_verified, users:id(full_name, username, avatar_url, bio)')
    .eq('id', creatorId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
