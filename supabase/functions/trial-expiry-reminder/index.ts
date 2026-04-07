import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Find trial subscriptions expiring in exactly 2 days
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    const startOfDay = new Date(twoDaysFromNow);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(twoDaysFromNow);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: expiringTrials, error } = await supabase
      .from('user_subscriptions')
      .select('user_id, ends_at, plan:subscription_plans(name)')
      .eq('status', 'trial')
      .gte('ends_at', startOfDay.toISOString())
      .lte('ends_at', endOfDay.toISOString());

    if (error) {
      console.error('Error fetching expiring trials:', error);
      throw error;
    }

    console.log(`Found ${expiringTrials?.length || 0} trials expiring in 2 days`);

    let notificationsSent = 0;

    for (const trial of expiringTrials || []) {
      // Check if we already sent a reminder notification for this user
      const { data: existingNotif } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', trial.user_id)
        .eq('title', 'Trial Expiring Soon')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (existingNotif && existingNotif.length > 0) {
        console.log(`Skipping user ${trial.user_id} - already notified`);
        continue;
      }

      const planName = (trial.plan as any)?.name || 'your plan';

      // Create in-app notification
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: trial.user_id,
          title: 'Trial Expiring Soon',
          message: `Your ${planName} trial expires in 2 days. Upgrade now to keep your AI agent running and avoid losing access to your dashboard.`,
          icon: '⏰',
        });

      if (notifError) {
        console.error(`Failed to notify user ${trial.user_id}:`, notifError);
      } else {
        notificationsSent++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        trialsFound: expiringTrials?.length || 0,
        notificationsSent 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Trial expiry reminder error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
