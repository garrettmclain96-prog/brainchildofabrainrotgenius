
-- Add zone column to public_thoughts for room system
ALTER TABLE public.public_thoughts 
ADD COLUMN zone text NOT NULL DEFAULT 'overflow';

-- Drop existing view and recreate with zone included
DROP VIEW IF EXISTS public.thoughts_with_decay;

CREATE OR REPLACE VIEW public.thoughts_with_decay 
WITH (security_invoker = off)
AS
SELECT 
  id,
  content,
  mode,
  decay_speed,
  created_at,
  expires_at,
  zone,
  public.calculate_decay_level(created_at, expires_at) as decay_level
FROM public.public_thoughts
WHERE expires_at > now()
ORDER BY created_at DESC;

-- Grant access to the view for anon/authenticated
GRANT SELECT ON public.thoughts_with_decay TO anon, authenticated;

-- Function to count how many thoughts have already faded (expired)
CREATE OR REPLACE FUNCTION public.count_faded_thoughts()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::integer
  FROM public.public_thoughts
  WHERE expires_at <= now();
$$;

-- Grant execute to anon
GRANT EXECUTE ON FUNCTION public.count_faded_thoughts() TO anon, authenticated;
