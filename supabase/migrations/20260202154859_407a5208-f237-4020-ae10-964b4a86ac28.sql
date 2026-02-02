-- Fix the security definer views by making them SECURITY INVOKER (default in newer Postgres)
-- Drop and recreate views with explicit security invoker

DROP VIEW IF EXISTS public.echoes_with_info;
DROP VIEW IF EXISTS public.thoughts_with_decay;

-- Recreate views without security definer (uses invoker by default)
CREATE VIEW public.thoughts_with_decay 
WITH (security_invoker = on) AS
SELECT 
  id,
  content,
  created_at,
  expires_at,
  public.calculate_decay_level(created_at, expires_at) as decay_level,
  mode,
  decay_speed,
  session_id
FROM public.public_thoughts
WHERE expires_at > now();

CREATE VIEW public.echoes_with_info 
WITH (security_invoker = on) AS
SELECT 
  e.id,
  e.thought_id,
  e.fragment_text,
  e.created_at,
  e.expires_at,
  e.session_id
FROM public.echoes e
WHERE e.expires_at > now();