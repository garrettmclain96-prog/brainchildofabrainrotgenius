-- Fix the views to use security_invoker instead of security_definer
DROP VIEW IF EXISTS public.thoughts_with_decay;
DROP VIEW IF EXISTS public.echoes_with_info;

-- Recreate thoughts_with_decay with security_invoker (safer - uses caller's permissions)
CREATE VIEW public.thoughts_with_decay
WITH (security_invoker=on) AS
SELECT 
  id,
  content,
  created_at,
  expires_at,
  decay_speed,
  mode,
  public.calculate_decay_level(created_at, expires_at) as decay_level
FROM public.public_thoughts
WHERE expires_at > now();

-- Recreate echoes_with_info with security_invoker
CREATE VIEW public.echoes_with_info
WITH (security_invoker=on) AS
SELECT 
  id,
  thought_id,
  fragment_text,
  created_at,
  expires_at
FROM public.echoes
WHERE expires_at > now();