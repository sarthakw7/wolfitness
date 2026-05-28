import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { getModel } from '@/lib/ai/provider';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    // 1. Authenticate Request via Bearer Token (Supports Web & Mobile Expo)
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized Request', code: 'UNAUTHORIZED' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or Expired Token', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    // 2. Validate Request Body
    const { food } = await req.json();
    if (!food || typeof food !== 'string') {
      return NextResponse.json({ error: 'Food description is required', code: 'BAD_REQUEST' }, { status: 400 });
    }

    // 3. Generate Structured Output via AI Provider
    const { object } = await generateObject({
      model: getModel('estimate'),
      schema: z.object({
        food_name: z.string().describe('A concise, title-cased name for the food (e.g., "Chicken & Rice", "2 Eggs"). Max 50 chars.'),
        calories: z.number().int().describe('Total estimated calories in kcal'),
        protein: z.number().describe('Total estimated protein in grams'),
        carbs: z.number().describe('Total estimated carbohydrates in grams'),
        fat: z.number().describe('Total estimated fat in grams'),
        confidence: z.number().min(0).max(100).optional().describe('Confidence score 0-100 for this estimation')
      }),
      system: 'You are an elite sports nutritionist AI. Your job is to estimate the macronutrients for the provided food description as accurately as possible based on standard USDA databases. Provide realistic estimates tailored for an athlete. Always return a concise, formatted food name and the requested macronutrient values in pure JSON.',
      prompt: `Estimate the macros for the following meal or food item: "${food}"`,
    });

    // 4. Return Structured Payload
    return NextResponse.json(object);
    
  } catch (error: any) {
    console.error('[AI_ESTIMATE_ERROR]', error);
    
    // Handle Vercel AI SDK Parsing/Validation Errors
    if (error.name === 'TypeValidationError' || error.name === 'JSONParseError') {
       return NextResponse.json(
         { error: 'AI returned malformed nutrition data. Please try again.', code: 'PARSE_ERROR' }, 
         { status: 422 }
       );
    }
    
    // Handle OpenAI Provider Timeouts / API Errors
    if (error.name === 'APICallError' || error.name === 'TimeoutError') {
       return NextResponse.json(
         { error: 'AI Provider is currently unavailable. Please try again later.', code: 'PROVIDER_ERROR' }, 
         { status: 503 }
       );
    }
    
    // Generic Fallback Error
    return NextResponse.json(
      { error: 'Internal Server Error during AI processing.', code: 'INTERNAL_ERROR' }, 
      { status: 500 }
    );
  }
}
