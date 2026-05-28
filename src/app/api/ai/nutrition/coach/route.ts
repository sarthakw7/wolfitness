import { generateObject, generateText } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  authenticateBearerRequest,
  type AthleteNutritionContext,
  buildAthleteNutritionSystemPrompt,
  loadAthleteNutritionContext,
  logNutritionAi,
  NutritionAiAuthError,
} from "@/lib/ai/athlete-context";
import { getAiProvider, getModel } from "@/lib/ai/provider";

const CoachRequestSchema = z
  .object({
    message: z.string().trim().min(1).optional(),
    messages: z
      .array(
        z.object({
          content: z.string(),
          role: z.string(),
        }),
      )
      .optional(),
    question: z.string().trim().min(1).optional(),
  })
  .transform((input) => {
    const lastMessage = input.messages?.at(-1)?.content?.trim();
    const prompt = input.question ?? input.message ?? lastMessage ?? "";
    return { prompt };
  })
  .refine((input) => input.prompt.length > 0, {
    message: "A nutrition coaching question is required.",
    path: ["prompt"],
  });

const CoachResponseSchema = z.object({
  answer: z.string().min(1),
  recommendedMeals: z
    .array(
      z.object({
        estimatedCalories: z.number().nullable(),
        estimatedCarbs: z.number().nullable(),
        estimatedFat: z.number().nullable(),
        estimatedProtein: z.number().nullable(),
        name: z.string(),
        why: z.string(),
      }),
    )
    .max(3),
  macroStatus: z.object({
    caloriesRemaining: z.number().nullable(),
    carbsRemaining: z.number().nullable(),
    fatRemaining: z.number().nullable(),
    proteinRemaining: z.number().nullable(),
    todayCalories: z.number().nullable(),
    todayCarbs: z.number().nullable(),
    todayFat: z.number().nullable(),
    todayProtein: z.number().nullable(),
  }),
  reasoningTags: z.array(z.string()).max(6),
  followUpQuestion: z.string().min(1),
});

type CoachResponse = z.infer<typeof CoachResponseSchema>;

class NutritionCoachParseError extends Error {
  constructor(message = "AI returned malformed coaching data. Please try again.") {
    super(message);
    this.name = "NutritionCoachParseError";
  }
}

function extractJsonObject(text: string) {
  const trimmedText = text.trim();
  const fencedJson = trimmedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1]?.trim();
  const candidate = fencedJson ?? trimmedText;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new NutritionCoachParseError();
  }

  return candidate.slice(start, end + 1);
}

function parseCoachResponse(text: string): CoachResponse {
  const parsedJson = JSON.parse(extractJsonObject(text));
  const parsedResponse = CoachResponseSchema.safeParse(parsedJson);

  if (!parsedResponse.success) {
    throw new NutritionCoachParseError(parsedResponse.error.issues[0]?.message);
  }

  return parsedResponse.data;
}

function getCoachJsonPrompt(question: string) {
  return [
    `Athlete question: ${question}`,
    "",
    "Return ONLY valid JSON with this exact shape:",
    JSON.stringify({
      answer: "string",
      recommendedMeals: [
        {
          estimatedCalories: 0,
          estimatedCarbs: 0,
          estimatedFat: 0,
          estimatedProtein: 0,
          name: "string",
          why: "string",
        },
      ],
      macroStatus: {
        caloriesRemaining: null,
        carbsRemaining: null,
        fatRemaining: null,
        proteinRemaining: null,
        todayCalories: null,
        todayCarbs: null,
        todayFat: null,
        todayProtein: null,
      },
      reasoningTags: ["string"],
      followUpQuestion: "string",
    }),
    "",
    "Rules:",
    "- recommendedMeals must contain at most 3 items.",
    "- Use numbers or null for macro fields.",
    "- Do not include markdown, code fences, comments, or extra keys.",
  ].join("\n");
}

async function generateCoachResponse(context: AthleteNutritionContext, prompt: string): Promise<CoachResponse> {
  const provider = getAiProvider();

  if (provider === "openai") {
    const { object } = await generateObject({
      model: getModel("chat"),
      schema: CoachResponseSchema,
      system: buildAthleteNutritionSystemPrompt(context),
      prompt: `Athlete question: ${prompt}`,
    });

    return object;
  }

  const { text } = await generateText({
    model: getModel("chat"),
    system: buildAthleteNutritionSystemPrompt(context),
    prompt: getCoachJsonPrompt(prompt),
  });

  return parseCoachResponse(text);
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return { message: error.message, name: error.name };
  }

  if (typeof error === "object" && error !== null) {
    return { message: JSON.stringify(error), name: undefined };
  }

  return { message: String(error), name: undefined };
}

export async function POST(req: Request) {
  try {
    const { accessToken, user } = await authenticateBearerRequest(req);

    const parsedBody = CoachRequestSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.issues[0]?.message ?? "A coaching question is required.", code: "BAD_REQUEST" },
        { status: 400 },
      );
    }

    const context = await loadAthleteNutritionContext(user.id, accessToken);

    logNutritionAi("ai-coach", "info", "Loaded athlete context for nutrition coach.", {
      hasActiveProgram: Boolean(context.activeProgram),
      hasGoal: Boolean(context.goal),
      hasMacroTargets: Boolean(context.macroTargets),
      hasTodayNutrition: Boolean(context.todayNutrition),
      hasWorkoutToday: Boolean(context.todayWorkout),
      userId: user.id,
    });

    const object = await generateCoachResponse(context, parsedBody.data.prompt);

    return NextResponse.json(object);
  } catch (error: any) {
    const serializedError = serializeError(error);

    logNutritionAi("ai-coach", "error", "Nutrition coach request failed.", {
      error: serializedError.message,
      name: serializedError.name,
      provider: getAiProvider(),
    });

    if (error instanceof NutritionAiAuthError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }

    if (
      error?.name === "TypeValidationError" ||
      error?.name === "JSONParseError" ||
      error instanceof SyntaxError ||
      error instanceof NutritionCoachParseError
    ) {
      return NextResponse.json(
        { error: "AI returned malformed coaching data. Please try again.", code: "PARSE_ERROR" },
        { status: 422 },
      );
    }

    if (
      error?.name === "APICallError" ||
      error?.name === "LoadAPIKeyError" ||
      error?.name === "NoSuchModelError" ||
      error?.name === "RetryError" ||
      error?.name === "TimeoutError"
    ) {
      return NextResponse.json(
        { error: "AI Provider is currently unavailable. Please try again later.", code: "PROVIDER_ERROR" },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error during AI coaching.", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
