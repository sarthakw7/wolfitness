-- Nutrition Logs Trigger for Daily Summaries

CREATE OR REPLACE FUNCTION public.handle_nutrition_log_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle DELETE or UPDATE (deduct old values)
    IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') THEN
        UPDATE public.daily_nutrition_summaries
        SET 
            total_calories = total_calories - OLD.calories,
            total_protein = total_protein - OLD.protein,
            total_carbs = total_carbs - OLD.carbs,
            total_fat = total_fat - OLD.fat
        WHERE user_id = OLD.user_id AND date = OLD.logged_at;
    END IF;

    -- Handle INSERT or UPDATE (add new values)
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        INSERT INTO public.daily_nutrition_summaries (user_id, date, total_calories, total_protein, total_carbs, total_fat)
        VALUES (NEW.user_id, NEW.logged_at, NEW.calories, NEW.protein, NEW.carbs, NEW.fat)
        ON CONFLICT (user_id, date)
        DO UPDATE SET 
            total_calories = public.daily_nutrition_summaries.total_calories + EXCLUDED.total_calories,
            total_protein = public.daily_nutrition_summaries.total_protein + EXCLUDED.total_protein,
            total_carbs = public.daily_nutrition_summaries.total_carbs + EXCLUDED.total_carbs,
            total_fat = public.daily_nutrition_summaries.total_fat + EXCLUDED.total_fat;
    END IF;

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_nutrition_log_change ON public.nutrition_logs;
CREATE TRIGGER on_nutrition_log_change
AFTER INSERT OR UPDATE OR DELETE ON public.nutrition_logs
FOR EACH ROW EXECUTE FUNCTION public.handle_nutrition_log_change();
