import { streamText, type ModelMessage } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  authenticateBearerRequest,
  buildAthleteNutritionSystemPrompt,
  loadAthleteNutritionContext,
  logNutritionAi,
  NutritionAiAuthError,
} from "@/lib/ai/athlete-context";
import { getModel } from "@/lib/ai/provider";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const ChatRequestSchema = z.object({
  messages: z.array(z.unknown()).min(1, "At least one chat message is required."),
});

function extractMessageText(message: any) {
  if (typeof message?.content === "string") {
    return message.content.trim();
  }

  if (Array.isArray(message?.parts)) {
    return message.parts
      .filter((part: any) => part?.type === "text" && typeof part?.text === "string")
      .map((part: any) => part.text)
      .join("")
      .trim();
  }

  if (typeof message?.text === "string") {
    return message.text.trim();
  }

  return "";
}

function normalizeMessages(messages: unknown[]): ModelMessage[] {
  return messages
    .map((message: any) => {
      const role = message?.role === "assistant" ? "assistant" : message?.role === "user" ? "user" : null;
      const content = extractMessageText(message);

      if (!role || !content) {
        return null;
      }

      return { role, content };
    })
    .filter((message): message is ModelMessage => Boolean(message));
}

function errorResponse(error: string, code: string, status: number) {
  return NextResponse.json({ error, code }, { status });
}

export async function POST(req: Request) {
  try {
    const { accessToken, user } = await authenticateBearerRequest(req);

    const body = await req.json().catch((error) => {
      logNutritionAi("nutrition-chat", "warn", "Failed to parse chat request body.", {
        error: error instanceof Error ? error.message : String(error),
        userId: user.id,
      });
      return null;
    });

    const parsedBody = ChatRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      return errorResponse(
        parsedBody.error.issues[0]?.message ?? "Invalid nutrition chat request.",
        "BAD_REQUEST",
        400,
      );
    }

    const messages = normalizeMessages(parsedBody.data.messages);
    if (messages.length === 0) {
      return errorResponse("A user message is required.", "BAD_REQUEST", 400);
    }

    const context = await loadAthleteNutritionContext(user.id, accessToken);

    logNutritionAi("nutrition-chat", "info", "Loaded athlete context for streaming nutrition chat.", {
      hasActiveProgram: Boolean(context.activeProgram),
      hasGoal: Boolean(context.goal),
      hasMacroTargets: Boolean(context.macroTargets),
      hasTodayNutrition: Boolean(context.todayNutrition),
      hasWorkoutToday: Boolean(context.todayWorkout),
      messageCount: messages.length,
      userId: user.id,
    });

    const result = streamText({
      model: getModel("chat"),
      messages,
      system: buildAthleteNutritionSystemPrompt(context),
    });

    return result.toUIMessageStreamResponse({
      onError(error) {
        const errorMessage =
          error instanceof Error ? error.message : typeof error === "object" ? JSON.stringify(error) : String(error);

        logNutritionAi("nutrition-chat", "error", "Streaming nutrition chat failed.", {
          error: errorMessage,
          name: error instanceof Error ? error.name : undefined,
          userId: user.id,
        });
        return "Wolf AI could not complete that nutrition response. Please try again.";
      },
    });
  } catch (error: any) {
    logNutritionAi("nutrition-chat", "error", "Nutrition chat request failed.", {
      error: error instanceof Error ? error.message : String(error),
      name: error?.name,
    });

    if (error instanceof NutritionAiAuthError) {
      return errorResponse(error.message, error.code, error.status);
    }

    if (error?.name === "JSONParseError") {
      return errorResponse("Invalid request body.", "PARSE_ERROR", 400);
    }

    if (error?.name === "APICallError" || error?.name === "TimeoutError") {
      return errorResponse("AI Provider is currently unavailable. Please try again later.", "PROVIDER_ERROR", 503);
    }

    return errorResponse("Internal Server Error during nutrition chat.", "INTERNAL_ERROR", 500);
  }
}
