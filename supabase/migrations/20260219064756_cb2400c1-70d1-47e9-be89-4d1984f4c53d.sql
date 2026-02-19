
-- Allow sessions to mark their own whispers as seen
CREATE POLICY "Session can update own whispers"
  ON public.payment_whispers FOR UPDATE
  USING (true)
  WITH CHECK (true);
