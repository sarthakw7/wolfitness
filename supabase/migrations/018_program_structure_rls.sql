-- RLS policies for program structure tables.
-- Required so clients can read weeks/days/exercises for published programs.

-- Public read access for published program structure
CREATE POLICY "Public can view published program weeks" ON public.program_weeks
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.programs p
    WHERE p.id = program_weeks.program_id
      AND p.is_published = true
  )
);

CREATE POLICY "Public can view published program days" ON public.program_days
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.program_weeks w
    JOIN public.programs p ON p.id = w.program_id
    WHERE w.id = program_days.week_id
      AND p.is_published = true
  )
);

CREATE POLICY "Public can view published program exercises" ON public.program_exercises
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.program_days d
    JOIN public.program_weeks w ON w.id = d.week_id
    JOIN public.programs p ON p.id = w.program_id
    WHERE d.id = program_exercises.day_id
      AND p.is_published = true
  )
);

-- Coach management access for their own program structure
CREATE POLICY "Coaches manage own program weeks" ON public.program_weeks
FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM public.programs p
    WHERE p.id = program_weeks.program_id
      AND p.creator_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.programs p
    WHERE p.id = program_weeks.program_id
      AND p.creator_id = auth.uid()
  )
);

CREATE POLICY "Coaches manage own program days" ON public.program_days
FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM public.program_weeks w
    JOIN public.programs p ON p.id = w.program_id
    WHERE w.id = program_days.week_id
      AND p.creator_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.program_weeks w
    JOIN public.programs p ON p.id = w.program_id
    WHERE w.id = program_days.week_id
      AND p.creator_id = auth.uid()
  )
);

CREATE POLICY "Coaches manage own program exercises" ON public.program_exercises
FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM public.program_days d
    JOIN public.program_weeks w ON w.id = d.week_id
    JOIN public.programs p ON p.id = w.program_id
    WHERE d.id = program_exercises.day_id
      AND p.creator_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.program_days d
    JOIN public.program_weeks w ON w.id = d.week_id
    JOIN public.programs p ON p.id = w.program_id
    WHERE d.id = program_exercises.day_id
      AND p.creator_id = auth.uid()
  )
);
