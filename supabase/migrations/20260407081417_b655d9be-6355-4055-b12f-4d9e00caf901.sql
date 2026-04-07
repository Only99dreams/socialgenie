
CREATE OR REPLACE FUNCTION public.handle_new_user_trial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  default_plan_id uuid;
  trial_duration integer;
BEGIN
  -- Get the first active plan (lowest sort_order) as the default trial plan
  SELECT id, trial_days INTO default_plan_id, trial_duration
  FROM public.subscription_plans
  WHERE is_active = true
  ORDER BY sort_order ASC
  LIMIT 1;

  -- If no plan exists, use 7 days default
  IF default_plan_id IS NULL THEN
    trial_duration := 7;
  END IF;

  -- Create a trial subscription for the new user
  INSERT INTO public.user_subscriptions (user_id, plan_id, status, starts_at, ends_at)
  VALUES (
    NEW.id,
    default_plan_id,
    'trial',
    now(),
    now() + (trial_duration || ' days')::interval
  );

  RETURN NEW;
END;
$$;

-- Trigger on new user creation
CREATE TRIGGER on_auth_user_created_trial
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_trial();
