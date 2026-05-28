-- Stabilization Migration: Fix enrollment RLS
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users manage own enrollments" ON public.enrollments;

CREATE POLICY "Users can view own enrollments" ON public.enrollments 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll in free programs" ON public.enrollments
FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    (SELECT price FROM public.programs WHERE id = program_id) = 0
);

-- Coaches can view enrollments for their programs (already exists but for clarity)
DROP POLICY IF EXISTS "Coaches can view enrollments for their programs" ON public.enrollments;
CREATE POLICY "Coaches can view enrollments for their programs" ON public.enrollments 
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.programs WHERE id = enrollments.program_id AND creator_id = auth.uid())
);
