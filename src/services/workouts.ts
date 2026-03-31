import { createClient } from '@/lib/supabaseServer';

// ─── Workout Service ────────────────────────────────────────────────

export async function getWorkoutLogs(userId: string, options?: { dayId?: string; daysBack?: number }) {
  const supabase = await createClient();
  let query = supabase
    .from('wff_user_workout_logs')
    .select('*')
    .eq('user_id', userId);

  if (options?.dayId) {
    query = query.eq('day_id', options.dayId);
  }

  if (options?.daysBack) {
    const since = new Date();
    since.setDate(since.getDate() - options.daysBack);
    query = query.gte('completed_at', since.toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getCompletedDaysCount(userId: string, programId: string) {
  const supabase = await createClient();
  
  // Get distinct day_ids the user has logged at least one set for
  const { data, error } = await supabase
    .from('wff_user_workout_logs')
    .select('day_id')
    .eq('user_id', userId)
    .eq('program_id', programId);

  if (error) throw error;
  
  const uniqueDays = new Set((data || []).map(d => d.day_id));
  return uniqueDays.size;
}

export async function getTotalDaysInProgram(programId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('wff_program_days')
    .select('id', { count: 'exact', head: true })
    .in('week_id', 
      (await supabase
        .from('wff_program_weeks')
        .select('id')
        .eq('program_id', programId)
      ).data?.map(w => w.id) || []
    );

  if (error) throw error;
  return count || 0;
}

export async function calculateProgramProgress(userId: string, programId: string) {
  const [completed, total] = await Promise.all([
    getCompletedDaysCount(userId, programId),
    getTotalDaysInProgram(programId),
  ]);

  return total === 0 ? 0 : Math.round((completed / total) * 100);
}
