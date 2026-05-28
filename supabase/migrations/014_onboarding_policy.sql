DROP POLICY IF EXISTS "Users can manage own assessments" ON public.onboarding_assessments;

CREATE POLICY "Users can manage own assessments"
ON public.onboarding_assessments
FOR ALL USING (auth.uid() = user_id);