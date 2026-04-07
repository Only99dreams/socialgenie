
-- Create enum for comment response status
CREATE TYPE public.comment_response_status AS ENUM ('pending_review', 'approved', 'posted', 'rejected', 'failed');

-- Create enum for comment response mode
CREATE TYPE public.comment_response_mode AS ENUM ('autopilot', 'review');

-- Table for storing fetched comments from all platforms
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  platform public.social_platform NOT NULL,
  platform_comment_id TEXT NOT NULL,
  platform_post_id TEXT,
  author_name TEXT,
  author_username TEXT,
  author_avatar_url TEXT,
  content TEXT NOT NULL,
  commented_at TIMESTAMP WITH TIME ZONE,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(platform, platform_comment_id)
);

-- Table for AI-generated responses to comments
CREATE TABLE public.comment_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  ai_response TEXT NOT NULL,
  status public.comment_response_status NOT NULL DEFAULT 'pending_review',
  edited_response TEXT,
  posted_at TIMESTAMP WITH TIME ZONE,
  platform_response_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Settings table for comment response configuration per business
CREATE TABLE public.comment_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
  response_mode public.comment_response_mode NOT NULL DEFAULT 'review',
  auto_fetch_enabled BOOLEAN NOT NULL DEFAULT false,
  fetch_interval_minutes INTEGER NOT NULL DEFAULT 15,
  last_fetched_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_settings ENABLE ROW LEVEL SECURITY;

-- RLS for comments
CREATE POLICY "Users can view their comments" ON public.comments
  FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their comments" ON public.comments
  FOR INSERT WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their comments" ON public.comments
  FOR DELETE USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- RLS for comment_responses
CREATE POLICY "Users can view their comment responses" ON public.comment_responses
  FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their comment responses" ON public.comment_responses
  FOR INSERT WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their comment responses" ON public.comment_responses
  FOR UPDATE USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their comment responses" ON public.comment_responses
  FOR DELETE USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- RLS for comment_settings
CREATE POLICY "Users can view their comment settings" ON public.comment_settings
  FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their comment settings" ON public.comment_settings
  FOR INSERT WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their comment settings" ON public.comment_settings
  FOR UPDATE USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_comment_responses_updated_at
  BEFORE UPDATE ON public.comment_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comment_settings_updated_at
  BEFORE UPDATE ON public.comment_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for comments and responses
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_responses;
