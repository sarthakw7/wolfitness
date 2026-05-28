'use server';

import { createClient } from '@/lib/supabaseServer';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function cloneTemplate(templateId: string) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // 1. Fetch the master template
  const { data: template, error: templateError } = await supabase
    .from('programs')
    .select('*')
    .eq('id', templateId)
    .single();

  if (templateError || !template) {
    throw new Error('Template not found');
  }

  // 2. Insert the cloned program
  const { data: newProgram, error: createError } = await supabase
    .from('programs')
    .insert({
      creator_id: session.user.id,
      title: `${template.title} (Clone)`,
      description: template.description,
      price: template.price,
      duration_weeks: template.duration_weeks,
      difficulty: template.difficulty,
      vibe_type: template.vibe_type,
      image_url: template.image_url,
      is_published: false,
      parent_template_id: template.id,
    })
    .select('id')
    .single();

  if (createError || !newProgram) {
    console.error('Error cloning program:', createError);
    throw new Error('Failed to create clone');
  }

  // 3. Clone Weeks, Days, and Exercises
  // We need to fetch all weeks, then days, then exercises to maintain relationships
  const { data: weeks } = await (supabase as any)
    .from('program_weeks')
    .select('*, program_days(*, program_exercises(*))')
    .eq('program_id', templateId);

  if (weeks && weeks.length > 0) {
    for (const rawWeek of weeks) {
      const week: any = rawWeek;
      // Create new week
      const { data: newWeek } = await (supabase as any)
        .from('program_weeks')
        .insert({
          program_id: newProgram.id,
          week_number: week.week_number,
          title: week.title,
        })
        .select('id')
        .single();

      if (newWeek && week.program_days) {
        for (const rawDay of week.program_days) {
          const day: any = rawDay;
          // Create new day
          const { data: newDay } = await (supabase as any)
            .from('program_days')
            .insert({
              week_id: newWeek.id,
              day_number: day.day_number,
              title: day.title,
            })
            .select('id')
            .single();

          if (newDay && day.program_exercises) {
            const exercisesToInsert = day.program_exercises.map((ex: any) => ({
              day_id: newDay.id,
              exercise_name: ex.exercise_name,
              sets: ex.sets,
              reps: ex.reps,
              rpe: ex.rpe,
              rest_seconds: ex.rest_seconds,
              notes: ex.notes,
              video_url: ex.video_url,
              order_index: ex.order_index,
            }));

            if (exercisesToInsert.length > 0) {
              await (supabase as any).from('program_exercises').insert(exercisesToInsert);
            }
          }
        }
      }
    }
  }

  revalidatePath('/dashboard/coach');
  redirect(`/dashboard/coach/programs/${newProgram.id}/edit`);
}
