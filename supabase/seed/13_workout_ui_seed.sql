-- Workout UI seed for remote DB testing.
-- Replace these placeholders before running:
--   f786865d-ede0-4307-8836-337b858a5e05 -> coach auth.users.id
--   d39c5500-4d79-4584-ba85-2b6529f39162 -> athlete auth.users.id
--
-- This script seeds:
-- - 1 published free program
-- - 1 full training week (7 days)
-- - day-wise exercise prescriptions with sets/reps/rest
-- - active enrollment for athlete
-- - optional open workout session for "Resume Workout" state

begin;

do $$
declare
  coach_user_id uuid := 'f786865d-ede0-4307-8836-337b858a5e05';
  athlete_user_id uuid := 'd39c5500-4d79-4584-ba85-2b6529f39162';

  seed_program_id uuid := '9f0f5f41-6d4f-4a7d-b22a-6f8f0f5a1001';
  seed_week_1_id uuid := '9f0f5f41-6d4f-4a7d-b22a-6f8f0f5a1101';

  day_1_id uuid := '9f0f5f41-6d4f-4a7d-b22a-6f8f0f5a1201'; -- Monday
  day_2_id uuid := '9f0f5f41-6d4f-4a7d-b22a-6f8f0f5a1202'; -- Tuesday
  day_3_id uuid := '9f0f5f41-6d4f-4a7d-b22a-6f8f0f5a1203'; -- Wednesday
  day_4_id uuid := '9f0f5f41-6d4f-4a7d-b22a-6f8f0f5a1204'; -- Thursday
  day_5_id uuid := '9f0f5f41-6d4f-4a7d-b22a-6f8f0f5a1205'; -- Friday
  day_6_id uuid := '9f0f5f41-6d4f-4a7d-b22a-6f8f0f5a1206'; -- Saturday
  day_7_id uuid := '9f0f5f41-6d4f-4a7d-b22a-6f8f0f5a1207'; -- Sunday

  today_iso_dow int := extract(isodow from now())::int;
  today_day_id uuid;
begin
  if not exists (select 1 from auth.users where id = coach_user_id) then
    raise exception 'coach_user_id not found in auth.users: %', coach_user_id;
  end if;

  if not exists (select 1 from auth.users where id = athlete_user_id) then
    raise exception 'athlete_user_id not found in auth.users: %', athlete_user_id;
  end if;

  insert into public.users (id, email, full_name, role)
  values
    (coach_user_id, 'coach.seed@wolfitness.dev', 'Seed Coach', 'coach'),
    (athlete_user_id, 'athlete.seed@wolfitness.dev', 'Seed Athlete', 'client')
  on conflict (id) do update
    set role = excluded.role,
        full_name = excluded.full_name;

  insert into public.coaches (
    id, specializations, years_experience, certifications, headline, is_verified
  )
  values (
    coach_user_id,
    array['strength', 'hypertrophy', 'body recomposition'],
    8,
    array['CSCS', 'PN1'],
    'Performance systems coach',
    true
  )
  on conflict (id) do update
    set is_verified = true,
        headline = excluded.headline,
        years_experience = excluded.years_experience;

  insert into public.exercises_library (name, primary_muscle, pattern)
  values
    ('Back Squat', 'Quads', 'squat'),
    ('Romanian Deadlift', 'Hamstrings', 'hinge'),
    ('Walking Lunge', 'Quads', 'squat'),
    ('Leg Press', 'Quads', 'squat'),
    ('Leg Curl', 'Hamstrings', 'isolation'),
    ('Standing Calf Raise', 'Calves', 'isolation'),
    ('Barbell Bench Press', 'Chest', 'push'),
    ('Incline Dumbbell Press', 'Chest', 'push'),
    ('Seated Dumbbell Shoulder Press', 'Shoulders', 'push'),
    ('Cable Lateral Raise', 'Shoulders', 'isolation'),
    ('Triceps Rope Pushdown', 'Triceps', 'isolation'),
    ('Pull-Up', 'Lats', 'pull'),
    ('Chest Supported Row', 'Mid Back', 'pull'),
    ('Lat Pulldown', 'Lats', 'pull'),
    ('Face Pull', 'Rear Delts', 'isolation'),
    ('Barbell Curl', 'Biceps', 'isolation'),
    ('Hip Thrust', 'Glutes', 'hinge'),
    ('Bulgarian Split Squat', 'Quads', 'squat'),
    ('Plank', 'Core', 'core'),
    ('Hanging Leg Raise', 'Core', 'core'),
    ('Treadmill Incline Walk', 'Cardio', 'cardio')
  on conflict (name) do update
    set primary_muscle = excluded.primary_muscle,
        pattern = excluded.pattern;

  insert into public.programs (
    id, creator_id, title, description, price, is_subscription,
    duration_weeks, difficulty, vibe_type, is_published
  )
  values (
    seed_program_id, coach_user_id,
    'Wolf Strength Foundation',
    '4-week full-body strength protocol with progressive overload.',
    0, false, 4, 'intermediate', 'Strength', true
  )
  on conflict (id) do update
    set title = excluded.title,
        description = excluded.description,
        is_published = true,
        price = excluded.price;

  insert into public.program_weeks (id, program_id, week_number, title)
  values (seed_week_1_id, seed_program_id, 1, 'Week 1 - Base Build')
  on conflict (id) do update
    set title = excluded.title;

  insert into public.program_days (id, week_id, day_number, title) values
    (day_1_id, seed_week_1_id, 1, 'Lower A'),
    (day_2_id, seed_week_1_id, 2, 'Upper Push'),
    (day_3_id, seed_week_1_id, 3, 'Upper Pull'),
    (day_4_id, seed_week_1_id, 4, 'Lower B'),
    (day_5_id, seed_week_1_id, 5, 'Upper Mix'),
    (day_6_id, seed_week_1_id, 6, 'Conditioning + Core'),
    (day_7_id, seed_week_1_id, 7, 'Recovery Mobility')
  on conflict (id) do update
    set title = excluded.title;

  delete from public.program_exercises
  where day_id in (day_1_id, day_2_id, day_3_id, day_4_id, day_5_id, day_6_id, day_7_id);

  insert into public.program_exercises (day_id, exercise_library_id, target_sets, target_reps, target_rpe, rest_seconds, order_index, notes)
  values
    (day_1_id, (select id from public.exercises_library where name='Back Squat'), 4, '6-8', 8, 150, 1, 'Controlled eccentric'),
    (day_1_id, (select id from public.exercises_library where name='Romanian Deadlift'), 4, '8-10', 8, 120, 2, null),
    (day_1_id, (select id from public.exercises_library where name='Walking Lunge'), 3, '10/leg', 7, 90, 3, null),
    (day_1_id, (select id from public.exercises_library where name='Standing Calf Raise'), 3, '12-15', 8, 60, 4, null),

    (day_2_id, (select id from public.exercises_library where name='Barbell Bench Press'), 4, '6-8', 8, 150, 1, null),
    (day_2_id, (select id from public.exercises_library where name='Incline Dumbbell Press'), 3, '8-10', 8, 120, 2, null),
    (day_2_id, (select id from public.exercises_library where name='Seated Dumbbell Shoulder Press'), 3, '8-10', 8, 120, 3, null),
    (day_2_id, (select id from public.exercises_library where name='Triceps Rope Pushdown'), 3, '12-15', 8, 60, 4, null),

    (day_3_id, (select id from public.exercises_library where name='Pull-Up'), 4, '6-8', 8, 120, 1, 'Band assist if needed'),
    (day_3_id, (select id from public.exercises_library where name='Chest Supported Row'), 4, '8-10', 8, 120, 2, null),
    (day_3_id, (select id from public.exercises_library where name='Lat Pulldown'), 3, '10-12', 8, 90, 3, null),
    (day_3_id, (select id from public.exercises_library where name='Barbell Curl'), 3, '10-12', 8, 60, 4, null),

    (day_4_id, (select id from public.exercises_library where name='Hip Thrust'), 4, '8-10', 8, 120, 1, null),
    (day_4_id, (select id from public.exercises_library where name='Leg Press'), 4, '10-12', 8, 120, 2, null),
    (day_4_id, (select id from public.exercises_library where name='Leg Curl'), 3, '12-15', 8, 75, 3, null),
    (day_4_id, (select id from public.exercises_library where name='Bulgarian Split Squat'), 3, '8/leg', 8, 90, 4, null),

    (day_5_id, (select id from public.exercises_library where name='Barbell Bench Press'), 3, '5-6', 8, 150, 1, null),
    (day_5_id, (select id from public.exercises_library where name='Chest Supported Row'), 3, '8-10', 8, 120, 2, null),
    (day_5_id, (select id from public.exercises_library where name='Cable Lateral Raise'), 3, '12-15', 8, 60, 3, null),
    (day_5_id, (select id from public.exercises_library where name='Face Pull'), 3, '12-15', 8, 60, 4, null),

    (day_6_id, (select id from public.exercises_library where name='Treadmill Incline Walk'), 1, '20 min', 6, 0, 1, 'Zone 2 effort'),
    (day_6_id, (select id from public.exercises_library where name='Plank'), 3, '45-60 sec', 7, 45, 2, null),
    (day_6_id, (select id from public.exercises_library where name='Hanging Leg Raise'), 3, '10-15', 8, 60, 3, null),

    (day_7_id, (select id from public.exercises_library where name='Treadmill Incline Walk'), 1, '30 min easy', 5, 0, 1, 'Recovery pace');

  insert into public.enrollments (user_id, program_id, status, enrolled_at)
  values (athlete_user_id, seed_program_id, 'active', now() - interval '1 day')
  on conflict (user_id, program_id) do update
    set status = 'active',
        enrolled_at = excluded.enrolled_at,
        expires_at = null;

  select case today_iso_dow
    when 1 then day_1_id
    when 2 then day_2_id
    when 3 then day_3_id
    when 4 then day_4_id
    when 5 then day_5_id
    when 6 then day_6_id
    else day_7_id
  end into today_day_id;

  if not exists (
    select 1
    from public.workout_sessions ws
    where ws.user_id = athlete_user_id
      and ws.program_id = seed_program_id
      and ws.day_id = today_day_id
      and ws.completed_at is null
  ) then
    insert into public.workout_sessions (user_id, program_id, day_id, started_at, notes)
    values (athlete_user_id, seed_program_id, today_day_id, now() - interval '10 minutes', 'Seeded active session for UI testing');
  end if;
end $$;

commit;
