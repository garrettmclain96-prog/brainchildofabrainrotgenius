
-- Create a function to dissolve all notes for a session
CREATE OR REPLACE FUNCTION public.dissolve_all_notes(p_session_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.private_notes
  WHERE session_id = p_session_id;
END;
$$;
