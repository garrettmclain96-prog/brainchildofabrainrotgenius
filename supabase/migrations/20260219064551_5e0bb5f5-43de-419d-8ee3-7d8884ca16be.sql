
-- Sponsored whispers table for non-intrusive ads
CREATE TABLE public.sponsored_whispers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content text NOT NULL,
  brand text NOT NULL,
  brand_url text,
  frequency_cap integer NOT NULL DEFAULT 1,
  active_from timestamptz NOT NULL DEFAULT now(),
  active_until timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sponsored_whispers ENABLE ROW LEVEL SECURITY;

-- Anyone can read active whispers (public data)
CREATE POLICY "Anyone can read active whispers"
  ON public.sponsored_whispers FOR SELECT
  USING (active_from <= now() AND active_until > now());
