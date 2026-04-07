-- Drop the overly permissive service role policy
DROP POLICY "Service role can manage all analytics" ON public.post_analytics;
