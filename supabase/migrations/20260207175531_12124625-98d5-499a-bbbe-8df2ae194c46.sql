
-- Enable RLS on the echoes_with_info view
ALTER VIEW public.echoes_with_info SET (security_invoker = on);

-- Add RLS policy to only show non-expired echoes (matches base table policy)
CREATE POLICY "Read non-expired echoes via view"
ON public.echoes
FOR SELECT
USING (expires_at > now());
