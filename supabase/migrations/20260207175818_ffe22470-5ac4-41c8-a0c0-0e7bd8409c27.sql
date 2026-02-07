
-- 1. Revert security_invoker on echoes_with_info (run as owner to bypass base table RLS)
ALTER VIEW public.echoes_with_info SET (security_invoker = off);

-- 2. Ensure thoughts_with_decay also runs as owner
ALTER VIEW public.thoughts_with_decay SET (security_invoker = off);

-- 3. Drop duplicate policy on echoes
DROP POLICY IF EXISTS "Read non-expired echoes via view" ON public.echoes;

-- 4. Replace echoes SELECT policy with deny-direct-access
DROP POLICY IF EXISTS "Read non-expired echoes" ON public.echoes;
CREATE POLICY "No direct read access to echoes"
ON public.echoes FOR SELECT
USING (false);

-- 5. Replace public_thoughts SELECT policy with deny-direct-access
DROP POLICY IF EXISTS "Read non-expired thoughts" ON public.public_thoughts;
CREATE POLICY "No direct read access to public thoughts"
ON public.public_thoughts FOR SELECT
USING (false);
