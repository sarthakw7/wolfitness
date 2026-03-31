-- Create a bucket for session assets (PDFs, Audio, etc.)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('session-assets', 'session-assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for storage (Allow mentors to upload, everyone to read)
CREATE POLICY "Mentors can upload assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'session-assets' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'mentor'
);

CREATE POLICY "Anyone can view session assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'session-assets');

CREATE POLICY "Mentors can delete their own assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'session-assets' AND
  owner = auth.uid()
);
