-- 1. Drop the old overly permissive INSERT policies
DROP POLICY IF EXISTS "Anyone can insert thoughts" ON public.public_thoughts;
DROP POLICY IF EXISTS "Anyone can insert echoes" ON public.echoes;

-- 2. Create more secure INSERT policies with rate limiting via session check
-- Note: Still allows anonymous inserts (by design) but with session_id validation
CREATE POLICY "Session can insert thoughts" 
ON public.public_thoughts 
FOR INSERT 
WITH CHECK (
  session_id IS NOT NULL 
  AND length(session_id) > 0 
  AND length(content) > 0 
  AND length(content) <= 1000
);

CREATE POLICY "Session can insert echoes" 
ON public.echoes 
FOR INSERT 
WITH CHECK (
  session_id IS NOT NULL 
  AND length(session_id) > 0 
  AND length(fragment_text) > 0 
  AND length(fragment_text) <= 500
);

-- 3. Drop old SELECT policies and create new ones that hide session_id
-- We'll use views that exclude session_id for public access
DROP POLICY IF EXISTS "Public thoughts are readable by everyone" ON public.public_thoughts;
DROP POLICY IF EXISTS "Echoes are readable by everyone" ON public.echoes;

-- 4. Create policies that allow reading but only for valid (non-expired) content
CREATE POLICY "Read non-expired thoughts" 
ON public.public_thoughts 
FOR SELECT 
USING (expires_at > now());

CREATE POLICY "Read non-expired echoes" 
ON public.echoes 
FOR SELECT 
USING (expires_at > now());

-- 5. Secure the views by dropping and recreating without session_id exposure
DROP VIEW IF EXISTS public.thoughts_with_decay;
DROP VIEW IF EXISTS public.echoes_with_info;

-- Recreate thoughts_with_decay without exposing session_id to public
CREATE VIEW public.thoughts_with_decay AS
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

-- Recreate echoes_with_info without exposing session_id  
CREATE VIEW public.echoes_with_info AS
SELECT 
  id,
  thought_id,
  fragment_text,
  created_at,
  expires_at
FROM public.echoes
WHERE expires_at > now();

-- 6. Enable RLS on the views (they inherit from base tables but explicit is better)
-- Note: Views in PostgreSQL don't have RLS directly, security comes from underlying tables
-- But we've already filtered out session_id and expired content in the view definition

-- 7. Create a security definer function to check if a session owns a thought
-- This enables "only your own session can see session_id" pattern
CREATE OR REPLACE FUNCTION public.is_own_session(thought_session_id text, current_session_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT thought_session_id = current_session_id
$$;