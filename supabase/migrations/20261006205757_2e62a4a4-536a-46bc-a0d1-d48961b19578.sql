ALTER TABLE public.profiles
  ADD COLUMN headline text,
  ADD COLUMN category text,
  ADD COLUMN skills text[] NOT NULL DEFAULT '{}',
  ADD COLUMN experience text,
  ADD COLUMN company text,
  ADD COLUMN location text,
  ADD COLUMN website text,
  ADD COLUMN portfolio_url text,
  ADD COLUMN linkedin text,
  ADD COLUMN twitter text,
  ADD COLUMN github text,
  ADD COLUMN instagram text;

CREATE POLICY "Avatar images are public" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);