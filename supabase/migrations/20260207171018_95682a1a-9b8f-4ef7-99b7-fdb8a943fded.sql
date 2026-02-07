
-- =============================================
-- PRIVATE NOTES: Database-backed persistent storage
-- Uses session_id (localStorage) for identity pre-auth
-- All access through SECURITY DEFINER RPCs
-- =============================================

CREATE TABLE public.private_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'uncategorized',
  mode TEXT NOT NULL DEFAULT 'clean',
  starred BOOLEAN NOT NULL DEFAULT false,
  water_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_watered_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_private_notes_session ON public.private_notes(session_id);
CREATE INDEX idx_private_notes_expires ON public.private_notes(expires_at);

-- Enable RLS
ALTER TABLE public.private_notes ENABLE ROW LEVEL SECURITY;

-- Lock down direct access — all operations go through RPCs
CREATE POLICY "No direct read access to private notes"
  ON public.private_notes FOR SELECT
  USING (false);

CREATE POLICY "Session can insert private notes"
  ON public.private_notes FOR INSERT
  WITH CHECK (
    session_id IS NOT NULL
    AND length(session_id) >= 10
    AND length(content) >= 1
    AND length(content) <= 1000
  );

CREATE POLICY "No direct update on private notes"
  ON public.private_notes FOR UPDATE
  USING (false);

CREATE POLICY "No direct delete on private notes"
  ON public.private_notes FOR DELETE
  USING (false);

-- =============================================
-- RPC FUNCTIONS (SECURITY DEFINER = bypass RLS)
-- =============================================

-- Fetch notes for a session (only non-expired or starred)
CREATE OR REPLACE FUNCTION public.get_private_notes(p_session_id TEXT)
RETURNS TABLE (
  id UUID,
  session_id TEXT,
  content TEXT,
  category TEXT,
  mode TEXT,
  starred BOOLEAN,
  water_count INTEGER,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  last_watered_at TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT id, session_id, content, category, mode, starred, water_count, created_at, expires_at, last_watered_at
  FROM public.private_notes
  WHERE session_id = p_session_id
    AND (starred = true OR expires_at > now())
  ORDER BY created_at DESC;
$$;

-- Delete a note (session-validated)
CREATE OR REPLACE FUNCTION public.delete_private_note(p_session_id TEXT, p_note_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.private_notes
  WHERE id = p_note_id AND session_id = p_session_id;
END;
$$;

-- Star/unstar a note (extends expiry by 48h when starring)
CREATE OR REPLACE FUNCTION public.toggle_note_star(p_session_id TEXT, p_note_id UUID, p_starred BOOLEAN)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.private_notes
  SET starred = p_starred,
      expires_at = CASE
        WHEN p_starred AND NOT private_notes.starred THEN expires_at + interval '48 hours'
        ELSE expires_at
      END
  WHERE id = p_note_id AND session_id = p_session_id;
END;
$$;

-- Water a note (extend life by 1 hour)
CREATE OR REPLACE FUNCTION public.water_private_note(p_session_id TEXT, p_note_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.private_notes
  SET water_count = water_count + 1,
      last_watered_at = now(),
      expires_at = expires_at + interval '1 hour'
  WHERE id = p_note_id AND session_id = p_session_id;
END;
$$;

-- Cleanup expired non-starred notes (for periodic maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_expired_notes()
RETURNS void
LANGUAGE sql SECURITY DEFINER
SET search_path = 'public'
AS $$
  DELETE FROM public.private_notes
  WHERE starred = false AND expires_at < now() - interval '1 hour';
$$;
