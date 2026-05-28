


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."enrollment_status" AS ENUM (
    'active',
    'pending',
    'completed',
    'cancelled'
);


ALTER TYPE "public"."enrollment_status" OWNER TO "postgres";


CREATE TYPE "public"."program_price_type" AS ENUM (
    'flat_fee',
    'subscription'
);


ALTER TYPE "public"."program_price_type" OWNER TO "postgres";


CREATE TYPE "public"."program_status" AS ENUM (
    'draft',
    'published',
    'archived'
);


ALTER TYPE "public"."program_status" OWNER TO "postgres";


CREATE TYPE "public"."session_format" AS ENUM (
    '1:1',
    'group',
    'recorded'
);


ALTER TYPE "public"."session_format" OWNER TO "postgres";


CREATE TYPE "public"."session_type" AS ENUM (
    'video',
    'intel',
    'mission',
    'live',
    'lesson',
    'task'
);


ALTER TYPE "public"."session_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'coach',
    'mentor',
    'admin',
    'consumer'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT (auth.jwt() ->> 'role') = 'admin';
$$;


ALTER FUNCTION "public"."check_is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."endorse_wff_creator"("coach_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Verify the person calling this function is actually a mentor
  IF NOT EXISTS (
    SELECT 1 FROM public.mentors WHERE id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only mentors can endorse creators.';
  END IF;

  -- Upsert the creator record: if they don't exist in WFF creators yet, add them.
  -- If they do, update their verification status and endorsement link.
  INSERT INTO public.wff_creators (id, is_verified, endorsed_by_mentor_id)
  VALUES (coach_id, true, auth.uid())
  ON CONFLICT (id) DO UPDATE SET
    is_verified = true,
    endorsed_by_mentor_id = auth.uid();
END;
$$;


ALTER FUNCTION "public"."endorse_wff_creator"("coach_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, username)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'consumer'::public.user_role),
    NEW.raw_user_meta_data->>'username'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    username = EXCLUDED.username;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_program_owner"("target_program_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.wff_programs
    WHERE id = target_program_id 
    AND creator_id = auth.uid()
  );
END;
$$;


ALTER FUNCTION "public"."is_program_owner"("target_program_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."coach_assessments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "why_coach" "text",
    "struggles" "text",
    "level" "text",
    "goal_12m" "text",
    "completed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."coach_assessments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "program_id" "uuid",
    "is_pinned" boolean DEFAULT false
);

ALTER TABLE ONLY "public"."community_messages" REPLICA IDENTITY FULL;


ALTER TABLE "public"."community_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."direct_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."direct_messages" REPLICA IDENTITY FULL;


ALTER TABLE "public"."direct_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."directives" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "mentor_id" "uuid" NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "mentor_feedback" "text",
    "student_reflection" "text",
    "due_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "program_id" "uuid"
);


ALTER TABLE "public"."directives" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."enrollments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "mentor_id" "uuid" NOT NULL,
    "status" "public"."enrollment_status" DEFAULT 'pending'::"public"."enrollment_status" NOT NULL,
    "enrolled_at" timestamp with time zone DEFAULT "now"(),
    "program_id" "uuid",
    "expires_at" timestamp with time zone,
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "amount_paid_cents" integer,
    "currency" "text" DEFAULT 'usd'::"text"
);


ALTER TABLE "public"."enrollments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mentor_focus_areas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "mentor_id" "uuid" NOT NULL,
    "area" "text" NOT NULL
);


ALTER TABLE "public"."mentor_focus_areas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mentor_signals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "mentor_id" "uuid" NOT NULL,
    "quote" "text" NOT NULL,
    "video_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mentor_signals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mentors" (
    "id" "uuid" NOT NULL,
    "philosophy_line" "text",
    "story" "text",
    "price_tier" "text",
    "commitment_level" "text",
    "is_published" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_featured" boolean DEFAULT false,
    "stripe_account_id" "text",
    "stripe_onboarding_complete" boolean DEFAULT false
);


ALTER TABLE "public"."mentors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."milestone_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_id" "uuid" NOT NULL,
    "completed" boolean DEFAULT false NOT NULL,
    "completed_at" timestamp with time zone,
    "response_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "submission_url" "text",
    "submission_type" "text"
);


ALTER TABLE "public"."milestone_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "role" "public"."user_role" DEFAULT 'coach'::"public"."user_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "stripe_customer_id" "text",
    "username" "text",
    "bio" "text",
    "height_cm" numeric,
    "weight_kg" numeric,
    "vibe_type" "text",
    "gender" "text",
    "date_of_birth" "date",
    "goal" "text",
    "experience_level" "text",
    "training_availability" "text"[],
    "equipment_access" "text"[],
    "injuries" "text"[],
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "dietary_preference" "text",
    "allergies" "text"[],
    "daily_calorie_target" integer,
    "daily_protein_target" integer,
    "daily_carbs_target" integer,
    "daily_fat_target" integer,
    CONSTRAINT "profiles_height_cm_check" CHECK ((("height_cm" > (0)::numeric) OR ("height_cm" IS NULL))),
    CONSTRAINT "profiles_weight_kg_check" CHECK ((("weight_kg" > (0)::numeric) OR ("weight_kg" IS NULL)))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."programs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "mentor_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "duration_text" "text" NOT NULL,
    "price_amount" numeric(10,2) DEFAULT 0.00 NOT NULL,
    "price_type" "public"."program_price_type" DEFAULT 'flat_fee'::"public"."program_price_type" NOT NULL,
    "status" "public"."program_status" DEFAULT 'draft'::"public"."program_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "access_duration_days" integer DEFAULT 0,
    "is_featured" boolean DEFAULT false,
    "cover_image" "text"
);


ALTER TABLE "public"."programs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."session_reflections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "coach_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."session_reflections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "mentor_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "format" "public"."session_format" NOT NULL,
    "scheduled_at" timestamp with time zone,
    "recording_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "key_takeaways" "jsonb" DEFAULT '[]'::"jsonb",
    "resources" "jsonb" DEFAULT '[]'::"jsonb",
    "status" "text" DEFAULT 'planned'::"text" NOT NULL,
    "program_id" "uuid",
    "session_type" "public"."session_type" DEFAULT 'video'::"public"."session_type",
    "sort_order" integer DEFAULT 0,
    "release_day" integer DEFAULT 0,
    "thumbnail_url" "text",
    "submission_type" "text" DEFAULT 'none'::"text",
    "expected_outcome" "text",
    "completion_mode" "text" DEFAULT 'manual'::"text",
    "estimated_time" "text",
    "is_required" boolean DEFAULT true,
    "mentor_notes" "text"
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_broadcasts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "link_url" "text",
    "is_active" boolean DEFAULT true,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_broadcasts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid"
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wff_creators" (
    "id" "uuid" NOT NULL,
    "specialization" "text"[],
    "years_experience" "text",
    "certifications" "text",
    "social_instagram" "text",
    "website" "text",
    "headline" "text",
    "is_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "endorsed_by_mentor_id" "uuid",
    "stripe_account_id" "text",
    "stripe_onboarding_complete" boolean DEFAULT false
);


ALTER TABLE "public"."wff_creators" OWNER TO "postgres";


COMMENT ON TABLE "public"."wff_creators" IS 'WFF Creator profiles linked to Signal Ecosystem identities.';



CREATE TABLE IF NOT EXISTS "public"."wff_enrollments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "program_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wff_enrollments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wff_global_exercises" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "muscle_group" "text",
    "video_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wff_global_exercises" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wff_landing_sections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "title" "text",
    "subtitle" "text",
    "description" "text",
    "media_url" "text",
    "poster_url" "text",
    "cta_text" "text",
    "cta_href" "text",
    "order_index" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "hide_content" boolean DEFAULT false,
    "anchor_tag" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wff_landing_sections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wff_meal_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "meal_id" "uuid" NOT NULL,
    "food_name" "text" NOT NULL,
    "quantity" "text",
    "calories" integer,
    "protein" numeric,
    "carbs" numeric,
    "fat" numeric,
    "notes" "text",
    "order_index" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wff_meal_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wff_meals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "order_index" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wff_meals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wff_nutrition_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "program_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "vibe_type" "text",
    "is_published" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wff_nutrition_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wff_program_days" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "week_id" "uuid" NOT NULL,
    "day_number" integer NOT NULL,
    "title" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wff_program_days" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wff_program_exercises" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "day_id" "uuid" NOT NULL,
    "exercise_name" "text" NOT NULL,
    "sets" integer,
    "reps" "text",
    "rpe" "text",
    "rest_seconds" integer,
    "notes" "text",
    "video_url" "text",
    "order_index" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wff_program_exercises" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wff_program_weeks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "program_id" "uuid" NOT NULL,
    "week_number" integer NOT NULL,
    "title" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wff_program_weeks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wff_programs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) DEFAULT 0 NOT NULL,
    "duration_weeks" integer,
    "difficulty" "text",
    "vibe_type" "text",
    "image_url" "text",
    "is_published" boolean DEFAULT false,
    "parent_template_id" "uuid",
    "origin_mentor_id" "uuid",
    "is_master_template" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "wff_programs_difficulty_check" CHECK (("difficulty" = ANY (ARRAY['beginner'::"text", 'intermediate'::"text", 'advanced'::"text"])))
);


ALTER TABLE "public"."wff_programs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wff_user_nutrition_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "food_name" "text" NOT NULL,
    "meal_category" "text",
    "calories" integer DEFAULT 0,
    "protein" numeric DEFAULT 0,
    "carbs" numeric DEFAULT 0,
    "fat" numeric DEFAULT 0,
    "logged_at" "date" DEFAULT CURRENT_DATE,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wff_user_nutrition_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wff_user_workout_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "program_id" "uuid" NOT NULL,
    "day_id" "uuid" NOT NULL,
    "exercise_id" "uuid" NOT NULL,
    "set_number" integer NOT NULL,
    "reps_completed" integer,
    "weight_kg" numeric,
    "rpe_actual" numeric,
    "completed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wff_user_workout_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wff_vibe_assessments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "answers" "jsonb" NOT NULL,
    "calculated_vibe" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wff_vibe_assessments" OWNER TO "postgres";


ALTER TABLE ONLY "public"."coach_assessments"
    ADD CONSTRAINT "coach_assessments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coach_assessments"
    ADD CONSTRAINT "coach_assessments_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."community_messages"
    ADD CONSTRAINT "community_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."direct_messages"
    ADD CONSTRAINT "direct_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."directives"
    ADD CONSTRAINT "directives_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_unique_selection" UNIQUE ("coach_id", "program_id");



ALTER TABLE ONLY "public"."mentor_focus_areas"
    ADD CONSTRAINT "mentor_focus_areas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentor_signals"
    ADD CONSTRAINT "mentor_signals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentors"
    ADD CONSTRAINT "mentors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."milestone_progress"
    ADD CONSTRAINT "milestone_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."milestone_progress"
    ADD CONSTRAINT "milestone_progress_user_id_session_id_key" UNIQUE ("user_id", "session_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."programs"
    ADD CONSTRAINT "programs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_reflections"
    ADD CONSTRAINT "session_reflections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_reflections"
    ADD CONSTRAINT "session_reflections_session_id_coach_id_key" UNIQUE ("session_id", "coach_id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_broadcasts"
    ADD CONSTRAINT "system_broadcasts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."wff_creators"
    ADD CONSTRAINT "wff_creators_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wff_creators"
    ADD CONSTRAINT "wff_creators_stripe_account_id_key" UNIQUE ("stripe_account_id");



ALTER TABLE ONLY "public"."wff_enrollments"
    ADD CONSTRAINT "wff_enrollments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wff_enrollments"
    ADD CONSTRAINT "wff_enrollments_user_id_program_id_key" UNIQUE ("user_id", "program_id");



ALTER TABLE ONLY "public"."wff_global_exercises"
    ADD CONSTRAINT "wff_global_exercises_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."wff_global_exercises"
    ADD CONSTRAINT "wff_global_exercises_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wff_landing_sections"
    ADD CONSTRAINT "wff_landing_sections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wff_meal_items"
    ADD CONSTRAINT "wff_meal_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wff_meals"
    ADD CONSTRAINT "wff_meals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wff_nutrition_plans"
    ADD CONSTRAINT "wff_nutrition_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wff_program_days"
    ADD CONSTRAINT "wff_program_days_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wff_program_days"
    ADD CONSTRAINT "wff_program_days_week_id_day_number_key" UNIQUE ("week_id", "day_number");



ALTER TABLE ONLY "public"."wff_program_exercises"
    ADD CONSTRAINT "wff_program_exercises_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wff_program_weeks"
    ADD CONSTRAINT "wff_program_weeks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wff_program_weeks"
    ADD CONSTRAINT "wff_program_weeks_program_id_week_number_key" UNIQUE ("program_id", "week_number");



ALTER TABLE ONLY "public"."wff_programs"
    ADD CONSTRAINT "wff_programs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wff_user_nutrition_logs"
    ADD CONSTRAINT "wff_user_nutrition_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wff_user_workout_logs"
    ADD CONSTRAINT "wff_user_workout_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wff_user_workout_logs"
    ADD CONSTRAINT "wff_user_workout_logs_user_id_day_id_exercise_id_set_number_key" UNIQUE ("user_id", "day_id", "exercise_id", "set_number");



ALTER TABLE ONLY "public"."wff_vibe_assessments"
    ADD CONSTRAINT "wff_vibe_assessments_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "enrollments_coach_mentor_program_idx" ON "public"."enrollments" USING "btree" ("coach_id", "mentor_id", COALESCE("program_id", '00000000-0000-0000-0000-000000000000'::"uuid"));



CREATE INDEX "idx_enrollments_stripe_subscription" ON "public"."enrollments" USING "btree" ("stripe_subscription_id");



CREATE INDEX "idx_mentors_published" ON "public"."mentors" USING "btree" ("is_published");



CREATE INDEX "idx_mentors_stripe_account" ON "public"."mentors" USING "btree" ("stripe_account_id");



CREATE INDEX "idx_milestone_progress_user_session" ON "public"."milestone_progress" USING "btree" ("user_id", "session_id");



CREATE INDEX "idx_profiles_stripe_customer" ON "public"."profiles" USING "btree" ("stripe_customer_id");



CREATE INDEX "idx_wff_landing_order" ON "public"."wff_landing_sections" USING "btree" ("order_index");



CREATE INDEX "idx_wff_meal_items_meal" ON "public"."wff_meal_items" USING "btree" ("meal_id");



CREATE INDEX "idx_wff_meals_plan" ON "public"."wff_meals" USING "btree" ("plan_id");



CREATE INDEX "idx_wff_nutrition_logs_user_date" ON "public"."wff_user_nutrition_logs" USING "btree" ("user_id", "logged_at");



CREATE INDEX "idx_wff_nutrition_plans_creator" ON "public"."wff_nutrition_plans" USING "btree" ("creator_id");



CREATE OR REPLACE TRIGGER "set_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_wff_landing_updated_at" BEFORE UPDATE ON "public"."wff_landing_sections" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_wff_nutrition_plans_updated_at" BEFORE UPDATE ON "public"."wff_nutrition_plans" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_wff_programs_updated_at" BEFORE UPDATE ON "public"."wff_programs" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



ALTER TABLE ONLY "public"."coach_assessments"
    ADD CONSTRAINT "coach_assessments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_messages"
    ADD CONSTRAINT "community_messages_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_messages"
    ADD CONSTRAINT "community_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."direct_messages"
    ADD CONSTRAINT "direct_messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."direct_messages"
    ADD CONSTRAINT "direct_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."directives"
    ADD CONSTRAINT "directives_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."directives"
    ADD CONSTRAINT "directives_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."directives"
    ADD CONSTRAINT "directives_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mentor_focus_areas"
    ADD CONSTRAINT "mentor_focus_areas_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mentor_signals"
    ADD CONSTRAINT "mentor_signals_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mentors"
    ADD CONSTRAINT "mentors_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."milestone_progress"
    ADD CONSTRAINT "milestone_progress_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."milestone_progress"
    ADD CONSTRAINT "milestone_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."programs"
    ADD CONSTRAINT "programs_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_reflections"
    ADD CONSTRAINT "session_reflections_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_reflections"
    ADD CONSTRAINT "session_reflections_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."system_broadcasts"
    ADD CONSTRAINT "system_broadcasts_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."wff_creators"
    ADD CONSTRAINT "wff_creators_endorsed_by_mentor_id_fkey" FOREIGN KEY ("endorsed_by_mentor_id") REFERENCES "public"."mentors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."wff_creators"
    ADD CONSTRAINT "wff_creators_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wff_enrollments"
    ADD CONSTRAINT "wff_enrollments_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."wff_programs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wff_enrollments"
    ADD CONSTRAINT "wff_enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wff_meal_items"
    ADD CONSTRAINT "wff_meal_items_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "public"."wff_meals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wff_meals"
    ADD CONSTRAINT "wff_meals_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."wff_nutrition_plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wff_nutrition_plans"
    ADD CONSTRAINT "wff_nutrition_plans_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wff_nutrition_plans"
    ADD CONSTRAINT "wff_nutrition_plans_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."wff_programs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."wff_program_days"
    ADD CONSTRAINT "wff_program_days_week_id_fkey" FOREIGN KEY ("week_id") REFERENCES "public"."wff_program_weeks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wff_program_exercises"
    ADD CONSTRAINT "wff_program_exercises_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "public"."wff_program_days"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wff_program_weeks"
    ADD CONSTRAINT "wff_program_weeks_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."wff_programs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wff_programs"
    ADD CONSTRAINT "wff_programs_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wff_programs"
    ADD CONSTRAINT "wff_programs_origin_mentor_id_fkey" FOREIGN KEY ("origin_mentor_id") REFERENCES "public"."mentors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."wff_programs"
    ADD CONSTRAINT "wff_programs_parent_template_id_fkey" FOREIGN KEY ("parent_template_id") REFERENCES "public"."wff_programs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."wff_user_nutrition_logs"
    ADD CONSTRAINT "wff_user_nutrition_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wff_user_workout_logs"
    ADD CONSTRAINT "wff_user_workout_logs_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "public"."wff_program_days"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wff_user_workout_logs"
    ADD CONSTRAINT "wff_user_workout_logs_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."wff_program_exercises"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wff_user_workout_logs"
    ADD CONSTRAINT "wff_user_workout_logs_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."wff_programs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wff_user_workout_logs"
    ADD CONSTRAINT "wff_user_workout_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wff_vibe_assessments"
    ADD CONSTRAINT "wff_vibe_assessments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage all focus areas" ON "public"."mentor_focus_areas" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can manage all mentors" ON "public"."mentors" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can manage settings" ON "public"."system_settings" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can manage system broadcasts" ON "public"."system_broadcasts" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can update all mentors" ON "public"."mentors" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can update all programs" ON "public"."programs" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can view all mentors" ON "public"."mentors" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins manage sections" ON "public"."wff_landing_sections" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Anyone can view active broadcasts" ON "public"."system_broadcasts" FOR SELECT USING ((("is_active" = true) OR "public"."check_is_admin"()));



CREATE POLICY "Anyone can view active system broadcasts" ON "public"."system_broadcasts" FOR SELECT USING ((("is_active" = true) AND (("expires_at" IS NULL) OR ("expires_at" > "now"()))));



CREATE POLICY "Anyone can view published programs" ON "public"."programs" FOR SELECT USING (("status" = 'published'::"public"."program_status"));



CREATE POLICY "Anyone can view settings" ON "public"."system_settings" FOR SELECT USING (true);



CREATE POLICY "Coaches can manage their own reflections" ON "public"."session_reflections" USING ((("auth"."uid"() = "coach_id") OR "public"."check_is_admin"()));



CREATE POLICY "Coaches can update own directives" ON "public"."directives" FOR UPDATE USING (("auth"."uid"() = "coach_id")) WITH CHECK (("auth"."uid"() = "coach_id"));



CREATE POLICY "Coaches can view aligned mentor signals" ON "public"."mentor_signals" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."enrollments"
  WHERE (("enrollments"."mentor_id" = "mentor_signals"."mentor_id") AND ("enrollments"."coach_id" = "auth"."uid"()) AND ("enrollments"."status" = 'active'::"public"."enrollment_status")))));



CREATE POLICY "Coaches can view own directives" ON "public"."directives" FOR SELECT USING (("auth"."uid"() = "coach_id"));



CREATE POLICY "Creators can manage own nutrition plans" ON "public"."wff_nutrition_plans" USING (("auth"."uid"() = "creator_id"));



CREATE POLICY "Creators can manage own profile" ON "public"."wff_creators" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Creators can manage own programs" ON "public"."wff_programs" USING (("auth"."uid"() = "creator_id"));



CREATE POLICY "Creators manage meal items" ON "public"."wff_meal_items" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Creators manage meals" ON "public"."wff_meals" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enrolled coaches can view sessions" ON "public"."sessions" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."enrollments"
  WHERE (("enrollments"."program_id" = "sessions"."program_id") AND ("enrollments"."coach_id" = "auth"."uid"()) AND ("enrollments"."status" = 'active'::"public"."enrollment_status")))) OR "public"."check_is_admin"()));



CREATE POLICY "Everyone views global exercises" ON "public"."wff_global_exercises" FOR SELECT USING (true);



CREATE POLICY "Focus areas are viewable by everyone" ON "public"."mentor_focus_areas" FOR SELECT USING (true);



CREATE POLICY "Involved parties can view directives" ON "public"."directives" FOR SELECT USING (((("auth"."uid"() = "coach_id") OR ("auth"."uid"() = "mentor_id")) OR "public"."check_is_admin"()));



CREATE POLICY "Mentors can delete their own sessions" ON "public"."sessions" FOR DELETE USING (("auth"."uid"() = "mentor_id"));



CREATE POLICY "Mentors can insert their own sessions" ON "public"."sessions" FOR INSERT WITH CHECK (("auth"."uid"() = "mentor_id"));



CREATE POLICY "Mentors can manage directives" ON "public"."directives" USING ((("auth"."uid"() = "mentor_id") OR "public"."check_is_admin"()));



CREATE POLICY "Mentors can manage own authority record" ON "public"."mentors" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Mentors can manage own directives" ON "public"."directives" USING (("auth"."uid"() = "mentor_id"));



CREATE POLICY "Mentors can manage own focus areas" ON "public"."mentor_focus_areas" USING ((EXISTS ( SELECT 1
   FROM "public"."mentors"
  WHERE (("mentors"."id" = "mentor_focus_areas"."mentor_id") AND ("mentors"."id" = "auth"."uid"())))));



CREATE POLICY "Mentors can manage own signals" ON "public"."mentor_signals" USING (("auth"."uid"() = "mentor_id"));



CREATE POLICY "Mentors can manage their own programs" ON "public"."programs" USING ((("auth"."uid"() = "mentor_id") OR "public"."check_is_admin"()));



CREATE POLICY "Mentors can manage their own sessions" ON "public"."sessions" USING ((("auth"."uid"() = "mentor_id") OR "public"."check_is_admin"()));



CREATE POLICY "Mentors can pin messages in their rooms" ON "public"."community_messages" FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM "public"."programs" "p"
  WHERE (("p"."id" = "community_messages"."program_id") AND ("p"."mentor_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))))) WITH CHECK (true);



CREATE POLICY "Mentors can update their own sessions" ON "public"."sessions" FOR UPDATE USING (("auth"."uid"() = "mentor_id"));



CREATE POLICY "Mentors can view reflections for their sessions" ON "public"."session_reflections" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."sessions"
  WHERE (("sessions"."id" = "session_reflections"."session_id") AND ("sessions"."mentor_id" = "auth"."uid"())))));



CREATE POLICY "Mentors can view session reflections" ON "public"."session_reflections" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."sessions"
  WHERE (("sessions"."id" = "session_reflections"."session_id") AND ("sessions"."mentor_id" = "auth"."uid"())))));



CREATE POLICY "Mentors can view their students progress" ON "public"."milestone_progress" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."sessions" "s"
  WHERE (("s"."id" = "milestone_progress"."session_id") AND ("s"."mentor_id" = "auth"."uid"())))));



CREATE POLICY "Only admins can manage broadcasts" ON "public"."system_broadcasts" USING ("public"."check_is_admin"());



CREATE POLICY "Owners manage days" ON "public"."wff_program_days" USING ((EXISTS ( SELECT 1
   FROM "public"."wff_program_weeks"
  WHERE (("wff_program_weeks"."id" = "wff_program_days"."week_id") AND "public"."is_program_owner"("wff_program_weeks"."program_id")))));



CREATE POLICY "Owners manage exercises" ON "public"."wff_program_exercises" USING ((EXISTS ( SELECT 1
   FROM ("public"."wff_program_days" "d"
     JOIN "public"."wff_program_weeks" "w" ON (("d"."week_id" = "w"."id")))
  WHERE (("d"."id" = "wff_program_exercises"."day_id") AND "public"."is_program_owner"("w"."program_id")))));



CREATE POLICY "Owners manage weeks" ON "public"."wff_program_weeks" USING ("public"."is_program_owner"("program_id"));



CREATE POLICY "Program members can view program messages" ON "public"."community_messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."enrollments"
  WHERE (("enrollments"."program_id" = "community_messages"."program_id") AND ("enrollments"."coach_id" = "auth"."uid"())))));



CREATE POLICY "Public can view WFF Creators" ON "public"."wff_creators" FOR SELECT USING (true);



CREATE POLICY "Public can view active sections" ON "public"."wff_landing_sections" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public can view days" ON "public"."wff_program_days" FOR SELECT USING (true);



CREATE POLICY "Public can view exercises" ON "public"."wff_program_exercises" FOR SELECT USING (true);



CREATE POLICY "Public can view meal items" ON "public"."wff_meal_items" FOR SELECT USING (true);



CREATE POLICY "Public can view meals" ON "public"."wff_meals" FOR SELECT USING (true);



CREATE POLICY "Public can view published nutrition plans" ON "public"."wff_nutrition_plans" FOR SELECT USING (("is_published" = true));



CREATE POLICY "Public can view published programs" ON "public"."programs" FOR SELECT USING ((("status" = 'published'::"public"."program_status") OR "public"."check_is_admin"()));



CREATE POLICY "Public can view published programs" ON "public"."wff_programs" FOR SELECT USING (("is_published" = true));



CREATE POLICY "Public can view weeks" ON "public"."wff_program_weeks" FOR SELECT USING (true);



CREATE POLICY "Public messages are viewable by all" ON "public"."community_messages" FOR SELECT USING ((("program_id" IS NULL) OR "public"."check_is_admin"()));



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Published mentors are viewable by everyone" ON "public"."mentors" FOR SELECT USING (("is_published" = true));



CREATE POLICY "Sessions are viewable by mentor or enrolled coaches" ON "public"."sessions" FOR SELECT USING ((("auth"."uid"() = "mentor_id") OR (EXISTS ( SELECT 1
   FROM "public"."enrollments"
  WHERE (("enrollments"."mentor_id" = "sessions"."mentor_id") AND ("enrollments"."coach_id" = "auth"."uid"()) AND ("enrollments"."status" = 'active'::"public"."enrollment_status"))))));



CREATE POLICY "Students can manage own reflections" ON "public"."session_reflections" USING (("auth"."uid"() = "coach_id"));



CREATE POLICY "Users can delete own messages" ON "public"."community_messages" FOR DELETE USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."programs" "p"
  WHERE (("p"."id" = "community_messages"."program_id") AND ("p"."mentor_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role"))))));



CREATE POLICY "Users can insert own assessment" ON "public"."coach_assessments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own enrollments" ON "public"."wff_enrollments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own vibe" ON "public"."wff_vibe_assessments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own enrollments" ON "public"."enrollments" FOR INSERT WITH CHECK (("auth"."uid"() = "coach_id"));



CREATE POLICY "Users can manage own profile" ON "public"."profiles" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can manage their own progress" ON "public"."milestone_progress" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can only see their own DMs" ON "public"."direct_messages" FOR SELECT USING (((("auth"."uid"() = "sender_id") OR ("auth"."uid"() = "recipient_id")) OR "public"."check_is_admin"()));



CREATE POLICY "Users can read messages they have access to" ON "public"."community_messages" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can read their own direct messages" ON "public"."direct_messages" FOR SELECT USING ((("auth"."uid"() = "sender_id") OR ("auth"."uid"() = "recipient_id")));



CREATE POLICY "Users can send DMs" ON "public"."direct_messages" FOR INSERT WITH CHECK (("auth"."uid"() = "sender_id"));



CREATE POLICY "Users can send messages to rooms they have access to" ON "public"."community_messages" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND (("program_id" IS NULL) OR (EXISTS ( SELECT 1
   FROM "public"."programs" "p"
  WHERE (("p"."id" = "community_messages"."program_id") AND ("p"."mentor_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."enrollments" "e"
  WHERE (("e"."program_id" = "community_messages"."program_id") AND ("e"."coach_id" = "auth"."uid"()) AND ("e"."status" = 'active'::"public"."enrollment_status")))))));



CREATE POLICY "Users can send their own direct messages" ON "public"."direct_messages" FOR INSERT WITH CHECK (("auth"."uid"() = "sender_id"));



CREATE POLICY "Users can view own assessment" ON "public"."coach_assessments" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own enrollments" ON "public"."wff_enrollments" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own vibe" ON "public"."wff_vibe_assessments" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own enrollments" ON "public"."enrollments" FOR SELECT USING ((("auth"."uid"() = "coach_id") OR ("auth"."uid"() = "mentor_id")));



CREATE POLICY "Users manage own logs" ON "public"."wff_user_workout_logs" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage own nutrition logs" ON "public"."wff_user_nutrition_logs" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."coach_assessments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."direct_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."directives" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enrollments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mentor_focus_areas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mentor_signals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mentors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."milestone_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."programs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."session_reflections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_broadcasts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wff_creators" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wff_enrollments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wff_global_exercises" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wff_landing_sections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wff_meal_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wff_meals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wff_nutrition_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wff_program_days" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wff_program_exercises" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wff_program_weeks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wff_programs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wff_user_nutrition_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wff_user_workout_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wff_vibe_assessments" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."community_messages";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."direct_messages";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."profiles";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."check_is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."endorse_wff_creator"("coach_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."endorse_wff_creator"("coach_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."endorse_wff_creator"("coach_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_program_owner"("target_program_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_program_owner"("target_program_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_program_owner"("target_program_id" "uuid") TO "service_role";


















GRANT ALL ON TABLE "public"."coach_assessments" TO "anon";
GRANT ALL ON TABLE "public"."coach_assessments" TO "authenticated";
GRANT ALL ON TABLE "public"."coach_assessments" TO "service_role";



GRANT ALL ON TABLE "public"."community_messages" TO "anon";
GRANT ALL ON TABLE "public"."community_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."community_messages" TO "service_role";



GRANT ALL ON TABLE "public"."direct_messages" TO "anon";
GRANT ALL ON TABLE "public"."direct_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."direct_messages" TO "service_role";



GRANT ALL ON TABLE "public"."directives" TO "anon";
GRANT ALL ON TABLE "public"."directives" TO "authenticated";
GRANT ALL ON TABLE "public"."directives" TO "service_role";



GRANT ALL ON TABLE "public"."enrollments" TO "anon";
GRANT ALL ON TABLE "public"."enrollments" TO "authenticated";
GRANT ALL ON TABLE "public"."enrollments" TO "service_role";



GRANT ALL ON TABLE "public"."mentor_focus_areas" TO "anon";
GRANT ALL ON TABLE "public"."mentor_focus_areas" TO "authenticated";
GRANT ALL ON TABLE "public"."mentor_focus_areas" TO "service_role";



GRANT ALL ON TABLE "public"."mentor_signals" TO "anon";
GRANT ALL ON TABLE "public"."mentor_signals" TO "authenticated";
GRANT ALL ON TABLE "public"."mentor_signals" TO "service_role";



GRANT ALL ON TABLE "public"."mentors" TO "anon";
GRANT ALL ON TABLE "public"."mentors" TO "authenticated";
GRANT ALL ON TABLE "public"."mentors" TO "service_role";



GRANT ALL ON TABLE "public"."milestone_progress" TO "anon";
GRANT ALL ON TABLE "public"."milestone_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."milestone_progress" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."programs" TO "anon";
GRANT ALL ON TABLE "public"."programs" TO "authenticated";
GRANT ALL ON TABLE "public"."programs" TO "service_role";



GRANT ALL ON TABLE "public"."session_reflections" TO "anon";
GRANT ALL ON TABLE "public"."session_reflections" TO "authenticated";
GRANT ALL ON TABLE "public"."session_reflections" TO "service_role";



GRANT ALL ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";



GRANT ALL ON TABLE "public"."system_broadcasts" TO "anon";
GRANT ALL ON TABLE "public"."system_broadcasts" TO "authenticated";
GRANT ALL ON TABLE "public"."system_broadcasts" TO "service_role";



GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";



GRANT ALL ON TABLE "public"."wff_creators" TO "anon";
GRANT ALL ON TABLE "public"."wff_creators" TO "authenticated";
GRANT ALL ON TABLE "public"."wff_creators" TO "service_role";



GRANT ALL ON TABLE "public"."wff_enrollments" TO "anon";
GRANT ALL ON TABLE "public"."wff_enrollments" TO "authenticated";
GRANT ALL ON TABLE "public"."wff_enrollments" TO "service_role";



GRANT ALL ON TABLE "public"."wff_global_exercises" TO "anon";
GRANT ALL ON TABLE "public"."wff_global_exercises" TO "authenticated";
GRANT ALL ON TABLE "public"."wff_global_exercises" TO "service_role";



GRANT ALL ON TABLE "public"."wff_landing_sections" TO "anon";
GRANT ALL ON TABLE "public"."wff_landing_sections" TO "authenticated";
GRANT ALL ON TABLE "public"."wff_landing_sections" TO "service_role";



GRANT ALL ON TABLE "public"."wff_meal_items" TO "anon";
GRANT ALL ON TABLE "public"."wff_meal_items" TO "authenticated";
GRANT ALL ON TABLE "public"."wff_meal_items" TO "service_role";



GRANT ALL ON TABLE "public"."wff_meals" TO "anon";
GRANT ALL ON TABLE "public"."wff_meals" TO "authenticated";
GRANT ALL ON TABLE "public"."wff_meals" TO "service_role";



GRANT ALL ON TABLE "public"."wff_nutrition_plans" TO "anon";
GRANT ALL ON TABLE "public"."wff_nutrition_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."wff_nutrition_plans" TO "service_role";



GRANT ALL ON TABLE "public"."wff_program_days" TO "anon";
GRANT ALL ON TABLE "public"."wff_program_days" TO "authenticated";
GRANT ALL ON TABLE "public"."wff_program_days" TO "service_role";



GRANT ALL ON TABLE "public"."wff_program_exercises" TO "anon";
GRANT ALL ON TABLE "public"."wff_program_exercises" TO "authenticated";
GRANT ALL ON TABLE "public"."wff_program_exercises" TO "service_role";



GRANT ALL ON TABLE "public"."wff_program_weeks" TO "anon";
GRANT ALL ON TABLE "public"."wff_program_weeks" TO "authenticated";
GRANT ALL ON TABLE "public"."wff_program_weeks" TO "service_role";



GRANT ALL ON TABLE "public"."wff_programs" TO "anon";
GRANT ALL ON TABLE "public"."wff_programs" TO "authenticated";
GRANT ALL ON TABLE "public"."wff_programs" TO "service_role";



GRANT ALL ON TABLE "public"."wff_user_nutrition_logs" TO "anon";
GRANT ALL ON TABLE "public"."wff_user_nutrition_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."wff_user_nutrition_logs" TO "service_role";



GRANT ALL ON TABLE "public"."wff_user_workout_logs" TO "anon";
GRANT ALL ON TABLE "public"."wff_user_workout_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."wff_user_workout_logs" TO "service_role";



GRANT ALL ON TABLE "public"."wff_vibe_assessments" TO "anon";
GRANT ALL ON TABLE "public"."wff_vibe_assessments" TO "authenticated";
GRANT ALL ON TABLE "public"."wff_vibe_assessments" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































