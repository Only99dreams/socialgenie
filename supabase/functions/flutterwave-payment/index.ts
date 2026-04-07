import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const flutterwaveSecretKey = Deno.env.get('FLUTTERWAVE_SECRET_KEY');

    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, plan_id, transaction_id, tx_ref } = await req.json();

    if (action === 'initialize') {
      // Initialize payment - return Flutterwave payment data
      if (!flutterwaveSecretKey) {
        return new Response(JSON.stringify({ error: 'Flutterwave not configured yet. Contact admin.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: plan, error: planError } = await supabaseAdmin
        .from('subscription_plans')
        .select('*')
        .eq('id', plan_id)
        .single();

      if (planError || !plan) {
        return new Response(JSON.stringify({ error: 'Plan not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const txRef = `SP-${user.id.slice(0, 8)}-${Date.now()}`;

      // Create pending payment record
      await supabaseAdmin.from('payments').insert({
        user_id: user.id,
        plan_id: plan.id,
        amount: plan.price_monthly,
        status: 'pending',
      });

      return new Response(JSON.stringify({
        tx_ref: txRef,
        amount: plan.price_monthly,
        currency: 'USD',
        plan_name: plan.name,
        customer_email: user.email,
        trial_days: plan.trial_days,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'verify') {
      // Verify Flutterwave transaction
      if (!flutterwaveSecretKey) {
        return new Response(JSON.stringify({ error: 'Flutterwave not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const verifyRes = await fetch(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
        headers: { Authorization: `Bearer ${flutterwaveSecretKey}` },
      });

      const verifyData = await verifyRes.json();

      if (verifyData.status === 'success' && verifyData.data.status === 'successful') {
        // Update payment status
        await supabaseAdmin
          .from('payments')
          .update({ status: 'approved' })
          .eq('user_id', user.id)
          .eq('plan_id', plan_id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1);

        // Create/update subscription with trial
        const { data: plan } = await supabaseAdmin
          .from('subscription_plans')
          .select('trial_days')
          .eq('id', plan_id)
          .single();

        const endsAt = new Date();
        endsAt.setDate(endsAt.getDate() + (plan?.trial_days || 7));

        // Check existing sub
        const { data: existingSub } = await supabaseAdmin
          .from('user_subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingSub) {
          await supabaseAdmin.from('user_subscriptions')
            .update({
              plan_id,
              status: 'trial',
              starts_at: new Date().toISOString(),
              ends_at: endsAt.toISOString(),
            })
            .eq('id', existingSub.id);
        } else {
          await supabaseAdmin.from('user_subscriptions').insert({
            user_id: user.id,
            plan_id,
            status: 'trial',
            starts_at: new Date().toISOString(),
            ends_at: endsAt.toISOString(),
          });
        }

        return new Response(JSON.stringify({ success: true, message: 'Payment verified and subscription activated' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(JSON.stringify({ success: false, message: 'Payment verification failed' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
