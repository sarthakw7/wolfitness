import { createClient, type User } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type FitnessProfileRow = Database["public"]["Tables"]["fitness_profiles"]["Row"];
type MacroTargetsRow = Database["public"]["Tables"]["macro_targets"]["Row"];
type DailyNutritionSummaryRow = Database["public"]["Tables"]["daily_nutrition_summaries"]["Row"];
type NutritionLogRow = Database["public"]["Tables"]["nutrition_logs"]["Row"];
type EnrollmentRow = Database["public"]["Tables"]["enrollments"]["Row"];
type ProgramRow = Database["public"]["Tables"]["programs"]["Row"];
type WorkoutSessionRow = Database["public"]["Tables"]["workout_sessions"]["Row"];

type NutritionLogMacroRow = Pick<
  NutritionLogRow,
  "calories" | "carbs" | "created_at" | "fat" | "food_name" | "logged_at" | "meal_category" | "protein"
>;

export type AthleteNutritionContext = {
  name: string | null;
  goal: string | null;
  dietaryPreference: string | null;
  allergies: string[];
  macroTargets: {
    calories: number;
    carbs: number;
    fat: number;
    protein: number;
  } | null;
  todayNutrition: {
    calories: number;
    carbs: number;
    date: string;
    fat: number;
    loggedMealCount: number;
    protein: number;
  } | null;
  remainingMacros: {
    calories: number | null;
    carbs: number | null;
    fat: number | null;
    protein: number | null;
  } | null;
  recentMeals: Array<{
    calories: number | null;
    carbs: number | null;
    fat: number | null;
    foodName: string;
    loggedAt: string;
    mealCategory: string | null;
    protein: number | null;
  }>;
  todayWorkout: {
    completedAt: string | null;
    programId: string | null;
    programTitle: string | null;
    startedAt: string;
  } | null;
  todayWorkoutCompleted: boolean;
  activeProgram: {
    difficulty: ProgramRow["difficulty"];
    durationWeeks: number | null;
    enrolledAt: string;
    id: string;
    title: string;
    vibeType: string | null;
  } | null;
};

export class NutritionAiAuthError extends Error {
  status = 401;
  code = "UNAUTHORIZED";

  constructor(message: string) {
    super(message);
    this.name = "NutritionAiAuthError";
  }
}

export function logNutritionAi(
  tag: "ai-coach" | "nutrition-chat",
  level: "error" | "warn" | "info",
  message: string,
  context?: Record<string, unknown>,
) {
  console[level](`[${tag}]`, message, context ?? {});
}

export async function authenticateBearerRequest(req: Request): Promise<{ accessToken: string; user: User }> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new NutritionAiAuthError("Unauthorized Request");
  }

  const accessToken = authHeader.split(" ")[1];
  const authClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser(accessToken);

  if (error || !user) {
    throw new NutritionAiAuthError("Invalid or Expired Token");
  }

  return { accessToken, user };
}

export function buildAthleteNutritionSystemPrompt(context: AthleteNutritionContext) {
  return [
    "You are Wolf AI Coach, a personalized athlete nutrition coach.",
    "Use only the athlete context JSON provided below.",
    "Do not invent profile, nutrition, macro, workout, allergy, or dietary data.",
    "If data is missing, state the missing data briefly and still give the safest useful guidance.",
    "Respect allergies and dietary preference when present.",
    "When macro targets exist, anchor advice to remaining macros.",
    "When today's workout exists or is completed, bias recommendations toward training recovery.",
    "Keep responses concise, practical, and athlete-focused.",
    "",
    "Athlete context JSON:",
    JSON.stringify(context, null, 2),
  ].join("\n");
}

function toIsoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfDayIso(dateIso: string) {
  return `${dateIso}T00:00:00.000Z`;
}

function endOfDayIso(dateIso: string) {
  return `${dateIso}T23:59:59.999Z`;
}

function asNullableNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function sumLogs(logs: NutritionLogMacroRow[]) {
  return logs.reduce(
    (totals, log) => ({
      calories: totals.calories + (log.calories ?? 0),
      carbs: totals.carbs + (log.carbs ?? 0),
      fat: totals.fat + (log.fat ?? 0),
      protein: totals.protein + (log.protein ?? 0),
    }),
    { calories: 0, carbs: 0, fat: 0, protein: 0 },
  );
}

export async function loadAthleteNutritionContext(
  userId: string,
  accessToken: string,
): Promise<AthleteNutritionContext> {
  const todayIso = toIsoDate();
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    },
  );

  const [
    userRes,
    fitnessRes,
    macroTargetsRes,
    summaryRes,
    todayLogsRes,
    recentMealsRes,
    activeEnrollmentRes,
    todayWorkoutRes,
  ] = await Promise.all([
    supabase.from("users").select("id,full_name,email").eq("id", userId).maybeSingle(),
    supabase
      .from("fitness_profiles")
      .select("user_id,primary_goal,dietary_preference,allergies")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("macro_targets")
      .select("id,user_id,daily_calorie_target,daily_protein_target,daily_carbs_target,daily_fat_target,active_from,active_to")
      .eq("user_id", userId)
      .order("active_from", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("daily_nutrition_summaries")
      .select("id,user_id,date,total_calories,total_protein,total_carbs,total_fat")
      .eq("user_id", userId)
      .eq("date", todayIso)
      .maybeSingle(),
    supabase
      .from("nutrition_logs")
      .select("food_name,meal_category,calories,protein,carbs,fat,logged_at,created_at")
      .eq("user_id", userId)
      .eq("logged_at", todayIso)
      .order("created_at", { ascending: false }),
    supabase
      .from("nutrition_logs")
      .select("food_name,meal_category,calories,protein,carbs,fat,logged_at,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("enrollments")
      .select("id,user_id,program_id,status,enrolled_at,expires_at")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("enrolled_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("workout_sessions")
      .select("id,user_id,program_id,started_at,completed_at")
      .eq("user_id", userId)
      .gte("started_at", startOfDayIso(todayIso))
      .lte("started_at", endOfDayIso(todayIso))
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (userRes.error && userRes.status !== 406) throw userRes.error;
  if (fitnessRes.error && fitnessRes.status !== 406) throw fitnessRes.error;
  if (macroTargetsRes.error && macroTargetsRes.status !== 406) throw macroTargetsRes.error;
  if (summaryRes.error && summaryRes.status !== 406) throw summaryRes.error;
  if (todayLogsRes.error) throw todayLogsRes.error;
  if (recentMealsRes.error) throw recentMealsRes.error;
  if (activeEnrollmentRes.error && activeEnrollmentRes.status !== 406) throw activeEnrollmentRes.error;
  if (todayWorkoutRes.error && todayWorkoutRes.status !== 406) throw todayWorkoutRes.error;

  const user = (userRes.data as Pick<UserRow, "email" | "full_name" | "id"> | null) ?? null;
  const fitnessProfile =
    (fitnessRes.data as Pick<FitnessProfileRow, "allergies" | "dietary_preference" | "primary_goal" | "user_id"> | null) ??
    null;
  const macroTargets =
    (macroTargetsRes.data as Pick<
      MacroTargetsRow,
      | "active_from"
      | "active_to"
      | "daily_calorie_target"
      | "daily_carbs_target"
      | "daily_fat_target"
      | "daily_protein_target"
      | "id"
      | "user_id"
    > | null) ?? null;
  const summary =
    (summaryRes.data as Pick<
      DailyNutritionSummaryRow,
      "date" | "id" | "total_calories" | "total_carbs" | "total_fat" | "total_protein" | "user_id"
    > | null) ?? null;
  const todayLogs = ((todayLogsRes.data ?? []) as NutritionLogMacroRow[]) ?? [];
  const recentMeals = ((recentMealsRes.data ?? []) as NutritionLogMacroRow[]) ?? [];
  const activeEnrollment =
    (activeEnrollmentRes.data as Pick<EnrollmentRow, "enrolled_at" | "expires_at" | "id" | "program_id" | "status" | "user_id"> | null) ??
    null;
  const todayWorkout =
    (todayWorkoutRes.data as Pick<WorkoutSessionRow, "completed_at" | "id" | "program_id" | "started_at" | "user_id"> | null) ??
    null;

  const activeProgramRes = activeEnrollment?.program_id
    ? await supabase
        .from("programs")
        .select("id,title,difficulty,duration_weeks,vibe_type")
        .eq("id", activeEnrollment.program_id)
        .maybeSingle()
    : null;

  if (activeProgramRes?.error && activeProgramRes.status !== 406) {
    throw activeProgramRes.error;
  }

  const activeProgram =
    (activeProgramRes?.data as Pick<
      ProgramRow,
      "difficulty" | "duration_weeks" | "id" | "title" | "vibe_type"
    > | null) ?? null;

  const fallbackTodayTotals = sumLogs(todayLogs);
  const todayNutrition = {
    calories: asNullableNumber(summary?.total_calories) ?? fallbackTodayTotals.calories,
    carbs: asNullableNumber(summary?.total_carbs) ?? fallbackTodayTotals.carbs,
    date: todayIso,
    fat: asNullableNumber(summary?.total_fat) ?? fallbackTodayTotals.fat,
    loggedMealCount: todayLogs.length,
    protein: asNullableNumber(summary?.total_protein) ?? fallbackTodayTotals.protein,
  };

  const hasTodayNutrition =
    Boolean(summary) ||
    todayLogs.length > 0 ||
    todayNutrition.calories > 0 ||
    todayNutrition.protein > 0 ||
    todayNutrition.carbs > 0 ||
    todayNutrition.fat > 0;

  return {
    activeProgram:
      activeProgram && activeEnrollment
        ? {
            difficulty: activeProgram.difficulty,
            durationWeeks: activeProgram.duration_weeks,
            enrolledAt: activeEnrollment.enrolled_at,
            id: activeProgram.id,
            title: activeProgram.title,
            vibeType: activeProgram.vibe_type,
          }
        : null,
    allergies: fitnessProfile?.allergies ?? [],
    dietaryPreference: fitnessProfile?.dietary_preference ?? null,
    goal: fitnessProfile?.primary_goal ?? null,
    macroTargets: macroTargets
      ? {
          calories: macroTargets.daily_calorie_target,
          carbs: macroTargets.daily_carbs_target,
          fat: macroTargets.daily_fat_target,
          protein: macroTargets.daily_protein_target,
        }
      : null,
    name: user?.full_name ?? user?.email ?? null,
    recentMeals: recentMeals.map((meal) => ({
      calories: meal.calories,
      carbs: meal.carbs,
      fat: meal.fat,
      foodName: meal.food_name,
      loggedAt: meal.logged_at,
      mealCategory: meal.meal_category,
      protein: meal.protein,
    })),
    remainingMacros: macroTargets
      ? {
          calories: macroTargets.daily_calorie_target - todayNutrition.calories,
          carbs: macroTargets.daily_carbs_target - todayNutrition.carbs,
          fat: macroTargets.daily_fat_target - todayNutrition.fat,
          protein: macroTargets.daily_protein_target - todayNutrition.protein,
        }
      : null,
    todayNutrition: hasTodayNutrition ? todayNutrition : null,
    todayWorkout: todayWorkout
      ? {
          completedAt: todayWorkout.completed_at,
          programId: todayWorkout.program_id,
          programTitle:
            todayWorkout.program_id && activeProgram?.id === todayWorkout.program_id ? activeProgram?.title ?? null : null,
          startedAt: todayWorkout.started_at,
        }
      : null,
    todayWorkoutCompleted: Boolean(todayWorkout?.completed_at),
  };
}
