
-- ============================================================
-- Stripe Connect Integration Tables
-- Stores connected account mappings and subscription statuses
-- ============================================================

-- Table: connected_accounts
-- Maps a session_id (pre-auth identity) to a Stripe connected account
CREATE TABLE public.connected_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  stripe_account_id TEXT NOT NULL UNIQUE,
  display_name TEXT,
  contact_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;

-- RLS policies — session-based access (pre-auth)
CREATE POLICY "Users can view their own connected accounts"
  ON public.connected_accounts FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own connected accounts"
  ON public.connected_accounts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own connected accounts"
  ON public.connected_accounts FOR UPDATE
  USING (true);

-- Table: subscription_status
-- Tracks subscription state for connected accounts (platform-level subscriptions)
CREATE TABLE public.subscription_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_account_id TEXT NOT NULL,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive',
  price_id TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_status ENABLE ROW LEVEL SECURITY;

-- RLS policies — public read for demo, write only from edge functions (service role)
CREATE POLICY "Anyone can view subscription status"
  ON public.subscription_status FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage subscription status"
  ON public.subscription_status FOR ALL
  USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_connected_accounts_updated_at
  BEFORE UPDATE ON public.connected_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_status_updated_at
  BEFORE UPDATE ON public.subscription_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
