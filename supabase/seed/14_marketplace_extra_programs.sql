-- Additional marketplace programs for UI/testing.
-- Replace this placeholder before running:
--   f786865d-ede0-4307-8836-337b858a5e05 -> coach auth.users.id
--
-- Creates:
-- - 1 paid intermediate program
-- - 1 paid advanced program
-- - lightweight week/day/exercise structure for each

begin;

do $$
declare
  coach_user_id uuid := 'f786865d-ede0-4307-8836-337b858a5e05';

  paid_program_id uuid := '9f0f5f41-6d4f-4a7d-b22a-6f8f0f5a2001';
  paid_week_id uuid := '9f0f5f41-6d4f-4a7d-b22a-6f8f0f5a2101';
  paid_day_a_id uuid := '9f0f5f41-6d4f-4a7d-b22a-6f8f0f5a2201';
  paid_day_b_id uuid := '9f0f5f41-6d4f-4a7d-b22a-6f8f0f5a2202';

  advanced_program_id uuid := '9f0f5f41-6d4f-4a7d-b22a-6f8f0f5a3001';
  advanced_week_id uuid := '9f0f5f41-6d4f-4a7d-b22a-6f8f0f5a3101';
  advanced_day_a_id uuid := '9f0f5f41-6d4f-4a7d-b22a-6f8f0f5a3201';
  advanced_day_b_id uuid := '9f0f5f41-6d4f-4a7d-b22a-6f8f0f5a3202';
begin
  if not exists (select 1 from auth.users where id = coach_user_id) then
    raise exception 'coach_user_id not found in auth.users: %', coach_user_id;
  end if;

  if not exists (select 1 from public.coaches where id = coach_user_id) then
    raise exception 'coach_user_id not found in public.coaches: %', coach_user_id;
  end if;

  insert into public.exercises_library (name, primary_muscle, pattern)
  values
    ('Deadlift', 'Posterior Chain', 'hinge'),
    ('Front Squat', 'Quads', 'squat'),
    ('Dumbbell Row', 'Lats', 'pull'),
    ('Push-Up', 'Chest', 'push'),
    ('Farmer Carry', 'Core', 'core'),
    ('Assault Bike', 'Conditioning', 'cardio')
  on conflict (name) do update
    set primary_muscle = excluded.primary_muscle,
        pattern = excluded.pattern;

  insert into public.programs (
    id, creator_id, title, description, price, is_subscription,
    duration_weeks, difficulty, vibe_type, is_published
  )
  values
    (
      paid_program_id, coach_user_id,
      'Fat Loss Blueprint - 8 Week',
      'Paid recomposition protocol with progressive training and conditioning.',
      79, false, 8, 'intermediate', 'Fat Loss', true
    ),
    (
      advanced_program_id, coach_user_id,
      'Strength Peak - Advanced Block',
      'High intensity advanced block focused on peak performance.',
      149, false, 6, 'advanced', 'Strength', true
    )
  on conflict (id) do update
    set title = excluded.title,
        description = excluded.description,
        price = excluded.price,
        difficulty = excluded.difficulty,
        vibe_type = excluded.vibe_type,
        is_published = true;

  insert into public.program_weeks (id, program_id, week_number, title)
  values
    (paid_week_id, paid_program_id, 1, 'Week 1 - Base Cut'),
    (advanced_week_id, advanced_program_id, 1, 'Week 1 - Peak Intro')
  on conflict (id) do update
    set title = excluded.title;

  insert into public.program_days (id, week_id, day_number, title)
  values
    (paid_day_a_id, paid_week_id, 1, 'Lower MetCon'),
    (paid_day_b_id, paid_week_id, 2, 'Upper Conditioning'),
    (advanced_day_a_id, advanced_week_id, 1, 'Heavy Pull'),
    (advanced_day_b_id, advanced_week_id, 2, 'Heavy Push')
  on conflict (id) do update
    set title = excluded.title;

  delete from public.program_exercises
  where day_id in (paid_day_a_id, paid_day_b_id, advanced_day_a_id, advanced_day_b_id);

  insert into public.program_exercises (day_id, exercise_library_id, target_sets, target_reps, target_rpe, rest_seconds, order_index, notes)
  values
    (paid_day_a_id, (select id from public.exercises_library where name = 'Front Squat'), 4, '8-10', 8, 120, 1, null),
    (paid_day_a_id, (select id from public.exercises_library where name = 'Assault Bike'), 6, '45 sec hard / 75 sec easy', 8, 0, 2, 'Intervals'),
    (paid_day_a_id, (select id from public.exercises_library where name = 'Farmer Carry'), 4, '40m', 7, 60, 3, null),

    (paid_day_b_id, (select id from public.exercises_library where name = 'Push-Up'), 4, 'AMRAP', 8, 60, 1, null),
    (paid_day_b_id, (select id from public.exercises_library where name = 'Dumbbell Row'), 4, '10-12', 8, 75, 2, null),
    (paid_day_b_id, (select id from public.exercises_library where name = 'Assault Bike'), 5, '2 min moderate', 7, 60, 3, null),

    (advanced_day_a_id, (select id from public.exercises_library where name = 'Deadlift'), 5, '3-5', 9, 180, 1, 'Top set + backoffs'),
    (advanced_day_a_id, (select id from public.exercises_library where name = 'Dumbbell Row'), 4, '8-10', 8, 90, 2, null),
    (advanced_day_a_id, (select id from public.exercises_library where name = 'Farmer Carry'), 3, '60m heavy', 8, 90, 3, null),

    (advanced_day_b_id, (select id from public.exercises_library where name = 'Push-Up'), 5, 'AMRAP', 9, 75, 1, 'Weighted if needed'),
    (advanced_day_b_id, (select id from public.exercises_library where name = 'Front Squat'), 4, '5-6', 8, 150, 2, null),
    (advanced_day_b_id, (select id from public.exercises_library where name = 'Assault Bike'), 8, '30 sec sprint / 90 sec easy', 9, 0, 3, 'Finisher');
end $$;

commit;
