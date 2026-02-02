-- Create enum for decay mode
CREATE TYPE public.decay_mode AS ENUM ('clean', 'rot');

-- Create enum for decay speed
CREATE TYPE public.decay_speed AS ENUM ('normal', 'fast', 'sink');

-- Create public_thoughts table for shared anonymous thoughts
CREATE TABLE public.public_thoughts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  decay_level INTEGER NOT NULL DEFAULT 0 CHECK (decay_level >= 0 AND decay_level <= 100),
  mode public.decay_mode NOT NULL DEFAULT 'clean',
  decay_speed public.decay_speed NOT NULL DEFAULT 'normal',
  session_id TEXT NOT NULL -- Anonymous session identifier for rate limiting
);

-- Create echoes table for brief responses to thoughts
CREATE TABLE public.echoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thought_id UUID NOT NULL REFERENCES public.public_thoughts(id) ON DELETE CASCADE,
  fragment_text TEXT NOT NULL CHECK (char_length(fragment_text) <= 50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  session_id TEXT NOT NULL -- Anonymous session identifier for rate limiting
);

-- Create index for faster queries on expiration
CREATE INDEX idx_public_thoughts_expires_at ON public.public_thoughts(expires_at);
CREATE INDEX idx_echoes_expires_at ON public.echoes(expires_at);
CREATE INDEX idx_echoes_thought_id ON public.echoes(thought_id);

-- Enable Row Level Security
ALTER TABLE public.public_thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.echoes ENABLE ROW LEVEL SECURITY;

-- Public thoughts are readable by everyone (anonymous access)
CREATE POLICY "Public thoughts are readable by everyone" 
ON public.public_thoughts 
FOR SELECT 
USING (expires_at > now());

-- Anyone can insert thoughts (anonymous, rate limited at application level)
CREATE POLICY "Anyone can insert thoughts" 
ON public.public_thoughts 
FOR INSERT 
WITH CHECK (true);

-- Echoes are readable by everyone (anonymous access)
CREATE POLICY "Echoes are readable by everyone" 
ON public.echoes 
FOR SELECT 
USING (expires_at > now());

-- Anyone can insert echoes (anonymous, rate limited at application level)
CREATE POLICY "Anyone can insert echoes" 
ON public.echoes 
FOR INSERT 
WITH CHECK (true);

-- Create function to auto-update decay_level based on time
CREATE OR REPLACE FUNCTION public.calculate_decay_level(created_at TIMESTAMP WITH TIME ZONE, expires_at TIMESTAMP WITH TIME ZONE)
RETURNS INTEGER AS $$
DECLARE
  total_duration INTERVAL;
  elapsed INTERVAL;
  decay_pct INTEGER;
BEGIN
  total_duration := expires_at - created_at;
  elapsed := now() - created_at;
  
  IF elapsed <= INTERVAL '0 seconds' THEN
    RETURN 0;
  END IF;
  
  IF elapsed >= total_duration THEN
    RETURN 100;
  END IF;
  
  decay_pct := ROUND((EXTRACT(EPOCH FROM elapsed) / EXTRACT(EPOCH FROM total_duration)) * 100);
  RETURN LEAST(100, GREATEST(0, decay_pct));
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

-- Create view for thoughts with calculated decay level
CREATE OR REPLACE VIEW public.thoughts_with_decay AS
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

-- Create view for echoes with parent thought info
CREATE OR REPLACE VIEW public.echoes_with_info AS
SELECT 
  e.id,
  e.thought_id,
  e.fragment_text,
  e.created_at,
  e.expires_at,
  e.session_id
FROM public.echoes e
WHERE e.expires_at > now();