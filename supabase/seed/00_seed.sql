-- Wolfitness modular seed runner
-- Use with psql/supabase db execute that supports meta-commands.
-- If your SQL runner doesn't support \i, execute files in numeric order manually.

begin;

\i ./01_users.sql
\i ./02_coaches.sql
\i ./03_programs.sql
\i ./04_exercises_library.sql
\i ./05_program_weeks.sql
\i ./06_program_days.sql
\i ./07_program_exercises.sql
\i ./08_athlete_profile_and_onboarding.sql
\i ./09_enrollments.sql
\i ./10_nutrition.sql
\i ./11_workout_sessions.sql
\i ./12_workout_log_sets.sql

commit;

