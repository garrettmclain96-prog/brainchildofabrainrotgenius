-- Add input validation constraints to public_thoughts
ALTER TABLE public.public_thoughts 
ADD CONSTRAINT content_length_check 
CHECK (length(content) >= 1 AND length(content) <= 1000);

-- Add session_id format validation
ALTER TABLE public.public_thoughts 
ADD CONSTRAINT session_id_format_check 
CHECK (length(session_id) >= 10 AND length(session_id) <= 50);

-- Same for echoes table (it already has fragment_text limit, adding session check)
ALTER TABLE public.echoes 
ADD CONSTRAINT echoes_session_id_format_check 
CHECK (length(session_id) >= 10 AND length(session_id) <= 50);

-- Add rate limiting table to track submissions per session
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  action_type text NOT NULL, -- 'thought' or 'echo'
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only allow inserts (no reads/updates/deletes for users)
CREATE POLICY "Sessions can insert their own rate limit records"
ON public.rate_limits
FOR INSERT
WITH CHECK (session_id IS NOT NULL AND length(session_id) >= 10);

-- Create cleanup function for old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limits WHERE created_at < now() - interval '1 hour';
$$;

-- Create rate checking function (allows 10 thoughts per hour, 30 echoes per hour)
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_session_id text, p_action_type text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  action_count integer;
  max_allowed integer;
BEGIN
  -- Set limits based on action type
  IF p_action_type = 'thought' THEN
    max_allowed := 10;
  ELSIF p_action_type = 'echo' THEN
    max_allowed := 30;
  ELSE
    RETURN false;
  END IF;

  -- Count recent actions
  SELECT COUNT(*) INTO action_count
  FROM public.rate_limits
  WHERE session_id = p_session_id
    AND action_type = p_action_type
    AND created_at > now() - interval '1 hour';

  RETURN action_count < max_allowed;
END;
$$;

-- Update RLS policy for thoughts to check rate limit
DROP POLICY IF EXISTS "Session can insert thoughts" ON public.public_thoughts;
CREATE POLICY "Session can insert thoughts with rate limit"
ON public.public_thoughts
FOR INSERT
WITH CHECK (
  session_id IS NOT NULL 
  AND length(session_id) >= 10 
  AND length(content) >= 1 
  AND length(content) <= 1000
  AND public.check_rate_limit(session_id, 'thought')
);

-- Update RLS policy for echoes to check rate limit  
DROP POLICY IF EXISTS "Session can insert echoes" ON public.echoes;
CREATE POLICY "Session can insert echoes with rate limit"
ON public.echoes
FOR INSERT
WITH CHECK (
  session_id IS NOT NULL 
  AND length(session_id) >= 10
  AND length(fragment_text) >= 1 
  AND length(fragment_text) <= 500
  AND public.check_rate_limit(session_id, 'echo')
);