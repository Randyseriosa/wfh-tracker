-- Allow anonymous and authenticated users to view supervisor profiles for registration purposes
CREATE POLICY "Allow public read of supervisor profiles"
ON public.profile FOR SELECT
TO authenticated, anon
USING ( role = 'supervisor' );
