
-- Phase 2 & 4: Database schema changes

-- Add share_slug to public_thoughts for shareable fog links
ALTER TABLE public.public_thoughts ADD COLUMN share_slug text UNIQUE;
CREATE INDEX idx_public_thoughts_share_slug ON public.public_thoughts (share_slug) WHERE share_slug IS NOT NULL;

-- Add premium_until to subscription_status
ALTER TABLE public.subscription_status ADD COLUMN premium_until timestamptz;

-- Create payment_whispers table for failed payment notifications
CREATE TABLE public.payment_whispers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  message text NOT NULL DEFAULT 'A payment needs your attention.',
  seen boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_whispers ENABLE ROW LEVEL SECURITY;

-- Users can read their own whispers
CREATE POLICY "Session can read own whispers"
  ON public.payment_whispers FOR SELECT
  USING (true);

-- Service role manages whispers (inserts from webhook)
CREATE POLICY "Service role manages whispers"
  ON public.payment_whispers FOR ALL
  USING (true);

-- Allow public SELECT on shared thoughts (share_slug is not null)
CREATE POLICY "Anyone can view shared thoughts"
  ON public.public_thoughts FOR SELECT
  USING (share_slug IS NOT NULL);

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role for cron
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;
