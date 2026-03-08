
-- Allow admins to read all files (for analytics)
CREATE POLICY "Admins can view all files"
  ON public.files FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
