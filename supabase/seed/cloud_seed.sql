-- 01_users.sql
-- IMPORTANT: replace IDs with real auth.users IDs in production.

with seed_people as (
  select *
  from (
    values
      ('f786865d-ede0-4307-8836-337b858a5e05'::uuid, 'coach1@wolfitness.app'::text, 'Coach Aria Stone'::text, 'coach'::text),
      ('9c37d428-0931-4920-b686-6e78f21e5786'::uuid, 'coach2@wolfitness.app'::text, 'Coach Noah Vale'::text, 'coach'::text),
      ('2c153cd4-25c5-4a8a-9c53-cc2bbf4025d0'::uuid, 'coach3@wolfitness.app'::text, 'Coach Mira Cross'::text, 'coach'::text),
      ('d39c5500-4d79-4584-ba85-2b6529f39162'::uuid, 'athlete@wolfitness.app'::text, 'Alex Athlete'::text, 'client'::text)
  ) as t(id, email, full_name, role)
)
insert into auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
)
select
  id,
  email,
  '$2a$10$CwTycUXWue0Thq9StjUM0uJ8uG6nY6Y7F4fWq8l6fQmQ6WmY5G2eK',
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', full_name),
  'authenticated',
  'authenticated'
from seed_people
on conflict (id) do update
set email = excluded.email,
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    raw_app_meta_data = excluded.raw_app_meta_data,
    raw_user_meta_data = excluded.raw_user_meta_data,
    aud = excluded.aud,
    role = excluded.role;

with seed_people as (
  select *
  from (
    values
      ('f786865d-ede0-4307-8836-337b858a5e05'::uuid, 'coach1@wolfitness.app'::text, 'Coach Aria Stone'::text, 'coach'::text),
      ('9c37d428-0931-4920-b686-6e78f21e5786'::uuid, 'coach2@wolfitness.app'::text, 'Coach Noah Vale'::text, 'coach'::text),
      ('2c153cd4-25c5-4a8a-9c53-cc2bbf4025d0'::uuid, 'coach3@wolfitness.app'::text, 'Coach Mira Cross'::text, 'coach'::text),
      ('d39c5500-4d79-4584-ba85-2b6529f39162'::uuid, 'athlete@wolfitness.app'::text, 'Alex Athlete'::text, 'client'::text)
  ) as t(id, email, full_name, role)
)
insert into public.users (id, email, full_name, role)
select id, email, full_name, role::wff_role
from seed_people
on conflict (id) do update
set email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role;
-- 02_coaches.sql

insert into public.coaches (id, specializations, years_experience, headline, is_verified)
values
  ('f786865d-ede0-4307-8836-337b858a5e05'::uuid, array['Strength','Hypertrophy'], 9, 'Performance-first strength systems.', true),
  ('9c37d428-0931-4920-b686-6e78f21e5786'::uuid, array['Conditioning','Fat Loss'], 7, 'Conditioning with measurable progression.', true),
  ('2c153cd4-25c5-4a8a-9c53-cc2bbf4025d0'::uuid, array['Mobility','Athletic Performance'], 11, 'Resilient movement and power transfer.', true)
on conflict (id) do update
set specializations = excluded.specializations,
    years_experience = excluded.years_experience,
    headline = excluded.headline,
    is_verified = excluded.is_verified;

-- 03_programs.sql

insert into public.programs (
  id, creator_id, title, description, price, is_subscription,
  duration_weeks, difficulty, vibe_type, image_url, is_published, version_number
)
values
  ('10000000-0000-0000-0000-000000000001'::uuid, 'f786865d-ede0-4307-8836-337b858a5e05'::uuid, 'Strength Foundation', 'Build foundational strength with progressive overload.', 49, false, 4, 'beginner', 'power', null, true, 1),
  ('10000000-0000-0000-0000-000000000002'::uuid, '9c37d428-0931-4920-b686-6e78f21e5786'::uuid, 'Fat Loss Conditioning', 'High-compliance conditioning and calorie burn.', 59, false, 4, 'beginner', 'endurance', null, true, 1),
  ('10000000-0000-0000-0000-000000000003'::uuid, 'f786865d-ede0-4307-8836-337b858a5e05'::uuid, 'Hypertrophy Split', 'Muscle-focused split with volume control.', 79, false, 4, 'intermediate', 'power', null, true, 1),
  ('10000000-0000-0000-0000-000000000004'::uuid, '2c153cd4-25c5-4a8a-9c53-cc2bbf4025d0'::uuid, 'Mobility & Recovery', 'Restore range, improve control, reduce pain risk.', 39, false, 4, 'beginner', 'mobility', null, true, 1),
  ('10000000-0000-0000-0000-000000000005'::uuid, '2c153cd4-25c5-4a8a-9c53-cc2bbf4025d0'::uuid, 'Athletic Performance', 'Power, speed, and force transfer for sport.', 99, false, 4, 'advanced', 'power', null, true, 1),
  ('10000000-0000-0000-0000-000000000006'::uuid, 'f786865d-ede0-4307-8836-337b858a5e05'::uuid, 'Beginner Strength', 'Simple full-body barbell progression.', 45, false, 4, 'beginner', 'balanced', null, true, 1),
  ('10000000-0000-0000-0000-000000000007'::uuid, '9c37d428-0931-4920-b686-6e78f21e5786'::uuid, 'Functional Fitness', 'Work capacity, movement patterns, real-world carryover.', 69, false, 4, 'intermediate', 'endurance', null, true, 1),
  ('10000000-0000-0000-0000-000000000008'::uuid, 'f786865d-ede0-4307-8836-337b858a5e05'::uuid, 'Lean Muscle Accelerator', 'Add lean mass without excess fatigue.', 89, false, 4, 'advanced', 'power', null, true, 1)
on conflict (id) do update
set title = excluded.title,
    description = excluded.description,
    price = excluded.price,
    duration_weeks = excluded.duration_weeks,
    difficulty = excluded.difficulty,
    vibe_type = excluded.vibe_type,
    is_published = excluded.is_published;

-- 04_exercises_library.sql

insert into public.exercises_library (id, name, primary_muscle, pattern, video_url)
values
  ('20000000-0000-0000-0000-000000000001'::uuid,'Back Squat','Quadriceps',null,null),
  ('20000000-0000-0000-0000-000000000002'::uuid,'Front Squat','Quadriceps',null,null),
  ('20000000-0000-0000-0000-000000000003'::uuid,'Romanian Deadlift','Hamstrings',null,null),
  ('20000000-0000-0000-0000-000000000004'::uuid,'Conventional Deadlift','Posterior Chain',null,null),
  ('20000000-0000-0000-0000-000000000005'::uuid,'Hip Thrust','Glutes',null,null),
  ('20000000-0000-0000-0000-000000000006'::uuid,'Walking Lunge','Quadriceps',null,null),
  ('20000000-0000-0000-0000-000000000007'::uuid,'Bench Press','Chest',null,null),
  ('20000000-0000-0000-0000-000000000008'::uuid,'Incline Dumbbell Press','Chest',null,null),
  ('20000000-0000-0000-0000-000000000009'::uuid,'Overhead Press','Shoulders',null,null),
  ('20000000-0000-0000-0000-000000000010'::uuid,'Push Press','Shoulders',null,null),
  ('20000000-0000-0000-0000-000000000011'::uuid,'Pull-Up','Lats',null,null),
  ('20000000-0000-0000-0000-000000000012'::uuid,'Lat Pulldown','Lats',null,null),
  ('20000000-0000-0000-0000-000000000013'::uuid,'Barbell Row','Upper Back',null,null),
  ('20000000-0000-0000-0000-000000000014'::uuid,'Chest Supported Row','Upper Back',null,null),
  ('20000000-0000-0000-0000-000000000015'::uuid,'Cable Row','Upper Back',null,null),
  ('20000000-0000-0000-0000-000000000016'::uuid,'Dumbbell Curl','Biceps',null,null),
  ('20000000-0000-0000-0000-000000000017'::uuid,'Triceps Pressdown','Triceps',null,null),
  ('20000000-0000-0000-0000-000000000018'::uuid,'Lateral Raise','Shoulders',null,null),
  ('20000000-0000-0000-0000-000000000019'::uuid,'Face Pull','Rear Delts',null,null),
  ('20000000-0000-0000-0000-000000000020'::uuid,'Plank','Core',null,null),
  ('20000000-0000-0000-0000-000000000021'::uuid,'Hanging Knee Raise','Core',null,null),
  ('20000000-0000-0000-0000-000000000022'::uuid,'Russian Twist','Core',null,null),
  ('20000000-0000-0000-0000-000000000023'::uuid,'Kettlebell Swing','Posterior Chain',null,null),
  ('20000000-0000-0000-0000-000000000024'::uuid,'Goblet Squat','Quadriceps',null,null),
  ('20000000-0000-0000-0000-000000000025'::uuid,'Step-Up','Glutes',null,null),
  ('20000000-0000-0000-0000-000000000026'::uuid,'Farmer Carry','Grip/Core',null,null),
  ('20000000-0000-0000-0000-000000000027'::uuid,'Sled Push','Legs',null,null),
  ('20000000-0000-0000-0000-000000000028'::uuid,'Battle Rope Waves','Conditioning',null,null),
  ('20000000-0000-0000-0000-000000000029'::uuid,'Air Bike Sprint','Conditioning',null,null),
  ('20000000-0000-0000-0000-000000000030'::uuid,'Row Erg Sprint','Conditioning',null,null),
  ('20000000-0000-0000-0000-000000000031'::uuid,'Hamstring Curl','Hamstrings',null,null),
  ('20000000-0000-0000-0000-000000000032'::uuid,'Leg Extension','Quadriceps',null,null),
  ('20000000-0000-0000-0000-000000000033'::uuid,'Calf Raise','Calves',null,null),
  ('20000000-0000-0000-0000-000000000034'::uuid,'Thoracic Rotation','Mobility',null,null),
  ('20000000-0000-0000-0000-000000000035'::uuid,'Couch Stretch','Mobility',null,null),
  ('20000000-0000-0000-0000-000000000036'::uuid,'Hip 90/90 Flow','Mobility',null,null)
on conflict (id) do nothing;

-- 05_program_weeks.sql

with program_ids as (
  select id as program_id from public.programs
  where id between '10000000-0000-0000-0000-000000000001'::uuid and '10000000-0000-0000-0000-000000000008'::uuid
),
weeks as (
  select
    (
      substr(md5(program_id::text || ':week:' || gs::text),1,8) || '-' ||
      substr(md5(program_id::text || ':week:' || gs::text),9,4) || '-' ||
      substr(md5(program_id::text || ':week:' || gs::text),13,4) || '-' ||
      substr(md5(program_id::text || ':week:' || gs::text),17,4) || '-' ||
      substr(md5(program_id::text || ':week:' || gs::text),21,12)
    )::uuid as id,
    program_id,
    gs as week_number,
    'Week ' || gs as title
  from program_ids cross join generate_series(1,4) gs
)
insert into public.program_weeks (id, program_id, week_number, title)
select id, program_id, week_number, title from weeks
on conflict (id) do nothing;

-- 06_program_days.sql

with weeks as (
  select id as week_id
  from public.program_weeks
  where program_id between '10000000-0000-0000-0000-000000000001'::uuid and '10000000-0000-0000-0000-000000000008'::uuid
),
days as (
  select
    (
      substr(md5(week_id::text || ':day:' || d::text),1,8) || '-' ||
      substr(md5(week_id::text || ':day:' || d::text),9,4) || '-' ||
      substr(md5(week_id::text || ':day:' || d::text),13,4) || '-' ||
      substr(md5(week_id::text || ':day:' || d::text),17,4) || '-' ||
      substr(md5(week_id::text || ':day:' || d::text),21,12)
    )::uuid as id,
    week_id,
    d as day_number,
    case d when 1 then 'Day 1 - Lower/Push' when 2 then 'Day 2 - Pull/Conditioning' else 'Day 3 - Mixed' end as title
  from weeks cross join generate_series(1,3) d
)
insert into public.program_days (id, week_id, day_number, title)
select id, week_id, day_number, title from days
on conflict (id) do nothing;

-- 07_program_exercises.sql

with day_rows as (
  select pd.id as day_id, pd.day_number, pw.week_number, pw.program_id
  from public.program_days pd
  join public.program_weeks pw on pw.id = pd.week_id
  where pw.program_id between '10000000-0000-0000-0000-000000000001'::uuid and '10000000-0000-0000-0000-000000000008'::uuid
),
slots as (
  select generate_series(1,5) as slot
),
exercise_pool as (
  select
    id as exercise_id,
    row_number() over(order by id) as rn,
    count(*) over() as total
  from public.exercises_library
  where id between '20000000-0000-0000-0000-000000000001'::uuid and '20000000-0000-0000-0000-000000000036'::uuid
),
mapped as (
  select
    (
      substr(md5(dr.day_id::text || ':slot:' || s.slot::text),1,8) || '-' ||
      substr(md5(dr.day_id::text || ':slot:' || s.slot::text),9,4) || '-' ||
      substr(md5(dr.day_id::text || ':slot:' || s.slot::text),13,4) || '-' ||
      substr(md5(dr.day_id::text || ':slot:' || s.slot::text),17,4) || '-' ||
      substr(md5(dr.day_id::text || ':slot:' || s.slot::text),21,12)
    )::uuid as id,
    dr.day_id,
    ep.exercise_id as exercise_library_id,
    case
      when dr.day_number = 1 and s.slot <= 2 then 4
      when dr.day_number = 2 and s.slot <= 2 then 3
      else 3
    end as target_sets,
    case
      when dr.day_number = 1 then '6-8'
      when dr.day_number = 2 then '8-12'
      else '10-15'
    end as target_reps,
    null::numeric as target_rpe,
    case when s.slot <= 2 then 120 else 75 end as rest_seconds,
    'Seeded protocol movement.'::text as notes,
    s.slot as order_index
  from day_rows dr
  cross join slots s
  join lateral (
    select exercise_id
    from exercise_pool
    where rn = ((abs(hashtext(dr.day_id::text || ':' || s.slot::text)) % (select max(total) from exercise_pool)) + 1)
  ) ep on true
)
insert into public.program_exercises (
  id, day_id, exercise_library_id, target_sets, target_reps, target_rpe, rest_seconds, notes, order_index
)
select id, day_id, exercise_library_id, target_sets, target_reps, target_rpe, rest_seconds, notes, order_index
from mapped
on conflict (id) do nothing;

-- 08_athlete_profile_and_onboarding.sql

insert into public.fitness_profiles (
  user_id, gender, date_of_birth, height_cm, weight_kg,
  primary_goal, experience_level, equipment_access, injuries, vibe_type
)
values
  ('d39c5500-4d79-4584-ba85-2b6529f39162'::uuid, 'male', '1996-05-18', 178, 78.5,
   'build_muscle', 'intermediate', array['full_gym'], array[]::text[], 'power')
on conflict (user_id) do update
set gender = excluded.gender,
    date_of_birth = excluded.date_of_birth,
    height_cm = excluded.height_cm,
    weight_kg = excluded.weight_kg,
    primary_goal = excluded.primary_goal,
    experience_level = excluded.experience_level,
    equipment_access = excluded.equipment_access,
    injuries = excluded.injuries,
    vibe_type = excluded.vibe_type;

insert into public.onboarding_assessments (id, user_id, raw_answers, calculated_vibe)
values (
  '90000000-0000-0000-0000-000000000001'::uuid,
  'd39c5500-4d79-4584-ba85-2b6529f39162'::uuid,
  jsonb_build_object(
    'gender','male',
    'dateOfBirth','1996-05-18',
    'heightCm',178,
    'weightKg',78.5,
    'primaryGoal','build_muscle',
    'experienceLevel','intermediate',
    'equipmentAccess','full_gym',
    'injuries',jsonb_build_array(),
    'vibeType','power',
    'vibeMetrics',jsonb_build_object('power',82,'endurance',57,'mobility',52)
  ),
  'power'
)
on conflict (id) do nothing;

-- 09_enrollments.sql

insert into public.enrollments (id, user_id, program_id, status, enrolled_at, expires_at)
values
  ('91000000-0000-0000-0000-000000000001'::uuid, 'd39c5500-4d79-4584-ba85-2b6529f39162'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'active', now() - interval '10 days', null)
on conflict (id) do update
set status = excluded.status,
    enrolled_at = excluded.enrolled_at,
    expires_at = excluded.expires_at;

-- 10_nutrition.sql

insert into public.macro_targets (
  id, user_id, daily_calorie_target, daily_protein_target, daily_carbs_target, daily_fat_target, active_from, active_to
)
values
  ('92000000-0000-0000-0000-000000000001'::uuid, 'd39c5500-4d79-4584-ba85-2b6529f39162'::uuid, 2600, 170, 300, 75, current_date - 30, null)
on conflict (id) do update
set daily_calorie_target = excluded.daily_calorie_target,
    daily_protein_target = excluded.daily_protein_target,
    daily_carbs_target = excluded.daily_carbs_target,
    daily_fat_target = excluded.daily_fat_target,
    active_from = excluded.active_from,
    active_to = excluded.active_to;

insert into public.daily_nutrition_summaries (
  id, user_id, date, total_calories, total_protein, total_carbs, total_fat
)
select
  (
    substr(md5('nutrition:' || gs::text),1,8) || '-' ||
    substr(md5('nutrition:' || gs::text),9,4) || '-' ||
    substr(md5('nutrition:' || gs::text),13,4) || '-' ||
    substr(md5('nutrition:' || gs::text),17,4) || '-' ||
    substr(md5('nutrition:' || gs::text),21,12)
  )::uuid,
  'd39c5500-4d79-4584-ba85-2b6529f39162'::uuid,
  (current_date - gs),
  2100 + (gs * 40),
  140 + (gs * 3),
  240 + (gs * 5),
  62 + (gs * 2)
from generate_series(0,6) gs
on conflict (id) do nothing;

-- 11_workout_sessions.sql

with target_days as (
  select pd.id as day_id
  from public.program_days pd
  join public.program_weeks pw on pw.id = pd.week_id
  where pw.program_id = '10000000-0000-0000-0000-000000000001'::uuid
  order by pw.week_number, pd.day_number
  limit 10
),
completed_sessions as (
  select
    (
      substr(md5('session:completed:' || row_number() over()::text),1,8) || '-' ||
      substr(md5('session:completed:' || row_number() over()::text),9,4) || '-' ||
      substr(md5('session:completed:' || row_number() over()::text),13,4) || '-' ||
      substr(md5('session:completed:' || row_number() over()::text),17,4) || '-' ||
      substr(md5('session:completed:' || row_number() over()::text),21,12)
    )::uuid as id,
    row_number() over() as rn,
    td.day_id
  from target_days td
)
insert into public.workout_sessions (id, user_id, program_id, day_id, started_at, completed_at, notes)
select
  cs.id,
  'd39c5500-4d79-4584-ba85-2b6529f39162'::uuid,
  '10000000-0000-0000-0000-000000000001'::uuid,
  cs.day_id,
  now() - ((11 - cs.rn) || ' days')::interval - interval '70 minutes',
  now() - ((11 - cs.rn) || ' days')::interval,
  'Completed seeded workout session'
from completed_sessions cs
on conflict (id) do nothing;

with todays_day as (
  select pd.id as day_id
  from public.program_days pd
  join public.program_weeks pw on pw.id = pd.week_id
  where pw.program_id = '10000000-0000-0000-0000-000000000001'::uuid
  order by pw.week_number, pd.day_number
  limit 1
)
insert into public.workout_sessions (id, user_id, program_id, day_id, started_at, completed_at, notes)
select
  '93000000-0000-0000-0000-000000000001'::uuid,
  'd39c5500-4d79-4584-ba85-2b6529f39162'::uuid,
  '10000000-0000-0000-0000-000000000001'::uuid,
  td.day_id,
  now() - interval '20 minutes',
  null,
  'Open session for resume testing'
from todays_day td
on conflict (id) do update
set completed_at = null,
    started_at = excluded.started_at,
    notes = excluded.notes;

-- 12_workout_log_sets.sql

with completed as (
  select id as session_id, day_id
  from public.workout_sessions
  where user_id = 'd39c5500-4d79-4584-ba85-2b6529f39162'::uuid
    and completed_at is not null
  order by completed_at desc
  limit 10
),
day_ex as (
  select c.session_id, pe.exercise_library_id, pe.order_index
  from completed c
  join public.program_exercises pe on pe.day_id = c.day_id
  where pe.order_index <= 3
),
set_rows as (
  select
    (
      substr(md5(session_id::text || ':' || exercise_library_id::text || ':set:' || s::text),1,8) || '-' ||
      substr(md5(session_id::text || ':' || exercise_library_id::text || ':set:' || s::text),9,4) || '-' ||
      substr(md5(session_id::text || ':' || exercise_library_id::text || ':set:' || s::text),13,4) || '-' ||
      substr(md5(session_id::text || ':' || exercise_library_id::text || ':set:' || s::text),17,4) || '-' ||
      substr(md5(session_id::text || ':' || exercise_library_id::text || ':set:' || s::text),21,12)
    )::uuid as id,
    session_id,
    exercise_library_id,
    s as set_number,
    (8 + ((order_index + s) % 5))::int as reps_completed,
    (40 + (order_index * 5) + (s * 2))::numeric as weight_kg,
    (7 + (s % 2))::numeric as rpe_actual
  from day_ex
  cross join generate_series(1,3) s
)
insert into public.workout_log_sets (
  id, session_id, exercise_library_id, set_number, reps_completed, weight_kg, rpe_actual, logged_at
)
select id, session_id, exercise_library_id, set_number, reps_completed, weight_kg, rpe_actual, now() - interval '1 day'
from set_rows
on conflict (id) do nothing;

