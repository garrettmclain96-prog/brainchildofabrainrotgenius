
-- Drop the existing permissive INSERT policy
DROP POLICY IF EXISTS "Sessions can insert their own rate limit records" ON public.rate_limits;

-- Create a stricter INSERT policy that validates action_type to known values only
CREATE POLICY "Sessions can insert validated rate limit records"
ON public.rate_limits
FOR INSERT
WITH CHECK (
  session_id IS NOT NULL
  AND length(session_id) >= 10
  AND action_type IN ('thought', 'echo')
);
