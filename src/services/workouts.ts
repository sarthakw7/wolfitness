import { createClient } from '@/lib/supabaseServer';

// ─── Workout Service ────────────────────────────────────────────────

export async function getWorkoutLogs(userId: string, options?: { dayId?: string; daysBack?: number }) {
  const supabase = await createClient();
  let query = supabase
    .from('workout_log_sets')
    .select('*, workout_sessions!inner(*)')
    .eq('workout_sessions.user_id', userId);

  if (options?.dayId) {
    query = query.eq('workout_sessions.day_id', options.dayId);
  }

  if (options?.daysBack) {
    const since = new Date();
    since.setDate(since.getDate() - options.daysBack);
    query = query.gte('workout_sessions.completed_at', since.toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getCompletedDaysCount(userId: string, programId: string) {
  const supabase = await createClient();
  
  // Get distinct day_ids from workout_sessions that have associated sets
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('day_id, workout_log_sets!inner(id)')
    .eq('user_id', userId)
    .eq('program_id', programId);

  if (error) throw error;
  
  const uniqueDays = new Set((data || []).map(d => d.day_id).filter(Boolean));
  return uniqueDays.size;
}

export async function getTotalDaysInProgram(programId: string) {
  const supabase = await createClient();
  
  // First get week IDs
  const { data: weeks, error: weekError } = await supabase
    .from('program_weeks')
    .select('id')
    .eq('program_id', programId);

  if (weekError || !weeks) return 0;

  const weekIds = weeks.map(w => w.id);
  if (weekIds.length === 0) return 0;

  const { count, error } = await supabase
    .from('program_days')
    .select('id', { count: 'exact', head: true })
    .in('week_id', weekIds);

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
