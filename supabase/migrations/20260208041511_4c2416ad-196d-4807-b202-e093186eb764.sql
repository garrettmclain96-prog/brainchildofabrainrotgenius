-- Fix echo length validation mismatch: align RLS policy with DB constraint (50 chars, not 500)
DROP POLICY IF EXISTS "Session can insert echoes with rate limit" ON public.echoes;

CREATE POLICY "Session can insert echoes with rate limit"
ON public.echoes
AS RESTRICTIVE
FOR INSERT
WITH CHECK (
  session_id IS NOT NULL
  AND length(session_id) >= 10
  AND length(fragment_text) >= 1
  AND length(fragment_text) <= 50
  AND check_rate_limit(session_id, 'echo'::text)
);