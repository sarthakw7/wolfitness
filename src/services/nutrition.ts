"use server";

import { createClient } from '@/lib/supabaseServer';

export interface MealLogInput {
  food_name: string;
  meal_category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logged_at: string;
}

export async function addSmartMealLog(userId: string, logData: MealLogInput) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('nutrition_logs')
    .insert([{ user_id: userId, ...logData }])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  
  return data;
}
