-- Add explicit SELECT deny policy on rate_limits for defense-in-depth
-- No client should ever need to read rate limit records directly
CREATE POLICY "No direct read access to rate limits"
  ON public.rate_limits
  FOR SELECT
  USING (false);