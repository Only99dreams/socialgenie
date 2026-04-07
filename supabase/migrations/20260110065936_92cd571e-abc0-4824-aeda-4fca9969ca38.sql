-- Create enum for brand tones
CREATE TYPE public.brand_tone AS ENUM ('professional', 'friendly', 'luxury', 'playful', 'bold', 'minimal');

-- Create enum for agent modes
CREATE TYPE public.agent_mode AS ENUM ('autopilot', 'review');

-- Create enum for social platforms
CREATE TYPE public.social_platform AS ENUM ('instagram', 'facebook', 'twitter', 'linkedin', 'tiktok');

-- Create enum for agent status
CREATE TYPE public.agent_status AS ENUM ('inactive', 'learning', 'active', 'paused');

-- Create businesses table
CREATE TABLE public.businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  brand_tone brand_tone DEFAULT 'professional',
  brand_keywords TEXT[],
  industry TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- RLS policies for businesses
CREATE POLICY "Users can view their own businesses"
ON public.businesses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own businesses"
ON public.businesses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own businesses"
ON public.businesses FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own businesses"
ON public.businesses FOR DELETE
USING (auth.uid() = user_id);

-- Create social_connections table
CREATE TABLE public.social_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  platform social_platform NOT NULL,
  account_name TEXT,
  account_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_connected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_id, platform)
);

-- Enable RLS
ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies for social_connections (via business ownership)
CREATE POLICY "Users can view their social connections"
ON public.social_connections FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.businesses 
  WHERE businesses.id = social_connections.business_id 
  AND businesses.user_id = auth.uid()
));

CREATE POLICY "Users can create their social connections"
ON public.social_connections FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.businesses 
  WHERE businesses.id = social_connections.business_id 
  AND businesses.user_id = auth.uid()
));

CREATE POLICY "Users can update their social connections"
ON public.social_connections FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.businesses 
  WHERE businesses.id = social_connections.business_id 
  AND businesses.user_id = auth.uid()
));

CREATE POLICY "Users can delete their social connections"
ON public.social_connections FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.businesses 
  WHERE businesses.id = social_connections.business_id 
  AND businesses.user_id = auth.uid()
));

-- Create ai_agents table
CREATE TABLE public.ai_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  mode agent_mode DEFAULT 'review',
  status agent_status DEFAULT 'inactive',
  business_profile JSONB,
  last_learning_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_agents
CREATE POLICY "Users can view their AI agents"
ON public.ai_agents FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.businesses 
  WHERE businesses.id = ai_agents.business_id 
  AND businesses.user_id = auth.uid()
));

CREATE POLICY "Users can create their AI agents"
ON public.ai_agents FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.businesses 
  WHERE businesses.id = ai_agents.business_id 
  AND businesses.user_id = auth.uid()
));

CREATE POLICY "Users can update their AI agents"
ON public.ai_agents FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.businesses 
  WHERE businesses.id = ai_agents.business_id 
  AND businesses.user_id = auth.uid()
));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_businesses_updated_at
BEFORE UPDATE ON public.businesses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_connections_updated_at
BEFORE UPDATE ON public.social_connections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_agents_updated_at
BEFORE UPDATE ON public.ai_agents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();