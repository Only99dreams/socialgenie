
-- Allow the trigger (SECURITY DEFINER) to insert subscriptions
-- Also allow users to insert their own subscriptions
CREATE POLICY "Users can insert their own subscriptions"
ON public.user_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
